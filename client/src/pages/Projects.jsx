import React, { useState, useEffect } from "react";
import { Header } from "../components/Header.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export const Projects = () => {
    const { token } = useAuth();
    const [projects, setProjects] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);

    // Create form states
    const [customerId, setCustomerId] = useState("");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [totalAmount, setTotalAmount] = useState("");
    const [status, setStatus] = useState("IN_PROGRESS");
    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState("");

    // Edit states
    const [editingProject, setEditingProject] = useState(null);
    const [editStatus, setEditStatus] = useState("");

    const fetchProjects = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/v1/projects", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setProjects(result.data);
            }
        } catch (err) {
            console.error("Failed to load projects:", err);
        }
    };

    const fetchCustomers = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/v1/customers?limit=100", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setCustomers(result.data);
            }
        } catch (err) {
            console.error("Failed to load customers list:", err);
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            await Promise.all([fetchProjects(), fetchCustomers()]);
            setLoading(false);
        };
        loadInitialData();
    }, [token]);

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:5000/api/v1/projects", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    customer: customerId,
                    name,
                    description,
                    totalAmount: parseFloat(totalAmount),
                    status,
                    startDate: new Date(startDate),
                    endDate: endDate ? new Date(endDate) : undefined
                })
            });
            const result = await response.json();
            if (result.success) {
                fetchProjects();
                setShowCreateForm(false);
                setCustomerId("");
                setName("");
                setDescription("");
                setTotalAmount("");
                setStatus("IN_PROGRESS");
            }
        } catch (err) {
            console.error("Project creation failed:", err);
        }
    };

    const handleUpdateStatus = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/v1/projects/${editingProject._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status: editStatus })
            });
            const result = await response.json();
            if (result.success) {
                fetchProjects();
                setEditingProject(null);
            }
        } catch (err) {
            console.error("Failed to update project status:", err);
        }
    };

    return (
        <div className="main-content">
            <Header title="Projects Management" />
            <div className="page-body">

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "600" }}>Workspace Project Cards</h3>
                    <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn btn-primary">
                        {showCreateForm ? "View Projects" : "🆕 New Project"}
                    </button>
                </div>

                {showCreateForm ? (
                    <div className="panel-card" style={{ maxWidth: "600px", margin: "0 auto" }}>
                        <h3 className="panel-title" style={{ marginBottom: "20px" }}>Create Project Card</h3>
                        <form onSubmit={handleCreateProject}>
                            <div className="form-group">
                                <label className="form-label">Client / Customer</label>
                                <select
                                    className="form-control"
                                    value={customerId}
                                    onChange={(e) => setCustomerId(e.target.value)}
                                    required
                                >
                                    <option value="">Select Customer...</option>
                                    {customers.map(c => (
                                        <option key={c._id} value={c._id}>{c.name || "Unnamed"} ({c.company || "No Company"})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Project Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Majisa Website Redesign"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Project Description</label>
                                <textarea
                                    className="form-control"
                                    rows="2"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Enter project milestones or brief..."
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Project Budget (₹)</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={totalAmount}
                                    onChange={(e) => setTotalAmount(e.target.value)}
                                    placeholder="e.g. 45000"
                                    required
                                />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div className="form-group">
                                    <label className="form-label">Start Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Estimated End Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "16px", padding: "12px" }}>
                                Start Project
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="panel-card">
                        {loading ? (
                            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>Loading projects data...</div>
                        ) : projects.length === 0 ? (
                            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>No client projects found.</div>
                        ) : (
                            <div className="table-responsive">
                                <table className="custom-table">
                                    <thead>
                                        <tr>
                                            <th>Project Title</th>
                                            <th>Client Name</th>
                                            <th>Budget (₹)</th>
                                            <th>Timeline Start</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {projects.map((proj) => (
                                            <tr key={proj._id}>
                                                <td style={{ fontWeight: "600" }}>{proj.name}</td>
                                                <td>{proj.customer?.name || "N/A"}</td>
                                                <td style={{ fontWeight: "700" }}>₹{proj.totalAmount.toLocaleString("en-IN")}</td>
                                                <td>{new Date(proj.startDate).toLocaleDateString()}</td>
                                                <td>
                                                    <span className={`pill ${
                                                        proj.status === "COMPLETED" ? "pill-success" :
                                                        proj.status === "ON_HOLD" ? "pill-danger" :
                                                        proj.status === "IN_PROGRESS" ? "pill-warning" :
                                                        "pill-info"
                                                    }`}>
                                                        {proj.status.replace("_", " ")}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() => {
                                                            setEditingProject(proj);
                                                            setEditStatus(proj.status);
                                                        }}
                                                        className="btn btn-secondary"
                                                        style={{ padding: "6px 12px", fontSize: "11px" }}
                                                    >
                                                        Change Status
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Edit status modal */}
                {editingProject && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: "600" }}>Update Project Status</h3>
                                <button onClick={() => setEditingProject(null)} style={{ border: "none", background: "none", fontSize: "20px", color: "var(--text-secondary)", cursor: "pointer" }}>×</button>
                            </div>

                            <div className="form-group" style={{ marginBottom: "24px" }}>
                                <label className="form-label">Project Status</label>
                                <select
                                    className="form-control"
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value)}
                                >
                                    <option value="NOT_STARTED">Not Started</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="ON_HOLD">On Hold</option>
                                    <option value="COMPLETED">Completed</option>
                                </select>
                            </div>

                            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                                <button onClick={() => setEditingProject(null)} className="btn btn-secondary">Cancel</button>
                                <button onClick={handleUpdateStatus} className="btn btn-primary">Save Status</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
