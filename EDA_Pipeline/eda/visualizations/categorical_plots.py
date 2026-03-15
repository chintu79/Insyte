import pandas as pd
import os

def plot_categorical_distributions(df: pd.DataFrame, categorical_cols, output_dir=None):
    """
    Generate bar charts for categorical columns showing the top 10 most frequent values.
    """
    if not categorical_cols:
        return []

    try:
        import matplotlib.pyplot as plt
        import seaborn as sns
    except ImportError:
        return ["Error: matplotlib and seaborn are required for visualizations."]

    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)

    saved_plots = []
    
    for col in categorical_cols:
        if df[col].nunique() == 0:
            continue
            
        plt.figure(figsize=(10, 6))
        
        # Take at most top 10 categories to avoid unreadable charts
        top_cats = df[col].value_counts().head(10)
        
        sns.barplot(x=top_cats.values, y=top_cats.index.astype(str), hue=top_cats.index.astype(str), palette="viridis", legend=False)
        plt.title(f"Top {len(top_cats)} Categories in '{col}'", fontsize=14)
        plt.xlabel("Count", fontsize=12)
        plt.ylabel(col, fontsize=12)
        plt.tight_layout()
        
        if output_dir:
            file_path = os.path.join(output_dir, f"cat_{col}_distribution.png")
            plt.savefig(file_path, dpi=150)
            saved_plots.append(file_path)
        
        # Close the figure to free memory
        plt.close()
        
    return saved_plots