import os
import sys
import tempfile
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

# Add the parent directory to Python Path to import from EDA-Pipeline
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'EDA-Pipeline')))
from eda.eda_pipeline import run_eda

app = FastAPI()

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
<<<<<<< HEAD
    # Save the file temporarily so pandas and the pipeline can read it
    with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_file_path = temp_file.name

    try:
        # Run the full EDA pipeline on the uploaded file
        eda_report = run_eda(temp_file_path)
    finally:
        # Clean up the temp file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

    return eda_report
=======

    # Read CSV file
    df = pd.read_csv(file.file)

    # Basic info
    preview = df.head(5).to_dict(orient="records")
    columns = df.columns.tolist()
    row_count = len(df)

    # EDA calculations
    summary_statistics = df.describe().to_dict()
    missing_values = df.isnull().sum().to_dict()
    data_types = df.dtypes.astype(str).to_dict()

    # Correlation (only numeric columns)
    correlation_matrix = df.corr(numeric_only=True).to_dict()

    # Duplicate rows
    duplicate_rows = int(df.duplicated().sum())

    return {
        "filename": file.filename,
        "columns": columns,
        "row_count": row_count,
        "preview": preview,
        "summary_statistics": summary_statistics,
        "missing_values": missing_values,
        "data_types": data_types,
        "correlation_matrix": correlation_matrix,
        "duplicate_rows": duplicate_rows
    }
>>>>>>> 71c0d62 (now we can see Dataset preview)
