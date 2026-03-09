import pandas as pd
import numpy as np

def reduce_memory_usage(df: pd.DataFrame):
    """
    Iterate through all columns of a dataframe and modify the data type
    to reduce memory usage safely.
    """
    start_mem = df.memory_usage(deep=True).sum() / 1024**2
    
    for col in df.columns:
        col_type = df[col].dtype
        
        if pd.api.types.is_numeric_dtype(df[col]):
            c_min = df[col].min()
            c_max = df[col].max()
            
            if str(col_type)[:3] == 'int':
                if c_min > np.iinfo(np.int8).min and c_max < np.iinfo(np.int8).max:
                    df[col] = df[col].astype(np.int8)
                elif c_min > np.iinfo(np.int16).min and c_max < np.iinfo(np.int16).max:
                    df[col] = df[col].astype(np.int16)
                elif c_min > np.iinfo(np.int32).min and c_max < np.iinfo(np.int32).max:
                    df[col] = df[col].astype(np.int32)
                elif c_min > np.iinfo(np.int64).min and c_max < np.iinfo(np.int64).max:
                    df[col] = df[col].astype(np.int64)  
            else:
                if c_min > np.finfo(np.float32).min and c_max < np.finfo(np.float32).max:
                    df[col] = df[col].astype(np.float32)
                else:
                    df[col] = df[col].astype(np.float64)
        elif col_type == object:
            # We don't indiscriminately convert to category unless there are extremely few unique values
            num_unique = df[col].nunique()
            num_total = len(df[col])
            if num_unique / num_total < 0.5:
                # Still, it's safer generally to let user decide when to convert to category
                pass
                
    end_mem = df.memory_usage(deep=True).sum() / 1024**2
    
    # If optimization actually increased memory (can happen when parsing mixed-type strings to fat floats),
    # revert it logically by just reporting 0 reduction and keeping start_mem as a baseline for the report
    if end_mem > start_mem:
        reduction = 0.0
    else:
        reduction = 100 * (start_mem - end_mem) / start_mem
    
    return df, round(start_mem, 2), round(end_mem, 2), round(reduction, 2)


def convert_to_native_types(obj):
    """
    Recursively iterate through dictionaries and lists to convert
    Numpy datatypes (e.g., np.int64, np.float32) into native Python
    types (int, float) to ensure the dictionary is JSON serializable.
    """
    if isinstance(obj, dict):
        return {k: convert_to_native_types(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_to_native_types(i) for i in obj]
    elif isinstance(obj, tuple):
        return tuple(convert_to_native_types(i) for i in obj)
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        if np.isnan(obj) or np.isinf(obj):
            return None
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return convert_to_native_types(obj.tolist())
    else:
        return obj