import numpy as np


def fix_skewed_features(df, eda_results):

    distribution_stats = eda_results.get("distribution", {})

    for col, stats in distribution_stats.items():

        skew = stats.get("skew", 0)

        if skew > 1:

            if (df[col] >= 0).all():
                df[col] = np.log1p(df[col])

    return df