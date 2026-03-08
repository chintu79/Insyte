import React from "react";
import { Container, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";
import "../styles/Home.css";

export default function Home() {
  return (

     <div className="page-center">
      <div className="center-box">
    {/* <Container className="home-container"> */}
      <Typography variant="h3" gutterBottom>
        Welcome to Data Analytics App
      </Typography>
      <Typography variant="body1" gutterBottom>
        Click below to upload your dataset and see insights
      </Typography>
      <Button
        variant="contained"
        component={Link}
        to="/Upload"
        className="primary-button"
      >
        Go to Upload
      </Button>
      </div>
      </div>
    // {/* </Container> */}
  );
}