import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          <span className="logo-icon">📊</span>
          <span className="logo-text">DataInsights</span>
        </Link>

        {/* Hamburger Menu */}
        <div className={`hamburger ${isOpen ? 'active' : ''}`} onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>

        {/* Navigation Links */}
        <ul className={`nav-menu ${isOpen ? 'active' : ''}`}>
          <li className="nav-item">
            <Link to="/" className="nav-link" onClick={closeMenu}>
              Home
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/upload" className="nav-link" onClick={closeMenu}>
              Upload
            </Link>
          </li>
          <li className="nav-item">
            <a href="#features" className="nav-link" onClick={closeMenu}>
              Features
            </a>
          </li>
          <li className="nav-item">
            <a href="#about" className="nav-link" onClick={closeMenu}>
              About
            </a>
          </li>
        </ul>

        {/* CTA Button */}
        <Link to="/upload" className="cta-button" onClick={closeMenu}>
          Get Started
        </Link>
      </div>

      {/* Navbar Blur Background */}
      <div className="navbar-glow"></div>
    </nav>
  );
}