import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDataset } from '../context/DatasetContext';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Syne:wght@600;700;800&display=swap');

  .nb {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 1000;
    height: 56px;
    background: rgba(8, 12, 20, 0.92);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(99,179,237,0.1);
    display: flex;
    align-items: center;
    font-family: 'Syne', sans-serif;
  }

  .nb-inner {
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    align-items: center;
    gap: 32px;
  }

  .nb-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    flex-shrink: 0;
  }
  .nb-logo-mark {
    width: 28px; height: 28px;
    background: linear-gradient(135deg, #0ea5e9, #6366f1);
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 800;
    color: white;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: -1px;
  }
  .nb-logo-text {
    font-size: 16px;
    font-weight: 800;
    color: #e2e8f0;
    letter-spacing: -0.3px;
  }

  .nb-divider {
    width: 1px;
    height: 20px;
    background: rgba(99,179,237,0.15);
    flex-shrink: 0;
  }

  .nb-links {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 1;
  }

  .nb-link {
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    color: #64748b;
    text-decoration: none;
    border: 1px solid transparent;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .nb-link:hover {
    color: #e2e8f0;
    background: rgba(56,189,248,0.06);
    border-color: rgba(99,179,237,0.15);
  }
  .nb-link.active {
    color: #38bdf8;
    background: rgba(56,189,248,0.08);
    border-color: rgba(56,189,248,0.2);
  }

  .nb-dataset-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 6px;
    background: rgba(52,211,153,0.07);
    border: 1px solid rgba(52,211,153,0.2);
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #34d399;
    max-width: 180px;
    overflow: hidden;
    flex-shrink: 0;
  }
  .nb-dataset-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: #34d399;
    flex-shrink: 0;
    animation: nb-pulse 2s ease-in-out infinite;
  }
  @keyframes nb-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  .nb-dataset-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .nb-cta {
    padding: 7px 16px;
    border-radius: 7px;
    border: none;
    background: linear-gradient(135deg, #0ea5e9, #6366f1);
    color: #fff;
    font-family: 'Syne', sans-serif;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: opacity 0.15s, transform 0.15s;
    flex-shrink: 0;
    letter-spacing: 0.2px;
  }
  .nb-cta:hover { opacity: 0.88; transform: translateY(-1px); }

  .nb-hamburger {
    display: none;
    flex-direction: column;
    gap: 4px;
    cursor: pointer;
    padding: 4px;
    margin-left: auto;
  }
  .nb-hamburger span {
    display: block;
    width: 20px; height: 2px;
    background: #64748b;
    border-radius: 2px;
    transition: all 0.2s;
  }

  .nb-mobile-menu {
    display: none;
    position: fixed;
    top: 56px; left: 0; right: 0;
    background: rgba(8,12,20,0.98);
    border-bottom: 1px solid rgba(99,179,237,0.1);
    padding: 16px 24px;
    flex-direction: column;
    gap: 4px;
    backdrop-filter: blur(16px);
  }
  .nb-mobile-menu.open { display: flex; }
  .nb-mobile-menu .nb-link { width: 100%; }

  @media (max-width: 640px) {
    .nb-links { display: none; }
    .nb-dataset-badge { display: none; }
    .nb-hamburger { display: flex; }
    .nb-cta { display: none; }
    .nb-divider { display: none; }
  }

`;

export default function Navbar() {
  const location = useLocation();
  const { datasetId, uploadInfo } = useDataset();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const isActive = (path) => location.pathname === path ? 'nb-link active' : 'nb-link';

  const links = [
    { to: '/', label: 'Home' },
    { to: '/upload', label: 'Upload' },
    ...(datasetId ? [{ to: '/dashboard', label: 'Dashboard' }] : []),
  ];

  return (
    <>
      <style>{css}</style>
      <nav className="nb">
        <div className="nb-inner">
          <Link to="/" className="nb-logo">
            <div className="nb-logo-mark">In</div>
            <span className="nb-logo-text">Insyte</span>
          </Link>

          <div className="nb-divider" />

          <div className="nb-links">
            {links.map(l => (
              <Link key={l.to} to={l.to} className={isActive(l.to)}>{l.label}</Link>
            ))}
          </div>

          {datasetId && uploadInfo?.filename && (
            <div className="nb-dataset-badge" title={uploadInfo.filename}>
              <div className="nb-dataset-dot" />
              <span className="nb-dataset-name">{uploadInfo.filename}</span>
            </div>
          )}

          <Link to="/upload" className="nb-cta">
            + New Dataset
          </Link>

          <div className="nb-hamburger" onClick={() => setOpen(o => !o)}>
            <span /><span /><span />
          </div>
        </div>
      </nav>

      <div className={`nb-mobile-menu ${open ? 'open' : ''}`}>
        {links.map(l => (
          <Link key={l.to} to={l.to} className={isActive(l.to)}>{l.label}</Link>
        ))}
        <Link to="/upload" className="nb-cta" style={{ marginTop: 8, justifyContent: 'center' }}>
          + New Dataset
        </Link>
      </div>
    </>
  );
}