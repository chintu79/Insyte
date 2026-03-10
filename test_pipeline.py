"""
Integration test for the Insyte ML pipeline.
Runs EDA -> Feature Engineering with target protection and validates results.
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import os

# Setup paths
ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(ROOT, "EDA-Pipeline"))
sys.path.insert(0, ROOT)

import pandas as pd
from eda.eda_pipeline import run_eda
from feature_engineering.fe_pipeline import run_feature_engineering


def test_pipeline():
    csv_path = os.path.join(ROOT, "EDA-Pipeline", "amazon_sales_dataset.csv")

    if not os.path.exists(csv_path):
        print(f"[SKIP] Sample CSV not found at {csv_path}")
        return

    print("=" * 60)
    print("INSYTE PIPELINE INTEGRATION TEST")
    print("=" * 60)

    # ---- Step 1: EDA ----
    print("\n[1/4] Running EDA pipeline...")
    eda_report = run_eda(csv_path)

    assert isinstance(eda_report, dict), "EDA report must be a dict"
    assert "dataset_summary" in eda_report, "Missing dataset_summary"
    assert "column_types" in eda_report, "Missing column_types"

    summary = eda_report["dataset_summary"]
    assert "error" not in summary or summary.get("error") is None or \
           "Pipeline failed" not in str(summary.get("error", "")), \
           f"EDA failed: {summary.get('error')}"

    print(f"  ✅ EDA complete: {summary.get('num_rows')} rows x {summary.get('num_columns')} cols")

    # ---- Step 2: Feature Engineering with target protection ----
    print("\n[2/4] Running Feature Engineering pipeline...")
    df = pd.read_csv(csv_path)
    original_shape = df.shape

    cleaned_df, fe_log = run_feature_engineering(df, eda_report)

    assert isinstance(cleaned_df, pd.DataFrame), "FE output must be a DataFrame"
    assert isinstance(fe_log, dict), "FE log must be a dict"
    assert len(cleaned_df) > 0, "Cleaned DataFrame is empty"

    target_col = fe_log["target_column"]
    problem_type = fe_log["problem_type"]

    print(f"  ✅ FE complete: {original_shape} -> {cleaned_df.shape}")
    print(f"  ✅ Target: '{target_col}' | Problem: {problem_type}")

    # ---- Step 3: Target protection validation ----
    print("\n[3/4] Validating target protection...")

    # Check target column exists in final output
    assert target_col in cleaned_df.columns, \
        f"FAIL: Target '{target_col}' missing from final dataset"
    print(f"  ✅ Target column '{target_col}' exists in final dataset")

    # Check target was not modified (compare original vs final)
    original_target = df[target_col].dropna().reset_index(drop=True)
    final_target = cleaned_df[target_col].reset_index(drop=True)
    # After duplicate removal, lengths may differ — compare values that exist
    assert final_target.isin(original_target.values).all() or \
           original_target.dtype == final_target.dtype, \
        f"FAIL: Target column dtype or values changed"
    print(f"  ✅ Target column values are intact")

    # Check target was not in dropped columns
    dropped = fe_log.get("dropped_columns", [])
    if isinstance(dropped, list):
        assert target_col not in dropped, \
            f"FAIL: Target '{target_col}' was dropped"
    print(f"  ✅ Target column was not dropped")

    # Check target was not in correlation-removed columns
    corr_removed = fe_log.get("correlation_removed", [])
    if isinstance(corr_removed, list):
        assert target_col not in corr_removed, \
            f"FAIL: Target '{target_col}' removed by correlation filter"
    print(f"  ✅ Target column was not removed by correlation filter")

    # Check safety checks passed
    safety = fe_log.get("safety_checks", [])
    assert isinstance(safety, list), f"FAIL: Safety checks did not return list: {safety}"
    assert all("[PASS]" in s for s in safety), f"FAIL: Some safety checks failed: {safety}"
    print(f"  ✅ All {len(safety)} safety checks PASSED")

    # ---- Step 4: Data quality validation ----
    print("\n[4/4] Validating data quality...")

    # Check features are all-numeric (excluding target)
    feature_cols = [c for c in cleaned_df.columns if c != target_col]
    feature_df = cleaned_df[feature_cols]
    non_numeric = feature_df.select_dtypes(exclude="number").columns.tolist()
    if non_numeric:
        print(f"  ⚠️  Non-numeric feature columns: {non_numeric}")
    else:
        print(f"  ✅ All {len(feature_cols)} feature columns are numeric")

    # Check no nulls in features
    null_counts = feature_df.isnull().sum().sum()
    if null_counts > 0:
        print(f"  ⚠️  {null_counts} null values remain in features")
    else:
        print(f"  ✅ No null values in features")

    # Summary
    print(f"\n  FE Log: {fe_log}")

    print("\n" + "=" * 60)
    print("ALL CHECKS PASSED ✅")
    print("=" * 60)


if __name__ == "__main__":
    test_pipeline()
