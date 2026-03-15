/**
 * Dashboard.jsx — Insyte ML Pipeline Dashboard
 *
 * FIXES IN THIS VERSION
 * ─────────────────────────────────────────────────────────────────────────────
 * FIX 1 — Prediction sliders now show real data ranges, not scaled values.
 *   buildMeta() now reads cleaned_dataset_preview from automlResult directly
 *   (previously only read from feResult which was often null). Also increased
 *   preview sample from 20 → 50 rows (backend updated to match) so binary
 *   OHE column detection (Sex_male, Embarked_S etc) is more reliable.
 *
 * FIX 2 — feResult is now hydrated from automlResult when missing.
 *   If a user skips /feature-engineering and goes straight to AutoML,
 *   feResult was null and target_column/problem_type were unavailable.
 *   Dashboard now falls back to automlResult.fe_log for these values.
 *
 * FIX 3 — Smart Summary skewness bullet no longer uses hardcoded examples.
 *   Now generates a context-aware description based on the actual skewed
 *   column names instead of "common for prices, income, etc."
 *
 * FIX 4 — Outlier bullet no longer uses hardcoded salary example.
 *   Now uses the actual column name and count from the data.
 *
 * FIX 5 — FE panel transforms now only show badges for transforms that ran.
 *   Reads fe_log.transforms_applied (added in fe_pipeline.py fix) instead
 *   of always displaying all 5 badges regardless of what executed.
 *
 * FIX 6 — AutoML panel now shows a plain-English accuracy verdict.
 *   78% → "solid result", <65% → "needs improvement", >90% → "excellent"
 *   so a zero-knowledge user understands what the score means.
 *
 * FIX 7 — Summary bullets now always render when automlResult is available.
 *   "What the Model Will Do" and "Model Result" bullets were missing when
 *   feResult was null. Fixed by always checking automlResult as fallback.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Five tabs:
 *   1. Smart Summary  — plain-English narrative (rule-based, no API)
 *   2. Data Analysis  — EDA stats, missing values, expandable gallery
 *   3. Feature Eng.   — what happened to your data, in plain English
 *   4. AutoML         — leaderboard + data leakage warning + accuracy verdict
 *   5. Prediction     — sliders + dropdowns on real data ranges
 */

// const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

// VITE_API_URL="4d7c-2401-4900-c0aa-e4fe-934-3509-eb9d-ab7a.ngrok-free.app/"

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDataset } from "../context/DatasetContext";

// ─────────────────────────────────────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Format a number to d decimal places, or "—" if null/undefined */
const fmt = (v, d = 3) => (v == null ? "—" : Number(v).toFixed(d));

/** Format as percentage string */
const pct = (v) => (v == null ? "—" : `${Number(v).toFixed(1)}%`);

/**
 * Return a plain-English verdict for a classification accuracy score.
 * Helps non-technical users understand what the number means.
 */
function accuracyVerdict(score) {
  const s = Number(score);
  if (isNaN(s)) return null;
  if (s >= 0.95) return { label: "Extremely high — double-check for data leakage", color: "var(--warn)" };
  if (s >= 0.90) return { label: "Excellent — the model is performing very well", color: "var(--success)" };
  if (s >= 0.80) return { label: "Solid — good performance for real-world data", color: "var(--success)" };
  if (s >= 0.70) return { label: "Acceptable — reasonable for a complex problem", color: "var(--accent)" };
  if (s >= 0.60) return { label: "Weak — the model is struggling, consider more data", color: "var(--warn)" };
  return { label: "Poor — model needs significant improvement", color: "var(--danger)" };
}

/**
 * Return a plain-English verdict for an R² regression score.
 */
function r2Verdict(score) {
  const s = Number(score);
  if (isNaN(s)) return null;
  if (s >= 0.95) return { label: "Extremely high — double-check for data leakage", color: "var(--warn)" };
  if (s >= 0.85) return { label: "Excellent — the model explains most of the variation", color: "var(--success)" };
  if (s >= 0.70) return { label: "Solid — good predictive performance", color: "var(--success)" };
  if (s >= 0.50) return { label: "Moderate — the model captures some patterns", color: "var(--accent)" };
  return { label: "Weak — the model struggles to predict accurately", color: "var(--warn)" };
}

