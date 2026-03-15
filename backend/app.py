import base64
import json
import joblib
import math
import os
import sys
import tempfile
import time
import uuid
from pathlib import Path

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Ensure project root is on sys.path so all pipeline imports resolve
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from EDA_Pipeline.eda.eda_pipeline import run_eda
from EDA_Pipeline.eda.utils.dataframe_utils import convert_to_native_types
from feature_engineering.fe_pipeline import run_feature_engineering
from automl.automl_pipeline import build_leaderboard, run_automl as execute_automl

# ---------------------------------------------------------------------------
# App + CORS
# ---------------------------------------------------------------------------
app = FastAPI(title="Insyte ML API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Storage helpers — flat layout: storage/{dataset_id}/
# ---------------------------------------------------------------------------
STORAGE_DIR = PROJECT_ROOT / "storage"
STORAGE_DIR.mkdir(exist_ok=True)


def _dataset_dir(did: str) -> Path:
    return STORAGE_DIR / did

def _data_path(did: str) -> Path:
    return _dataset_dir(did) / "data.csv"

def _model_path(did: str) -> Path:
    return _dataset_dir(did) / "best_model.joblib"

def _meta_path(did: str) -> Path:
    return _dataset_dir(did) / "model_meta.json"

def _plot_dir(did: str) -> Path:
    return _dataset_dir(did) / "eda_plots"

def _ensure_dirs(did: str) -> None:
    _dataset_dir(did).mkdir(parents=True, exist_ok=True)
    _plot_dir(did).mkdir(parents=True, exist_ok=True)

def _read_df(path: Path) -> pd.DataFrame:
    s = str(path)
    return pd.read_excel(s) if s.endswith((".xlsx", ".xls")) else pd.read_csv(s)

def _b64_png(path: Path) -> str:
    return "data:image/png;base64," + base64.b64encode(path.read_bytes()).decode()

def _sanitize(obj):
    """Recursively replace NaN / Inf floats with None for JSON compliance."""
    if isinstance(obj, float):
        return None if (math.isnan(obj) or math.isinf(obj)) else obj
    if isinstance(obj, dict):
        return {k: _sanitize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize(v) for v in obj]
    return obj

def _clean(data):
    """convert_to_native_types then sanitize NaN/Inf in one call."""
    return _sanitize(convert_to_native_types(data))

def _run_eda(did: str, data_path: Path) -> dict:
    """Run EDA with CWD set to the plot directory so PNGs land there."""
    before = os.getcwd()
    os.chdir(str(_plot_dir(did)))
    try:
        return run_eda(str(data_path))
    finally:
        os.chdir(before)

def _encode_viz(did: str, viz: dict) -> dict:
    """Convert visualization file paths to base64 PNG strings."""
    pd_ = _plot_dir(did)
    out = {"categorical_plots": [], "distribution_plots": [], "correlation_heatmap": None}
    try:
        for p in viz.get("categorical_plots") or []:
            f = pd_ / p if not Path(p).is_absolute() else Path(p)
            if f.exists(): out["categorical_plots"].append(_b64_png(f))
        for p in viz.get("distribution_plots") or []:
            f = pd_ / p if not Path(p).is_absolute() else Path(p)
            if f.exists(): out["distribution_plots"].append(_b64_png(f))
        h = viz.get("correlation_heatmap")
        if h:
            f = pd_ / h if not Path(h).is_absolute() else Path(h)
            if f.exists(): out["correlation_heatmap"] = _b64_png(f)
    except Exception:
        pass
    return out


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------
class DatasetRef(BaseModel):
    dataset_id: str = Field(..., min_length=6)

class FERequest(DatasetRef):
    target_col: str | None = None

class AutoMLRequest(DatasetRef):
    target_col: str | None = None

class PredictRequest(DatasetRef):
    inputs: dict = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Step 1 — Upload CSV or XLSX. Returns dataset_id for subsequent calls."""
    content = await file.read()
    did = uuid.uuid4().hex[:12]
    _ensure_dirs(did)

    suffix = os.path.splitext(file.filename)[1].lower() or ".csv"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        df = _read_df(Path(tmp_path))
    except Exception as e:
        raise HTTPException(400, f"Could not read file: {e}")
    finally:
        os.remove(tmp_path)

    df.to_csv(_data_path(did), index=False)

    return {
        "dataset_id": did,
        "filename": file.filename,
        "shape": {"rows": int(df.shape[0]), "columns": int(df.shape[1])},
        "columns": df.columns.tolist(),
        "preview": _clean(df.head(20).to_dict(orient="records")),
    }


@app.post("/eda")
async def eda_endpoint(req: DatasetRef):
    """Step 2 — Run EDA. Returns report + base64 visualizations."""
    dp = _data_path(req.dataset_id)
    if not dp.exists():
        raise HTTPException(404, "dataset_id not found. Upload a file first.")

    report = _run_eda(req.dataset_id, dp)
    report["visualizations"] = _encode_viz(req.dataset_id, report.get("visualizations", {}))
    return _clean(report)


@app.post("/feature-engineering")
async def fe_endpoint(req: FERequest):
    """Step 3 — Feature engineering on the uploaded dataset."""
    dp = _data_path(req.dataset_id)
    if not dp.exists():
        raise HTTPException(404, "dataset_id not found. Upload a file first.")

    df = _read_df(dp)
    eda = _run_eda(req.dataset_id, dp)

    if eda.get("dataset_summary", {}).get("error"):
        raise HTTPException(400, eda["dataset_summary"]["error"])

    cleaned_df, fe_log = run_feature_engineering(df, eda, target_col=req.target_col)
    target = fe_log.get("target_column")

    return _clean({
        "target_column": target,
        "problem_type": fe_log.get("problem_type"),
        "fe_log": fe_log,
        "transformed_feature_list": cleaned_df.drop(columns=[target], errors="ignore").columns.tolist(),
        # 50 rows — enough to reliably detect binary OHE columns (Sex_male, Embarked_S etc)
        # and give buildMeta() real numeric ranges for slider inputs
        "cleaned_dataset_preview": cleaned_df.head(50).to_dict(orient="records"),
        "cleaned_shape": {"rows": int(cleaned_df.shape[0]), "columns": int(cleaned_df.shape[1])},
        "cleaned_columns": cleaned_df.columns.tolist(),
    })


@app.post("/automl")
async def automl_endpoint(req: AutoMLRequest):
    """
    Step 4 — Full pipeline: EDA → FE → AutoML. Saves best model.

    KEY FIXES in this version:
    ─────────────────────────────────────────────────────────────────────────
    FIX 1 — cleaned_dataset_preview is now included in the response.
      Previously missing, which caused PredictPanel's buildMeta() to fall back
      to raw StandardScaler ranges (-3 to 3) for every post-FE feature.
      With the preview, binary OHE columns (Sex_male, Embarked_S etc) are
      detected as Yes/No dropdowns and numeric columns get real ranges.

    FIX 2 — fe_log is returned alongside automl results.
      Previously, if a user ran AutoML directly (skipping /feature-engineering),
      feResult in the Dashboard context was null. The Smart Summary and FE panel
      could not show target_column, problem_type, or transform details.
      Now the frontend can hydrate feResult from the automl response.
    ─────────────────────────────────────────────────────────────────────────
    """
    dp = _data_path(req.dataset_id)
    if not dp.exists():
        raise HTTPException(404, "dataset_id not found. Upload a file first.")

    df = _read_df(dp)
    t0 = time.time()

    try:
        eda = _run_eda(req.dataset_id, dp)
        if eda.get("dataset_summary", {}).get("error"):
            raise ValueError(eda["dataset_summary"]["error"])

        cleaned_df, fe_log = run_feature_engineering(df, eda, target_col=req.target_col)
        target = fe_log.get("target_column")
        problem = fe_log.get("problem_type")

        if not target or not problem:
            raise ValueError("Target detection failed — cannot run AutoML.")

        out = execute_automl(cleaned_df, target_column=target, problem_type=problem)
        leaderboard = build_leaderboard(problem, out.get("metrics"), out.get("training_time_sec"))

        best_name = out.get("best_model")
        for row in leaderboard:
            row["is_best"] = row.get("model_name") == best_name

        best_obj = (out.get("trained_models") or {}).get(best_name)
        if best_obj is None:
            raise ValueError("Best model object missing from AutoML output.")

        # Persist model + metadata for /predict
        joblib.dump(best_obj, _model_path(req.dataset_id))
        feature_cols = cleaned_df.drop(columns=[target], errors="ignore").columns.tolist()
        _meta_path(req.dataset_id).write_text(json.dumps({
            "dataset_id": req.dataset_id,
            "target_column": target,
            "problem_type": problem,
            "input_features": feature_cols,
        }, indent=2))

    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"AutoML failed: {e}")

    return _clean({
        "dataset_id": req.dataset_id,
        "target_column": target,
        "problem_type": problem,
        "best_model": best_name,
        "leaderboard": leaderboard,
        # fe_log included so Dashboard can hydrate feResult without a separate FE call
        "fe_log": fe_log,
        # preview included so buildMeta() detects binary OHE columns correctly
        "cleaned_dataset_preview": cleaned_df.head(50).to_dict(orient="records"),
        "prediction_schema": {
            "features": feature_cols
        },
        "total_time_sec": round(time.time() - t0, 4),
    })


@app.post("/predict")
async def predict_endpoint(req: PredictRequest):
    """Step 5 — Inference using the best model saved by /automl."""
    mp, mtp = _model_path(req.dataset_id), _meta_path(req.dataset_id)
    if not mp.exists() or not mtp.exists():
        raise HTTPException(400, "No trained model found. Run /automl first.")

    try:
        meta = json.loads(mtp.read_text())
        features = meta.get("input_features") or []
        if not features:
            raise ValueError("Model metadata missing input_features.")

        X = pd.DataFrame([{f: req.inputs.get(f) for f in features}], columns=features)
        pred = joblib.load(mp).predict(X)

    except Exception as e:
        raise HTTPException(400, f"Prediction failed: {e}")

    return _clean({
        "dataset_id": req.dataset_id,
        "prediction": pred[0] if hasattr(pred, "__len__") else pred,
        "problem_type": meta.get("problem_type"),
        "target_column": meta.get("target_column"),
    })