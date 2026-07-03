import React, { useState, useEffect } from "react";
import { Header } from "../components/Header.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export const Customers = () => {
    const { request } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    
    // Edit Form States
    const [notesText, setNotesText] = useState("");
    const [statusText, setStatusText] = useState("");
    const [assignedToText, setAssignedToText] = useState("");
    const [isBotPaused, setIsBotPaused] = useState(false);
    
    // Conversation History State
    const [chatHistory, setChatHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    
    const [loading, setLoading] = useState(true);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page,
                limit: 10,
                search,
                status: statusFilter
            });
            const response = await request(`http://localhost:5000/api/v1/customers?${queryParams}`);
            const result = await response.json();
            if (result.success) {
                setCustomers(result.data);
                setTotalPages(result.pagination.pages);
            }
        } catch (err) {
            console.error("Failed to load customer leads:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, [page, statusFilter]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        fetchCustomers();
    };

    const fetchChatHistory = async (customer) => {
        setLoadingHistory(true);
        setChatHistory([]);
        try {
            const response = await request(`http://localhost:5000/api/v1/chats/${customer._id}/messages`);
            const result = await response.json();
            if (result.success) {
                setChatHistory(result.data);
            }
        } catch (err) {
            console.error("Failed to load conversation history:", err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const openCustomerDetails = (cust) => {
        setSelectedCustomer(cust);
        setNotesText(cust.notes || "");
        setStatusText(cust.status || "New Lead");
        setAssignedToText(cust.assignedTo || "");
        setIsBotPaused(cust.isBotPaused || false);
        fetchChatHistory(cust);
    };

    const handleSaveChanges = async () => {
        try {
            const response = await request(`http://localhost:5000/api/v1/customers/${selectedCustomer._id}`, {
                method: "PUT",
                body: JSON.stringify({
                    notes: notesText,
                    status: statusText,
                    assignedTo: assignedToText,
                    isBotPaused: isBotPaused
                })
            });
            const result = await response.json();
            if (result.success) {
                fetchCustomers();
                setSelectedCustomer(null);
            }
        } catch (err) {
            console.error("Failed to update customer:", err);
        }
    };

    const handleSoftDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this customer lead?")) return;

        try {
            const response = await request(`http://localhost:5000/api/v1/customers/${id}`, {
                method: "DELETE"
            });
            const result = await response.json();
            if (result.success) {
                fetchCustomers();
                if (selectedCustomer && selectedCustomer._id === id) {
                    setSelectedCustomer(null);
                }
            }
        } catch (err) {
            console.error("Failed to delete customer:", err);
        }
    };

    // Client-side CSV/Excel export helper
    const handleExportCSV = () => {
        if (customers.length === 0) {
            alert("No customer data available to export.");
            return;
        }

        const headers = ["Name", "Company", "WhatsApp Number", "Email", "City", "Service Interested", "Status", "Executive Assigned", "Bot Paused", "Date Created"];
        const rows = customers.map(c => [
            c.name || "Unnamed",
            c.company || "N/A",
            c.phone || c.customerId?.split("@")[0] || "",
            c.email || "N/A",
            c.city || "N/A",
            c.service || "N/A",
            c.status || "New Lead",
            c.assignedTo || "Unassigned",
            c.isBotPaused ? "Yes" : "No",
            new Date(c.createdAt).toLocaleDateString()
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `majisa_crm_customers_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="main-content">
            <Header title="Leads Directory" />
            <div className="page-body" style={{ paddingBottom: "40px" }}>
                
                {/* Search & Actions Bar */}
                <div className="panel-card" style={{ padding: "16px 24px", marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "16px", alignItems: "center", flex: 1, flexWrap: "wrap" }}>
                            <div style={{ flex: 1, minWidth: "240px" }}>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search by name, company, email, phone..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ width: "100%" }}
                                />
                            </div>
                            <div style={{ width: "180px" }}>
                                <select
                                    className="form-control"
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setPage(1);
                                    }}
                                    style={{ width: "100%" }}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="New Lead">New Lead</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Quotation Sent">Quotation Sent</option>
                                    <option value="Talk to Executive">Talk to Executive</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary">Search</button>
                        </form>
                        
                        {/* Export Buttons */}
                        <div style={{ display: "flex", gap: "10px" }}>
                            <button onClick={handleExportCSV} className="btn btn-secondary" style={{ fontSize: "13px" }}>
                                📥 Export CSV
                            </button>
                            <button onClick={handleExportCSV} className="btn btn-secondary" style={{ fontSize: "13px" }}>
                                📊 Export Excel
                            </button>
                        </div>
                    </div>
                </div>

                {/* Customers Table */}
                <div className="panel-card">
                    {loading ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>Loading leads directory...</div>
                    ) : (
                        <div className="table-responsive">
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Company</th>
                                        <th>Phone</th>
                                        <th>Email</th>
                                        <th>Executive</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>No customer leads found</td>
                                        </tr>
                                    ) : (
                                        customers.map(cust => (
                                            <tr key={cust._id}>
                                                <td style={{ fontWeight: "600" }}>{cust.name || "Unnamed"}</td>
                                                <td>{cust.company || "N/A"}</td>
                                                <td>{cust.phone || cust.customerId.split("@")[0]}</td>
                                                <td>{cust.email || "N/A"}</td>
                                                <td>{cust.assignedTo || "Unassigned"}</td>
                                                <td>
                                                    <span className={`pill ${
                                                        cust.status === "New Lead" ? "pill-info" :
                                                        cust.status === "Quotation Sent" ? "pill-success" :
                                                        cust.status === "Talk to Executive" ? "pill-warning" :
                                                        cust.status === "In Progress" ? "pill-warning" :
                                                        "pill-success"
                                                    }`}>
                                                        {cust.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", gap: "8px" }}>
                                                        <button onClick={() => openCustomerDetails(cust)} className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "12px" }}>
                                                            View Card
                                                        </button>
                                                        <button onClick={() => handleSoftDelete(cust._id)} className="btn btn-danger" style={{ padding: "6px 12px", fontSize: "12px", backgroundColor: "rgba(239, 68, 68, 0.15)", color: "var(--color-danger)" }}>
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "20px" }}>
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="btn btn-secondary"
                                style={{ padding: "6px 12px" }}
                            >
                                Previous
                            </button>
                            <span style={{ display: "flex", alignItems: "center", fontSize: "13px", color: "var(--text-secondary)" }}>Page {page} of {totalPages}</span>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                className="btn btn-secondary"
                                style={{ padding: "6px 12px" }}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>

                {/* Details & Conversation History modal */}
                {selectedCustomer && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: "800px", width: "90%", display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "24px" }}>
                            
                            {/* Left: Lead Profile Card */}
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                                    <h3 style={{ fontSize: "17px", fontWeight: "700" }}>Lead Information</h3>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "13px", marginBottom: "20px" }}>
                                    <div>
                                        <span style={{ color: "var(--text-muted)", display: "block" }}>Full Name</span>
                                        <strong style={{ fontSize: "14px", color: "#fff" }}>{selectedCustomer.name || "Unnamed"}</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: "var(--text-muted)", display: "block" }}>Company Name</span>
                                        <span>{selectedCustomer.company || "N/A"}</span>
                                    </div>
                                    <div>
                                        <span style={{ color: "var(--text-muted)", display: "block" }}>Email Address</span>
                                        <span>{selectedCustomer.email || "N/A"}</span>
                                    </div>
                                    <div>
                                        <span style={{ color: "var(--text-muted)", display: "block" }}>WhatsApp Number</span>
                                        <span>{selectedCustomer.phone || selectedCustomer.customerId.split("@")[0]}</span>
                                    </div>
                                    <div>
                                        <span style={{ color: "var(--text-muted)", display: "block" }}>City</span>
                                        <span>{selectedCustomer.city || "N/A"}</span>
                                    </div>
                                    <div>
                                        <span style={{ color: "var(--text-muted)", display: "block" }}>Service Interested</span>
                                        <span className="pill pill-info" style={{ marginTop: "4px" }}>{selectedCustomer.service || "N/A"}</span>
                                    </div>
                                    <div>
                                        <span style={{ color: "var(--text-muted)", display: "block" }}>Lead Source</span>
                                        <span>{selectedCustomer.source || "WhatsApp"}</span>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Assign Executive</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={assignedToText}
                                        onChange={(e) => setAssignedToText(e.target.value)}
                                        placeholder="Executive Name..."
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Lead Status</label>
                                    <select
                                        className="form-control"
                                        value={statusText}
                                        onChange={(e) => setStatusText(e.target.value)}
                                    >
                                        <option value="New Lead">New Lead</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Quotation Sent">Quotation Sent</option>
                                        <option value="Talk to Executive">Talk to Executive</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: "var(--text-secondary)", marginTop: "10px" }}>
                                        <input
                                            type="checkbox"
                                            checked={isBotPaused}
                                            onChange={(e) => setIsBotPaused(e.target.checked)}
                                            style={{ accentColor: "var(--color-brand)" }}
                                        />
                                        Pause Automated Chatbot
                                    </label>
                                </div>

                                <div className="form-group" style={{ marginBottom: "20px" }}>
                                    <label className="form-label">Internal notes</label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        value={notesText}
                                        onChange={(e) => setNotesText(e.target.value)}
                                        placeholder="Log call updates, requirements background here..."
                                        style={{ resize: "vertical" }}
                                    />
                                </div>

                                <div style={{ display: "flex", gap: "10px" }}>
                                    <button onClick={() => setSelectedCustomer(null)} className="btn btn-secondary" style={{ flex: 1 }}>Close</button>
                                    <button onClick={handleSaveChanges} className="btn btn-primary" style={{ flex: 1.5 }}>Save changes</button>
                                </div>
                            </div>

                            {/* Right: Embedded Conversation History timeline */}
                            <div style={{ display: "flex", flexDirection: "column", borderLeft: "1px solid var(--border-color)", paddingLeft: "24px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                    <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Inquiry History</h3>
                                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Read-only log</span>
                                </div>

                                <div style={{
                                    flex: 1,
                                    maxHeight: "440px",
                                    overflowY: "auto",
                                    padding: "16px",
                                    backgroundColor: "var(--bg-primary)",
                                    borderRadius: "8px",
                                    border: "1px solid var(--border-color)",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "12px"
                                }}>
                                    {loadingHistory ? (
                                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                                            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Loading messages...</span>
                                        </div>
                                    ) : chatHistory.length === 0 ? (
                                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-muted)", fontSize: "13px" }}>
                                            No messages logged yet
                                        </div>
                                    ) : (
                                        chatHistory.map((msg) => {
                                            const isClient = msg.sender === "CUSTOMER";
                                            const isBot = msg.sender === "BOT";
                                            
                                            // Handle media render
                                            const renderMessageContent = () => {
                                                if (msg.type === "IMAGE") {
                                                    return <img src={`http://localhost:5000${msg.message}`} alt="attachment" style={{ maxWidth: "100%", borderRadius: "6px", display: "block" }} />;
                                                }
                                                if (msg.type === "PDF") {
                                                    return <a href={`http://localhost:5000${msg.message}`} target="_blank" rel="noreferrer" style={{ color: "#fff", textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: "6px" }}>📄 Download PDF</a>;
                                                }
                                                if (msg.type === "AUDIO") {
                                                    return <audio src={`http://localhost:5000${msg.message}`} controls style={{ maxWidth: "100%" }} />;
                                                }
                                                return <div>{msg.message}</div>;
                                            };

                                            return (
                                                <div
                                                    key={msg._id}
                                                    style={{
                                                        alignSelf: isClient ? "flex-start" : "flex-end",
                                                        maxWidth: "85%",
                                                        backgroundColor: isClient ? "var(--bg-secondary)" : isBot ? "var(--bg-tertiary)" : "var(--color-brand)",
                                                        color: isClient || isBot ? "var(--text-primary)" : "#fff",
                                                        padding: "8px 12px",
                                                        borderRadius: "8px",
                                                        border: isClient ? "1px solid var(--border-color)" : "none",
                                                        fontSize: "12px",
                                                        lineHeight: "1.4"
                                                    }}
                                                >
                                                    {renderMessageContent()}
                                                    <div style={{ display: "flex", justifyContent: "flex-end", fontSize: "9px", opacity: 0.7, marginTop: "4px" }}>
                                                        {isBot ? "🤖 " : !isClient ? "👨‍💼 " : ""}
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