// ─────────────────────────────────────────────────────────────────────────────
// buildSummary — plain-English bullets from pipeline results
// Pure rule-based. No external API calls.
// ─────────────────────────────────────────────────────────────────────────────
function buildSummary(edaResult, feResult, automlResult, uploadInfo) {
  const bullets = [];
  if (!edaResult) return bullets;

  const s        = edaResult.dataset_summary  || {};
  const missing  = edaResult.missing_analysis || {};
  const types    = edaResult.column_types     || {};
  const dist     = edaResult.distribution     || {};
  const corr     = edaResult.correlations     || {};
  const outliers = edaResult.outliers         || {};
  const insights = edaResult.insights         || [];

  // FIX 7: Always resolve target/problem from automlResult as fallback
  // so "What the Model Will Do" appears even if feResult is null
  const feLog  = feResult?.fe_log || automlResult?.fe_log || {};
  const target  = feResult?.target_column  || automlResult?.target_column  || feLog.target_column;
  const problem = feResult?.problem_type   || automlResult?.problem_type   || feLog.problem_type;

  // ── Overview ──
  bullets.push({
    section: "Dataset Overview", icon: "📋", type: "info",
    text: `Your dataset "${uploadInfo?.filename || "dataset"}" has ${(s.num_rows || 0).toLocaleString()} rows and ${s.num_columns} columns. ` +
      ((s.duplicate_rows || 0) > 0
        ? `There are ${s.duplicate_rows} duplicate rows — Insyte will remove them automatically before training.`
        : `No duplicate rows were found. Your data is clean on that front.`),
  });

  // ── Memory ──
  if (s.memory_usage_mb != null) {
    bullets.push({
      section: "Memory Optimisation", icon: "💾", type: "success",
      text: `Insyte automatically optimised your dataset from ${s.memory_usage_mb} MB down to ${s.memory_optimized_mb} MB — a ${s.memory_reduction_percent}% reduction.`,
    });
  }

  // ── Missing values ──
  const missingCols = Object.entries(missing).filter(([, v]) => (v?.missing_count || 0) > 0);
  if (!missingCols.length) {
    bullets.push({ section: "Missing Data", icon: "✅", type: "success", text: "No missing values in any column. Your dataset is complete." });
  } else {
    const severe   = missingCols.filter(([, v]) => v.missing_percent > 40);
    const moderate = missingCols.filter(([, v]) => v.missing_percent > 5 && v.missing_percent <= 40);
    const minor    = missingCols.filter(([, v]) => v.missing_percent <= 5);
    let text = `${missingCols.length} column${missingCols.length > 1 ? "s have" : " has"} missing values. `;
    if (severe.length)   text += `${severe.map(([c]) => c).join(", ")} ${severe.length > 1 ? "are" : "is"} severely incomplete (over 40% missing) and will be dropped. `;
    if (moderate.length) text += `${moderate.map(([c]) => c).join(", ")} will be filled with the median or most common value. `;
    if (minor.length)    text += `${minor.map(([c]) => c).join(", ")} ${minor.length > 1 ? "have" : "has"} only minor gaps — easy to fix.`;
    bullets.push({ section: "Missing Data", icon: "⚠️", type: severe.length ? "warn" : "info", text });
  }

  // ── Column types ──
  const numCols = [...new Set([...(types.numeric || []), ...(types.numeric_continuous || []), ...(types.numeric_discrete || [])])];
  const catCols = types.categorical || [];
  const dtCols  = types.datetime    || [];
  bullets.push({
    section: "Column Types", icon: "🏷️", type: "info",
    text: `Your dataset has ${numCols.length} numeric column${numCols.length !== 1 ? "s" : ""} (numbers) and ` +
      `${catCols.length} text/category column${catCols.length !== 1 ? "s" : ""}` +
      (dtCols.length ? `, plus ${dtCols.length} date/time column${dtCols.length !== 1 ? "s" : ""}` : "") +
      `. Insyte handles encoding and scaling automatically.`,
  });

  // ── Skewness — FIX 3: context-aware description, no hardcoded examples ──
  const skewed = Object.entries(dist).filter(([, v]) => Math.abs(v?.skew || 0) > 1);
  if (skewed.length) {
    // Describe the columns in plain English based on what they actually are
    const skewedNames = skewed.map(([c]) => c).join(", ");
    const example = skewed[0][0]; // first skewed column for the example
    const skewVal = Math.abs(skewed[0][1]?.skew || 0).toFixed(1);
    bullets.push({
      section: "Data Distribution", icon: "📊", type: "info",
      text: `${skewedNames} ${skewed.length > 1 ? "are" : "is"} skewed (skewness: ${skewVal}) — meaning most values are bunched at one end with a long tail. ` +
        `For example, in "${example}" most passengers have low values but a few have much higher ones. ` +
        `Insyte applies a log transformation to smooth this out before training.`,
    });
  }

  // ── Correlations ──
  const strongCorrs = corr.strong_correlations || [];
  if (strongCorrs.length) {
    const top = strongCorrs.slice(0, 2);
    bullets.push({
      section: "Feature Relationships", icon: "🔗", type: "info",
      text: `Some columns move together: ${top.map(c => `${c.col1} and ${c.col2} (${fmt(c.correlation, 2)})`).join(", ")}. Insyte automatically removes redundant features.`,
    });
  }

  // ── Outliers — FIX 4: use actual column name, not hardcoded salary example ──
  const outlierCols = Object.entries(outliers).filter(([, v]) => (v?.outlier_count || 0) > 0);
  if (outlierCols.length) {
    const [topCol, topData] = outlierCols[0];
    const count = topData.outlier_count;
    bullets.push({
      section: "Outliers", icon: "🎯", type: "info",
      text: `${outlierCols.length} column${outlierCols.length > 1 ? "s contain" : " contains"} outliers — extreme values far from the typical range. ` +
        `For example, "${topCol}" has ${count} outlier${count > 1 ? "s" : ""} where the value is unusually high or low compared to most rows. ` +
        `Insyte automatically clips these so they don't distort the model.`,
    });
  }

  // ── What the model will do — FIX 7: always uses automlResult fallback ──
  if (target && problem) {
    const desc = problem === "classification"
      ? "predict a category — for example: yes/no, survived/died, approved/rejected"
      : "predict a number — for example: a price, score, or quantity";
    bullets.push({
      section: "What the Model Will Do", icon: "🤖", type: "success",
      text: `Your target column is "${target}". This is a ${problem} problem — meaning the model will ${desc}. Insyte has already selected the right algorithms for this task.`,
    });
  }

  // ── AutoML result ──
  if (automlResult?.best_model) {
    const best  = automlResult.leaderboard?.find(r => r.is_best);
    const score = problem === "regression" ? best?.r2 : best?.accuracy;
    const isLeakage = score != null && Number(score) >= 0.999;
    if (isLeakage) {
      bullets.push({
        section: "Model Result — Caution Required", icon: "🚨", type: "danger",
        text: `The best model scored ${fmt(score, 4)} — which is unrealistically perfect. This almost always means data leakage: one of your input features gives away the answer. Check your columns and remove anything derived from "${target}".`,
      });
    } else {
      const verdict = problem === "regression" ? r2Verdict(score) : accuracyVerdict(score);
      bullets.push({
        section: "Model Result", icon: "🏆", type: "success",
        text: `Training complete. Best model: ${automlResult.best_model} with ${problem === "regression" ? "R²" : "accuracy"} of ${fmt(score, 4)}. ` +
          (verdict ? `${verdict.label}. ` : "") +
          `Go to the Prediction tab to simulate outcomes.`,
      });
    }
  }

  // ── EDA warnings ──
  insights.filter(i => i.startsWith("[WARNING]")).slice(0, 2).forEach(ins => {
    bullets.push({ section: "ML Recommendation", icon: "💡", type: "warn", text: ins.replace("[WARNING]", "").trim() });
  });

  return bullets;
}

