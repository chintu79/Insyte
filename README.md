# Insyte

Insyte is a full-stack web application designed for processing and previewing CSV files, built with a modern, decoupled architecture.

## Project Structure

This repository is split into two main directories:

- **`backend/`**: A Python-based REST API built with FastAPI. It handles file uploads safely, processes CSV data using Pandas, and serves metadata and data previews to the client.
- **`frontend/`**: A React application powered by Vite. It provides an intuitive user interface for users to upload their CSV files and immediately preview the uploaded data.

## Prerequisites

Before setting up the project, make sure you have the following installed on your machine:

- **Node.js** (v16+ recommended)
- **Python** (v3.9+ recommended)
- **npm** (for the frontend)

---

## 🚀 Getting Started

Follow the instructions below to get both the frontend and backend running locally.

### 1. Backend Setup

The backend runs on FastAPI.

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the backend server:
   ```bash
   python -m uvicorn app:app --reload --port 8000
   ```
   > The backend API will start at [http://127.0.0.1:8000](http://127.0.0.1:8000).

---

### 2. Frontend Setup

The frontend is a React app configured with Vite.

1. Open a new terminal window and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install the necessary Node dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   > The frontend application will be accessible at [http://localhost:5173](http://localhost:5173).

---

## API Endpoints

### `POST /upload`
Expects a `multipart/form-data` request with a `file` field containing a CSV.
**Returns:**
- `filename`: The name of the uploaded file.
- `columns`: A list of all column headers in the CSV.
- `row_count`: The total number of rows.
- `preview`: An array of the first 5 rows represented as objects.

## License

Standard open-source license applies. See `backend/LICENSE` if applicable.
