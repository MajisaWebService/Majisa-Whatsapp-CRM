import React, { useState, useEffect } from "react";
import { Header } from "../components/Header.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export const Settings = () => {
    const { token, admin, request } = useAuth();
    const [activeTab, setActiveTab] = useState("PROFILE");

    // --- Tab 1: Profile & Password Change States ---
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [pwError, setPwError] = useState("");
    const [pwSuccess, setPwSuccess] = useState("");
    const [pwLoading, setPwLoading] = useState(false);

    // --- Tab 2: Company Profile States ---
    const [companyName, setCompanyName] = useState("");
    const [companyEmail, setCompanyEmail] = useState("");
    const [companyPhone, setCompanyPhone] = useState("");
    const [companyLogo, setCompanyLogo] = useState("");
    const [gstCompanyName, setGstCompanyName] = useState("");
    const [gstNumber, setGstNumber] = useState("");
    const [gstAddress, setGstAddress] = useState("");
    const [terms, setTerms] = useState("");
    const [bankName, setBankName] = useState("");
    const [bankAccount, setBankAccount] = useState("");
    const [bankIfsc, setBankIfsc] = useState("");
    const [bankUpi, setBankUpi] = useState("");
    const [companySuccess, setCompanySuccess] = useState("");
    const [companyLoading, setCompanyLoading] = useState(false);

    // --- Tab 3: Admin Management States (Super Admin only) ---
    const [admins, setAdmins] = useState([]);
    const [loadingAdmins, setLoadingAdmins] = useState(false);
    const [newName, setNewName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPass, setNewPass] = useState("");
    const [newRole, setNewRole] = useState("ADMIN");
    const [adminError, setAdminError] = useState("");
    const [adminSuccess, setAdminSuccess] = useState("");

    // --- Tab 4: Database Maintenance States ---
    const [backupSuccess, setBackupSuccess] = useState("");
    const [backupLoading, setBackupLoading] = useState(false);

    // Fetch company settings
    const fetchCompanySettings = async () => {
        try {
            const response = await request("http://localhost:5000/api/v1/settings");
            const result = await response.json();
            if (result.success && result.data) {
                const s = result.data;
                setCompanyName(s.companyName || "");
                setCompanyEmail(s.email || "");
                setCompanyPhone(s.phone || "");
                setCompanyLogo(s.logo || "");
                setGstCompanyName(s.gstDetails?.companyName || "");
                setGstNumber(s.gstDetails?.gstNumber || "");
                setGstAddress(s.gstDetails?.address || "");
                setTerms(s.termsAndConditions || "");
                setBankName(s.paymentInfo?.bankName || "");
                setBankAccount(s.paymentInfo?.accountNumber || "");
                setBankIfsc(s.paymentInfo?.ifscCode || "");
                setBankUpi(s.paymentInfo?.upiId || "");
            }
        } catch (err) {
            console.error("Failed to load company configurations:", err);
        }
    };

    // Fetch other admins list
    const fetchAdmins = async () => {
        if (admin?.role !== "SUPER_ADMIN") return;
        setLoadingAdmins(true);
        try {
            const response = await request("http://localhost:5000/api/v1/auth/admins");
            const result = await response.json();
            if (result.success) {
                setAdmins(result.data);
            }
        } catch (err) {
            console.error("Failed to load admin lists:", err);
        } finally {
            setLoadingAdmins(false);
        }
    };

    useEffect(() => {
        fetchCompanySettings();
        fetchAdmins();
    }, [token, admin]);

    // Save Password Change
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPwError("");
        setPwSuccess("");
        setPwLoading(true);

        try {
            const response = await request("http://localhost:5000/api/v1/auth/change-password", {
                method: "PUT",
                body: JSON.stringify({ oldPassword, newPassword })
            });
            const result = await response.json();
            if (result.success) {
                setPwSuccess("Password updated successfully.");
                setOldPassword("");
                setNewPassword("");
            } else {
                setPwError(result.message || "Failed to update password.");
            }
        } catch (err) {
            setPwError("Server connection failed.");
        } finally {
            setPwLoading(false);
        }
    };

    // Save Company Profile Settings
    const handleSaveCompany = async (e) => {
        e.preventDefault();
        setCompanySuccess("");
        setCompanyLoading(true);

        try {
            const response = await request("http://localhost:5000/api/v1/settings", {
                method: "PUT",
                body: JSON.stringify({
                    companyName,
                    email: companyEmail,
                    phone: companyPhone,
                    logo: companyLogo,
                    gstDetails: {
                        companyName: gstCompanyName,
                        gstNumber,
                        address: gstAddress
                    },
                    termsAndConditions: terms,
                    paymentInfo: {
                        bankName,
                        accountNumber: bankAccount,
                        ifscCode: bankIfsc,
                        upiId: bankUpi
                    }
                })
            });
            const result = await response.json();
            if (result.success) {
                setCompanySuccess("Settings saved successfully.");
                fetchCompanySettings();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setCompanyLoading(false);
        }
    };

    // Create New Admin account
    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        setAdminError("");
        setAdminSuccess("");

        try {
            const response = await request("http://localhost:5000/api/v1/auth/register", {
                method: "POST",
                body: JSON.stringify({ name: newName, email: newEmail, password: newPass, role: newRole })
            });

            const result = await response.json();
            if (result.success) {
                setAdminSuccess(`Admin account ${newEmail} created successfully.`);
                setNewName("");
                setNewEmail("");
                setNewPass("");
                setNewRole("ADMIN");
                fetchAdmins();
            } else {
                setAdminError(result.message || "Failed to register admin.");
            }
        } catch (err) {
            setAdminError("Server connection failed.");
        }
    };

    // Toggle active status of admin
    const handleToggleAdminStatus = async (id, currentStatus) => {
        try {
            const response = await request(`http://localhost:5000/api/v1/auth/admins/${id}/status`, {
                method: "PUT",
                body: JSON.stringify({ isActive: !currentStatus })
            });
            const result = await response.json();
            if (result.success) {
                fetchAdmins();
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Change role of admin
    const handleChangeAdminRole = async (id, newRoleValue) => {
        try {
            const response = await request(`http://localhost:5000/api/v1/auth/admins/${id}/role`, {
                method: "PUT",
                body: JSON.stringify({ role: newRoleValue })
            });
            const result = await response.json();
            if (result.success) {
                fetchAdmins();
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Delete admin account
    const handleDeleteAdmin = async (id) => {
        if (!window.confirm("Are you sure you want to permanently delete this administrator account?")) return;
        try {
            const response = await request(`http://localhost:5000/api/v1/auth/admins/${id}`, {
                method: "DELETE"
            });
            const result = await response.json();
            if (result.success) {
                fetchAdmins();
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Download Database Backup JSON
    const handleTriggerBackup = async () => {
        setBackupSuccess("");
        setBackupLoading(true);
        try {
            const response = await request("http://localhost:5000/api/v1/settings/backup", {
                method: "POST"
            });
            
            if (response.status === 200) {
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = downloadUrl;
                a.download = `majisa_db_backup_${Date.now()}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setBackupSuccess("Database backup file downloaded successfully.");
            } else {
                alert("Database backup trigger failed.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setBackupLoading(false);
        }
    };

    return (
        <div className="main-content">
            <Header title="Settings Panel" />
            <div className="page-body" style={{ paddingBottom: "40px" }}>
                
                {/* Tabs selection bar */}
                <div style={{ display: "flex", gap: "10px", marginBottom: "24px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>
                    <button onClick={() => setActiveTab("PROFILE")} className={`btn ${activeTab === "PROFILE" ? "btn-primary" : "btn-secondary"}`} style={{ fontSize: "13px", padding: "8px 14px" }}>
                        👤 Profile & Security
                    </button>
                    <button onClick={() => setActiveTab("COMPANY")} className={`btn ${activeTab === "COMPANY" ? "btn-primary" : "btn-secondary"}`} style={{ fontSize: "13px", padding: "8px 14px" }}>
                        🏢 Company & Finance
                    </button>
                    {admin?.role === "SUPER_ADMIN" && (
                        <>
                            <button onClick={() => setActiveTab("USERS")} className={`btn ${activeTab === "USERS" ? "btn-primary" : "btn-secondary"}`} style={{ fontSize: "13px", padding: "8px 14px" }}>
                                👥 Admin User Manager
                            </button>
                            <button onClick={() => setActiveTab("MAINTENANCE")} className={`btn ${activeTab === "MAINTENANCE" ? "btn-primary" : "btn-secondary"}`} style={{ fontSize: "13px", padding: "8px 14px" }}>
                                ⚙️ Database Backup
                            </button>
                        </>
                    )}
                </div>

                {/* TAB 1: Profile & Security */}
                {activeTab === "PROFILE" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                        {/* Profile Info */}
                        <div className="panel-card">
                            <h3 className="panel-title" style={{ marginBottom: "20px" }}>Admin Profile</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "14px" }}>
                                <div>
                                    <span style={{ color: "var(--text-muted)", display: "block" }}>Full Name</span>
                                    <strong style={{ fontSize: "16px" }}>{admin?.name}</strong>
                                </div>
                                <div>
                                    <span style={{ color: "var(--text-muted)", display: "block" }}>Email ID</span>
                                    <span>{admin?.email}</span>
                                </div>
                                <div>
                                    <span style={{ color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Access Clearance</span>
                                    <span className="pill pill-success" style={{ textTransform: "uppercase", fontSize: "11px" }}>{admin?.role}</span>
                                </div>
                            </div>
                        </div>

                        {/* Password change form */}
                        <div className="panel-card">
                            <h3 className="panel-title" style={{ marginBottom: "20px" }}>Change Account Password</h3>
                            {pwError && <div style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "var(--color-danger)", padding: "10px", borderRadius: "4px", fontSize: "13px", marginBottom: "16px" }}>⚠️ {pwError}</div>}
                            {pwSuccess && <div style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "var(--color-success)", padding: "10px", borderRadius: "4px", fontSize: "13px", marginBottom: "16px" }}>✅ {pwSuccess}</div>}
                            
                            <form onSubmit={handlePasswordChange}>
                                <div className="form-group">
                                    <label className="form-label">Current Password</label>
                                    <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="form-control" required />
                                </div>
                                <div className="form-group" style={{ marginBottom: "20px" }}>
                                    <label className="form-label">New Password</label>
                                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="form-control" placeholder="Min 6 characters..." required />
                                </div>
                                <button type="submit" disabled={pwLoading} className="btn btn-primary" style={{ width: "100%", padding: "10px" }}>
                                    {pwLoading ? "Updating..." : "Save Password Update"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* TAB 2: Company & Billing Config */}
                {activeTab === "COMPANY" && (
                    <form onSubmit={handleSaveCompany} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
                        {/* Company Detail Forms */}
                        <div className="panel-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <h3 className="panel-title" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>Company Profile</h3>
                            
                            <div className="form-group">
                                <label className="form-label">Company Name</label>
                                <input type="text" className="form-control" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div className="form-group">
                                    <label className="form-label">Support Email</label>
                                    <input type="email" className="form-control" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Support Phone</label>
                                    <input type="text" className="form-control" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Company Logo Url / Path</label>
                                <input type="text" className="form-control" value={companyLogo} onChange={(e) => setCompanyLogo(e.target.value)} />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Default Invoice Terms & Conditions</label>
                                <textarea rows="4" className="form-control" value={terms} onChange={(e) => setTerms(e.target.value)} />
                            </div>
                        </div>

                        {/* GST & Payment configuration */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            {/* GST Profile Details */}
                            <div className="panel-card" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                <h3 className="panel-title">GST Identification</h3>
                                <div className="form-group">
                                    <label className="form-label">Registered Company Name</label>
                                    <input type="text" className="form-control" value={gstCompanyName} onChange={(e) => setGstCompanyName(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">GSTIN / Number</label>
                                    <input type="text" className="form-control" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Registered Office Address</label>
                                    <input type="text" className="form-control" value={gstAddress} onChange={(e) => setGstAddress(e.target.value)} />
                                </div>
                            </div>

                            {/* Payment Accounts Profile */}
                            <div className="panel-card" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                <h3 className="panel-title">Settlement bank accounts</h3>
                                <div className="form-group">
                                    <label className="form-label">Beneficiary Bank Name</label>
                                    <input type="text" className="form-control" value={bankName} onChange={(e) => setBankName(e.target.value)} />
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "16px" }}>
                                    <div className="form-group">
                                        <label className="form-label">Account number</label>
                                        <input type="text" className="form-control" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">IFSC Code</label>
                                        <input type="text" className="form-control" value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value)} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">UPI ID (VPA)</label>
                                    <input type="text" className="form-control" value={bankUpi} onChange={(e) => setBankUpi(e.target.value)} />
                                </div>
                            </div>

                            {companySuccess && <div style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "var(--color-success)", padding: "10px", borderRadius: "4px", fontSize: "13px" }}>✅ {companySuccess}</div>}

                            <button type="submit" disabled={companyLoading} className="btn btn-primary" style={{ width: "100%", padding: "12px" }}>
                                {companyLoading ? "Saving Configurations..." : "Save Business Configurations"}
                            </button>
                        </div>
                    </form>
                )}

                {/* TAB 3: Admin Users Manager CRUD */}
                {activeTab === "USERS" && admin?.role === "SUPER_ADMIN" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
                        {/* Users Directory Table */}
                        <div className="panel-card">
                            <h3 className="panel-title" style={{ marginBottom: "20px" }}>Operational Staff</h3>
                            {loadingAdmins ? (
                                <div style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Loading staff profiles...</div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="custom-table" style={{ fontSize: "13px" }}>
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Role</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {admins.map(adm => (
                                                <tr key={adm._id}>
                                                    <td style={{ fontWeight: "600" }}>{adm.name}</td>
                                                    <td>{adm.email}</td>
                                                    <td>
                                                        <select
                                                            value={adm.role}
                                                            onChange={(e) => handleChangeAdminRole(adm._id, e.target.value)}
                                                            disabled={admin._id === adm._id}
                                                            style={{ padding: "4px", fontSize: "11px", backgroundColor: "var(--bg-tertiary)", color: "#fff", border: "1px solid var(--border-color)", borderRadius: "4px" }}
                                                        >
                                                            <option value="ADMIN">ADMIN</option>
                                                            <option value="SUPER_ADMIN">SUPER ADMIN</option>
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <span
                                                            onClick={() => admin._id !== adm._id && handleToggleAdminStatus(adm._id, adm.isActive)}
                                                            className={`pill ${adm.isActive ? "pill-success" : "pill-danger"}`}
                                                            style={{ cursor: admin._id !== adm._id ? "pointer" : "default", fontSize: "10px" }}
                                                        >
                                                            {adm.isActive ? "Active" : "Suspended"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button
                                                            onClick={() => handleDeleteAdmin(adm._id)}
                                                            disabled={admin._id === adm._id}
                                                            className="btn btn-danger"
                                                            style={{ padding: "4px 8px", fontSize: "10px", backgroundColor: admin._id === adm._id ? "rgba(255,255,255,0.05)" : "rgba(239, 68, 68, 0.15)", color: admin._id === adm._id ? "var(--text-muted)" : "var(--color-danger)" }}
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Add Admin Form */}
                        <div className="panel-card">
                            <h3 className="panel-title" style={{ marginBottom: "20px" }}>Add New Administrator</h3>
                            {adminError && <div style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "var(--color-danger)", padding: "10px", borderRadius: "4px", fontSize: "13px", marginBottom: "16px" }}>⚠️ {adminError}</div>}
                            {adminSuccess && <div style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "var(--color-success)", padding: "10px", borderRadius: "4px", fontSize: "13px", marginBottom: "16px" }}>✅ {adminSuccess}</div>}
                            
                            <form onSubmit={handleCreateAdmin}>
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="form-control" placeholder="e.g. John Doe" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email ID</label>
                                    <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="form-control" placeholder="staff@majisa.com" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Security Role</label>
                                    <select className="form-control" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                                        <option value="ADMIN">ADMIN</option>
                                        <option value="SUPER_ADMIN">SUPER ADMIN</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ marginBottom: "20px" }}>
                                    <label className="form-label">Temporary Password</label>
                                    <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="form-control" placeholder="Min 6 characters..." required />
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "10px" }}>
                                    Register Admin Account
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* TAB 4: Database Maintenance */}
                {activeTab === "MAINTENANCE" && admin?.role === "SUPER_ADMIN" && (
                    <div className="panel-card" style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center", padding: "40px" }}>
                        <span style={{ fontSize: "48px", display: "block", marginBottom: "16px" }}>📦</span>
                        <h3 className="panel-title" style={{ fontSize: "18px", marginBottom: "10px" }}>Backup System Database</h3>
                        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "30px", lineHeight: "1.5" }}>
                            Download a full cryptographic snapshot dump of all CRM collections (Admins, Customers, Pricing Rules, Projects, Sockets State, and Conversation Logs) as a single portable JSON file.
                        </p>

                        {backupSuccess && (
                            <div style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "var(--color-success)", padding: "12px", borderRadius: "6px", fontSize: "13px", marginBottom: "20px", display: "inline-block" }}>
                                ✅ {backupSuccess}
                            </div>
                        )}

                        <div>
                            <button
                                onClick={handleTriggerBackup}
                                disabled={backupLoading}
                                className="btn btn-primary"
                                style={{ padding: "12px 30px", fontSize: "14px" }}
                            >
                                {backupLoading ? "Compiling Database..." : "💾 Download Backup File"}
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