// ─────────────────────────────────────────────────────────────────────────────
// JARGON — hover any ⓘ to see a plain-English explanation
// ─────────────────────────────────────────────────────────────────────────────
const JARGON = {
  "Skewness":           "How lopsided the data is. High skew = most values clumped at one end with a long tail.",
  "Standard Deviation": "How spread out the values are. High std = values vary a lot from the average.",
  "Mean":               "The average — add all numbers, divide by how many there are.",
  "Median":             "The middle value when sorted. Less affected by extreme outliers than the mean.",
  "IQR Clipping":       "Trimming extreme values to a reasonable range so they don't distort the model.",
  "StandardScaler":     "Rescaling all numbers so they sit around 0. Helps models treat every feature equally.",
  "One-Hot Encoding":   "Turning text categories (Male/Female) into 0s and 1s that a model can understand.",
  "Frequency Encoding": "Replacing a category with how often it appears — useful when there are many unique values.",
  "High Cardinality":   "A column with many unique values (like names or postcodes). Too many categories can confuse models.",
  "Log Transform":      "Taking the logarithm of skewed values to make distributions more even and model-friendly.",
  "Correlation":        "How closely two columns move together. Near 1 = same direction. Near -1 = opposite directions.",
  "Outlier":            "An extreme value far from the rest of the data.",
  "Classification":     "Predicting a category — e.g. survived or not, spam or not.",
  "Regression":         "Predicting a number — e.g. house price, temperature, or exam score.",
  "Feature":            "A column used as input to train the model. Everything except the target column.",
  "Target Column":      "The column you want to predict. Everything else feeds into the model to predict this.",
  "Data Leakage":       "When the model accidentally uses information it shouldn't — making scores look perfect but useless in practice.",
  "R² Score":           "How well the model explains the data. 1.0 = perfect, 0 = no better than guessing the average.",
  "F1 Score":           "Balance between precision and recall. Good when your dataset has unequal class sizes.",
  "Precision":          "When the model predicts 'yes', how often is it actually right?",
  "Recall":             "Of all real 'yes' cases, how many did the model catch?",
  "Accuracy":           "Percentage of all predictions that were correct.",
};

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Syne:wght@600;700;800&display=swap');

  :root {
    --bg:      #080c14;
    --surface: #0d1321;
    --card:    #111827;
    --border:  rgba(99,179,237,0.12);
    --border2: rgba(99,179,237,0.25);
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

  .db * { box-sizing: border-box; margin: 0; padding: 0; }
  .db { display: flex; min-height: calc(100vh - 56px); background: var(--bg); font-family: var(--sans); color: var(--text); }

  /* Sidebar */
  .db-sb { width: 252px; flex-shrink: 0; background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 22px 13px; gap: 4px; position: sticky; top: 56px; height: calc(100vh - 56px); overflow-y: auto; }
  .db-sb-lbl { font-family: var(--mono); font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: var(--muted); padding: 0 9px; margin-bottom: 6px; }
  .db-file-chip { font-family: var(--mono); font-size: 10px; color: var(--accent); background: rgba(56,189,248,0.07); border: 1px solid rgba(56,189,248,0.18); border-radius: 6px; padding: 6px 10px; margin-bottom: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .db-nav { display: flex; align-items: center; gap: 8px; padding: 9px 10px; border-radius: 7px; border: 1px solid transparent; background: transparent; color: var(--muted); font-family: var(--sans); font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.15s; text-align: left; width: 100%; }
  .db-nav:hover:not(:disabled) { background: rgba(56,189,248,0.05); color: var(--text); }
  .db-nav.active { background: rgba(56,189,248,0.09); color: var(--accent); border-color: rgba(56,189,248,0.22); }
  .db-nav:disabled { opacity: 0.3; cursor: not-allowed; }
  .db-nav-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--muted); flex-shrink: 0; transition: background 0.15s; }
  .db-nav.active .db-nav-dot { background: var(--accent); }
  .db-nav.done   .db-nav-dot { background: var(--success); }
  .db-nav-ck { margin-left: auto; font-size: 10px; color: var(--success); }
  .db-sep { height: 1px; background: var(--border); margin: 9px 0; }
  .db-run { width: 100%; padding: 10px; border-radius: 7px; border: none; background: linear-gradient(135deg,#0ea5e9,#6366f1); color: #fff; font-family: var(--sans); font-size: 12px; font-weight: 700; cursor: pointer; transition: opacity 0.15s, transform 0.15s; }
  .db-run:hover:not(:disabled) { opacity: .85; transform: translateY(-1px); }
  .db-run:disabled { opacity: .4; cursor: not-allowed; transform: none; }
  .db-ghost { width: 100%; padding: 8px; border-radius: 7px; border: 1px solid var(--border2); background: transparent; color: var(--muted); font-family: var(--sans); font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.15s; margin-top: 5px; }
  .db-ghost:hover { color: var(--danger); border-color: var(--danger); }
  .db-err { margin-top: 8px; padding: 9px 11px; border-radius: 7px; border: 1px solid rgba(248,113,113,0.3); background: rgba(248,113,113,0.06); color: var(--danger); font-family: var(--mono); font-size: 11px; line-height: 1.5; }

  /* Main */
  .db-main { flex: 1; padding: 28px 32px; display: flex; flex-direction: column; gap: 18px; overflow-y: auto; }
  .db-topbar { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding-top: 50px; }
  .db-ptitle { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
  .db-chips { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
  .db-chip { font-family: var(--mono); font-size: 10px; padding: 3px 9px; border-radius: 20px; border: 1px solid var(--border2); background: rgba(56,189,248,0.05); color: var(--accent); }
  .db-chip.g { color: var(--success); border-color: rgba(52,211,153,0.25); background: rgba(52,211,153,0.05); }
  .db-chip.p { color: var(--accent2); border-color: rgba(129,140,248,0.25); background: rgba(129,140,248,0.05); }
  .db-chip.w { color: var(--warn); border-color: rgba(251,191,36,0.25); background: rgba(251,191,36,0.05); }
  .db-loader { height: 2px; background: var(--border); border-radius: 2px; overflow: hidden; }
  .db-lf { height: 100%; background: linear-gradient(90deg,#0ea5e9,#818cf8,#34d399); background-size: 200% 100%; animation: db-sh 1.4s linear infinite; width: 55%; }
  @keyframes db-sh { 0%{background-position:200% center} 100%{background-position:-200% center} }
  .db-llbl { font-family: var(--mono); font-size: 10px; color: var(--muted); margin-top: 5px; }

  /* Cards */
  .db-card { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 20px 22px; }
  .db-chdr { font-family: var(--mono); font-size: 9px; letter-spacing: 2.5px; text-transform: uppercase; color: var(--accent); margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid var(--border); }
  .g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .g3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
  .g4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }
  .ga { display: grid; grid-template-columns: repeat(auto-fill,minmax(200px,1fr)); gap: 10px; }
  .db-st { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 16px 18px; }
  .db-sl { font-family: var(--mono); font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: var(--muted); margin-bottom: 7px; }
  .db-sv { font-family: var(--mono); font-size: 26px; font-weight: 700; color: var(--accent); line-height: 1; }
  .db-sv.g { color: var(--success); } .db-sv.p { color: var(--accent2); } .db-sv.w { color: var(--warn); } .db-sv.r { color: var(--danger); }
  .db-ss { font-family: var(--mono); font-size: 10px; color: var(--muted); margin-top: 4px; }

  /* Table */
  .db-tw { overflow-x: auto; border-radius: 7px; }
  .db-t { width: 100%; border-collapse: collapse; font-family: var(--mono); font-size: 11px; }
  .db-t th { padding: 9px 13px; text-align: left; color: var(--muted); border-bottom: 1px solid var(--border); font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; white-space: nowrap; background: var(--surface); }
  .db-t td { padding: 10px 13px; border-bottom: 1px solid rgba(99,179,237,0.04); color: var(--text); white-space: nowrap; }
  .db-t tr:hover td { background: rgba(56,189,248,0.025); }
  .db-t tr.best td { background: rgba(52,211,153,0.04); }
  .db-t td.hi  { color: var(--accent);  font-weight: 700; }
  .db-t td.hig { color: var(--success); font-weight: 700; }

  /* Badges + pills */
  .db-b { display: inline-block; padding: 2px 7px; border-radius: 4px; font-family: var(--mono); font-size: 9px; font-weight: 700; letter-spacing: 0.5px; }
  .db-b.best { background: rgba(52,211,153,0.12); color: var(--success); border: 1px solid rgba(52,211,153,0.28); }
  .db-b.warn { background: rgba(251,191,36,0.1);  color: var(--warn);    border: 1px solid rgba(251,191,36,0.25); }
  .db-b.pass { background: rgba(52,211,153,0.08); color: var(--success); border: 1px solid rgba(52,211,153,0.2); }
  .db-b.info { background: rgba(56,189,248,0.08); color: var(--accent);  border: 1px solid rgba(56,189,248,0.2); }
  .db-pill { display: inline-block; padding: 2px 9px; border-radius: 5px; font-family: var(--mono); font-size: 10px; background: rgba(99,179,237,0.06); border: 1px solid var(--border); color: var(--text); }
  .db-pills { display: flex; flex-wrap: wrap; gap: 5px; }

  /* Tooltip */
  .tip-wrap { position: relative; display: inline-flex; align-items: center; gap: 3px; cursor: help; }
  .tip-ico  { font-size: 9px; color: var(--muted); }
  .tip-box  { position: absolute; bottom: calc(100% + 7px); left: 50%; transform: translateX(-50%); background: #1a2535; border: 1px solid var(--border2); border-radius: 7px; padding: 9px 12px; font-family: var(--mono); font-size: 11px; color: var(--text); white-space: normal; min-width: 220px; max-width: 300px; line-height: 1.6; z-index: 200; pointer-events: none; box-shadow: 0 8px 24px rgba(0,0,0,0.45); opacity: 0; transition: opacity 0.15s; }
  .tip-wrap:hover .tip-box { opacity: 1; }

  /* Summary bullets */
  .db-bul { display: flex; gap: 14px; align-items: flex-start; padding: 15px 17px; background: var(--surface); border: 1px solid var(--border); border-radius: 9px; transition: border-color 0.15s; }
  .db-bul:hover { border-color: var(--border2); }
  .db-bul + .db-bul { margin-top: 8px; }
  .db-bul.warn   { border-color: rgba(251,191,36,0.25);  background: rgba(251,191,36,0.04); }
  .db-bul.danger { border-color: rgba(248,113,113,0.3);  background: rgba(248,113,113,0.05); }
  .db-bul.success{ border-color: rgba(52,211,153,0.22);  background: rgba(52,211,153,0.04); }
  .db-bul-ico { font-size: 20px; flex-shrink: 0; margin-top: 1px; }
  .db-bul-sec { font-family: var(--mono); font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-bottom: 5px; }
  .db-bul-txt { font-size: 13px; line-height: 1.75; color: var(--text); }

  /* Missing bar */
  .db-mc { background: var(--surface); border: 1px solid var(--border); border-radius: 7px; padding: 12px 14px; }
  .db-mn { font-family: var(--mono); font-size: 11px; font-weight: 700; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .db-mr { display: flex; justify-content: space-between; font-family: var(--mono); font-size: 10px; color: var(--muted); margin-bottom: 5px; }
  .db-bt { height: 3px; background: rgba(99,179,237,0.08); border-radius: 2px; overflow: hidden; }
  .db-bf { height: 100%; border-radius: 2px; transition: width 0.5s ease; }
  .db-mt { font-family: var(--mono); font-size: 10px; color: var(--muted); margin-top: 5px; line-height: 1.4; }

  /* Gallery */
  .db-gallery { display: grid; grid-template-columns: repeat(auto-fill,minmax(280px,1fr)); gap: 12px; }
  .db-gi { background: var(--surface); border: 1px solid var(--border); border-radius: 9px; overflow: hidden; cursor: zoom-in; transition: border-color 0.15s, transform 0.15s; }
  .db-gi:hover { border-color: var(--border2); transform: translateY(-2px); }
  .db-gl { font-family: var(--mono); font-size: 10px; color: var(--muted); padding: 7px 11px 5px; }
  .db-gi img { width: 100%; display: block; }
  .db-lb { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.88); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 24px; animation: db-fi 0.18s ease; }
  @keyframes db-fi { from{opacity:0} to{opacity:1} }
  .db-lb img { max-width: 90vw; max-height: 88vh; border-radius: 10px; box-shadow: 0 0 80px rgba(0,0,0,0.6); }
  .db-lb-x { position: fixed; top: 20px; right: 24px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; cursor: pointer; transition: background 0.15s; }
  .db-lb-x:hover { background: rgba(255,255,255,0.15); }
  .db-lb-cap { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); font-family: var(--mono); font-size: 11px; color: rgba(255,255,255,0.55); background: rgba(0,0,0,0.5); padding: 5px 13px; border-radius: 20px; }

  /* Leakage + accuracy verdict */
  .db-leak { padding: 16px 18px; background: rgba(248,113,113,0.06); border: 1px solid rgba(248,113,113,0.3); border-radius: 9px; display: flex; gap: 14px; align-items: flex-start; }
  .db-leak-ico { font-size: 22px; flex-shrink: 0; }
  .db-leak-ttl { font-weight: 800; font-size: 14px; color: var(--danger); margin-bottom: 5px; }
  .db-leak-txt { font-family: var(--mono); font-size: 11px; color: var(--muted); line-height: 1.75; }
  .db-verdict { display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px; border-radius: 6px; background: rgba(52,211,153,0.06); border: 1px solid rgba(52,211,153,0.2); font-family: var(--mono); font-size: 11px; margin-top: 10px; }

  /* Insight + safety */
  .db-ins { display: flex; gap: 10px; align-items: flex-start; padding: 11px 13px; border-radius: 7px; border: 1px solid var(--border); background: var(--surface); }
  .db-ins + .db-ins { margin-top: 6px; }
  .db-ins-txt { font-size: 12px; color: var(--text); line-height: 1.6; flex: 1; }
  .db-safe { display: flex; align-items: center; gap: 8px; padding: 7px 11px; border-radius: 6px; background: var(--surface); border: 1px solid rgba(52,211,153,0.14); font-family: var(--mono); font-size: 11px; color: var(--success); }
  .db-safe + .db-safe { margin-top: 5px; }

  /* Predict */
  .db-pgrid { display: grid; grid-template-columns: repeat(auto-fill,minmax(240px,1fr)); gap: 10px; }
  .db-pc { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 13px 15px; }
  .db-plbl { font-family: var(--mono); font-size: 10px; color: var(--muted); margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; gap: 6px; }
  .db-pval { font-family: var(--mono); font-size: 13px; font-weight: 700; color: var(--accent); }
  .db-slider { width: 100%; -webkit-appearance: none; appearance: none; height: 4px; border-radius: 2px; background: linear-gradient(to right, var(--accent) 0%, var(--accent) var(--pct,50%), rgba(99,179,237,0.15) var(--pct,50%), rgba(99,179,237,0.15) 100%); outline: none; cursor: pointer; margin: 8px 0 4px; }
  .db-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: var(--accent); border: 2px solid var(--bg); cursor: pointer; box-shadow: 0 0 6px rgba(56,189,248,0.5); }
  .db-srange { display: flex; justify-content: space-between; font-family: var(--mono); font-size: 9px; color: var(--muted); }
  .db-ni { width: 100%; background: rgba(8,12,20,0.6); border: 1px solid var(--border2); border-radius: 5px; padding: 7px 9px; color: var(--text); font-family: var(--mono); font-size: 12px; outline: none; margin-top: 4px; transition: border-color 0.15s; }
  .db-ni:focus { border-color: var(--accent); }
  .db-sel { width: 100%; background: var(--card); border: 1px solid var(--border2); border-radius: 5px; padding: 7px 9px; color: var(--text); font-family: var(--mono); font-size: 12px; outline: none; margin-top: 4px; cursor: pointer; }
  .db-pb { padding: 12px 30px; border-radius: 8px; border: none; background: linear-gradient(135deg,#0ea5e9,#6366f1); color: #fff; font-family: var(--sans); font-size: 14px; font-weight: 700; cursor: pointer; transition: opacity 0.15s, transform 0.15s; }
  .db-pb:hover:not(:disabled) { opacity: .86; transform: translateY(-1px); }
  .db-pb:disabled { opacity: .4; cursor: not-allowed; }
  .db-res { background: rgba(52,211,153,0.05); border: 1px solid rgba(52,211,153,0.22); border-radius: 10px; padding: 24px; text-align: center; animation: db-fi 0.25s ease; }
  .db-rl { font-family: var(--mono); font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
  .db-rv { font-family: var(--mono); font-size: 40px; font-weight: 700; color: var(--success); }

  /* JSON viewer */
  .db-jv { background: #060a10; border: 1px solid var(--border); border-radius: 9px; overflow: hidden; }
  .db-jh { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: rgba(99,179,237,0.03); border-bottom: 1px solid rgba(99,179,237,0.07); cursor: pointer; user-select: none; }
  .db-jt { font-family: var(--mono); font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); }
  .db-jc { font-family: var(--mono); font-size: 12px; color: var(--muted); }
  .db-jv pre { padding: 16px 20px; font-family: var(--mono); font-size: 11px; color: #7dd3fc; white-space: pre-wrap; line-height: 1.7; max-height: 380px; overflow-y: auto; }
  .db-jv pre::-webkit-scrollbar { width: 3px; }
  .db-jv pre::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  /* Empty + no-dataset */
  .db-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 56px 20px; gap: 10px; text-align: center; }
  .db-ei { font-size: 36px; opacity: .35; }
  .db-et { color: var(--muted); font-size: 13px; line-height: 1.6; max-width: 320px; }
  .db-nods { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: calc(100vh - 56px); background: var(--bg); gap: 14px; text-align: center; padding: 40px; }
  .db-nods-t { font-family: var(--sans); font-size: 26px; font-weight: 800; color: var(--text); }
  .db-nods-s { font-family: var(--mono); font-size: 12px; color: var(--muted); max-width: 360px; }
  .db-gob { padding: 11px 26px; border-radius: 8px; border: none; background: linear-gradient(135deg,#0ea5e9,#6366f1); color: #fff; font-family: var(--sans); font-size: 13px; font-weight: 700; cursor: pointer; margin-top: 6px; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Tip({ label, term }) {
  const explanation = JARGON[term || label];
  if (!explanation) return <span>{label}</span>;
  return (
    <span className="tip-wrap">
      {label}<span className="tip-ico">ⓘ</span>
      <span className="tip-box">{explanation}</span>
    </span>
  );
}

function Lightbox({ src, caption, onClose }) {
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);
  return (
    <div className="db-lb" onClick={onClose}>
      <button className="db-lb-x" onClick={onClose}>✕</button>
      <img src={src} alt={caption} onClick={e => e.stopPropagation()} />
      {caption && <div className="db-lb-cap">{caption}</div>}
    </div>
  );
}

function JsonViewer({ title, data }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="db-jv">
      <div className="db-jh" onClick={() => setOpen(o => !o)}>
        <span className="db-jt">Raw JSON · {title}</span>
        <span className="db-jc">{open ? "▾" : "▸"}</span>
      </div>
      {open && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard root
// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const { datasetId, uploadInfo, edaResult, setEdaResult, feResult, setFeResult, automlResult, setAutomlResult, resetAll } = useDataset();

  const [tab,     setTab]     = useState("summary");
  const [running, setRunning] = useState(false);
  const [error,   setError]   = useState("");

  const post = async (url, body) => {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json();
    if (!r.ok) throw new Error(d?.detail || `${url} failed`);
    return d;
  };

  const run = async (fn) => {
    setRunning(true); setError("");
    try { await fn(); } catch (e) { setError(e.message); } finally { setRunning(false); }
  };

  const runEda    = () => run(async () => setEdaResult(await post("http://localhost:8000/eda", { dataset_id: datasetId })));
  const runFe     = () => run(async () => setFeResult(await post("http://localhost:8000/feature-engineering", { dataset_id: datasetId })));

  // FIX 2: After AutoML runs, also hydrate feResult from the automl response
  // so fe_log, target_column, and problem_type are available even if the user
  // skipped the separate /feature-engineering step.
  const runAutoml = () => run(async () => {
    const result = await post("http://localhost:8000/automl", { dataset_id: datasetId });
    setAutomlResult(result);
    // Hydrate feResult from automl response if not already set
    if (!feResult && result.fe_log) {
      setFeResult({
        target_column:            result.target_column,
        problem_type:             result.problem_type,
        fe_log:                   result.fe_log,
        transformed_feature_list: result.prediction_schema?.features || [],
        // FIX 1: use the preview from automl so buildMeta() works correctly
        cleaned_dataset_preview:  result.cleaned_dataset_preview || [],
      });
    }
  });

  useEffect(() => {
    if (datasetId && !edaResult) runEda();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetId]);

  const shape   = uploadInfo?.shape;
  // FIX 7: Always fall back to automlResult for target/problem
  const target  = feResult?.target_column  || automlResult?.target_column;
  const problem = feResult?.problem_type   || automlResult?.problem_type;

  const summaryBullets = buildSummary(edaResult, feResult, automlResult, uploadInfo);

  const navItems = [
    { id: "summary", label: "Smart Summary",      done: !!edaResult },
    { id: "eda",     label: "Data Analysis",       done: !!edaResult },
    { id: "fe",      label: "Feature Engineering", done: !!feResult  },
    { id: "automl",  label: "AutoML Training",      done: !!automlResult },
    { id: "predict", label: "Prediction",           done: false, disabled: !automlResult?.best_model },
  ];

  const runConfig = {
    summary: { label: "Refresh Summary",  fn: runEda    },
    eda:     { label: "Re-run EDA",       fn: runEda    },
    fe:      { label: "Run Feature Eng.", fn: runFe     },
    automl:  { label: "Run AutoML",       fn: runAutoml },
    predict: null,
  };

  if (!datasetId) return (
    <>
      <style>{css}</style>
      <div className="db-nods">
        <div style={{ fontSize: 44 }}>⬡</div>
        <div className="db-nods-t">No dataset loaded</div>
        <div className="db-nods-s">Upload a CSV or Excel file to start the ML pipeline.</div>
        <button className="db-gob" onClick={() => navigate("/upload")}>Go to Upload</button>
      </div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div className="db">
        <aside className="db-sb">
          <div className="db-sb-lbl">Pipeline</div>
          {uploadInfo?.filename && <div className="db-file-chip" title={uploadInfo.filename}>📄 {uploadInfo.filename}</div>}
          {navItems.map(n => (
            <button key={n.id} className={`db-nav${tab === n.id ? " active" : ""}${n.done ? " done" : ""}`} onClick={() => setTab(n.id)} disabled={n.disabled}>
              <span className="db-nav-dot" />
              {n.label}
              {n.done && <span className="db-nav-ck">✓</span>}
            </button>
          ))}
          <div className="db-sep" />
          {runConfig[tab] && <button className="db-run" onClick={runConfig[tab].fn} disabled={running}>{running ? "Running…" : runConfig[tab].label}</button>}
          <button className="db-ghost" onClick={() => { resetAll(); navigate("/upload"); }}>↩ New Dataset</button>
          {error && <div className="db-err">{error}</div>}
        </aside>

        <main className="db-main">
          <div className="db-topbar">
            <div className="db-ptitle">{{ summary:"Smart Summary", eda:"Data Analysis", fe:"Feature Engineering", automl:"AutoML Training", predict:"Prediction" }[tab]}</div>
            <div className="db-chips">
              {shape   && <span className="db-chip">{shape.rows} × {shape.columns}</span>}
              {problem && <span className="db-chip p">{problem}</span>}
              {target  && <span className="db-chip g">target: {target}</span>}
              {automlResult?.best_model && <span className="db-chip w">🏆 {automlResult.best_model}</span>}
            </div>
          </div>

          {running && <div><div className="db-loader"><div className="db-lf" /></div><div className="db-llbl">pipeline running…</div></div>}

          {tab === "summary" && <SummaryPanel bullets={summaryBullets} edaResult={edaResult} feResult={feResult} automlResult={automlResult} />}
          {tab === "eda"     && <EdaPanel data={edaResult} />}
          {tab === "fe"      && <FePanel  data={feResult} />}
          {tab === "automl"  && <AutomlPanel data={automlResult} problem={problem} />}
          {tab === "predict" && <PredictPanel datasetId={datasetId} schema={automlResult?.prediction_schema} edaResult={edaResult} feResult={feResult} automlResult={automlResult} />}
        </main>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PANEL 1 — Smart Summary
// ─────────────────────────────────────────────────────────────────────────────
function SummaryPanel({ bullets, edaResult, feResult, automlResult }) {
  if (!edaResult) return (
    <div className="db-card">
      <div className="db-empty"><div className="db-ei">📋</div><div className="db-et">EDA is running automatically. Your summary will appear here once complete.</div></div>
    </div>
  );
  const s = edaResult.dataset_summary || {};
  return (
    <>
      <div className="db-card">
        <div className="db-chdr">What is this?</div>
        <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)", lineHeight: 1.85 }}>
          This tab translates all the technical ML analysis into plain English — no jargon, no maths.
          {(!feResult || !automlResult) && <span style={{ color: "var(--warn)" }}> Run Feature Engineering and AutoML to unlock the full summary.</span>}
        </p>
      </div>
      <div>
        {bullets.map((b, i) => (
          <div key={i} className={`db-bul ${b.type}`}>
            <div className="db-bul-ico">{b.icon}</div>
            <div style={{ flex: 1 }}>
              <div className="db-bul-sec">{b.section}</div>
              <div className="db-bul-txt">{b.text}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="g4">
        {[
          { lbl: "Rows",         val: (s.num_rows || 0).toLocaleString(), cls: "" },
          { lbl: "Columns",      val: s.num_columns,                      cls: "p" },
          { lbl: "Duplicates",   val: s.duplicate_rows ?? 0,             cls: s.duplicate_rows > 0 ? "w" : "g" },
          { lbl: "Memory Saved", val: `${s.memory_reduction_percent ?? 0}%`, cls: "g" },
        ].map(x => (
          <div key={x.lbl} className="db-st">
            <div className="db-sl">{x.lbl}</div>
            <div className={`db-sv ${x.cls}`}>{x.val}</div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PANEL 2 — Data Analysis (EDA)
// ─────────────────────────────────────────────────────────────────────────────
function EdaPanel({ data }) {
  const [lb, setLb] = useState(null);
  if (!data) return (
    <div className="db-card"><div className="db-empty"><div className="db-ei">📊</div><div className="db-et">EDA is running automatically.</div></div></div>
  );
  const s       = data.dataset_summary  || {};
  const types   = data.column_types     || {};
  const missing = data.missing_analysis || {};
  const dist    = data.distribution     || {};
  const insights= data.insights         || [];
  const viz     = data.visualizations   || {};
  const missingCols = Object.entries(missing).filter(([, v]) => (v?.missing_count || 0) > 0);

  return (
    <>
      {lb && <Lightbox src={lb.src} caption={lb.caption} onClose={() => setLb(null)} />}

      <div className="g4">
        <div className="db-st"><div className="db-sl">Rows</div><div className="db-sv">{(s.num_rows||0).toLocaleString()}</div></div>
        <div className="db-st"><div className="db-sl">Columns</div><div className="db-sv p">{s.num_columns}</div></div>
        <div className="db-st"><div className="db-sl">Duplicates</div><div className={`db-sv ${s.duplicate_rows > 0 ? "w" : "g"}`}>{s.duplicate_rows ?? 0}</div></div>
        <div className="db-st"><div className="db-sl">Memory Saved</div><div className="db-sv g">{s.memory_reduction_percent ?? 0}%</div><div className="db-ss">{s.memory_usage_mb} → {s.memory_optimized_mb} MB</div></div>
      </div>

      <div className="db-card">
        <div className="db-chdr">Column Types</div>
        <div className="ga">
          {Object.entries(types).map(([k, v]) => Array.isArray(v) && v.length ? (
            <div key={k} className="db-st" style={{ padding: "13px 15px" }}>
              <div className="db-sl"><Tip label={k.replace(/_/g, " ")} /></div>
              <div className="db-sv" style={{ fontSize: 20 }}>{v.length}</div>
              <div className="db-pills" style={{ marginTop: 7 }}>
                {v.slice(0, 3).map(c => <span key={c} className="db-pill">{c}</span>)}
                {v.length > 3 && <span className="db-pill" style={{ color: "var(--muted)" }}>+{v.length - 3}</span>}
              </div>
            </div>
          ) : null)}
        </div>
      </div>

      {missingCols.length > 0 && (
        <div className="db-card">
          <div className="db-chdr">Missing Values</div>
          <div className="ga">
            {missingCols.slice(0, 20).map(([col, d]) => {
              const p = d.missing_percent || 0;
              const color = p > 40 ? "var(--danger)" : p > 10 ? "var(--warn)" : "var(--accent)";
              return (
                <div key={col} className="db-mc">
                  <div className="db-mn">{col}</div>
                  <div className="db-mr"><span>{d.missing_count} missing</span><span style={{ color }}>{pct(p)}</span></div>
                  <div className="db-bt"><div className="db-bf" style={{ width: `${Math.min(p,100)}%`, background: color }} /></div>
                  <div className="db-mt">{d.imputation_recommendation}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {Object.keys(dist).length > 0 && (
        <div className="db-card">
          <div className="db-chdr">Numeric Distributions — hover headers for explanations</div>
          <div className="db-tw">
            <table className="db-t">
              <thead>
                <tr>
                  <th>Feature</th>
                  {["Mean","Median","Standard Deviation","Min","Max","Skewness"].map(h => <th key={h}><Tip label={h} /></th>)}
                </tr>
              </thead>
              <tbody>
                {Object.entries(dist).slice(0,15).map(([col, st]) => (
                  <tr key={col}>
                    <td style={{ color: "var(--accent2)", fontWeight: 700 }}>{col}</td>
                    <td className="hi">{fmt(st.mean)}</td>
                    <td>{fmt(st.median)}</td>
                    <td>{fmt(st.std)}</td>
                    <td>{fmt(st.min,2)}</td>
                    <td>{fmt(st.max,2)}</td>
                    <td style={{ color: Math.abs(st.skew||0) > 1 ? "var(--warn)" : "var(--text)" }}>
                      {fmt(st.skew)}
                      {Math.abs(st.skew||0) > 1 && <span className="db-b warn" style={{ marginLeft: 5 }}>skewed</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {insights.length > 0 && (
        <div className="db-card">
          <div className="db-chdr">ML Insights</div>
          {insights.map((ins, i) => {
            const isWarn = ins.startsWith("[WARNING]");
            return (
              <div key={i} className="db-ins">
                <span className={`db-b ${isWarn ? "warn" : "info"}`}>{isWarn ? "WARN" : "INFO"}</span>
                <span className="db-ins-txt">{ins.replace(/^\[(WARNING|INFO|NOTE)\]\s*/, "")}</span>
              </div>
            );
          })}
        </div>
      )}

      {viz.correlation_heatmap && (
        <div className="db-card">
          <div className="db-chdr">Correlation Heatmap — <Tip label="what is correlation?" term="Correlation" /></div>
          <div className="db-gi" style={{ maxWidth: "100%" }} onClick={() => setLb({ src: viz.correlation_heatmap, caption: "Correlation Heatmap — darker = stronger relationship" })}>
            <img src={viz.correlation_heatmap} alt="Correlation heatmap" />
          </div>
          <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", marginTop: 8 }}>Click to expand · Darker = stronger relationship between two columns</p>
        </div>
      )}

      {viz.distribution_plots?.length > 0 && (
        <div className="db-card">
          <div className="db-chdr">Distribution Charts — click any chart to expand</div>
          <div className="db-gallery">
            {viz.distribution_plots.map((src, i) => (
              <div key={i} className="db-gi" onClick={() => setLb({ src, caption: `Distribution · column ${i+1}` })}>
                <div className="db-gl">Distribution {i+1}</div>
                <img src={src} alt={`dist-${i}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {viz.categorical_plots?.length > 0 && (
        <div className="db-card">
          <div className="db-chdr">Categorical Charts — click any chart to expand</div>
          <div className="db-gallery">
            {viz.categorical_plots.map((src, i) => (
              <div key={i} className="db-gi" onClick={() => setLb({ src, caption: `Category distribution · column ${i+1}` })}>
                <div className="db-gl">Category {i+1}</div>
                <img src={src} alt={`cat-${i}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      <JsonViewer title="EDA output" data={data} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PANEL 3 — Feature Engineering
// FIX 5: Only shows transform badges for transforms that actually ran,
// read from fe_log.transforms_applied (populated by updated fe_pipeline.py)
// ─────────────────────────────────────────────────────────────────────────────
function FePanel({ data }) {
  if (!data) return (
    <div className="db-card"><div className="db-empty"><div className="db-ei">⚙️</div><div className="db-et">Click "Run Feature Eng." to automatically clean and transform your dataset.</div></div></div>
  );

  const log      = data.fe_log || {};
  const features = data.transformed_feature_list || [];
  const safety   = log.safety_checks || [];
  const dropped  = log.dropped_columns || [];
  const highCard = log.high_cardinality_encoded || [];

  // FIX 5: All transform definitions — only render the ones that actually ran
  const ALL_TRANSFORMS = {
    OHE:   { term: "One-Hot Encoding",   tip: "Text categories (like Male/Female) were converted into 0s and 1s that a model can read." },
    FREQ:  { term: "Frequency Encoding", tip: "Columns with many unique values were replaced with how often each value appears." },
    SCALE: { term: "StandardScaler",     tip: "All numbers were rescaled to the same range so no single feature dominates the model." },
    LOG1P: { term: "Log Transform",      tip: "Heavily skewed columns were smoothed out using a log transformation." },
    IQR:   { term: "IQR Clipping",       tip: "Extreme outlier values were trimmed to prevent them from distorting the model." },
  };

  // transforms_applied is set by the updated fe_pipeline.py
  // Fall back to showing all if the key is missing (older backend)
  const ran = log.transforms_applied || Object.keys(ALL_TRANSFORMS);

  return (
    <>
      <div className="g3">
        <div className="db-st"><div className="db-sl">Features After FE</div><div className="db-sv">{log.final_feature_count ?? features.length}</div></div>
        <div className="db-st"><div className="db-sl">Rows</div><div className="db-sv p">{log.final_shape?.rows ?? "—"}</div></div>
        <div className="db-st"><div className="db-sl">Duplicates Removed</div><div className="db-sv g">{log.duplicates_removed ?? 0}</div></div>
      </div>

      <div className="db-card">
        <div className="db-chdr">What happened to your data?</div>
        <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)", lineHeight: 1.85, marginBottom: 14 }}>
          Insyte automatically cleaned and transformed your dataset. Here's exactly what was applied:
        </p>
        {ran.map(badge => {
          const t = ALL_TRANSFORMS[badge];
          if (!t) return null;
          return (
            <div key={badge} className="db-ins">
              <span className="db-b pass"><Tip label={badge} term={t.term} /></span>
              <span className="db-ins-txt">{t.tip}</span>
            </div>
          );
        })}
        {ran.length === 0 && <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>No transforms were needed for this dataset.</p>}
      </div>

      <div className="db-card">
        <div className="db-chdr">Features Used for Training ({features.length})</div>
        <div className="db-pills">{features.map(f => <span key={f} className="db-pill">{f}</span>)}</div>
      </div>

      {(dropped.length > 0 || highCard.length > 0) && (
        <div className="g2">
          {dropped.length > 0 && (
            <div className="db-card">
              <div className="db-chdr">Dropped Columns</div>
              <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", marginBottom: 10, lineHeight: 1.6 }}>
                Removed because they were IDs, near-unique text columns (like names), constants, or too incomplete.
              </p>
              <div className="db-pills">
                {dropped.map(c => <span key={c} className="db-pill" style={{ borderColor: "rgba(248,113,113,0.3)", color: "var(--danger)" }}>{c}</span>)}
              </div>
            </div>
          )}
          {highCard.length > 0 && (
            <div className="db-card">
              <div className="db-chdr"><Tip label="High Cardinality Columns" term="High Cardinality" /></div>
              <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", marginBottom: 10, lineHeight: 1.6 }}>
                Too many unique values for one-hot encoding — frequency encoding was used instead.
              </p>
              <div className="db-pills">
                {highCard.map(c => <span key={c} className="db-pill" style={{ borderColor: "rgba(251,191,36,0.3)", color: "var(--warn)" }}>{c}</span>)}
              </div>
            </div>
          )}
        </div>
      )}

      {safety.length > 0 && (
        <div className="db-card">
          <div className="db-chdr">Target Column Safety Checks</div>
          <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", marginBottom: 10, lineHeight: 1.6 }}>
            5 automatic checks confirm the target column was never modified during cleaning.
          </p>
          {safety.map((s, i) => <div key={i} className="db-safe"><span>✓</span><span>{s.replace("[PASS] ", "")}</span></div>)}
        </div>
      )}

      <JsonViewer title="FE log" data={log} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PANEL 4 — AutoML
// FIX 6: Plain-English accuracy verdict added below the leaderboard
// ─────────────────────────────────────────────────────────────────────────────
function AutomlPanel({ data, problem }) {
  if (!data) return (
    <div className="db-card"><div className="db-empty"><div className="db-ei">🤖</div><div className="db-et">Run AutoML to automatically train and compare multiple models.</div></div></div>
  );

  const rows   = data.leaderboard || [];
  const isReg  = problem === "regression";
  const best   = rows.find(r => r.is_best);
  const topScore = isReg ? best?.r2 : best?.accuracy;
  const isLeakage = topScore != null && Number(topScore) >= 0.999;
  const verdict = isReg ? r2Verdict(topScore) : accuracyVerdict(topScore);

  return (
    <>
      <div className="g3">
        <div className="db-st"><div className="db-sl">Best Model</div><div className="db-sv w" style={{ fontSize: 15, marginTop: 3 }}>{data.best_model ?? "—"}</div></div>
        <div className="db-st"><div className="db-sl">Models Trained</div><div className="db-sv p">{rows.length}</div></div>
        <div className="db-st"><div className="db-sl">Total Time</div><div className="db-sv g">{data.total_time_sec != null ? `${data.total_time_sec}s` : "—"}</div></div>
      </div>

      {isLeakage && (
        <div className="db-leak">
          <div className="db-leak-ico">🚨</div>
          <div>
            <div className="db-leak-ttl">Suspiciously Perfect Score — Possible Data Leakage</div>
            <div className="db-leak-txt">
              All models scored {fmt(topScore, 4)} — unrealistically perfect for real-world data. This almost always means <strong style={{ color: "var(--danger)" }}>data leakage</strong>: one of your features gives away the answer.
              <br /><br />
              <strong style={{ color: "var(--warn)" }}>What to do:</strong> Check your dataset for any column derived from or containing the same information as "{data.target_column}". Remove it, re-upload, and run again.
            </div>
          </div>
        </div>
      )}

      <div className="db-card">
        <div className="db-chdr">Model Leaderboard</div>
        <div className="db-tw">
          <table className="db-t">
            <thead>
              <tr>
                <th>Model</th>
                {isReg
                  ? <><th><Tip label="R² Score" /></th><th>RMSE</th><th>MSE</th></>
                  : <><th><Tip label="Accuracy" /></th><th><Tip label="Precision" /></th><th><Tip label="Recall" /></th><th><Tip label="F1 Score" /></th></>
                }
                <th>Train Time</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.model_name} className={r.is_best ? "best" : ""}>
                  <td style={{ fontWeight: 700 }}>
                    {r.model_name}
                    {r.is_best && <span className="db-b best" style={{ marginLeft: 7 }}>BEST</span>}
                  </td>
                  {isReg
                    ? <><td className="hig">{fmt(r.r2)}</td><td className="hi">{fmt(r.rmse)}</td><td>{fmt(r.mse)}</td></>
                    : <><td className="hig">{fmt(r.accuracy)}</td><td className="hi">{fmt(r.precision)}</td><td>{fmt(r.recall)}</td><td>{fmt(r.f1_score)}</td></>
                  }
                  <td style={{ color: "var(--muted)" }}>{r.training_time_sec != null ? `${r.training_time_sec}s` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FIX 6: Plain-English verdict so users understand what the score means */}
        {verdict && !isLeakage && (
          <div className="db-verdict" style={{ borderColor: `${verdict.color}33` }}>
            <span style={{ color: verdict.color }}>●</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: verdict.color }}>{verdict.label}</span>
          </div>
        )}

        <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", marginTop: 12, lineHeight: 1.7 }}>
          {isReg
            ? "R² tells you how well the model explains your data. 1.0 = perfect fit. 0.0 = no better than guessing the average."
            : "Accuracy = % of predictions that were correct. For example, 78% means the model got it right about 4 out of every 5 times."}
        </p>
      </div>

      <JsonViewer title="AutoML output" data={data} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PANEL 5 — Prediction
// FIX 1: buildMeta now reads cleaned_dataset_preview from automlResult
// so sliders work correctly even without a separate FE step
// ─────────────────────────────────────────────────────────────────────────────
function PredictPanel({ datasetId, schema, edaResult, feResult, automlResult }) {
  const features = schema?.features || [];

  // FIX 1: read preview from feResult OR automlResult (whichever has it)
  const meta = buildMeta(features, edaResult, feResult, automlResult);

  const [values,  setValues]  = useState(() => {
    const init = {};
    features.forEach(f => {
      const m = meta[f];
      if (!m)                 { init[f] = "";    return; }
      if (m.type === "numeric") init[f] = m.mid;
      else                     init[f] = 0;
    });
    return init;
  });

  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [err,     setErr]     = useState("");

  const predict = async () => {
    setLoading(true); setErr(""); setResult(null);
    try {
      const r = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataset_id: datasetId, inputs: values }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.detail || "Prediction failed");
      setResult(d);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  const sliderStyle = (f) => {
    const m = meta[f];
    if (!m || m.type !== "numeric") return {};
    const p = ((values[f] - m.min) / (m.max - m.min)) * 100;
    return { "--pct": `${Math.max(0, Math.min(100, p))}%` };
  };

  const target  = feResult?.target_column  || automlResult?.target_column;
  const problem = feResult?.problem_type   || automlResult?.problem_type;

  if (!features.length) return (
    <div className="db-card"><div className="db-empty"><div className="db-ei">🎯</div><div className="db-et">Run AutoML first to unlock the prediction interface.</div></div></div>
  );

  return (
    <>
      <div className="db-card">
        <div className="db-chdr">How to use this</div>
        <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)", lineHeight: 1.85 }}>
          Move the sliders to describe a scenario, then click "Run Prediction" to see what the model predicts.
          {target && <span> Predicting: <strong style={{ color: "var(--accent)" }}>{target}</strong></span>}
          {problem && <span style={{ color: "var(--muted)" }}> ({problem})</span>}.
        </p>
      </div>

      <div className="db-card">
        <div className="db-chdr">Adjust Feature Values</div>
        <div className="db-pgrid">
          {features.map(f => {
            const m = meta[f];

            if (m?.type === "binary") return (
              <div key={f} className="db-pc">
                <div className="db-plbl"><Tip label={f} /><span className="db-pval">{values[f] ? "Yes" : "No"}</span></div>
                <select className="db-sel" value={values[f]} onChange={e => setValues(p => ({ ...p, [f]: Number(e.target.value) }))}>
                  <option value={0}>No (0)</option>
                  <option value={1}>Yes (1)</option>
                </select>
              </div>
            );

            if (m?.type === "numeric") return (
              <div key={f} className="db-pc">
                <div className="db-plbl"><Tip label={f} /><span className="db-pval">{Number(values[f]).toFixed(2)}</span></div>
                <input type="range" className="db-slider" style={sliderStyle(f)}
                  min={m.min} max={m.max} step={(m.max - m.min) / 200} value={values[f]}
                  onChange={e => setValues(p => ({ ...p, [f]: Number(e.target.value) }))} />
                <div className="db-srange"><span>{fmt(m.min,1)}</span><span>{fmt(m.max,1)}</span></div>
              </div>
            );

            return (
              <div key={f} className="db-pc">
                <div className="db-plbl"><Tip label={f} /></div>
                <input className="db-ni" type="number" placeholder="Enter value…" value={values[f] ?? ""}
                  onChange={e => setValues(p => ({ ...p, [f]: e.target.value }))} />
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 20, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button className="db-pb" onClick={predict} disabled={loading}>{loading ? "Predicting…" : "Run Prediction →"}</button>
          {err && <span style={{ color: "var(--danger)", fontFamily: "var(--mono)", fontSize: 12 }}>{err}</span>}
        </div>
      </div>

      {result && (
        <div className="db-res">
          <div className="db-rl">Predicted · {result.target_column}</div>
          <div className="db-rv">{String(result.prediction)}</div>
          <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", marginTop: 10 }}>
            Adjust the sliders to see how different inputs change the prediction.
          </p>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// buildMeta — derive per-feature input type + range
//
// FIX 1: Now reads cleaned_dataset_preview from BOTH feResult and automlResult
// so slider ranges work correctly whether or not the user ran /feature-engineering
// separately. Priority: EDA distribution (best, original scale) → preview detection
// (binary OHE cols) → scaled fallback (-3 to 3, StandardScaler output range).
// ─────────────────────────────────────────────────────────────────────────────
function buildMeta(features, edaResult, feResult, automlResult) {
  const meta    = {};
  const dist    = edaResult?.distribution || {};
  // FIX 1: read preview from feResult OR automlResult — whichever has it
  const preview = feResult?.cleaned_dataset_preview || automlResult?.cleaned_dataset_preview || [];

  features.forEach(f => {
    // 1. EDA distribution: original scale, most accurate for numeric features
    if (dist[f]) {
      meta[f] = { type: "numeric", min: dist[f].min ?? 0, max: dist[f].max ?? 1, mid: dist[f].median ?? (dist[f].min + dist[f].max) / 2 };
      return;
    }

    if (preview.length > 0) {
      const vals   = preview.map(row => row[f]).filter(v => v != null);
      const unique = [...new Set(vals.map(Number))];

      // 2. Binary detection: OHE columns like Sex_male, Embarked_S — only 0 and 1
      if (unique.length <= 2 && unique.every(v => v === 0 || v === 1)) {
        meta[f] = { type: "binary" };
        return;
      }

      // 3. Numeric range from preview (frequency-encoded or other post-FE columns)
      const nums = vals.map(Number).filter(n => !isNaN(n));
      if (nums.length > 0) {
        const min = Math.min(...nums), max = Math.max(...nums);
        meta[f] = { type: "numeric", min, max, mid: (min + max) / 2 };
        return;
      }
    }

    // 4. Final fallback: StandardScaler output is roughly -3 to 3
    meta[f] = { type: "numeric", min: -3, max: 3, mid: 0 };
  });

  return meta;
}