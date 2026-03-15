from eda.eda_pipeline import run_eda

# path to dataset
file_path = "amazon_sales_dataset.csv"

# run EDA
result = run_eda(file_path)

# print results
print("\nDATASET SUMMARY")
print(result["dataset_summary"])

print("\nCOLUMN TYPES")
print(result["column_types"])

print("\nINSIGHTS")
for insight in result["insights"]:
    print("-", insight)