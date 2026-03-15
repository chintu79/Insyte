import pandas as pd
import numpy as np

def analyze_correlations(df: pd.DataFrame, numeric_cols):
    """
    Compute Pearson Correlation matrix.
    Identifying heavily correlated features is crucial to avoid "Multicollinearity",
    which can destabilize linear ML models (e.g., Linear/Logistic Regression).
    """
    if len(numeric_cols) < 2 or df.empty:
        return {"correlation_matrix": {}, "strong_correlations": []}

    # Only include valid numeric columns - dropping columns with zero variance implicitly
    # by ensuring std != 0 avoids division by zero NaNs in correlation matrices
    valid_numeric = [col for col in numeric_cols if not df[col].isnull().all() and df[col].std() > 0]
    
    if len(valid_numeric) < 2:
        return {"correlation_matrix": {}, "strong_correlations": []}

    corr_matrix = df[valid_numeric].corr()

    strong_corr = []
    seen_pairs = set()

    for col1 in valid_numeric:
        for col2 in valid_numeric:
            if col1 == col2:
                continue

            # Sort tuple to avoid counting both (A, B) and (B, A)
            pair = tuple(sorted([col1, col2]))
            if pair in seen_pairs:
                continue

            seen_pairs.add(pair)
            
            # Use numpy to safely handle NaNs
            corr_value = corr_matrix.loc[col1, col2]
            
            if pd.isna(corr_value):
                 continue

            abs_corr = abs(corr_value)
            if abs_corr >= 0.7:
                # Derived feature detection: > 0.9 correlation and related names
                related_names = (col1 in col2 or col2 in col1) or \
                                (any(word in col2.split('_') for word in col1.split('_')) and '_' in col1)

                if abs_corr >= 0.9 and related_names:
                    severity = "WARNING"
                    action = f"These features may be derived from each other (Correlation: {round(corr_value,4)}). Consider removing one to avoid mathematical redundancy."
                elif abs_corr >= 0.9:
                    severity = "WARNING"
                    action = f"High risk of Multicollinearity (Correlation: {round(corr_value,4)}). Consider dropping either '{col1}' or '{col2}' for linear models."
                else: # 0.7 to 0.89
                    severity = "INFO"
                    action = "Moderate to strong correlation detected. These features may be mathematically related."

                strong_corr.append({
                    "feature_1": col1,
                    "feature_2": col2,
                    "correlation": round(corr_value, 4),
                    "action_recommendation": action,
                    "severity": severity
                })

    return {
        # Fill NaNs with 0 to ensure valid JSON serialization later
        "correlation_matrix": corr_matrix.fillna(0).round(4).to_dict(),
        "strong_correlations": strong_corr
    }