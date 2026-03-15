import pandas as pd

def detect_outliers(df: pd.DataFrame, numeric_cols):
    """
    Identify outliers using the Interquartile Range (IQR) method.
    Outliers can severely impact distance-based ML models (e.g., K-Means, SVM)
    and linear models, but are often fine for tree-based models (e.g., Random Forest).
    """
    outlier_results = {}
    num_rows = len(df)
    
    # Edge case: IQR is fundamentally unreliable for very small samples
    if num_rows < 30:
         return {"error": "Sample size too small (<30) for reliable IQR outlier detection."}

    for col in numeric_cols:
        # Skip if the column is entirely null
        if df[col].isnull().all():
            continue

        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)

        IQR = Q3 - Q1
        
        # Edge case: No variance in the middle 50% means IQR is 0. 
        # Outlier detection will flag everything outside this exact value, which is usually not intended.
        if IQR == 0:
            continue

        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR

        outliers = df[(df[col] < lower_bound) | (df[col] > upper_bound)]
        outlier_count = len(outliers)
        outlier_percent = round((outlier_count / num_rows) * 100, 2)
        
        if outlier_count > 0:
            if outlier_percent > 15:
                 action = "High outlier percentage. Consider 'Winsorization' (capping) instead of dropping to avoid heavy data loss."
            elif outlier_percent > 5:
                 action = "Moderate outlier percentage. Consider capping if using Linear/Distance-based models."
            else:
                 action = "Low outlier percentage. Safe to drop these rows if they are data entry errors."
                 
            outlier_results[col] = {
                "outlier_count": int(outlier_count),
                "outlier_percent": outlier_percent,
                "lower_bound": round(lower_bound, 4),
                "upper_bound": round(upper_bound, 4),
                "action_recommendation": action
            }

    return outlier_results