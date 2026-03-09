import { useLocation, useNavigate } from "react-router-dom";
import { Typography, Button, Paper, Grid, Chip } from "@mui/material";

export default function Result() {
    const location = useLocation();
    const navigate = useNavigate();

    // Extract the EDA Report passed via state from the Upload component
    const { edaReport, fileName } = location.state || {};

    if (!edaReport) {
        return (
            <div className="page-center">
                <div className="center-box">
                    <Typography variant="h5" color="error">
                        No EDA data found. Please upload a file first.
                    </Typography>
                    <Button variant="contained" sx={{ mt: 3 }} onClick={() => navigate("/upload")}>
                        Back to Upload
                    </Button>
                </div>
            </div>
        );
    }

    const { dataset_summary, data_quality_issues, insights, column_types, missing_analysis } = edaReport;

    return (
        <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto", backgroundColor: "#f9fafb", borderRadius: "12px", minHeight: "100vh" }}>
            <Typography variant="h3" fontWeight={700} gutterBottom sx={{ color: "#111827" }}>
                EDA Report Dashboard
            </Typography>
            <Typography variant="h6" color="textSecondary" gutterBottom sx={{ mb: 4 }}>
                Dataset Analyzed: <b>{fileName}</b>
            </Typography>

            <Grid container spacing={3}>
                {/* Row 1: Dataset Summary & Quality */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3, borderRadius: "16px", height: "100%" }}>
                        <Typography variant="h5" fontWeight={600} gutterBottom sx={{ borderBottom: "2px solid #e5e7eb", pb: 1, mb: 2 }}>
                            📊 Dataset Summary
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6}><Typography color="textSecondary">Total Rows</Typography><Typography variant="h6">{dataset_summary.num_rows.toLocaleString()}</Typography></Grid>
                            <Grid item xs={6}><Typography color="textSecondary">Total Columns</Typography><Typography variant="h6">{dataset_summary.num_columns}</Typography></Grid>
                            <Grid item xs={6}><Typography color="textSecondary">Duplicate Rows</Typography><Typography variant="h6" color={dataset_summary.duplicate_rows > 0 ? "error" : "textPrimary"}>{dataset_summary.duplicate_rows} ({dataset_summary.duplicate_percent}%)</Typography></Grid>
                            <Grid item xs={6}><Typography color="textSecondary">Mem Optimization</Typography><Typography variant="h6" color="success.main">-{dataset_summary.memory_reduction_percent}%</Typography></Grid>
                            <Grid item xs={6}><Typography color="textSecondary">Original Size</Typography><Typography variant="body1">{dataset_summary.memory_usage_mb} MB</Typography></Grid>
                            <Grid item xs={6}><Typography color="textSecondary">Optimized Size</Typography><Typography variant="body1">{dataset_summary.memory_optimized_mb} MB</Typography></Grid>
                        </Grid>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3, borderRadius: "16px", height: "100%", backgroundColor: Object.keys(data_quality_issues || {}).length > 0 ? "#fffbfa" : "#ffffff" }}>
                        <Typography variant="h5" fontWeight={600} gutterBottom sx={{ borderBottom: "2px solid #e5e7eb", pb: 1, mb: 2 }}>
                            🧹 Data Quality Issues
                        </Typography>

                        {dataset_summary.duplicate_warning && (
                            <Chip label={dataset_summary.duplicate_warning} color="error" variant="outlined" sx={{ mb: 2, height: 'auto', '& .MuiChip-label': { display: 'block', whiteSpace: 'normal' } }} />
                        )}

                        {Object.keys(data_quality_issues || {}).length === 0 ? (
                            <Typography color="success.main" variant="subtitle1" sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <span>✅</span> No invisible formatting issues detected. Highly pristine dataset.
                            </Typography>
                        ) : (
                            <ul style={{ margin: 0, paddingLeft: "20px", color: "#4b5563" }}>
                                {Object.entries(data_quality_issues).map(([col, issues]) => (
                                    <li key={col} style={{ marginBottom: "8px" }}>
                                        <b>{col}</b>: {issues.join(", ")}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Paper>
                </Grid>

                {/* Row 2: Column Types & Missing Data */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={2} sx={{ p: 3, borderRadius: "16px", height: "100%" }}>
                        <Typography variant="h5" fontWeight={600} gutterBottom sx={{ borderBottom: "2px solid #e5e7eb", pb: 1, mb: 2 }}>
                            🏷️ Feature Types
                        </Typography>
                        {Object.entries(column_types || {}).map(([type, cols]) => {
                            if (!cols || cols.length === 0) return null;
                            // Don't render redundant sub-categories if they clutter, focus on the base ones
                            if (['numeric_continuous', 'numeric_discrete'].includes(type)) return null;

                            let color = "default";
                            if (type === "numeric") color = "primary";
                            if (type === "categorical") color = "secondary";
                            if (type === "datetime") color = "success";
                            if (type === "id_like") color = "warning";

                            return (
                                <div key={type} style={{ marginBottom: "16px" }}>
                                    <Typography variant="subtitle2" sx={{ textTransform: "capitalize", color: "#6b7280", mb: 0.5 }}>
                                        {type.replace("_", " ")} ({cols.length})
                                    </Typography>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                        {cols.map(c => <Chip key={c} label={c} size="small" color={color} variant="outlined" />)}
                                    </div>
                                </div>
                            )
                        })}
                    </Paper>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Paper elevation={2} sx={{ p: 3, borderRadius: "16px", height: "100%" }}>
                        <Typography variant="h5" fontWeight={600} gutterBottom sx={{ borderBottom: "2px solid #e5e7eb", pb: 1, mb: 2 }}>
                            ❓ Missing Values Analysis
                        </Typography>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                            {Object.entries(missing_analysis || {}).map(([col, data]) => {
                                if (data.missing_count === 0) return null; // Only show columns that are actually missing data

                                const p = data.missing_percent;
                                let pColor = p > 40 ? "#ef4444" : (p > 5 ? "#f59e0b" : "#3b82f6");

                                return (
                                    <div key={col} style={{ border: "1px solid #e5e7eb", padding: "12px", borderRadius: "8px" }}>
                                        <Typography variant="subtitle2" fontWeight={600}>{col}</Typography>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0' }}>
                                            <span style={{ fontSize: '13px', color: "#6b7280" }}>{data.missing_count} missing</span>
                                            <span style={{ fontSize: '13px', fontWeight: 600, color: pColor }}>{p}%</span>
                                        </div>
                                        {/* Mini progress bar */}
                                        <div style={{ width: '100%', height: '6px', backgroundColor: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ width: `${p}%`, height: '100%', backgroundColor: pColor }} />
                                        </div>
                                        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: "#6b7280", lineHeight: 1.2 }}>
                                            {data.imputation_recommendation}
                                        </Typography>
                                    </div>
                                )
                            })}

                            {Object.values(missing_analysis || {}).every(d => d.missing_count === 0) && (
                                <Typography color="success.main">💯 No missing values in any column!</Typography>
                            )}
                        </div>
                    </Paper>
                </Grid>

                {/* Row 3: ML Insights Overview */}
                <Grid item xs={12}>
                    <Paper elevation={2} sx={{ p: 3, borderRadius: "16px", backgroundColor: "#fdf8f6" }}>
                        <Typography variant="h5" fontWeight={600} gutterBottom sx={{ borderBottom: "2px solid #e5e7eb", pb: 1, mb: 2 }}>
                            🧠 Machine Learning Recommendations
                        </Typography>
                        {insights && insights.length > 0 ? (
                            <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
                                {insights.map((insight, idx) => {
                                    let chipColor = "info";
                                    let bgHover = "#f3f4f6";
                                    if (insight.startsWith("[WARNING]")) { chipColor = "error"; bgHover = "#fef2f2"; }
                                    if (insight.startsWith("[INFO]")) { chipColor = "primary"; bgHover = "#eff6ff"; }

                                    return (
                                        <li key={idx} style={{
                                            marginBottom: "12px", display: "flex", alignItems: "flex-start",
                                            padding: "12px", borderRadius: "8px", backgroundColor: "white",
                                            border: "1px solid #e5e7eb", transition: "background-color 0.2s"
                                        }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = bgHover}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
                                        >
                                            <div style={{ minWidth: "100px" }}>
                                                <Chip
                                                    label={insight.split("]")[0].replace("[", "")}
                                                    color={chipColor}
                                                    size="small"
                                                    sx={{ fontWeight: 600, borderRadius: "6px" }}
                                                />
                                            </div>
                                            <Typography sx={{ ml: 2, color: "#374151", lineHeight: 1.5 }}>
                                                {insight.split("]").slice(1).join("]")}
                                            </Typography>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <Typography color="textSecondary">No actionable ML insights generated. Proceed with standard modelling.</Typography>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            <div style={{ display: "flex", justifyContent: "center", marginTop: "40px" }}>
                <Button variant="contained" color="primary" size="large" sx={{ px: 4, py: 1.5, borderRadius: "8px", fontWeight: 600 }} onClick={() => navigate("/upload")}>
                    Analyze Another Dataset
                </Button>
            </div>
        </div>
    );
}
