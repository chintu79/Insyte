import pandas as pd
import numpy as np
import os

def plot_correlation_heatmap(df: pd.DataFrame, numeric_cols, output_dir=None):
    """
    Generate a heatmap of the Pearson Correlation matrix between numeric features.
    """
    if len(numeric_cols) < 2 or df.empty:
        return None

    try:
        import matplotlib.pyplot as plt
        import seaborn as sns
    except ImportError:
        return "Error: matplotlib and seaborn are required for visualizations."

    # Validate numeric cols explicitly to avoid empty frames
    valid_numeric = [col for col in numeric_cols if not df[col].isnull().all() and df[col].std() > 0]
    
    if len(valid_numeric) < 2:
        return None

    corr_matrix = df[valid_numeric].corr()

    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)

    plt.figure(figsize=(12, 10))
    
    # Generate a mask for the upper triangle
    mask = np.triu(np.ones_like(corr_matrix, dtype=bool))
    
    # Custom diverging colormap
    cmap = sns.diverging_palette(230, 20, as_cmap=True)

    sns.heatmap(corr_matrix, mask=mask, cmap=cmap, vmax=1, vmin=-1, center=0,
                square=True, linewidths=.5, cbar_kws={"shrink": .5}, annot=True, fmt=".2f")
    
    plt.title("Numeric Feature Correlation Heatmap", fontsize=16)
    plt.tight_layout()
    
    saved_path = None
    if output_dir:
        saved_path = os.path.join(output_dir, "correlation_heatmap.png")
        plt.savefig(saved_path, dpi=150)
    
    plt.close()
    return saved_path