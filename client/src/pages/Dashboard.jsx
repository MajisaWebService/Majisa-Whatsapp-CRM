import React, { useState, useEffect } from "react";
import { Header } from "../components/Header.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";

export const Dashboard = () => {
    const { token, request } = useAuth();
    const { whatsappStatus, whatsappQR, incomingMessage } = useSocket();
    const [stats, setStats] = useState({
        totalCustomers: 0,
        todaysLeads: 0,
        newLeads: 0,
        inProgressLeads: 0,
        talkToExecutiveLeads: 0,
        todaysMessages: 0,
        activeChats: 0,
        completedProjects: 0,
        activeProjects: 0,
        totalRevenue: 0,
        realizedRevenue: 0
    });
    const [recentConvs, setRecentConvs] = useState([]);
    const [recentNotifs, setRecentNotifs] = useState([]);
    const [charts, setCharts] = useState({
        leadsTrend: [],
        revenueTrend: [],
        serviceDistribution: [],
        statusDistribution: []
    });
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async () => {
        try {
            const response = await request(window.API_BASE_URL + "/api/v1/dashboard/stats");
            const result = await response.json();
            if (result.success) {
                setStats(result.data.cards);
                setRecentConvs(result.data.recentConversations);
                setRecentNotifs(result.data.recentNotifications);
                setCharts(result.data.charts);
            }
        } catch (err) {
            console.error("Dashboard loading error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [token]);

    // Handle real-time updates when messages hit
    useEffect(() => {
        if (incomingMessage) {
            fetchDashboardData();
        }
    }, [incomingMessage]);

    if (loading) {
        return (
            <div className="main-content">
                <Header title="Dashboard" />
                <div className="page-body" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
                    <div style={{ textAlign: "center" }}>
                        <div className="pulse-dot" style={{ width: "20px", height: "20px", margin: "0 auto 16px auto" }}></div>
                        <h3 style={{ color: "var(--text-secondary)" }}>Loading dashboard metrics...</h3>
                    </div>
                </div>
            </div>
        );
    }

    // --- CHART PLOT CALCULATIONS ---
    // 1. Leads Line Chart Points
    const maxLead = Math.max(...charts.leadsTrend.map(l => l.count), 5);
    const leadsPoints = charts.leadsTrend.map((trend, i) => {
        const x = 40 + i * 80;
        const y = 160 - (trend.count / maxLead) * 120;
        return { x, y, count: trend.count, label: trend.label };
    });
    const leadsPolyline = leadsPoints.map(p => `${p.x},${p.y}`).join(" ");

    // 2. Revenue Bar Chart Columns
    const maxRev = Math.max(...charts.revenueTrend.map(r => r.revenue), 10000);

    // 3. Conic Gradient for Service Distribution Donut
    const totalServiceCount = charts.serviceDistribution.reduce((sum, s) => sum + s.count, 0);
    let serviceGradientAccum = 0;
    const serviceColors = ["#f97316", "#ec4899", "#06b6d4", "#10b981", "#a855f7"];
    const serviceGradientSlices = charts.serviceDistribution.map((item, idx) => {
        const percent = totalServiceCount > 0 ? (item.count / totalServiceCount) * 100 : 0;
        const start = serviceGradientAccum;
        serviceGradientAccum += percent;
        return `${serviceColors[idx % serviceColors.length]} ${start}% ${serviceGradientAccum}%`;
    }).join(", ");

    // 4. Proportions for Customer Status Distribution
    const totalStatusCount = charts.statusDistribution.reduce((sum, s) => sum + s.count, 0);

    return (
        <div className="main-content">
            <Header title="Overview" />
            <div className="page-body" style={{ paddingBottom: "40px" }}>
                
                {/* Connection Status & Warning Notification Bar */}
                {whatsappStatus !== "connected" && (
                    <div className="panel-card" style={{ borderLeft: "4px solid var(--color-warning)", padding: "18px 24px", marginBottom: "24px", background: "rgba(245, 158, 11, 0.05)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
                            <div>
                                <h3 style={{ color: "var(--color-warning)", fontWeight: "700", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                                    ⚠️ WHATSAPP CONNECTIVITY DISCONNECTED
                                </h3>
                                <p style={{ color: "var(--text-secondary)", fontSize: "12px", marginTop: "4px", lineHeight: "1.4" }}>
                                    The automated chatbot system is currently offline. Customers will not receive auto-responses or price quotes. Please scan the QR code to connect.
                                </p>
                            </div>
                            {whatsappQR && (
                                <div style={{ display: "flex", alignItems: "center", gap: "16px", backgroundColor: "#fff", padding: "8px 12px", borderRadius: "10px" }}>
                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(whatsappQR)}`} alt="WhatsApp QR Code" style={{ width: "100px", height: "100px" }} />
                                    <div>
                                        <span style={{ fontSize: "11px", color: "#111", fontWeight: "700", display: "block" }}>Scan with Business Phone</span>
                                        <span style={{ fontSize: "9px", color: "#666", display: "block", marginTop: "4px" }}>Settings &gt; Linked Devices</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Primary Widgets Grid */}
                <div className="card-grid" style={{ marginBottom: "24px" }}>
                    <div className="stat-card">
                        <div className="stat-info">
                            <p>Total Customers</p>
                            <h3>{stats.totalCustomers}</h3>
                        </div>
                        <div className="stat-icon">👥</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-info">
                            <p>Today's Messages</p>
                            <h3>{stats.todaysMessages}</h3>
                        </div>
                        <div className="stat-icon">💬</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-info">
                            <p>New Leads</p>
                            <h3>{stats.newLeads}</h3>
                        </div>
                        <div className="stat-icon" style={{ color: "var(--color-info)" }}>⚡</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-info">
                            <p>In Progress Leads</p>
                            <h3>{stats.inProgressLeads}</h3>
                        </div>
                        <div className="stat-icon" style={{ color: "var(--color-warning)" }}>⌛</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-info">
                            <p>Talk to Executive</p>
                            <h3>{stats.talkToExecutiveLeads || 0}</h3>
                        </div>
                        <div className="stat-icon" style={{ color: "var(--color-brand)" }}>📞</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-info">
                            <p>Active Chats</p>
                            <h3>{stats.activeChats}</h3>
                        </div>
                        <div className="stat-icon">🔥</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-info">
                            <p>Completed Projects</p>
                            <h3>{stats.completedProjects}</h3>
                        </div>
                        <div className="stat-icon" style={{ color: "var(--color-success)" }}>✅</div>
                    </div>
                    <div className="stat-card" style={{ gridColumn: "span 2" }}>
                        <div className="stat-info" style={{ width: "100%" }}>
                            <p>Revenue Overview</p>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                                <div>
                                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Realised Billed</span>
                                    <strong style={{ fontSize: "16px", color: "var(--color-success)" }}>₹{stats.realizedRevenue.toLocaleString("en-IN")}</strong>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Pipeline Booking</span>
                                    <strong style={{ fontSize: "16px", color: "var(--color-brand)" }}>₹{stats.totalRevenue.toLocaleString("en-IN")}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Analytical Charts Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
                    
                    {/* Leads Growth (Line Chart) */}
                    <div className="panel-card" style={{ height: "280px", display: "flex", flexDirection: "column" }}>
                        <h3 className="panel-title" style={{ marginBottom: "16px" }}>Leads Growth Trend</h3>
                        <div style={{ flex: 1, position: "relative", minHeight: "0" }}>
                            {leadsPoints.length > 0 ? (
                                <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} viewBox="0 0 480 180" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.25" />
                                            <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0.0" />
                                        </linearGradient>
                                    </defs>
                                    
                                    {/* Grid Lines */}
                                    <line x1="40" y1="40" x2="440" y2="40" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
                                    <line x1="40" y1="100" x2="440" y2="100" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
                                    <line x1="40" y1="160" x2="440" y2="160" stroke="var(--border-color)" strokeWidth="1.5" />
                                    
                                    {/* Polyline Path */}
                                    <polyline fill="none" stroke="var(--color-brand)" strokeWidth="3" points={leadsPolyline} />
                                    
                                    {/* Filled gradient under line */}
                                    <path fill="url(#leadsGrad)" d={`M ${leadsPoints[0].x} 160 ${leadsPolyline} L ${leadsPoints[leadsPoints.length - 1].x} 160 Z`} />
                                    
                                    {/* Dot nodes & tooltips */}
                                    {leadsPoints.map((p, i) => (
                                        <g key={i}>
                                            <circle cx={p.x} cy={p.y} r="5" fill="var(--bg-secondary)" stroke="var(--color-brand)" strokeWidth="2.5" />
                                            <text x={p.x} y={p.y - 10} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="600">{p.count}</text>
                                            <text x={p.x} y="175" textAnchor="middle" fill="var(--text-secondary)" fontSize="9">{p.label.split(" ")[0]}</text>
                                        </g>
                                    ))}
                                </svg>
                            ) : (
                                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "13px" }}>No trend data available</div>
                            )}
                        </div>
                    </div>

                    {/* Monthly Revenue (Bar Chart) */}
                    <div className="panel-card" style={{ height: "280px", display: "flex", flexDirection: "column" }}>
                        <h3 className="panel-title" style={{ marginBottom: "16px" }}>Monthly Booking Revenue</h3>
                        <div style={{ flex: 1, position: "relative", minHeight: "0" }}>
                            {charts.revenueTrend.length > 0 ? (
                                <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} viewBox="0 0 480 180" preserveAspectRatio="none">
                                    <line x1="40" y1="40" x2="440" y2="40" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
                                    <line x1="40" y1="100" x2="440" y2="100" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
                                    <line x1="40" y1="160" x2="440" y2="160" stroke="var(--border-color)" strokeWidth="1.5" />

                                    {charts.revenueTrend.map((trend, i) => {
                                        const w = 32;
                                        const h = maxRev > 0 ? (trend.revenue / maxRev) * 120 : 0;
                                        const x = 50 + i * 65;
                                        const y = 160 - h;
                                        
                                        return (
                                            <g key={i}>
                                                <rect x={x} y={y} width={w} height={h} rx="4" fill="var(--color-brand)" opacity="0.85" style={{ transition: "all 0.3s ease" }}>
                                                    <title>₹{trend.revenue.toLocaleString("en-IN")}</title>
                                                </rect>
                                                <text x={x + w/2} y={y - 8} textAnchor="middle" fill="#fff" fontSize="9" fontWeight="600">
                                                    {trend.revenue > 0 ? `₹${Math.round(trend.revenue/1000)}k` : "0"}
                                                </text>
                                                <text x={x + w/2} y="175" textAnchor="middle" fill="var(--text-secondary)" fontSize="9">
                                                    {trend.label.split(" ")[0]}
                                                </text>
                                            </g>
                                        );
                                    })}
                                </svg>
                            ) : (
                                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "13px" }}>No revenue statistics available</div>
                            )}
                        </div>
                    </div>

                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
                    
                    {/* Donut Chart: Service Distribution */}
                    <div className="panel-card" style={{ height: "260px" }}>
                        <h3 className="panel-title" style={{ marginBottom: "16px" }}>Service Interest Share</h3>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "80%" }}>
                            
                            {/* Conic Donut Circle */}
                            {charts.serviceDistribution.length > 0 ? (
                                <div style={{ position: "relative", width: "130px", height: "130px" }}>
                                    <div style={{
                                        width: "100%",
                                        height: "100%",
                                        borderRadius: "50%",
                                        background: `conic-gradient(${serviceGradientSlices})`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                    }}>
                                        {/* Inner mask to build a donut */}
                                        <div style={{
                                            width: "60%",
                                            height: "60%",
                                            backgroundColor: "var(--bg-secondary)",
                                            borderRadius: "50%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "12px",
                                            fontWeight: "700"
                                        }}>
                                            {totalServiceCount} Leads
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>No requests registered</div>
                            )}

                            {/* Donut Legend */}
                            <div style={{ flex: 1, paddingLeft: "30px", display: "flex", flexDirection: "column", gap: "10px", maxHeight: "150px", overflowY: "auto" }}>
                                {charts.serviceDistribution.map((item, idx) => (
                                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px" }}>
                                        <span style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: serviceColors[idx % serviceColors.length] }}></span>
                                        <span style={{ flex: 1, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.name}>{item.name}</span>
                                        <strong style={{ color: "#fff" }}>{item.count} ({Math.round((item.count/totalServiceCount)*100)}%)</strong>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Status Distribution */}
                    <div className="panel-card" style={{ height: "260px" }}>
                        <h3 className="panel-title" style={{ marginBottom: "16px" }}>Customer Status Share</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "80%", justifyContent: "center" }}>
                            {charts.statusDistribution.length > 0 ? (
                                charts.statusDistribution.map((item, idx) => {
                                    const percent = totalStatusCount > 0 ? (item.count / totalStatusCount) * 100 : 0;
                                    const statusColors = {
                                        "New Lead": "var(--color-info)",
                                        "In Progress": "var(--color-warning)",
                                        "Talk to Executive": "#f97316",
                                        "Completed": "var(--color-success)",
                                        "Quotation Sent": "#ec4899"
                                    };
                                    const barColor = statusColors[item.name] || "#94a3b8";

                                    return (
                                        <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                                                <span style={{ fontWeight: "500", color: "var(--text-secondary)" }}>{item.name}</span>
                                                <strong style={{ color: "#fff" }}>{item.count} ({Math.round(percent)}%)</strong>
                                            </div>
                                            <div style={{ height: "8px", backgroundColor: "var(--bg-tertiary)", borderRadius: "4px", overflow: "hidden" }}>
                                                <div style={{
                                                    height: "100%",
                                                    backgroundColor: barColor,
                                                    width: `${percent}%`
                                                }}></div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={{ color: "var(--text-muted)", fontSize: "13px", textAlign: "center" }}>No customer status registered</div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Bottom Row Dashboard Grid */}
                <div className="dashboard-grid">
                    {/* Left: Recent Conversations */}
                    <div>
                        <div className="panel-card" style={{ marginBottom: 0 }}>
                            <div className="panel-header">
                                <h3 className="panel-title">Recent Conversations</h3>
                            </div>
                            <div className="table-responsive">
                                <table className="custom-table">
                                    <thead>
                                        <tr>
                                            <th>Client</th>
                                            <th>WhatsApp ID</th>
                                            <th>Service Interest</th>
                                            <th>Last Message</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentConvs.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>No recent active conversations</td>
                                            </tr>
                                        ) : (
                                            recentConvs.map(conv => (
                                                <tr key={conv._id}>
                                                    <td style={{ fontWeight: "600" }}>{conv.customer?.name || "Unnamed"}</td>
                                                    <td>{conv.customer?.phone || conv.customer?.customerId?.split("@")[0] || "N/A"}</td>
                                                    <td>
                                                        <span className="pill pill-info">{conv.customer?.service || "None"}</span>
                                                    </td>
                                                    <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-secondary)" }}>
                                                        {conv.lastMessage}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right: Recent Notifications */}
                    <div>
                        <div className="panel-card" style={{ marginBottom: 0 }}>
                            <div className="panel-header">
                                <h3 className="panel-title">System Activity Log</h3>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {recentNotifs.length === 0 ? (
                                    <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px", fontSize: "13px" }}>No activities recorded</div>
                                ) : (
                                    recentNotifs.map(notif => {
                                        const notifPills = {
                                            "NEW_LEAD": "pill-info",
                                            "EXECUTIVE_REQUESTED": "pill-warning",
                                            "QUOTATION_GENERATED": "pill-success",
                                            "PROJECT_STARTED": "pill-success",
                                            "PAYMENT_RECEIVED": "pill-success",
                                            "SYSTEM": "pill-danger"
                                        };
                                        const pillClass = notifPills[notif.type] || "pill-secondary";
                                        
                                        return (
                                            <div key={notif._id} style={{ display: "flex", flexDirection: "column", gap: "4px", paddingBottom: "10px", borderBottom: "1px solid var(--border-color)" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <span className={`pill ${pillClass}`} style={{ fontSize: "9px", padding: "2px 6px" }}>{notif.type.replace("_", " ")}</span>
                                                    <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                                                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <strong style={{ fontSize: "12px", color: "#fff" }}>{notif.title}</strong>
                                                <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{notif.message}</p>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};
