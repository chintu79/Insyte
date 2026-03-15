import React from 'react'
import './App.css'

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from './Pages/Home';      // Home page
import Upload from "./Pages/Upload";   // Upload page
import Dashboard from "./Pages/Dashboard";
import { DatasetProvider } from "./context/DatasetContext";

function App() {
  return (
    <>
      <DatasetProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </BrowserRouter>
      </DatasetProvider>
    </>
  )
}

export default App
