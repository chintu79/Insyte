from sklearn.preprocessing import StandardScaler


def scale_features(df, eda_results):
    """
    Scale numeric features using StandardScaler.
    Derives columns from the current DataFrame state (not the stale EDA list)
    to account for columns added/removed by earlier pipeline steps.
    """

    numeric_cols = df.select_dtypes(include="number").columns.tolist()

    if not numeric_cols:
        return df

    scaler = StandardScaler()

    df[numeric_cols] = scaler.fit_transform(df[numeric_cols])

    return df