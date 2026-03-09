def drop_useless_columns(df, eda_results, protected_columns=None):
    """
    Drop useless columns: ID-like, constant, and empty columns.
    Never drops columns listed in protected_columns.
    """

    if protected_columns is None:
        protected_columns = []

    column_types = eda_results["column_types"]

    drop_cols = []

    drop_cols += column_types.get("id_like", [])
    drop_cols += column_types.get("constant", [])
    drop_cols += column_types.get("empty", [])

    drop_cols = list(set(drop_cols))

    # Never drop protected columns (e.g., target)
    drop_cols = [c for c in drop_cols if c not in protected_columns]

    df = df.drop(columns=drop_cols, errors="ignore")

    return df, drop_cols