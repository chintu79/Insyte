def handle_outliers(df, eda_results):

    numeric_cols = [c for c in eda_results["column_types"].get("numeric", []) if c in df.columns]

    for col in numeric_cols:

        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)

        IQR = Q3 - Q1

        lower = Q1 - 1.5 * IQR
        upper = Q3 + 1.5 * IQR

        df[col] = df[col].clip(lower, upper)

    return df