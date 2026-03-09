import pandas as pd


def encode_categorical_features(df, eda_results):
    """
    One-hot encode categorical features.
    Only encodes columns that still exist in the DataFrame and are still
    of object dtype (high-cardinality ones were already frequency-encoded).
    """

    categorical_cols = eda_results["column_types"].get("categorical", [])
    boolean_cols = eda_results["column_types"].get("boolean", [])

    # Combine categorical + boolean, keep only those still present and still object dtype
    all_cols = categorical_cols + boolean_cols
    all_cols = [
        c for c in all_cols
        if c in df.columns and df[c].dtype == "object"
    ]

    if all_cols:
        df = pd.get_dummies(df, columns=all_cols, drop_first=True)
        # Cast bool dummy columns to int for ML compatibility
        bool_cols = df.select_dtypes(include="bool").columns
        df[bool_cols] = df[bool_cols].astype(int)

    return df