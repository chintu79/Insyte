import pandas as pd


def extract_datetime_features(df, eda_results):

    datetime_cols = eda_results["column_types"].get("datetime", [])

    for col in datetime_cols:

        df[col] = pd.to_datetime(df[col], errors="coerce")

        df[f"{col}_year"] = df[col].dt.year
        df[f"{col}_month"] = df[col].dt.month
        df[f"{col}_day"] = df[col].dt.day
        df[f"{col}_weekday"] = df[col].dt.weekday

        df = df.drop(columns=[col])

    return df