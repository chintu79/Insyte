import pandas as pd

def analyze_missing_values(df: pd.DataFrame):
    """
    Analyze missing values and provide imputation recommendations for ML models.
    Different strategies are needed based on the percentage of missing data
    and the column type (e.g., categorical vs numeric).
    """
    if df.empty:
        return {}

    missing_count = df.isnull().sum()
    missing_percent = (missing_count / len(df)) * 100

    result = {}

    for col in df.columns:
        count = int(missing_count[col])
        percent = round(missing_percent[col], 2)
        
        # Edge Case: No missing values
        if count == 0:
            recommendation = "No imputation needed"
        # Edge Case: Extreme missing values (75-100%)
        elif percent > 75:
            recommendation = "Drop column (missing >75% is too high to impute safely)"
        # Heavy missing values (40-75%)
        elif percent > 40:
            recommendation = "Consider dropping or impute carefully using advanced methods (e.g., KNN, MICE)"
        # Moderate missing values (5-30%)
        elif percent >= 5:
             if pd.api.types.is_numeric_dtype(df[col]):
                 recommendation = "Impute with Median (robust to outliers)"
             else:
                 recommendation = "Impute with Mode or 'Unknown' category"
        # Light missing values (<5%)
        else:
             if pd.api.types.is_numeric_dtype(df[col]):
                 recommendation = "Safe to impute with Mean or Median"
             else:
                 recommendation = "Safe to impute with Mode"

        result[col] = {
            "missing_count": count,
            "missing_percent": percent,
            "imputation_recommendation": recommendation
        }

    return result