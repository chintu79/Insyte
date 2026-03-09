import numpy as np


def remove_highly_correlated(df, eda_results, threshold=0.95, protected_columns=None):
    """
    Remove highly correlated features using feature-to-feature correlation only.
    Never removes columns listed in protected_columns.
    """

    if protected_columns is None:
        protected_columns = []

    corr_matrix = df.corr(numeric_only=True).abs()

    upper = corr_matrix.where(
        np.triu(np.ones(corr_matrix.shape), k=1).astype(bool)
    )

    to_drop = [col for col in upper.columns if any(upper[col] > threshold)]

    # Never remove protected columns (e.g., target)
    to_drop = [c for c in to_drop if c not in protected_columns]

    df = df.drop(columns=to_drop)

    return df, to_drop