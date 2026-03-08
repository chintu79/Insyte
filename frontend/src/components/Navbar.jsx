import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import "../styles/Navbar.css"; 
import "../styles/Global.css";


export default function Navbar() {
  return (
    <AppBar  className="navbar">
      <Toolbar className="toolbar">
        <Typography variant="h6" className="navbar-title">
          Data Analytics App
        </Typography>
        <div className="navbar-links">
        <Button color="inherit" component={Link} to="/">
          Home
        </Button>
        <Button color="inherit" component={Link} to="/upload">
          Upload
        </Button>
        </div>
      </Toolbar>
    </AppBar>
  );
}