import pandas as pd


def handle_high_cardinality(df, eda_results, threshold=50):
    """
    Detect and transform high-cardinality categorical features.

    Parameters
    ----------
    df : pandas.DataFrame
        Input dataset.

    eda_results : dict
        Output dictionary from the EDA pipeline.

    threshold : int
        Number of unique values above which a column is considered
        high cardinality.

    Returns
    -------
    df : pandas.DataFrame
        DataFrame with high-cardinality features encoded.

    transformed_cols : list
        List of columns that were transformed.
    """

    categorical_cols = eda_results["column_types"].get("categorical", [])

    transformed_cols = []

    for col in categorical_cols:

        unique_count = df[col].nunique()

        if unique_count > threshold:

            # Frequency Encoding
            freq = df[col].value_counts(normalize=True)

            df[col] = df[col].map(freq)

            transformed_cols.append(col)

    return df, transformed_cols