import pandas as pd

def get_dataset_summary(df: pd.DataFrame):
    """
    Generate a high-level summary of the dataset.
    This provides fundamental context for down-stream machine learning tasks,
    such as identifying if there's enough data to train a model.
    """
    # Edge case: Empty dataset check
    if df.empty:
        return {"error": "Dataset is empty. Cannot perform EDA!"}

    num_rows = df.shape[0]
    duplicate_rows = df.duplicated().sum()
    
    # Calculate duplicate percentage - high duplicates can lead to data leakage or biased models
    duplicate_percent = round((duplicate_rows / num_rows) * 100, 2) if num_rows > 0 else 0
    
    duplicate_warning = None
    if duplicate_rows > 0:
         duplicate_warning = "Identical duplicate rows detected. It is highly recommended to drop them during cleaning to prevent data leakage."

    summary = {
        "num_rows": num_rows,
        "num_columns": df.shape[1],
        "duplicate_rows": int(duplicate_rows),
        "duplicate_percent": duplicate_percent,
        "duplicate_warning": duplicate_warning,
        # Memory usage in MB. Important for knowing if the dataset fits in RAM for model training
        "memory_usage_mb": round(df.memory_usage(deep=True).sum() / (1024**2), 2),
        "columns": list(df.columns)
    }

    return summary