import pandas as pd

def analyze_numeric_distribution(df: pd.DataFrame, numeric_cols):
    """
    Compute statistical distribution properties for numerical columns.
    Features like skewness and kurtosis are critical - highly skewed features
    usually require transformations (e.g., Log, Box-Cox) before feeding into linear models.
    """
    distribution_stats = {}
    
    if df.empty or not numeric_cols:
        return distribution_stats

    for col in numeric_cols:
        # Edge Case: Skip zero-variance (constant) columns as they provide no info
        std_val = df[col].std()
        if pd.isna(std_val) or std_val == 0:
            continue
            
        skew_val = df[col].skew()
        
        # Calculate Kurtosis: measures the "tailedness"
        # High kurtosis means more extreme outliers
        kurtosis_val = df[col].kurtosis()

        stats = {
            "mean": round(df[col].mean(), 4),
            "median": round(df[col].median(), 4),
            "std": round(std_val, 4),
            "min": round(df[col].min(), 4),
            "max": round(df[col].max(), 4),
            "skew": round(skew_val, 4) if not pd.isna(skew_val) else 0.0,
            "kurtosis": round(kurtosis_val, 4) if not pd.isna(kurtosis_val) else 0.0
        }

        distribution_stats[col] = stats

    return distribution_stats