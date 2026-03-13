# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# DataInsights

AI-powered platform that analyzes data files and generates insights automatically.

## What is it?

Users upload CSV/Excel files → System analyzes data → Returns predictions and insights.

## Project Structure

```
DataInsights/
├── frontend/          React UI application
├── backend/           Python API server
└── docs/              Documentation
```

## Tech Used

| Layer | Technology |
|-------|------------|
| UI | React, Vite, Tailwind CSS |
| Server | FastAPI, Python |
| Data | Pandas, Scikit-learn |
| ML | XGBoost, FLAML |

## Quick Start

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python app.py
```

## How It Works

1. User uploads file via frontend
2. Backend receives file at `/upload` endpoint
3. Data is validated and processed
4. Preview is returned to user
5. (Next: Analysis, Model training, Insights generation)

## Current Features

- File upload with drag & drop
- Data preview
- Responsive UI
- API ready

## File Structure Explanation

### Frontend (React)
- `Pages/` - Different pages (Home, Upload, Result)
- `components/` - Reusable UI components (Navbar, Card)
- `styles/` - CSS styling
- `services/` - API communication
- `App.jsx` - Main component

### Backend (Python)
- `app.py` - Main FastAPI application
- `routes/` - API endpoint definitions
- `services/` - Business logic and data processing
- `uploads/` - Temporary file storage
- `requirements.txt` - Python dependencies

## Development

Both servers run simultaneously:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000

Frontend makes requests to backend API.

## Next Steps

See detailed documentation in:
- `frontend/README.md` - Frontend setup and code structure
- `backend/README.md` - Backend setup and API details