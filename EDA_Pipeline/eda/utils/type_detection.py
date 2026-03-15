import pandas as pd
import numpy as np

def coerce_to_numeric(df: pd.DataFrame, object_cols):
    """
    Attempts to coerce string/object columns to numeric if they look like numbers
    (e.g., contains commas like "1,000", or currency like "$50.5").
    """
    coerced_cols = []
    
    for col in object_cols:
        # Check if the column has a significant number of digit characters
        # Sample first 100 non-null rows
        sample = df[col].dropna().head(100).astype(str)
        if sample.empty:
            continue
            
        # If >80% of the sample contains digits, it's worth trying to clean
        digit_ratio = sample.str.contains(r'\d').mean()
        
        if digit_ratio > 0.8:
            # Try cleaning common non-numeric characters before cast
            cleaned_series = df[col].astype(str).str.replace(r'[$,% ]', '', regex=True)
            try:
                numeric_series = pd.to_numeric(cleaned_series, errors='coerce')
                # If we didn't introduce too many new NaNs by doing this
                new_nans = numeric_series.isnull().sum() - df[col].isnull().sum()
                if new_nans / len(df) < 0.1:
                    df[col] = numeric_series
                    coerced_cols.append(col)
            except Exception:
                pass
                
    return df, coerced_cols

def coerce_to_datetime(df: pd.DataFrame, object_cols):
    """
    Attempts to coerce string columns into datetimes if they fit a pattern.
    """
    coerced_cols = []
    
    for col in object_cols:
        sample = df[col].dropna().head(100).astype(str)
        if sample.empty:
            continue
            
        # If it looks like a date (e.g. contains '-' or '/')
        if sample.str.contains(r'\d{4}-\d{2}-\d{2}|\d{2}/\d{2}/\d{2,4}').mean() > 0.5:
            try:
                datetime_series = pd.to_datetime(df[col], errors='coerce')
                new_nans = datetime_series.isnull().sum() - df[col].isnull().sum()
                if new_nans / len(df) < 0.1:
                    df[col] = datetime_series
                    coerced_cols.append(col)
            except Exception:
                pass
                
    return df, coerced_cols