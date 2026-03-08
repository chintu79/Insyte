from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

app = FastAPI()

# Frontend se requests ke liye CORS
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
    preview = df.head(5).to_dict(orient="records")
    columns = df.columns.tolist()
    row_count = len(df)
    return {
        "filename": file.filename,
        "columns": columns,
        "row_count": row_count,
        "preview": preview
    }