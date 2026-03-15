import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDataset } from "../context/DatasetContext";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Syne:wght@600;700;800&display=swap');

  .up-root * { box-sizing: border-box; margin: 0; padding: 0; }
  .up-root {
    min-height: calc(100vh - 72px);
    background: #080c14;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 100px 20px;
    font-family: 'Syne', sans-serif;
    position: relative;
    overflow: hidden;
  }

  /* background orbs */
  .up-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    pointer-events: none;
  }
  .up-orb-1 {
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(56,189,248,0.12), transparent 70%);
    top: -100px; left: -100px;
  }
  .up-orb-2 {
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(129,140,248,0.1), transparent 70%);
    bottom: -80px; right: -80px;
  }

  /* card */
  .up-card {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 620px;
    background: #0d1321;
    border: 1px solid rgba(99,179,237,0.12);
    border-radius: 20px;
    padding: 48px 44px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  /* header */
  .up-header { text-align: center; }
  .up-title {
    font-size: 28px;
    font-weight: 800;
    color: #e2e8f0;
    letter-spacing: -0.5px;
    margin-bottom: 6px;
  }
  .up-sub {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: #64748b;
    letter-spacing: 1px;
  }

  /* drop zone */
  .up-zone {
    border: 1.5px dashed rgba(56,189,248,0.3);
    border-radius: 14px;
    background: rgba(56,189,248,0.03);
    transition: all 0.2s ease;
    cursor: pointer;
  }
  .up-zone:hover {
    border-color: rgba(56,189,248,0.55);
    background: rgba(56,189,248,0.06);
  }
  .up-zone.drag {
    border-color: #38bdf8;
    background: rgba(56,189,248,0.1);
    transform: scale(1.01);
  }
  .up-zone input { display: none; }
  .up-zone label {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    padding: 52px 20px;
    cursor: pointer;
  }
  .up-zone-icon {
    font-size: 38px;
    animation: bob 2.5s ease-in-out infinite;
  }
  @keyframes bob {
    0%,100% { transform: translateY(0); }
    50%      { transform: translateY(-10px); }
  }
  .up-zone-main {
    color: #e2e8f0;
    font-weight: 700;
    font-size: 15px;
  }
  .up-zone-sub {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #64748b;
  }

  /* file info */
  .up-file {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 18px;
    background: rgba(52,211,153,0.06);
    border: 1px solid rgba(52,211,153,0.2);
    border-radius: 10px;
    animation: slideIn 0.25s ease;
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .up-file-icon {
    width: 42px; height: 42px;
    background: rgba(52,211,153,0.15);
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
  }
  .up-file-name {
    font-weight: 700;
    font-size: 13px;
    color: #e2e8f0;
    word-break: break-all;
  }
  .up-file-size {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #34d399;
    margin-top: 3px;
  }
  .up-file-remove {
    margin-left: auto;
    background: transparent;
    border: none;
    color: #64748b;
    font-size: 18px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    transition: all 0.18s;
    flex-shrink: 0;
  }
  .up-file-remove:hover { color: #f87171; background: rgba(248,113,113,0.1); }

  /* error */
  .up-error {
    padding: 12px 16px;
    background: rgba(248,113,113,0.07);
    border: 1px solid rgba(248,113,113,0.3);
    border-radius: 10px;
    color: #f87171;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    animation: slideIn 0.25s ease;
  }

  /* upload button */
  .up-btn {
    width: 100%;
    padding: 15px;
    border-radius: 10px;
    border: none;
    background: linear-gradient(135deg, #0ea5e9, #6366f1);
    color: #fff;
    font-family: 'Syne', sans-serif;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.18s, transform 0.18s;
    letter-spacing: 0.3px;
  }
  .up-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-2px); }
  .up-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  /* loading bar inside button area */
  .up-loading {
    height: 3px;
    background: rgba(99,179,237,0.1);
    border-radius: 2px;
    overflow: hidden;
    margin-top: -14px;
  }
  .up-loading-fill {
    height: 100%;
    background: linear-gradient(90deg, #0ea5e9, #818cf8, #34d399);
    background-size: 200% 100%;
    animation: shimmer 1.4s linear infinite;
    width: 60%;
  }
  @keyframes shimmer {
    0%   { background-position: 200% center; }
    100% { background-position: -200% center; }
  }

  /* info pills */
  .up-info {
    display: flex;
    justify-content: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .up-info-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    background: rgba(99,179,237,0.05);
    border: 1px solid rgba(99,179,237,0.12);
    border-radius: 20px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #64748b;
    transition: all 0.18s;
  }
  .up-info-pill:hover { color: #e2e8f0; border-color: rgba(99,179,237,0.3); }

  /* preview table */
  .up-preview { animation: slideIn 0.3s ease; }
  .up-preview-title {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #38bdf8;
    margin-bottom: 12px;
  }
  .up-table-wrap {
    overflow-x: auto;
    border-radius: 10px;
    border: 1px solid rgba(99,179,237,0.12);
  }
  .up-table {
    width: 100%;
    border-collapse: collapse;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
  }
  .up-table th {
    padding: 10px 14px;
    background: #111827;
    color: #64748b;
    text-align: left;
    border-bottom: 1px solid rgba(99,179,237,0.1);
    white-space: nowrap;
    font-size: 10px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .up-table td {
    padding: 9px 14px;
    color: #94a3b8;
    border-bottom: 1px solid rgba(99,179,237,0.05);
    white-space: nowrap;
  }
  .up-table tr:last-child td { border-bottom: none; }
  .up-table tr:hover td { background: rgba(56,189,248,0.03); }

  @media (max-width: 560px) {
    .up-card { padding: 32px 24px; }
    .up-title { font-size: 22px; }
    .up-zone label { padding: 40px 16px; }
  }
`;

export default function Upload() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState([]);
  const [isDrag, setIsDrag] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const navigate = useNavigate();
  const { setFile: setGlobalFile, setDatasetId, setUploadInfo, setEdaResult, setFeResult, setAutomlResult } = useDataset();

  const processFile = (f) => {
    if (!f) return;
    const valid = ["text/csv", "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
    if (!valid.includes(f.type)) {
      setError("Please upload a CSV or Excel file (.csv, .xlsx, .xls)");
      setFile(null); return;
    }
    if (f.size > 100 * 1024 * 1024) {
      setError("File size must be under 100 MB");
      setFile(null); return;
    }
    setFile(f);
    setGlobalFile(f);
    setError("");
    setPreview([]);
  };

  const onDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    setIsDrag(e.type === "dragenter" || e.type === "dragover");
  };
  const onDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setIsDrag(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) { setError("Select a file first."); return; }
    setIsUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("http://localhost:8000/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data?.detail || "Upload failed."); return; }
      setDatasetId(data.dataset_id);
      setUploadInfo(data);
      setEdaResult(null); setFeResult(null); setAutomlResult(null);
      if (data.preview) setPreview(data.preview);
      setError("");
      navigate("/dashboard");
    } catch {
      setError("Cannot reach backend. Is uvicorn running on port 8000?");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="up-root">
        <div className="up-orb up-orb-1" />
        <div className="up-orb up-orb-2" />

        <div className="up-card">

          {/* header */}
          <div className="up-header">
            <div className="up-title">Upload Dataset</div>
            <div className="up-sub">CSV · XLSX · XLS &nbsp;·&nbsp; max 100 MB</div>
          </div>

          {/* drop zone */}
          <div
            className={`up-zone${isDrag ? " drag" : ""}`}
            onDragEnter={onDrag} onDragLeave={onDrag}
            onDragOver={onDrag} onDrop={onDrop}
          >
            <input id="up-input" type="file" accept=".csv,.xlsx,.xls"
              onChange={e => processFile(e.target.files[0])} />
            <label htmlFor="up-input">
              <div className="up-zone-icon">📂</div>
              <div className="up-zone-main">Drop your file here</div>
              <div className="up-zone-sub">or click to browse</div>
            </label>
          </div>

          {/* selected file */}
          {file && (
            <div className="up-file">
              <div className="up-file-icon">📄</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="up-file-name">{file.name}</div>
                <div className="up-file-size">{(file.size / 1024).toFixed(1)} KB</div>
              </div>
              <button className="up-file-remove" onClick={() => {
                setFile(null); setGlobalFile(null); setError(""); setPreview([]);
              }}>✕</button>
            </div>
          )}

          {/* error */}
          {error && <div className="up-error">⚠ {error}</div>}

          {/* upload button */}
          <button className="up-btn" onClick={handleUpload} disabled={isUploading || !file}>
            {isUploading ? "Uploading…" : "Upload & Analyse →"}
          </button>
          {isUploading && <div className="up-loading"><div className="up-loading-fill" /></div>}

          {/* info pills */}
          <div className="up-info">
            {[["📊", "CSV & Excel"], ["⚡", "Max 100 MB"], ["🔒", "Local only"]].map(([icon, label]) => (
              <div key={label} className="up-info-pill">{icon} {label}</div>
            ))}
          </div>

          {/* preview table — shown briefly before redirect */}
          {preview.length > 0 && (
            <div className="up-preview">
              <div className="up-preview-title">Preview · {preview.length} rows</div>
              <div className="up-table-wrap">
                <table className="up-table">
                  <thead>
                    <tr>{Object.keys(preview[0]).map(c => <th key={c}>{c}</th>)}</tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((v, j) => <td key={j}>{String(v ?? "")}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}