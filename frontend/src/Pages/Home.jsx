import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Syne:wght@600;700;800&display=swap');

  :root {
    --bg:      #080c14;
    --surface: #0d1321;
    --card:    #111827;
    --border:  rgba(99,179,237,0.12);
    --accent:  #38bdf8;
    --accent2: #818cf8;
    --success: #34d399;
    --warn:    #fbbf24;
    --danger:  #f87171;
    --text:    #e2e8f0;
    --muted:   #64748b;
    --mono:    'JetBrains Mono', monospace;
    --sans:    'Syne', sans-serif;
  }

  .hm * { box-sizing: border-box; margin: 0; padding: 0; }
  .hm {
    background: var(--bg);
    color: var(--text);
    font-family: var(--sans);
    min-height: 100vh;
    padding-top: 56px;
    overflow-x: hidden;
  }

  /* ── hero ── */
  .hm-hero {
    position: relative;
    min-height: calc(100vh - 56px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 80px 24px;
    overflow: hidden;
  }

  /* grid bg */
  .hm-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(99,179,237,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,179,237,0.04) 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black, transparent);
  }

  /* glow orbs */
  .hm-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(120px);
    pointer-events: none;
  }
  .hm-orb-1 {
    width: 500px; height: 500px;
    background: rgba(14,165,233,0.12);
    top: -100px; left: -100px;
  }
  .hm-orb-2 {
    width: 400px; height: 400px;
    background: rgba(99,102,241,0.1);
    bottom: -80px; right: -80px;
  }
  .hm-orb-3 {
    width: 300px; height: 300px;
    background: rgba(52,211,153,0.07);
    top: 40%; left: 60%;
  }

  .hm-hero-inner {
    position: relative;
    z-index: 1;
    max-width: 860px;
    text-align: center;
    opacity: 0;
    transform: translateY(24px);
    animation: hm-fadein 0.7s ease 0.1s forwards;
  }
  @keyframes hm-fadein {
    to { opacity: 1; transform: translateY(0); }
  }

  .hm-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 5px 14px;
    border-radius: 20px;
    border: 1px solid rgba(56,189,248,0.25);
    background: rgba(56,189,248,0.06);
    font-family: var(--mono);
    font-size: 11px;
    color: var(--accent);
    letter-spacing: 1px;
    margin-bottom: 28px;
    text-transform: uppercase;
  }
  .hm-eyebrow-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--accent);
    animation: hm-pulse 2s ease-in-out infinite;
  }
  @keyframes hm-pulse {
    0%,100% { opacity: 1; } 50% { opacity: 0.3; }
  }

  .hm-title {
    font-size: clamp(2.4rem, 6vw, 4rem);
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: -1.5px;
    margin-bottom: 20px;
    color: var(--text);
  }
  .hm-title-accent {
    background: linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #34d399 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hm-sub {
    font-size: 16px;
    color: var(--muted);
    line-height: 1.8;
    max-width: 560px;
    margin: 0 auto 40px;
    font-family: var(--mono);
    font-weight: 400;
  }

  .hm-actions {
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 60px;
  }
  .hm-btn-primary {
    padding: 13px 28px;
    border-radius: 8px;
    border: none;
    background: linear-gradient(135deg, #0ea5e9, #6366f1);
    color: #fff;
    font-family: var(--sans);
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: opacity 0.15s, transform 0.15s;
    box-shadow: 0 0 40px rgba(14,165,233,0.25);
  }
  .hm-btn-primary:hover { opacity: 0.88; transform: translateY(-2px); }
  .hm-btn-secondary {
    padding: 13px 28px;
    border-radius: 8px;
    border: 1px solid rgba(99,179,237,0.25);
    background: rgba(56,189,248,0.04);
    color: var(--text);
    font-family: var(--sans);
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.15s;
  }
  .hm-btn-secondary:hover {
    background: rgba(56,189,248,0.08);
    border-color: rgba(56,189,248,0.4);
  }

  /* terminal card */
  .hm-terminal {
    background: #060a10;
    border: 1px solid rgba(99,179,237,0.15);
    border-radius: 12px;
    overflow: hidden;
    max-width: 580px;
    margin: 0 auto;
    text-align: left;
    box-shadow: 0 0 60px rgba(14,165,233,0.08);
  }
  .hm-terminal-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 12px 16px;
    background: rgba(99,179,237,0.04);
    border-bottom: 1px solid rgba(99,179,237,0.1);
  }
  .hm-terminal-dot {
    width: 10px; height: 10px; border-radius: 50%;
  }
  .hm-terminal-title {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--muted);
    margin-left: 6px;
  }
  .hm-terminal-body {
    padding: 20px;
    font-family: var(--mono);
    font-size: 12px;
    line-height: 2;
  }
  .hm-line { display: flex; gap: 10px; }
  .hm-prompt { color: var(--accent2); flex-shrink: 0; }
  .hm-cmd { color: var(--text); }
  .hm-out { color: var(--muted); }
  .hm-out.green { color: var(--success); }
  .hm-out.cyan  { color: var(--accent); }
  .hm-out.purple{ color: var(--accent2); }
  .hm-cursor {
    display: inline-block;
    width: 8px; height: 14px;
    background: var(--accent);
    vertical-align: middle;
    animation: hm-blink 1s step-end infinite;
  }
  @keyframes hm-blink { 0%,100%{opacity:1} 50%{opacity:0} }

  /* ── stats bar ── */
  .hm-stats {
    display: flex;
    justify-content: center;
    gap: 0;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    overflow: hidden;
  }
  .hm-stat {
    flex: 1;
    padding: 28px 20px;
    text-align: center;
    border-right: 1px solid var(--border);
  }
  .hm-stat:last-child { border-right: none; }
  .hm-stat-num {
    font-family: var(--mono);
    font-size: 28px;
    font-weight: 700;
    color: var(--accent);
    margin-bottom: 4px;
  }
  .hm-stat-label {
    font-size: 11px;
    color: var(--muted);
    font-family: var(--mono);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  /* ── pipeline steps ── */
  .hm-pipeline {
    padding: 80px 24px;
    max-width: 1100px;
    margin: 0 auto;
  }
  .hm-section-label {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 12px;
  }
  .hm-section-title {
    font-size: clamp(1.6rem, 3vw, 2.2rem);
    font-weight: 800;
    letter-spacing: -0.5px;
    margin-bottom: 48px;
    color: var(--text);
  }

  .hm-steps {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 2px;
    background: var(--border);
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--border);
  }
  .hm-step {
    background: var(--card);
    padding: 32px 28px;
    position: relative;
    transition: background 0.2s;
  }
  .hm-step:hover { background: var(--surface); }
  .hm-step-num {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--muted);
    letter-spacing: 2px;
    margin-bottom: 16px;
  }
  .hm-step-icon {
    font-size: 28px;
    margin-bottom: 14px;
    display: block;
  }
  .hm-step-title {
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 8px;
    color: var(--text);
  }
  .hm-step-desc {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--muted);
    line-height: 1.7;
  }
  .hm-step-accent {
    position: absolute;
    bottom: 0; left: 0;
    height: 2px;
    width: 0;
    background: linear-gradient(90deg, #0ea5e9, #6366f1);
    transition: width 0.3s ease;
  }
  .hm-step:hover .hm-step-accent { width: 100%; }

  /* ── features grid ── */
  .hm-features {
    padding: 0 24px 80px;
    max-width: 1100px;
    margin: 0 auto;
  }
  .hm-feat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 12px;
  }
  .hm-feat-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 24px;
    transition: border-color 0.2s, transform 0.2s;
  }
  .hm-feat-card:hover {
    border-color: rgba(56,189,248,0.3);
    transform: translateY(-2px);
  }
  .hm-feat-top {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }
  .hm-feat-icon-wrap {
    width: 36px; height: 36px;
    border-radius: 8px;
    background: rgba(56,189,248,0.08);
    border: 1px solid rgba(56,189,248,0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
  }
  .hm-feat-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--text);
  }
  .hm-feat-desc {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--muted);
    line-height: 1.7;
  }
  .hm-feat-tag {
    display: inline-block;
    margin-top: 12px;
    padding: 2px 8px;
    border-radius: 4px;
    font-family: var(--mono);
    font-size: 10px;
    background: rgba(52,211,153,0.08);
    border: 1px solid rgba(52,211,153,0.2);
    color: var(--success);
  }

  /* ── CTA ── */
  .hm-cta {
    padding: 80px 24px;
    text-align: center;
    background: var(--surface);
    border-top: 1px solid var(--border);
    position: relative;
    overflow: hidden;
  }
  .hm-cta-orb {
    position: absolute;
    width: 600px; height: 300px;
    background: radial-gradient(ellipse, rgba(14,165,233,0.07) 0%, transparent 70%);
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }
  .hm-cta-inner { position: relative; z-index: 1; }
  .hm-cta-title {
    font-size: clamp(1.6rem, 3vw, 2.4rem);
    font-weight: 800;
    letter-spacing: -0.5px;
    margin-bottom: 12px;
  }
  .hm-cta-sub {
    font-family: var(--mono);
    font-size: 13px;
    color: var(--muted);
    margin-bottom: 32px;
  }
