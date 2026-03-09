import pandas as pd


def handle_missing_values(df, eda_results):
    """
    Impute missing values: median for numeric, mode for categorical.
    Guards against columns that may have been dropped by earlier pipeline steps.
    """

    column_types = eda_results["column_types"]

    numeric_cols = [c for c in column_types.get("numeric", []) if c in df.columns]
    categorical_cols = [c for c in column_types.get("categorical", []) if c in df.columns]

    for col in numeric_cols:
        if df[col].isnull().sum() > 0:
            df[col] = df[col].fillna(df[col].median())

    for col in categorical_cols:
        if df[col].isnull().sum() > 0:
            df[col] = df[col].fillna(df[col].mode()[0])

    return df