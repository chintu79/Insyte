
import { useState } from "react";
import { Typography, Button } from "@mui/material";
<<<<<<< HEAD
import { useNavigate } from "react-router-dom";

export default function Upload() {
  const [eda, setEda] = useState(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
=======
  const [data, setData] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);


  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setError("");
    setData([]);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("⚠ Please select a file before uploading!");
      return;
    }

    setIsUploading(true);

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
<<<<<<< HEAD
      console.log("EDA Pipeline Output:", result);

      if (result.dataset_summary && result.dataset_summary.error) {
        setError("⚠ " + result.dataset_summary.error);
        return;
      }

      if (result.preview) {
        setData(result.preview);
      }

      setError("");

      navigate("/result", {
        state: { edaReport: result, fileName: file.name }
      });

    } catch (err) {
      console.error("Upload failed:", err);
      setError("⚠ Upload failed. Please check if the backend is running!");
      setIsLoading(false);
    }
  };

  return (
    <div className="page-center">
      <div className="center-box">

        <Typography variant="h4" gutterBottom>
          Upload Dataset
        </Typography>

        <input
          type="file"
          accept=".csv, .xlsx"
          onChange={handleFileChange}
          disabled={isLoading}
        />

        {file && (
          <p style={{ marginTop: "10px" }}>
            Selected file: <b>{file.name}</b>
          </p>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-banner">
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <p style={{ color: "#1976d2", marginTop: "15px", fontWeight: 600 }}>
            Analyzing Dataset... This may take a moment.
          </p>
        ) : (
          <Button
            variant="contained"
            sx={{ mt: 3 }}
            onClick={handleUpload}
            disabled={!file}
          >
            Run EDA Pipeline
          </Button>
        )}

      </div>
    </div>
  );
}