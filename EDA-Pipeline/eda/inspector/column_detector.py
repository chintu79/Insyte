import pandas as pd

def detect_column_types(df: pd.DataFrame):
    """
    Detect column types and identify edge cases (empty, constant, high-cardinality IDs).
    Categorizing features correctly is crucial for selecting the right ML models and preprocessing steps.
    """
    column_types = {
        "numeric": [],
        "numeric_continuous": [],
        "numeric_discrete": [],
        "categorical": [],
        "datetime": [],
        "boolean": [],
        "empty": [],
        "constant": [],
        "id_like": []
    }
    
    if df.empty:
        return column_types

    num_rows = len(df)

    for col in df.columns:
        # 1. Edge Case: Empty Column (100% missing values)
        if df[col].isnull().all():
            column_types["empty"].append(col)
            continue
            
        unique_count = df[col].nunique()

        # 2. Edge Case: Constant Column (zero variance)
        # These are useless for ML as they provide no discriminative power
        if unique_count == 1:
            column_types["constant"].append(col)
            continue
            
        # 3. Edge Case: ID-like Column
        # Detect IDs if they are > 95% unique, OR if the column name explicitly denotes an ID
        is_high_cardinality = (unique_count / num_rows) > 0.95
        is_named_id = str(col).lower() == 'id' or str(col).lower().endswith('_id') or str(col).lower().endswith('id')

        if is_high_cardinality or is_named_id:
             column_types["id_like"].append(col)
             continue

        # 4. Feature Type: Boolean / Binary
        if unique_count == 2:
            column_types["boolean"].append(col)
            continue
            
        # 5. Feature Type: Datetime
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            column_types["datetime"].append(col)
            continue
            
        # 6. Feature Type: Numeric
        if pd.api.types.is_numeric_dtype(df[col]):
            column_types["numeric"].append(col)
            # Differentiate continuous vs discrete (rule of thumb: < 20 unique vals = discrete)
            # Discrete features might be treated as categorical embeddings in some DL models
            if unique_count < 20:
                column_types["numeric_discrete"].append(col)
            else:
                column_types["numeric_continuous"].append(col)
            continue
            
        # 7. Feature Type: Categorical
        # If it's not any of the above, it's likely categorical text
        column_types["categorical"].append(col)

    return column_types