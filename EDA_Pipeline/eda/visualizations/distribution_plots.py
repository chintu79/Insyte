import pandas as pd
import os

def plot_numeric_distributions(df: pd.DataFrame, numeric_cols, output_dir=None):
    """
    Generate Histograms and Boxplots for numeric columns to visualize skewness and outliers.
    """
    if not numeric_cols:
        return []

    try:
        import matplotlib.pyplot as plt
        import seaborn as sns
    except ImportError:
        return ["Error: matplotlib and seaborn are required for visualizations."]

    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)

    saved_plots = []
    
    for col in numeric_cols:
        if df[col].isnull().all():
            continue
            
        fig, axes = plt.subplots(1, 2, figsize=(14, 5))
        
        # Histogram with KDE
        sns.histplot(df[col].dropna(), kde=True, ax=axes[0], color='skyblue')
        axes[0].set_title(f"Distribution of {col}")
        axes[0].set_xlabel(col)
        axes[0].set_ylabel("Frequency")
        
        # Boxplot
        sns.boxplot(x=df[col].dropna(), ax=axes[1], color='lightgreen')
        axes[1].set_title(f"Boxplot of {col}")
        axes[1].set_xlabel(col)
        
        plt.tight_layout()
        
        if output_dir:
            file_path = os.path.join(output_dir, f"num_{col}_distribution.png")
            plt.savefig(file_path, dpi=150)
            saved_plots.append(file_path)
            
        plt.close(fig)
        
    return saved_plots