import { useState } from "react";
import { Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import "../styles/Upload.css";

export default function Upload() {
  const [eda, setEda] = useState(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [data, setData] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const navigate = useNavigate();

  // File select handler
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    processFile(selectedFile);
  };

  // Drag handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    processFile(droppedFile);
  };

  // Validate and process file
  const processFile = (selectedFile) => {
    if (!selectedFile) return;

    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!validTypes.includes(selectedFile.type)) {
      setError("❌ Please upload a CSV or Excel file");
      setFile(null);
      setData([]);
      return;
    }

    if (selectedFile.size > 100 * 1024 * 1024) {
      setError("❌ File size must be less than 100MB");
      setFile(null);
      setData([]);
      return;
    }

    setFile(selectedFile);
    setError("");
    setData([]);
  };

  // Upload file to backend
  const handleUpload = async () => {
    if (!file) {
      setError("⚠️ Please select a file before uploading!");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      console.log("EDA Pipeline Output:", result);

      if (result.dataset_summary && result.dataset_summary.error) {
        setError("⚠ " + result.dataset_summary.error);
        setIsUploading(false);
        return;
      }

      // preview table
      if (result.preview) {
        setData(result.preview);
      }

      setError("");

      // navigate to results page
      navigate("/result", {
        state: {
          edaReport: result,
          fileName: file.name,
        },
      });
    } catch (err) {
      console.error("Upload failed:", err);
      setError("⚠ Upload failed. Please check if backend is running!");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="upload-wrapper">
      <div className="upload-container">

        <div className="upload-header">
          <Typography variant="h4">Upload Dataset</Typography>
          <p>Drop your file or click to browse</p>
        </div>

        {/* Upload Zone */}
        <div
          className={`upload-zone ${isDragActive ? "dragover" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-input"
            accept=".csv, .xlsx, .xls"
            onChange={handleFileChange}
          />

          <label htmlFor="file-input" className="upload-label">
            <div className="upload-icon">📁</div>
            <div className="upload-text">
              <span className="upload-main">Drag & drop your file here</span>
              <span className="upload-sub">or click to select</span>
            </div>
          </label>
        </div>

        {/* File Info */}
        {file && (
          <div className="file-info">
            <div className="file-icon">✓</div>

            <div className="file-details">
              <div className="file-name">{file.name}</div>
              <div className="file-size">
                {(file.size / 1024).toFixed(2)} KB
              </div>
            </div>

            <button
              className="remove-file"
              onClick={() => {
                setFile(null);
                setError("");
                setData([]);
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="error-banner">
            <span>{error}</span>
          </div>
        )}

        {/* Upload Button */}
        <Button
          variant="contained"
          className="upload-btn"
          onClick={handleUpload}
          disabled={isUploading || !file}
        >
          {isUploading ? "Analyzing Dataset..." : "🚀 Run EDA Pipeline"}
        </Button>

        {/* Data Preview */}
        {data.length > 0 && (
          <div className="preview-section">
            <h2>Data Preview</h2>

            <div className="table-wrapper">
              <table className="preview-table">
                <thead>
                  <tr>
                    {Object.keys(data[0]).map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {data.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((val, i) => (
                        <td key={i}>{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="features-info">
          <div className="info-card">📊 Supports CSV, Excel</div>
          <div className="info-card">⚡ Max 100MB</div>
          <div className="info-card">🔒 Secure Upload</div>
        </div>
      </div>
    </div>
  );
}