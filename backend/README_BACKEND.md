FastAPI backend for DataInsights.
Handles dataset uploads and returns preview data.

🚀 Run the Server
pip install -r requirements.txtgit push origin yogesh
python app.py
Server runs at:
http://localhost:8000
📁 Folder Structure
backend/
│
├── app.py                Main FastAPI application
│
├── routes/
│   └── upload.py         File upload endpoint
│
├── services/
│   ├── data_processor.py Data validation and cleaning
│
├── utils/
│   ├── validators.py
│   └── constants.py
│
├── uploads/              Temporary uploaded files
└── tests/                Backend tests
⚙️ Upload Endpoint
POST /upload

Receives CSV or Excel file and returns dataset preview.

Example response:

{
  "filename": "data.csv",
  "columns": ["col1", "col2"],
  "row_count": 1000,
  "preview": [...]
}
🔄 Request Flow
Frontend sends POST /upload
        ↓
Backend receives file
        ↓
Pandas reads dataset
        ↓
Preview (first 5 rows) generated
        ↓
JSON response returned
🧰 Tech Stack

FastAPI
Uvicorn
Pandas
Python

🌐 CORS Configuration

Frontend allowed origin:
http://localhost:5173

Configured in app.py.

⚠️ Common Issues
ModuleNotFoundError

Run:
pip install -r requirements.txt
Port already in use
Run server on another port.