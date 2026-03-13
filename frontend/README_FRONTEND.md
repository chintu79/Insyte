npm install
npm run dev

Open in browser:

http://localhost:5173
📁 Folder Structure
src/
│
├── Pages/              Application pages
│   ├── Home.jsx        Landing page
│   ├── Upload.jsx      Dataset upload interface
│   └── Result.jsx      Results display
│
├── components/         Reusable UI components
│   ├── Navbar.jsx
│   ├── Button.jsx
│   └── Card.jsx
│
├── services/
│   └── api.jsx         Backend API calls
│
├── styles/             Page styles
│   ├── Home.css
│   └── Upload.css
│
├── App.jsx             Main router
├── main.jsx            React entry point
└── index.css           Base styles
⚙️ Routing

Routes defined in App.jsx

Route	Page
/	Home page
/upload	Upload dataset

Navbar appears on all pages.

📤 File Upload Flow
User selects file
      ↓
Upload.jsx validates file
      ↓
POST request to backend
      ↓
Backend returns preview
      ↓
Preview displayed in table

Backend endpoint:

http://localhost:8000/upload

Example API call:

await fetch("http://localhost:8000/upload", {
  method: "POST",
  body: formData
});
npm install

run frontend-
cd frontend
npm run dev

Open in browser:

http://localhost:5173
📁 Folder Structure
src/
│
├── Pages/              Application pages
│   ├── Home.jsx        Landing page
│   ├── Upload.jsx      Dataset upload interface
│   └── Result.jsx      Results display
│
├── components/         Reusable UI components
│   ├── Navbar.jsx
│   ├── Button.jsx
│   └── Card.jsx
│
├── services/
│   └── api.jsx         Backend API calls
│
├── styles/             Page styles
│   ├── Home.css
│   └── Upload.css
│
├── App.jsx             Main router
├── main.jsx            React entry point
└── index.css           Base styles
⚙️ Routing

Routes defined in App.jsx

Route	Page
/	Home page
/upload	Upload dataset

Navbar appears on all pages.

📤 File Upload Flow
User selects file
      ↓
Upload.jsx validates file
      ↓
POST request to backend
      ↓
Backend returns preview
      ↓
Preview displayed in table

Backend endpoint:

http://localhost:8000/upload

Example API call:

await fetch("http://localhost:8000/upload", {
  method: "POST",
  body: formData
});