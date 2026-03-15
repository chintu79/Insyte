ml_pipeline/
│
├── eda/
│   ├── __init__.py
│
│   ├── eda_pipeline.py
│
│   ├── inspectors/
│   │   ├── dataset_summary.py
│   │   ├── column_detector.py
│   │   └── data_quality.py
│
│   ├── analyzers/
│   │   ├── missing_analysis.py
│   │   ├── distribution_analysis.py
│   │   ├── correlation_analysis.py
│   │   ├── outlier_detection.py
│   │   └── categorical_analysis.py
│
│   ├── visualizations/
│   │   ├── distribution_plots.py
│   │   ├── correlation_plots.py
│   │   └── categorical_plots.py
│
│   ├── insights/
│   │   └── rule_based_insights.py
│
│   └── utils/
│       ├── dataframe_utils.py
│       └── type_detection.py