import logging
import pandas as pd

from .cleaning.column_dropper import drop_useless_columns
from .cleaning.duplicate_handler import remove_duplicates
from .cleaning.missing_handler import handle_missing_values

from .datetime.datetime_features import extract_datetime_features

from .encoding.high_cardinality_handler import handle_high_cardinality
from .encoding.categorical_encoder import encode_categorical_features

from .transformations.skew_handler import fix_skewed_features
from .transformations.outlier_handler import handle_outliers

from .scaling.scaler import scale_features

from .selection.feature_selection import remove_highly_correlated

from .utils.target_detector import detect_target_column
from .utils.safety_validator import validate_target_safety


logger = logging.getLogger(__name__)


def run_feature_engineering(df, eda_results, target_col=None):
    """
    Execute the full feature engineering pipeline with target protection.

    Pipeline order:
      1.  Detect target column & problem type
      2.  Separate features (X) and target (y)
      3.  Remove duplicate rows
      4.  Drop useless columns — IDs, constants, near-IDs (unique ratio > 0.95),
          and columns with >75% missing values (never drops target)
      5.  Handle missing values (features only)
      6.  Extract datetime features
      7.  Frequency-encode high-cardinality categoricals
      8.  One-hot encode remaining categoricals (drop_first=True)
      9.  Fix skewed features (log1p transform)
     10.  Handle outliers (IQR clipping)
     11.  Standard-scale numeric features
     12.  Remove highly correlated features (feature-to-feature only)
     13.  Reattach target column
     14.  Run safety validation
     15.  Track which transforms actually ran (for accurate FE panel display)

    Parameters
    ----------
    df : pd.DataFrame
        Raw input dataset.
    eda_results : dict
        Output from the EDA pipeline.
    target_col : str, optional
        Explicitly specify the target column. If None, auto-detect.

    Returns
    -------
    df_final : pd.DataFrame
        Cleaned dataset with target column intact.
    log : dict
        Detailed log of every pipeline step, including transforms_applied list.
    """

    log = {}

    # ------------------------------------------------------------------
    # Step 1: Detect target column and problem type
    # ------------------------------------------------------------------
    target_info = detect_target_column(df, target_col)
    target_column = target_info["target_column"]
    problem_type = target_info["problem_type"]

    log["target_column"] = target_column
    log["problem_type"] = problem_type
    logger.info(f"Target: '{target_column}' | Problem: {problem_type}")

    # ------------------------------------------------------------------
    # Step 2: Separate features (X) and target (y)
    # ------------------------------------------------------------------
    if target_column not in df.columns:
        raise ValueError(f"Target column '{target_column}' not found in DataFrame.")

    y = df[target_column].copy()
    X = df.drop(columns=[target_column])

    # ------------------------------------------------------------------
    # Step 3: Remove duplicate rows
    # ------------------------------------------------------------------
    try:
        X_with_y = pd.concat([X, y], axis=1)
        X_with_y, removed_dupes = remove_duplicates(X_with_y)
        y = X_with_y[target_column].copy()
        X = X_with_y.drop(columns=[target_column])
        log["duplicates_removed"] = removed_dupes
    except Exception as e:
        logger.error(f"Duplicate removal failed: {e}")
        log["duplicates_removed"] = {"error": str(e)}

    # ------------------------------------------------------------------
    # Step 4: Drop useless columns
    #
    # FIX: Also drop near-ID columns — text columns where almost every row
    # has a unique value (e.g. Name, Ticket). These have unique_ratio > 0.95
    # and add noise with no predictive signal.
    #
    # This is done BEFORE high-cardinality encoding (step 7) so Name never
    # gets frequency-encoded and included in training features.
    # ------------------------------------------------------------------
    try:
        X, dropped_cols = drop_useless_columns(X, eda_results)

        # Extra pass: drop any remaining object/string columns where
        # n_unique / n_rows > 0.95 — these are effectively row identifiers.
        near_id_cols = []
        n_rows = len(X)
        for col in X.select_dtypes(include=["object", "category"]).columns:
            if n_rows > 0 and X[col].nunique() / n_rows > 0.95:
                near_id_cols.append(col)
        if near_id_cols:
            X = X.drop(columns=near_id_cols)
            logger.info(f"Dropped near-ID text columns: {near_id_cols}")
            # Merge into dropped_cols log
            if isinstance(dropped_cols, list):
                dropped_cols = dropped_cols + near_id_cols
            else:
                dropped_cols = near_id_cols

        log["dropped_columns"] = dropped_cols
    except Exception as e:
        logger.error(f"Column dropping failed: {e}")
        log["dropped_columns"] = {"error": str(e)}

    # Track which columns exist at each stage for the transforms log
    cols_before_missing = set(X.columns)

    # ------------------------------------------------------------------
    # Step 5: Handle missing values (features only)
    # ------------------------------------------------------------------
    try:
        X = handle_missing_values(X, eda_results)
    except Exception as e:
        logger.error(f"Missing value handling failed: {e}")
        log["missing_values"] = {"error": str(e)}

    # ------------------------------------------------------------------
    # Step 6: Extract datetime features
    # ------------------------------------------------------------------
    try:
        X = extract_datetime_features(X, eda_results)
    except Exception as e:
        logger.error(f"Datetime extraction failed: {e}")
        log["datetime_features"] = {"error": str(e)}

    # ------------------------------------------------------------------
    # Step 7: Frequency-encode high-cardinality categoricals
    # ------------------------------------------------------------------
    cols_before_hc = set(X.columns)
    try:
        X, high_card_cols = handle_high_cardinality(X, eda_results)
        log["high_cardinality_encoded"] = high_card_cols
    except Exception as e:
        logger.error(f"High-cardinality encoding failed: {e}")
        log["high_cardinality_encoded"] = {"error": str(e)}
        high_card_cols = []

    # ------------------------------------------------------------------
    # Step 8: One-hot encode remaining categoricals (drop_first=True)
    # ------------------------------------------------------------------
    cols_before_ohe = set(X.columns)
    try:
        X = encode_categorical_features(X, eda_results)
    except Exception as e:
        logger.error(f"Categorical encoding failed: {e}")
        log["categorical_encoding"] = {"error": str(e)}

    # Detect whether OHE actually produced new columns
    ohe_ran = len(set(X.columns) - cols_before_ohe) > 0

    # ------------------------------------------------------------------
    # Step 9: Fix skewed features (log1p transform)
    # ------------------------------------------------------------------
    cols_before_skew = set(X.columns)
    try:
        X = fix_skewed_features(X, eda_results)
    except Exception as e:
        logger.error(f"Skew handling failed: {e}")
        log["skew_handling"] = {"error": str(e)}

    # ------------------------------------------------------------------
    # Step 10: Handle outliers via IQR clipping
    # ------------------------------------------------------------------
    try:
        X = handle_outliers(X, eda_results)
    except Exception as e:
        logger.error(f"Outlier handling failed: {e}")
        log["outlier_handling"] = {"error": str(e)}

    # ------------------------------------------------------------------
    # Step 11: Standard-scale numeric features
    # ------------------------------------------------------------------
    try:
        X = scale_features(X, eda_results)
    except Exception as e:
        logger.error(f"Feature scaling failed: {e}")
        log["scaling"] = {"error": str(e)}

    # ------------------------------------------------------------------
    # Step 12: Remove highly correlated features (feature-to-feature only)
    # ------------------------------------------------------------------
    try:
        X, removed_corr = remove_highly_correlated(X, eda_results)
        log["correlation_removed"] = removed_corr
    except Exception as e:
        logger.error(f"Correlation removal failed: {e}")
        log["correlation_removed"] = {"error": str(e)}

    # ------------------------------------------------------------------
    # Step 13: Reattach target column
    # ------------------------------------------------------------------
    X.reset_index(drop=True, inplace=True)
    y.reset_index(drop=True, inplace=True)
    df_final = pd.concat([X, y], axis=1)

    # ------------------------------------------------------------------
    # Step 14: Safety validation — ensures target was never touched
    # ------------------------------------------------------------------
    try:
        safety_results = validate_target_safety(
            df=df_final,
            target_column=target_column,
            original_target_values=y,
            log=log,
        )
        log["safety_checks"] = safety_results
        logger.info("All safety checks PASSED")
    except Exception as e:
        logger.error(f"Safety validation FAILED: {e}")
        log["safety_checks"] = {"error": str(e)}
        raise

    # ------------------------------------------------------------------
    # Step 15: Record which transforms actually ran
    #
    # FIX: Previously the FE panel showed all 5 transform badges statically
    # regardless of what actually executed. Now we record exactly which
    # transforms produced changes so the Dashboard can show accurate info.
    # ------------------------------------------------------------------
    transforms_applied = []

    if ohe_ran:
        transforms_applied.append("OHE")

    if isinstance(high_card_cols, list) and len(high_card_cols) > 0:
        transforms_applied.append("FREQ")

    # SCALE always runs if there are numeric columns
    if X.select_dtypes(include=["number"]).shape[1] > 0:
        transforms_applied.append("SCALE")

    # LOG1P: check if skewed columns existed in EDA distribution
    dist = eda_results.get("distribution", {})
    skewed = [c for c, v in dist.items() if abs(v.get("skew", 0) or 0) > 1]
    if skewed:
        transforms_applied.append("LOG1P")

    # IQR: check if outliers existed in EDA
    outliers = eda_results.get("outliers", {})
    has_outliers = any(
        (v.get("outlier_count") or 0) > 0
        for v in outliers.values()
        if isinstance(v, dict)
    )
    if has_outliers:
        transforms_applied.append("IQR")

    log["transforms_applied"] = transforms_applied

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------
    log["final_feature_count"] = len(X.columns)
    log["final_shape"] = {"rows": int(df_final.shape[0]), "columns": int(df_final.shape[1])}

    _print_debug_summary(log, target_column, problem_type)

    return df_final, log


def _print_debug_summary(log, target_column, problem_type):
    """Print a structured debug summary to the server console."""
    print("\n" + "=" * 50)
    print("FEATURE ENGINEERING — DEBUG SUMMARY")
    print("=" * 50)
    print(f"Target Column:           {target_column}")
    print(f"Problem Type:            {problem_type.capitalize()}")
    print(f"Duplicates Removed:      {log.get('duplicates_removed', 0)}")
    print(f"Dropped Columns:         {log.get('dropped_columns', [])}")
    print(f"High-Cardinality Encoded:{log.get('high_cardinality_encoded', [])}")
    print(f"Correlation Removed:     {log.get('correlation_removed', [])}")
    print(f"Transforms Applied:      {log.get('transforms_applied', [])}")
    print(f"Final Feature Count:     {log.get('final_feature_count', '?')}")
    print(f"Final Shape:             {log.get('final_shape', '?')}")

    safety = log.get("safety_checks", [])
    if isinstance(safety, list):
        print("\nSafety Checks:")
        for check in safety:
            print(f"  {check}")
    elif isinstance(safety, dict) and "error" in safety:
        print(f"\nSafety Checks: FAILED — {safety['error']}")

    print("=" * 50 + "\n")