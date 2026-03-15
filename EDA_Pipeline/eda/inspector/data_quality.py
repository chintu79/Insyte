import pandas as pd
import numpy as np

def check_data_quality(df: pd.DataFrame, categorical_cols, numeric_cols):
    """
    Check for subtle data quality issues that don't manifest as 'missing' values.
    This includes whitespace padding in strings, inconsistent casing, and weird numeric values (e.g., negatives where they shouldn't be).
    """
    quality_issues = {}

    for col in categorical_cols:
        if df[col].dtype == 'object':
            # Check for leading/trailing whitespaces
            # Use dropna() to avoid errors on null values
            has_whitespace = df[col].dropna().astype(str).str.contains(r'^\s+|\s+$', regex=True).any()
            
            # Check for inconsistent casing (e.g., "Apple" vs "apple")
            unique_vals = df[col].dropna().astype(str).unique()
            lower_vals = set(str(v).lower() for v in unique_vals)
            has_inconsistent_casing = len(unique_vals) > len(lower_vals)
            
            issues = []
            if has_whitespace:
                issues.append("Contains leading/trailing whitespaces")
            if has_inconsistent_casing:
                issues.append("Contains inconsistent text casing (e.g., Mix of lower/upper case for same category)")
                
            if issues:
                quality_issues[col] = issues

    for col in numeric_cols:
        # Check for negative values in columns that might be strictly positive (like prices, counts)
        if pd.api.types.is_numeric_dtype(df[col]):
            if (df[col] < 0).any():
                # We just flag it as a warning, the user has to decide if it's an error.
                quality_issues[col] = ["Contains negative values. Verify if negatives are valid for this feature."]

    return quality_issues