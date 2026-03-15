import pandas as pd

def analyze_categorical_data(df: pd.DataFrame, categorical_cols):
    """
    Analyze categorical and discrete features.
    Provides insights into cardinality, which dictates whether to use One-Hot Encoding
    or more advanced techniques like Target Encoding/Embeddings.
    """
    categorical_stats = {}
    
    if df.empty or not categorical_cols:
        return categorical_stats
        
    for col in categorical_cols:
        if df[col].isnull().all():
            continue
            
        unique_count = df[col].nunique()
        top_values = df[col].value_counts(normalize=True).head(5)
        
        # Determine encoding recommendations based on high vs low cardinality
        if unique_count <= 15:
            action = "Low cardinality. Safe for One-Hot Encoding (OHE)."
        elif unique_count <= 50:
            action = "Medium cardinality. Consider Grouping rare categories before One-Hot Encoding."
        else:
            action = "High cardinality. Avoid OHE. Consider Target Encoding, Frequency Encoding, or Entity Embeddings."
            
        # Check for dominance (one category makes up >90% of data)
        dominant_warning = None
        if top_values.iloc[0] > 0.90:
             dominant_warning = f"Highly skewed category. '{top_values.index[0]}' makes up {round(top_values.iloc[0]*100, 2)}% of the data."
             action = "Feature has heavy class imbalance. " + action

        categorical_stats[col] = {
            "unique_categories": int(unique_count),
            "top_5_categories": {str(k): round(v * 100, 2) for k, v in top_values.to_dict().items()},
            "dominant_warning": dominant_warning,
            "encoding_recommendation": action
        }
        
    return categorical_stats