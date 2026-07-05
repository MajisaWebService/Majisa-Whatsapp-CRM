import React, { useState, useEffect } from "react";
import { Header } from "../components/Header.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export const Reports = () => {
    const { token, request } = useAuth();
    const [analytics, setAnalytics] = useState({
        summary: {
            totalLeads: 0,
            completedProjects: 0,
            conversionRate: 0,
            totalPipelineRevenue: 0,
            realizedRevenue: 0,
            ongoingRevenue: 0,
            avgResponseTimeStr: "15 mins",
            avgClosingTimeStr: "7 Days"
        },
        charts: {
            leadsTrend: [],
            revenueTrend: [],
            serviceDistribution: [],
            serviceRevenue: [],
            statusDistribution: []
        },
        executivePerformance: []
    });
    
    // Time Edit States
    const [showEditTimesModal, setShowEditTimesModal] = useState(false);
    const [editResponseTime, setEditResponseTime] = useState("");
    const [editCycleTime, setEditCycleTime] = useState("");
    const [savingTimes, setSavingTimes] = useState(false);

    const [loading, setLoading] = useState(true);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const response = await request(window.API_BASE_URL + "/api/v1/analytics/stats");
            const result = await response.json();
            if (result.success) {
                setAnalytics(result.data);
                setEditResponseTime(result.data.summary.avgResponseTimeStr || "15 mins");
                setEditCycleTime(result.data.summary.avgClosingTimeStr || "7 Days");
            }
        } catch (err) {
            console.error("Failed to load analytics stats:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [token]);

    const handleSaveTimes = async (e) => {
        e.preventDefault();
        setSavingTimes(true);
        try {
            const response = await request(window.API_BASE_URL + "/api/v1/settings", {
                method: "PUT",
                body: JSON.stringify({
                    manualAvgResponseTime: editResponseTime,
                    manualAvgCycleTime: editCycleTime
                })
            });
            const result = await response.json();
            if (result.success) {
                setShowEditTimesModal(false);
                fetchAnalytics(); // Refresh summary values
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSavingTimes(false);
        }
    };

    const handlePrintPDF = () => {
        window.print();
    };

    const handleExportCSV = () => {
        const headers = ["Executive", "Leads Handled", "Won Leads", "Revenue Generated (₹)"];
        const rows = analytics.executivePerformance.map(e => [
            e.executive || "Unassigned",
            e.leadsHandled,
            e.convertedLeads,
            e.revenueGenerated
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
            + [
                ["MAJISA WEB SOLUTIONS - BUSINESS REPORT"],
                ["Generated Date", new Date().toLocaleString()],
                ["Total Leads", analytics.summary.totalLeads],
                ["Completed Projects", analytics.summary.completedProjects],
                ["Conversion Rate (%)", `${analytics.summary.conversionRate}%`],
                [],
                headers.join(","),
                ...rows.map(r => r.join(","))
            ].map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `majisa_crm_analytics_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="main-content">
                <Header title="Business Analytics" />
                <div className="page-body" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
                    <div style={{ textAlign: "center" }}>
                        <div className="pulse-dot" style={{ width: "20px", height: "20px", margin: "0 auto 16px auto" }}></div>
                        <h3 style={{ color: "var(--text-secondary)" }}>Generating analytics reports...</h3>
                    </div>
                </div>
            </div>
        );
    }

    const { summary, charts, executivePerformance } = analytics;

    // Line chart coordinates for growth
    const maxCount = Math.max(...charts.leadsTrend.map(l => l.count), 5);
    const leadsPoints = charts.leadsTrend.map((trend, i) => {
        const x = 50 + i * 75;
        const y = 140 - (trend.count / maxCount) * 100;
        return { x, y, count: trend.count, label: trend.label };
    });
    const leadsPolyline = leadsPoints.map(p => `${p.x},${p.y}`).join(" ");

    // Bar chart coordinates for revenue trend
    const maxRevVal = Math.max(...charts.revenueTrend.map(r => r.revenue), 10000);

    return (
        <div className="main-content">
            <Header title="Business Intel & Analytics" />
            <div className="page-body" style={{ paddingBottom: "40px" }} id="printable-area">
                
                {/* Reporting Action Options */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                        <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#fff" }}>Management Performance Sheets</h2>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Live statistics compiled directly from WhatsApp operations and customer projects.</span>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <button onClick={handleExportCSV} className="btn btn-secondary" style={{ fontSize: "13px" }}>
                            📥 Export Spreadsheet
                        </button>
                        <button onClick={handlePrintPDF} className="btn btn-primary" style={{ fontSize: "13px" }}>
                            🖨️ Export PDF / Print
                        </button>
                    </div>
                </div>

                {/* KPI Performance Cards Grid */}
                <div className="card-grid" style={{ marginBottom: "24px", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                    <div className="stat-card">
                        <div className="stat-info">
                            <p>Total Leads</p>
                            <h3>{summary.totalLeads}</h3>
                        </div>
                        <div className="stat-icon">📈</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-info">
                            <p>Won Deals</p>
                            <h3>{summary.completedProjects}</h3>
                        </div>
                        <div className="stat-icon" style={{ color: "var(--color-success)" }}>🤝</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-info">
                            <p>Conversion Rate</p>
                            <h3>{summary.conversionRate}%</h3>
                        </div>
                        <div className="stat-icon" style={{ color: "var(--color-info)" }}>🎯</div>
                    </div>
                    <div className="stat-card" style={{ position: "relative" }}>
                        <div className="stat-info">
                            <p>Avg Response Time</p>
                            <h3>{summary.avgResponseTimeStr}</h3>
                        </div>
                        <button 
                            onClick={() => setShowEditTimesModal(true)} 
                            style={{ position: "absolute", top: "12px", right: "12px", border: "none", background: "none", cursor: "pointer", fontSize: "13px", color: "var(--text-secondary)" }}
                            title="Edit Benchmark"
                        >
                            ✏️
                        </button>
                        <div className="stat-icon">⚡</div>
                    </div>
                    <div className="stat-card" style={{ position: "relative" }}>
                        <div className="stat-info">
                            <p>Avg Cycle Time</p>
                            <h3>{summary.avgClosingTimeStr}</h3>
                        </div>
                        <button 
                            onClick={() => setShowEditTimesModal(true)} 
                            style={{ position: "absolute", top: "12px", right: "12px", border: "none", background: "none", cursor: "pointer", fontSize: "13px", color: "var(--text-secondary)" }}
                            title="Edit Benchmark"
                        >
                            ✏️
                        </button>
                        <div className="stat-icon">⌛</div>
                    </div>
                </div>

                {/* Primary Visualization Rows */}
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px", marginBottom: "24px" }}>
                    
                    {/* Customer Growth Line Chart */}
                    <div className="panel-card" style={{ height: "260px", display: "flex", flexDirection: "column" }}>
                        <h3 className="panel-title" style={{ marginBottom: "16px" }}>Leads Acquisition Growth</h3>
                        <div style={{ flex: 1, position: "relative", minHeight: "0" }}>
                            {leadsPoints.length > 0 ? (
                                <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} viewBox="0 0 460 160" preserveAspectRatio="none">
                                    <line x1="40" y1="40" x2="420" y2="40" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
                                    <line x1="40" y1="90" x2="420" y2="90" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
                                    <line x1="40" y1="140" x2="420" y2="140" stroke="var(--border-color)" strokeWidth="1.5" />
                                    
                                    <polyline fill="none" stroke="var(--color-brand)" strokeWidth="2.5" points={leadsPolyline} />
                                    
                                    {leadsPoints.map((p, i) => (
                                        <g key={i}>
                                            <circle cx={p.x} cy={p.y} r="4" fill="var(--bg-secondary)" stroke="var(--color-brand)" strokeWidth="2" />
                                            <text x={p.x} y={p.y - 10} textAnchor="middle" fill="#fff" fontSize="9" fontWeight="600">{p.count}</text>
                                            <text x={p.x} y="152" textAnchor="middle" fill="var(--text-secondary)" fontSize="8">{p.label}</text>
                                        </g>
                                    ))}
                                </svg>
                            ) : (
                                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-muted)", fontSize: "13px" }}>No data</div>
                            )}
                        </div>
                    </div>

                    {/* Revenue Growth Bar Chart */}
                    <div className="panel-card" style={{ height: "260px", display: "flex", flexDirection: "column" }}>
                        <h3 className="panel-title" style={{ marginBottom: "16px" }}>Monthly Booked Revenue</h3>
                        <div style={{ flex: 1, position: "relative", minHeight: "0" }}>
                            {charts.revenueTrend.length > 0 ? (
                                <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} viewBox="0 0 400 160" preserveAspectRatio="none">
                                    <line x1="40" y1="40" x2="360" y2="40" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
                                    <line x1="40" y1="90" x2="360" y2="90" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
                                    <line x1="40" y1="140" x2="360" y2="140" stroke="var(--border-color)" strokeWidth="1.5" />

                                    {charts.revenueTrend.map((trend, i) => {
                                        const w = 24;
                                        const h = maxRevVal > 0 ? (trend.revenue / maxRevVal) * 100 : 0;
                                        const x = 50 + i * 50;
                                        const y = 140 - h;
                                        
                                        return (
                                            <g key={i}>
                                                <rect x={x} y={y} width={w} height={h} rx="3" fill="var(--color-info)" opacity="0.85" />
                                                <text x={x + w/2} y={y - 8} textAnchor="middle" fill="#fff" fontSize="8" fontWeight="600">
                                                    {trend.revenue > 0 ? `₹${Math.round(trend.revenue/1000)}k` : "0"}
                                                </text>
                                                <text x={x + w/2} y="152" textAnchor="middle" fill="var(--text-secondary)" fontSize="8">
                                                    {trend.label.split(" ")[0]}
                                                </text>
                                            </g>
                                        );
                                    })}
                                </svg>
                            ) : (
                                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-muted)", fontSize: "13px" }}>No data</div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Secondary Aggregation Rows */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
                    
                    {/* Service Demand Breakdown */}
                    <div className="panel-card" style={{ minHeight: "260px" }}>
                        <h3 className="panel-title" style={{ marginBottom: "16px" }}>Service Inquiries demand</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            {charts.serviceDistribution.length === 0 ? (
                                <div style={{ padding: "40px", color: "var(--text-muted)", fontSize: "13px", textAlign: "center" }}>No inquiry data</div>
                            ) : (
                                charts.serviceDistribution.map((item, idx) => {
                                    const percent = summary.totalLeads > 0 ? (item.count / summary.totalLeads) * 100 : 0;
                                    return (
                                        <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                                                <span style={{ color: "var(--text-secondary)" }}>{item.service || "Other"}</span>
                                                <strong style={{ color: "#fff" }}>{item.count} inquiries ({Math.round(percent)}%)</strong>
                                            </div>
                                            <div style={{ height: "6px", backgroundColor: "var(--bg-tertiary)", borderRadius: "3px", overflow: "hidden" }}>
                                                <div style={{ height: "100%", backgroundColor: "var(--color-brand)", width: `${percent}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Service wise Revenue Allocation */}
                    <div className="panel-card" style={{ minHeight: "260px" }}>
                        <h3 className="panel-title" style={{ marginBottom: "16px" }}>Service Booking Revenue</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            {charts.serviceRevenue.length === 0 ? (
                                <div style={{ padding: "40px", color: "var(--text-muted)", fontSize: "13px", textAlign: "center" }}>No financial booking logs registered</div>
                            ) : (
                                charts.serviceRevenue.map((item, idx) => {
                                    const percent = summary.totalPipelineRevenue > 0 ? (item.revenue / summary.totalPipelineRevenue) * 100 : 0;
                                    return (
                                        <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                                                <span style={{ color: "var(--text-secondary)" }}>{item.service || "Unmapped"}</span>
                                                <strong style={{ color: "#fff" }}>₹{item.revenue.toLocaleString("en-IN")} ({Math.round(percent)}%)</strong>
                                            </div>
                                            <div style={{ height: "6px", backgroundColor: "var(--bg-tertiary)", borderRadius: "3px", overflow: "hidden" }}>
                                                <div style={{ height: "100%", backgroundColor: "var(--color-success)", width: `${percent}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                </div>

                {/* Executive Performance Sheets */}
                <div className="panel-card">
                    <h3 className="panel-title" style={{ marginBottom: "20px" }}>Executive Performance Ranking</h3>
                    <div className="table-responsive">
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Executive Owner</th>
                                    <th>Leads Assigned</th>
                                    <th>Won Deals</th>
                                    <th>Conversion Rate (%)</th>
                                    <th>Pipeline Contribution (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {executivePerformance.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>No representative performance details logged</td>
                                    </tr>
                                ) : (
                                    executivePerformance.map((exec, idx) => {
                                        const convRate = exec.leadsHandled > 0 ? Math.round((exec.convertedLeads / exec.leadsHandled) * 100) : 0;
                                        return (
                                            <tr key={idx}>
                                                <td style={{ fontWeight: "600" }}>{exec.executive || "Unassigned Owner"}</td>
                                                <td>{exec.leadsHandled} Leads</td>
                                                <td>{exec.convertedLeads} Projects</td>
                                                <td style={{ fontWeight: "600", color: "var(--color-info)" }}>{convRate}%</td>
                                                <td style={{ fontWeight: "700", color: "var(--color-success)" }}>₹{exec.revenueGenerated.toLocaleString("en-IN")}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Editable Times Modal */}
            {showEditTimesModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: "400px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                            <h3 style={{ fontSize: "16px", fontWeight: "600" }}>Edit Analytics Benchmarks</h3>
                            <button onClick={() => setShowEditTimesModal(false)} style={{ border: "none", background: "none", fontSize: "20px", color: "var(--text-secondary)", cursor: "pointer" }}>×</button>
                        </div>

                        <form onSubmit={handleSaveTimes} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div className="form-group">
                                <label className="form-label">Average Response Time</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    value={editResponseTime} 
                                    onChange={(e) => setEditResponseTime(e.target.value)} 
                                    placeholder="e.g. 15 mins or 2 mins" 
                                    required 
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: "10px" }}>
                                <label className="form-label">Average Cycle Time (Closing)</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    value={editCycleTime} 
                                    onChange={(e) => setEditCycleTime(e.target.value)} 
                                    placeholder="e.g. 7 Days or 5 Days" 
                                    required 
                                />
                            </div>

                            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                                <button type="button" onClick={() => setShowEditTimesModal(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={savingTimes}>
                                    {savingTimes ? "Saving..." : "Save Benchmarks"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
