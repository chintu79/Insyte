import React from 'react'
import './App.css'

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from './Pages/Home';      // Home page
import Upload from "./Pages/Upload";   // Upload page
import Result from './Pages/Result';   // Result page

function App() {
  return (
    <>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/result" element={<Result />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
