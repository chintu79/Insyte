import sys
from pathlib import Path

# Ensure project root (A:\Insyte) is on sys.path so absolute imports work
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

import pandas as pd

from EDA_Pipeline.eda.inspector.dataset_summary import get_dataset_summary
from EDA_Pipeline.eda.inspector.column_detector import detect_column_types
from EDA_Pipeline.eda.inspector.data_quality import check_data_quality

from EDA_Pipeline.eda.analyzers.missing_analysis import analyze_missing_values
from EDA_Pipeline.eda.analyzers.distribution_analysis import analyze_numeric_distribution
from EDA_Pipeline.eda.analyzers.correlation_analysis import analyze_correlations
from EDA_Pipeline.eda.analyzers.outlier_detection import detect_outliers
from EDA_Pipeline.eda.analyzers.categorical_analysis import analyze_categorical_data

from EDA_Pipeline.eda.insights.rule_based_insights import generate_insights

from EDA_Pipeline.eda.utils.type_detection import coerce_to_numeric, coerce_to_datetime
from EDA_Pipeline.eda.utils.dataframe_utils import reduce_memory_usage, convert_to_native_types

from EDA_Pipeline.eda.visualizations.categorical_plots import plot_categorical_distributions
from EDA_Pipeline.eda.visualizations.correlation_plots import plot_correlation_heatmap
from EDA_Pipeline.eda.visualizations.distribution_plots import plot_numeric_distributions


def run_eda(file_path):
    """
    Main orchestration function for the EDA pipeline.
    Executes all sub-modules sequentially, collecting insights for downstream ML tasks.
    """
    eda_report = {
        "dataset_summary": {"error": "Pipeline failed before completion."},
        "column_types": {},
        "missing_analysis": {},
        "distribution": {},
        "categorical_analysis": {},
        "correlations": {"correlation_matrix": {}, "strong_correlations": []},
        "outliers": {},
        "insights": [],
        "visualizations": {}
    }

    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        eda_report["dataset_summary"]["error"] = f"Failed to read CSV at {file_path}: {e}"
        return convert_to_native_types(eda_report)

    try:
        # Step 1: Initial column detection and type coercion
        column_types = detect_column_types(df)
        object_cols = column_types.get("categorical", []) + column_types.get("id_like", [])

        df, coerced_num = coerce_to_numeric(df, object_cols)
        df, coerced_dt = coerce_to_datetime(df, object_cols)

        # Step 2: Memory optimization
        df, mem_start, mem_end, mem_reduction = reduce_memory_usage(df)

        # Re-detect columns after coercion
        column_types = detect_column_types(df)

        numeric_cols = list(set(
            column_types.get("numeric", []) +
            column_types.get("numeric_continuous", []) +
            column_types.get("numeric_discrete", [])
        ))
        categorical_cols = column_types.get("categorical", [])

        # Step 3: Analysis
        summary = get_dataset_summary(df)
        summary["memory_usage_mb"] = mem_start
        summary["memory_optimized_mb"] = mem_end
        summary["memory_reduction_percent"] = mem_reduction

        data_quality   = check_data_quality(df, categorical_cols, numeric_cols)
        missing_info   = analyze_missing_values(df)
        distribution   = analyze_numeric_distribution(df, numeric_cols)
        correlations   = analyze_correlations(df, numeric_cols)
        outliers       = detect_outliers(df, numeric_cols)
        categorical_info = analyze_categorical_data(df, categorical_cols)
        insights       = generate_insights(missing_info, correlations)

        # Step 4: Visualizations
        output_dir = "eda_plots"
        cat_plots   = plot_categorical_distributions(df, categorical_cols, output_dir)
        dist_plots  = plot_numeric_distributions(df, numeric_cols, output_dir)
        heatmap_plot = plot_correlation_heatmap(df, numeric_cols, output_dir)

        eda_report = {
            "dataset_summary": summary,
            "data_quality_issues": data_quality,
            "column_types": column_types,
            "missing_analysis": missing_info,
            "distribution": distribution,
            "categorical_analysis": categorical_info,
            "correlations": correlations,
            "outliers": outliers,
            "insights": insights,
            "visualizations": {
                "categorical_plots": cat_plots,
                "distribution_plots": dist_plots,
                "correlation_heatmap": heatmap_plot,
            }
        }

    except Exception as e:
        eda_report["dataset_summary"]["error"] = f"Pipeline analysis encountered a critical error: {e}"

    return convert_to_native_types(eda_report)