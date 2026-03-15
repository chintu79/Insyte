def generate_insights(missing_info, correlations):
    """
    Synthesize findings from various analyzers into actionable ML feature engineering insights.
    """
    insights = []

    if isinstance(missing_info, dict):
        for col, data in missing_info.items():
            if isinstance(data, dict) and 'missing_percent' in data and data['missing_percent'] > 0:
                percent = data['missing_percent']
                rec = data.get('imputation_recommendation', 'Investigate further')
                if percent > 30:
                    insights.append(f"[WARNING] Feature '{col}' has high missingness ({percent}%). {rec}.")
                else:
                    insights.append(f"[INFO] Feature '{col}' has light missingness ({percent}%). {rec}.")

    if isinstance(correlations, dict) and "strong_correlations" in correlations:
        for pair in correlations["strong_correlations"]:
            f1, f2, corr = pair.get('feature_1'), pair.get('feature_2'), pair.get('correlation')
            action = pair.get('action_recommendation', 'Consider removing one feature.')
            severity = pair.get('severity', 'WARNING')
            
            insights.append(
                f"[{severity}] Correlation between '{f1}' and '{f2}'. {action}"
            )

    if not insights:
         insights.append("[INFO] Dataset looks extremely clean. No critical anomalies detected.")

    return insights