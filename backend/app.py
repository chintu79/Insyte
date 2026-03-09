from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

app = FastAPI()

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):

    # Read CSV file
    df = pd.read_csv(file.file)

    # Basic info
    preview = df.head(5).to_dict(orient="records")
    columns = df.columns.tolist()
    row_count = len(df)

    # EDA calculations
    summary_statistics = df.describe().to_dict()
    missing_values = df.isnull().sum().to_dict()
    data_types = df.dtypes.astype(str).to_dict()

    # Correlation (only numeric columns)
    correlation_matrix = df.corr(numeric_only=True).to_dict()

    # Duplicate rows
    duplicate_rows = int(df.duplicated().sum())

    return {
        "filename": file.filename,
        "columns": columns,
        "row_count": row_count,
        "preview": preview,
        "summary_statistics": summary_statistics,
        "missing_values": missing_values,
        "data_types": data_types,
        "correlation_matrix": correlation_matrix,
        "duplicate_rows": duplicate_rows
    }