import pandas as pd


# Common target column name patterns (case-insensitive matching)
TARGET_HINTS = [
    "target", "label", "class", "outcome", "y",
    "survived", "churn", "price", "salary", "revenue",
    "default", "fraud", "diagnosis", "species",
    "result", "status", "output", "response",
]


def detect_target_column(df: pd.DataFrame, target_col: str = None) -> dict:
    """
    Automatically detect the target column and problem type.

    Parameters
    ----------
    df : pd.DataFrame
        The input dataset.
    target_col : str, optional
        If provided, skip auto-detection and use this column directly.

    Returns
    -------
    dict with keys:
        - target_column: str
        - problem_type: "classification" | "regression"
    """

    if target_col and target_col in df.columns:
        return {
            "target_column": target_col,
            "problem_type": _infer_problem_type(df[target_col]),
        }

    # --- Auto-detection ---

    # Strategy 1: Match column names against known target hints
    for col in df.columns:
        if col.lower().strip() in TARGET_HINTS:
            return {
                "target_column": col,
                "problem_type": _infer_problem_type(df[col]),
            }

    # Strategy 2: Use the last column (common convention in ML datasets)
    last_col = df.columns[-1]
    return {
        "target_column": last_col,
        "problem_type": _infer_problem_type(df[last_col]),
    }


def _infer_problem_type(series: pd.Series) -> str:
    """
    Infer whether a target column represents classification or regression.
    """

    # If dtype is object or categorical → classification
    if series.dtype == "object" or pd.api.types.is_categorical_dtype(series):
        return "classification"

    # If boolean-like → classification
    if series.dtype == "bool":
        return "classification"

    # Count unique non-null values
    nunique = series.nunique()

    # Binary or very few unique values → classification
    if nunique <= 20:
        return "classification"

    # Continuous numeric → regression
    return "regression"
