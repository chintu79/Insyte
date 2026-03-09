class TargetSafetyError(Exception):
    """Raised when the target column is corrupted during the pipeline."""
    pass


def validate_target_safety(
    df,
    target_column: str,
    original_target_values,
    log: dict,
) -> list:
    """
    Run post-pipeline safety checks to ensure the target column
    was never modified, removed, encoded, or scaled.

    Parameters
    ----------
    df : pd.DataFrame
        The final processed DataFrame (should contain target).
    target_column : str
        Name of the target column.
    original_target_values : pd.Series
        The original target column values before any processing.
    log : dict
        The FE pipeline log to inspect for target tampering.

    Returns
    -------
    list of str
        List of validation check results (all should be PASS).

    Raises
    ------
    TargetSafetyError
        If any critical safety check fails.
    """

    results = []

    # Check 1: Target column exists in final dataset
    if target_column not in df.columns:
        raise TargetSafetyError(
            f"CRITICAL: Target column '{target_column}' is missing from the final dataset. "
            f"It may have been removed during correlation filtering or column dropping."
        )
    results.append(f"[PASS] Target column '{target_column}' exists in final dataset")

    # Check 2: Target column was not modified
    final_target = df[target_column]
    if not original_target_values.equals(final_target):
        raise TargetSafetyError(
            f"CRITICAL: Target column '{target_column}' values were modified during the pipeline."
        )
    results.append(f"[PASS] Target column '{target_column}' values are unchanged")

    # Check 3: Target was not in dropped columns
    dropped = log.get("dropped_columns", [])
    if isinstance(dropped, list) and target_column in dropped:
        raise TargetSafetyError(
            f"CRITICAL: Target column '{target_column}' was dropped during column cleaning."
        )
    results.append(f"[PASS] Target column was not dropped")

    # Check 4: Target was not removed during correlation filtering
    corr_removed = log.get("correlation_removed", [])
    if isinstance(corr_removed, list) and target_column in corr_removed:
        raise TargetSafetyError(
            f"CRITICAL: Target column '{target_column}' was removed during correlation filtering."
        )
    results.append(f"[PASS] Target column was not removed by correlation filter")

    # Check 5: Target was not encoded (check high-cardinality list)
    high_card = log.get("high_cardinality_encoded", [])
    if isinstance(high_card, list) and target_column in high_card:
        raise TargetSafetyError(
            f"CRITICAL: Target column '{target_column}' was frequency-encoded."
        )
    results.append(f"[PASS] Target column was not encoded")

    return results