`;

const steps = [
  { num: "01", icon: "📁", title: "Upload Dataset", desc: "Drop a CSV or Excel file. We handle the rest — no config needed." },
  { num: "02", icon: "🔍", title: "EDA", desc: "Instant statistics, missing value analysis, correlation heatmaps." },
  { num: "03", icon: "⚙️", title: "Feature Engineering", desc: "Auto cleaning, encoding, scaling and outlier handling." },
  { num: "04", icon: "🤖", title: "AutoML", desc: "Train multiple models, compare metrics, pick the best automatically." },
  { num: "05", icon: "🎯", title: "Predict", desc: "Run inference on new data with your best trained model." },
];

const features = [
  { icon: "📊", title: "Automated EDA", desc: "Distribution plots, correlation heatmaps, missing value maps — all generated instantly.", tag: "instant" },
  { icon: "🛡️", title: "Target Protection", desc: "5-layer safety validator ensures your target column is never modified during engineering.", tag: "safe" },
  { icon: "⚡", title: "Fast AutoML", desc: "Trains logistic regression, random forest, and gradient boosting in seconds.", tag: "fast" },
  { icon: "📈", title: "Model Leaderboard", desc: "Compare accuracy, precision, recall, F1 and training time side by side.", tag: "compare" },
  { icon: "🔄", title: "Full Pipeline", desc: "EDA → FE → AutoML → Predict. One dataset ID links every step.", tag: "end-to-end" },
  { icon: "💾", title: "Persistent Models", desc: "Best model is saved server-side. Come back and predict any time.", tag: "persistent" },
];

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setLoaded(true); }, []);

  return (
    <>
      <style>{css}</style>
      <div className="hm">

        {/* ── hero ── */}
        <section className="hm-hero">
          <div className="hm-grid" />
          <div className="hm-orb hm-orb-1" />
          <div className="hm-orb hm-orb-2" />
          <div className="hm-orb hm-orb-3" />

          <div className="hm-hero-inner">
            <div className="hm-eyebrow">
              <div className="hm-eyebrow-dot" />
              Automated ML Pipeline
            </div>

            <h1 className="hm-title">
              From raw data to<br />
              <span className="hm-title-accent">trained model in minutes</span>
            </h1>

            <p className="hm-sub">
              Upload a CSV. Get EDA, feature engineering, model training<br />
              and predictions — all from one dashboard.
            </p>

            <div className="hm-actions">
              <Link to="/upload" className="hm-btn-primary">
                → Start analysing
              </Link>
              <Link to="/dashboard" className="hm-btn-secondary">
                View Dashboard
              </Link>
            </div>

            {/* terminal */}
            <div className="hm-terminal">
              <div className="hm-terminal-bar">
                <div className="hm-terminal-dot" style={{ background: '#f87171' }} />
                <div className="hm-terminal-dot" style={{ background: '#fbbf24' }} />
                <div className="hm-terminal-dot" style={{ background: '#34d399' }} />
                <span className="hm-terminal-title">insyte · pipeline log</span>
              </div>
              <div className="hm-terminal-body">
                <div className="hm-line"><span className="hm-prompt">$</span><span className="hm-cmd">upload titanic.csv</span></div>
                <div className="hm-line"><span className="hm-out cyan">✓ dataset_id: adadac616555</span></div>
                <div className="hm-line"><span className="hm-out">  shape: 891 × 12</span></div>
                <div className="hm-line" style={{ marginTop: 6 }}><span className="hm-prompt">$</span><span className="hm-cmd">run eda</span></div>
                <div className="hm-line"><span className="hm-out green">✓ missing analysis complete</span></div>
                <div className="hm-line"><span className="hm-out green">✓ correlations computed</span></div>
                <div className="hm-line" style={{ marginTop: 6 }}><span className="hm-prompt">$</span><span className="hm-cmd">run automl --target Survived</span></div>
                <div className="hm-line"><span className="hm-out purple">→ training 3 models…</span></div>
                <div className="hm-line"><span className="hm-out green">✓ best: logistic_regression  acc=0.9821</span></div>
                <div className="hm-line"><span className="hm-prompt">$</span><span className="hm-cursor" /></div>
              </div>
            </div>
          </div>
        </section>

        {/* ── stats ── */}
        <div className="hm-stats">
          {[
            { num: "5", label: "Pipeline Steps" },
            { num: "3+", label: "ML Models" },
            { num: "100%", label: "Automated" },
            { num: "0", label: "Config needed" },
          ].map(s => (
            <div key={s.label} className="hm-stat">
              <div className="hm-stat-num">{s.num}</div>
              <div className="hm-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── pipeline steps ── */}
        <section className="hm-pipeline">
          <div className="hm-section-label">How it works</div>
          <h2 className="hm-section-title">Five steps. Zero friction.</h2>
          <div className="hm-steps">
            {steps.map(s => (
              <div key={s.num} className="hm-step">
                <div className="hm-step-num">{s.num}</div>
                <span className="hm-step-icon">{s.icon}</span>
                <div className="hm-step-title">{s.title}</div>
                <div className="hm-step-desc">{s.desc}</div>
                <div className="hm-step-accent" />
              </div>
            ))}
          </div>
        </section>

        {/* ── features ── */}
        <section className="hm-features">
          <div className="hm-section-label">Capabilities</div>
          <h2 className="hm-section-title">Everything in one place.</h2>
          <div className="hm-feat-grid">
            {features.map(f => (
              <div key={f.title} className="hm-feat-card">
                <div className="hm-feat-top">
                  <div className="hm-feat-icon-wrap">{f.icon}</div>
                  <div className="hm-feat-title">{f.title}</div>
                </div>
                <div className="hm-feat-desc">{f.desc}</div>
                <div className="hm-feat-tag">{f.tag}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="hm-cta">
          <div className="hm-cta-orb" />
          <div className="hm-cta-inner">
            <h2 className="hm-cta-title">Ready to run your pipeline?</h2>
            <p className="hm-cta-sub">Upload a dataset and get results in under a minute.</p>
            <Link to="/upload" className="hm-btn-primary" style={{ display: 'inline-flex' }}>
              → Upload your dataset
            </Link>
          </div>
        </section>

      </div>
    </>
  );
}