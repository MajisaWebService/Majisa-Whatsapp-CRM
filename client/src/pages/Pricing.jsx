import React, { useState, useEffect } from "react";
import { Header } from "../components/Header.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export const Pricing = () => {
    const { token, admin, request } = useAuth();
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("SERVICE");
    
    // Modal & CRUD States
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [selectedViewModelService, setSelectedViewModelService] = useState(null);

    // Form inputs (reusable for Add and Edit)
    const [category, setCategory] = useState("SERVICE");
    const [key, setKey] = useState("");
    const [name, setName] = useState("");
    const [price, setPrice] = useState(0);
    const [serviceKey, setServiceKey] = useState("");
    const [emoji, setEmoji] = useState("");
    const [hasSubTypes, setHasSubTypes] = useState(false);
    const [hasPages, setHasPages] = useState(false);
    const [hasFeatures, setHasFeatures] = useState(false);
    const [extraPages, setExtraPages] = useState(0);
    const [pricePerPage, setPricePerPage] = useState(0);
    const [sortOrder, setSortOrder] = useState(0);

    const fetchPricingRules = async () => {
        setLoading(true);
        try {
            const response = await request(window.API_BASE_URL + "/api/v1/pricing");
            const result = await response.json();
            if (result.success) {
                setRules(result.data);
            }
        } catch (err) {
            console.error("Failed to load pricing rules:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPricingRules();
    }, [token]);

    const handleToggleActive = async (id, e) => {
        if (e) e.stopPropagation();
        try {
            const response = await request(`${window.API_BASE_URL}/api/v1/pricing/${id}/toggle`, {
                method: "PATCH"
            });
            const result = await response.json();
            if (result.success) {
                setRules((prev) =>
                    prev.map((r) => (r._id === id ? { ...r, isActive: result.data.isActive } : r))
                );
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateRule = async (e) => {
        e.preventDefault();
        try {
            const response = await request(window.API_BASE_URL + "/api/v1/pricing", {
                method: "POST",
                body: JSON.stringify({
                    category,
                    key,
                    name,
                    price: Number(price),
                    serviceKey,
                    emoji,
                    hasSubTypes: category === "SERVICE" ? hasSubTypes : undefined,
                    hasPages: category === "SERVICE" ? hasPages : undefined,
                    hasFeatures: category === "SERVICE" ? hasFeatures : undefined,
                    extraPages: category === "PAGE_RANGE" ? Number(extraPages) : undefined,
                    pricePerPage: category === "PAGE_RANGE" ? Number(pricePerPage) : undefined,
                    sortOrder: Number(sortOrder)
                })
            });
            const result = await response.json();
            if (result.success) {
                fetchPricingRules();
                setShowAddModal(false);
                resetForm();
            } else {
                alert(result.message || "Failed to create pricing rule.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleStartEdit = (rule, e) => {
        if (e) e.stopPropagation();
        setEditingRule(rule);
        setCategory(rule.category);
        setKey(rule.key);
        setName(rule.name);
        setPrice(rule.price);
        setServiceKey(rule.serviceKey || "");
        setEmoji(rule.emoji || "");
        setHasSubTypes(rule.hasSubTypes || false);
        setHasPages(rule.hasPages || false);
        setHasFeatures(rule.hasFeatures || false);
        setExtraPages(rule.extraPages || 0);
        setPricePerPage(rule.pricePerPage || 0);
        setSortOrder(rule.sortOrder || 0);
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        try {
            const response = await request(`${window.API_BASE_URL}/api/v1/pricing/${editingRule._id}`, {
                method: "PUT",
                body: JSON.stringify({
                    name,
                    price: Number(price),
                    serviceKey,
                    emoji,
                    hasSubTypes: category === "SERVICE" ? hasSubTypes : undefined,
                    hasPages: category === "SERVICE" ? hasPages : undefined,
                    hasFeatures: category === "SERVICE" ? hasFeatures : undefined,
                    extraPages: category === "PAGE_RANGE" ? Number(extraPages) : undefined,
                    pricePerPage: category === "PAGE_RANGE" ? Number(pricePerPage) : undefined,
                    sortOrder: Number(sortOrder)
                })
            });
            const result = await response.json();
            if (result.success) {
                fetchPricingRules();
                setEditingRule(null);
                resetForm();
            } else {
                alert(result.message || "Failed to update rule.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteRule = async (id, e) => {
        if (e) e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this pricing rule?")) return;

        try {
            const response = await request(`${window.API_BASE_URL}/api/v1/pricing/${id}`, {
                method: "DELETE"
            });
            const result = await response.json();
            if (result.success) {
                setRules((prev) => prev.filter((r) => r._id !== id));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleOpenViewModel = (service) => {
        setSelectedViewModelService(service);
    };

    const resetForm = () => {
        setCategory("SERVICE");
        setKey("");
        setName("");
        setPrice(0);
        setServiceKey("");
        setEmoji("");
        setHasSubTypes(false);
        setHasPages(false);
        setHasFeatures(false);
        setExtraPages(0);
        setPricePerPage(0);
        setSortOrder(0);
    };

    const servicesList = rules.filter(r => r.category === "SERVICE");
    const tabRules = rules.filter((r) => r.category === activeTab);

    // Filter packages and features for the comparative preview modal
    const modelPackages = selectedViewModelService
        ? rules.filter(r => r.category === "PACKAGE" && r.serviceKey === selectedViewModelService.key && r.isActive)
        : [];
    const modelFeatures = selectedViewModelService
        ? rules.filter(r => r.category === "FEATURE" && r.serviceKey === selectedViewModelService.key && r.isActive)
        : [];
    const modelPages = selectedViewModelService
        ? rules.filter(r => r.category === "PAGE_RANGE" && r.key === selectedViewModelService.key && r.isActive)
        : [];

    return (
        <div className="main-content">
            <Header title="Pricing Database Configuration" />
            <div className="page-body" style={{ paddingBottom: "40px" }}>
                
                {/* Header Actions */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    {/* Tabs */}
                    <div style={{ display: "flex", gap: "8px" }}>
                        {["SERVICE", "PACKAGE", "FEATURE", "PAGE_RANGE"].map((tab) => (
                            <button
                                key={tab}
                                className={`btn ${activeTab === tab ? "btn-primary" : "btn-secondary"}`}
                                onClick={() => setActiveTab(tab)}
                                style={{ padding: "8px 14px", fontSize: "13px" }}
                            >
                                {tab === "SERVICE" ? "🌐 Services" :
                                 tab === "PACKAGE" ? "📦 Packages" :
                                 tab === "FEATURE" ? "✨ Features" :
                                 "📄 Page Ranges"}
                            </button>
                        ))}
                    </div>
                    
                    {/* Add Button */}
                    {(admin?.role === "SUPER_ADMIN" || admin?.role === "ADMIN") && (
                        <button onClick={() => { resetForm(); setCategory(activeTab); setShowAddModal(true); }} className="btn btn-primary" style={{ padding: "8px 16px", fontSize: "13px" }}>
                            ➕ Add Pricing Rule
                        </button>
                    )}
                </div>

                {/* Rules Table */}
                <div className="panel-card">
                    {loading ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>Loading pricing configurations...</div>
                    ) : (
                        <div className="table-responsive">
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Key</th>
                                        {activeTab !== "SERVICE" && <th>Base Rate (₹)</th>}
                                        {activeTab === "SERVICE" && <th>Flow Config</th>}
                                        {activeTab === "PACKAGE" && <th>Service ID</th>}
                                        {activeTab === "PAGE_RANGE" && <th>Page Multiplier</th>}
                                        <th>Sort</th>
                                        <th>Status</th>
                                        {(admin?.role === "SUPER_ADMIN" || admin?.role === "ADMIN") && <th>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {tabRules.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>No pricing configurations found for this category</td>
                                        </tr>
                                    ) : (
                                        tabRules.map((rule) => (
                                            <tr 
                                                key={rule._id} 
                                                style={{ cursor: activeTab === "SERVICE" ? "pointer" : "default" }}
                                                onClick={() => activeTab === "SERVICE" && handleOpenViewModel(rule)}
                                                className={activeTab === "SERVICE" ? "hover-row-pricing" : ""}
                                            >
                                                <td style={{ fontWeight: "600" }}>
                                                    {rule.emoji ? `${rule.emoji} ` : ""}{rule.name}
                                                    {activeTab === "SERVICE" && (
                                                        <span style={{ fontSize: "10px", color: "var(--text-muted)", marginLeft: "8px", fontWeight: "normal" }}>(Click to view model)</span>
                                                    )}
                                                </td>
                                                <td><code>{rule.key}</code></td>
                                                
                                                {activeTab !== "SERVICE" && (
                                                    <td>
                                                        {activeTab === "PAGE_RANGE" ? `Included: ${rule.extraPages} pages` : `₹{rule.price.toLocaleString("en-IN")}`}
                                                    </td>
                                                )}
                                                
                                                {activeTab === "SERVICE" && (
                                                    <td style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                                                        {rule.hasSubTypes ? "• SubTypes " : ""}
                                                        {rule.hasPages ? "• Pages " : ""}
                                                        {rule.hasFeatures ? "• Features " : ""}
                                                    </td>
                                                )}

                                                {activeTab === "PACKAGE" && <td><code>{rule.serviceKey}</code></td>}
                                                {activeTab === "PAGE_RANGE" && <td>₹{rule.pricePerPage} / extra page</td>}
                                                <td><code>{rule.sortOrder}</code></td>
                                                <td>
                                                    <span
                                                        onClick={(e) => (admin?.role === "SUPER_ADMIN" || admin?.role === "ADMIN") && handleToggleActive(rule._id, e)}
                                                        className={`pill ${rule.isActive ? "pill-success" : "pill-danger"}`}
                                                        style={{ cursor: (admin?.role === "SUPER_ADMIN" || admin?.role === "ADMIN") ? "pointer" : "default" }}
                                                    >
                                                        {rule.isActive ? "Active" : "Disabled"}
                                                    </span>
                                                </td>
                                                {(admin?.role === "SUPER_ADMIN" || admin?.role === "ADMIN") && (
                                                    <td>
                                                        <div style={{ display: "flex", gap: "8px" }}>
                                                            <button onClick={(e) => handleStartEdit(rule, e)} className="btn btn-secondary" style={{ padding: "5px 10px", fontSize: "11px" }}>
                                                                Edit
                                                            </button>
                                                            <button onClick={(e) => handleDeleteRule(rule._id, e)} className="btn btn-danger" style={{ padding: "5px 10px", fontSize: "11px", backgroundColor: "rgba(239, 68, 68, 0.15)", color: "var(--color-danger)" }}>
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Comparative Service Pricing Model Modal */}
                {selectedViewModelService && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: "900px", width: "95%" }}>
                            
                            {/* Modal Header */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                                <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
                                    {selectedViewModelService.emoji} {selectedViewModelService.name} - Packages & Features
                                </h2>
                                <button onClick={() => setSelectedViewModelService(null)} style={{ border: "none", background: "none", fontSize: "24px", color: "var(--text-secondary)", cursor: "pointer" }}>×</button>
                            </div>

                            {/* Packages Grid */}
                            <div style={{ marginBottom: "24px" }}>
                                <h3 style={{ fontSize: "14px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>Available Packages</h3>
                                {modelPackages.length === 0 ? (
                                    <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px", border: "1px dashed var(--border-color)", borderRadius: "8px" }}>
                                        No packages configured for this service yet. Add packages under the "Packages" tab using service ID: <code>{selectedViewModelService.key}</code>.
                                    </div>
                                ) : (
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
                                        {modelPackages.sort((a,b) => a.sortOrder - b.sortOrder).map((pkg) => (
                                            <div key={pkg._id} className="panel-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px", alignItems: "center", border: "1px solid var(--border-color)", margin: 0, textAlign: "center" }}>
                                                <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--color-brand)", textTransform: "uppercase" }}>{pkg.name}</span>
                                                <h3 style={{ fontSize: "22px", fontWeight: "800", color: "#fff", margin: "6px 0" }}>₹{pkg.price.toLocaleString("en-IN")}</h3>
                                                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>ID: {pkg.key}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
                                {/* Features (Add-ons) */}
                                <div>
                                    <h3 style={{ fontSize: "14px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>Included Features / Add-ons</h3>
                                    {modelFeatures.length === 0 ? (
                                        <div style={{ padding: "16px", color: "var(--text-muted)", fontSize: "12px", border: "1px dashed var(--border-color)", borderRadius: "8px" }}>
                                            No additional add-on features mapped to this service. Add features under the "Features" tab using service ID: <code>{selectedViewModelService.key}</code>.
                                        </div>
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                            {modelFeatures.sort((a,b) => a.sortOrder - b.sortOrder).map((f) => (
                                                <div key={f._id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", backgroundColor: "var(--bg-tertiary)", borderRadius: "6px", fontSize: "13px" }}>
                                                    <span style={{ color: "var(--text-primary)" }}>✨ {f.name}</span>
                                                    <strong style={{ color: "var(--color-success)" }}>₹{f.price.toLocaleString("en-IN")}</strong>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Page Multipliers / Rules */}
                                <div>
                                    <h3 style={{ fontSize: "14px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>Page range limits</h3>
                                    {modelPages.length === 0 ? (
                                        <div style={{ padding: "16px", color: "var(--text-muted)", fontSize: "12px", border: "1px dashed var(--border-color)", borderRadius: "8px" }}>
                                            No custom page range rules configured for this service.
                                        </div>
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                            {modelPages.map((pr) => (
                                                <div key={pr._id} className="panel-card" style={{ padding: "14px", margin: 0, border: "1px solid var(--border-color)" }}>
                                                    <strong style={{ fontSize: "13px", display: "block" }}>{pr.name}</strong>
                                                    <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginTop: "4px" }}>
                                                        Base pages included: <strong>{pr.extraPages}</strong>
                                                    </span>
                                                    <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginTop: "2px" }}>
                                                        Extra page surcharge: <strong>₹{pr.pricePerPage}</strong> / page
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px", borderTop: "1px solid var(--border-color)", paddingTop: "14px" }}>
                                <button onClick={() => setSelectedViewModelService(null)} className="btn btn-secondary">Close View</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Rule Modal */}
                {showAddModal && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: "500px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                                <h3 style={{ fontSize: "16px", fontWeight: "600" }}>Add New Pricing Rule</h3>
                                <button onClick={() => setShowAddModal(false)} style={{ border: "none", background: "none", fontSize: "20px", color: "var(--text-secondary)", cursor: "pointer" }}>×</button>
                            </div>

                            <form onSubmit={handleCreateRule} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)} required>
                                        <option value="SERVICE">SERVICE</option>
                                        <option value="PACKAGE">PACKAGE</option>
                                        <option value="FEATURE">FEATURE</option>
                                        <option value="PAGE_RANGE">PAGE RANGE</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Unique Key Reference</label>
                                    <input type="text" className="form-control" value={key} onChange={(e) => setKey(e.target.value)} placeholder="e.g. WEB_ECOM or SEO_BASIC" required />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Descriptive Name</label>
                                    <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. E-Commerce Website" required />
                                </div>

                                {category === "SERVICE" && (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">Service Emoji Icon</label>
                                            <input type="text" className="form-control" value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="e.g. 🌐" />
                                        </div>
                                        <div style={{ display: "flex", gap: "20px", margin: "6px 0" }}>
                                            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
                                                <input type="checkbox" checked={hasSubTypes} onChange={(e) => setHasSubTypes(e.target.checked)} />
                                                Has Packages
                                            </label>
                                            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
                                                <input type="checkbox" checked={hasPages} onChange={(e) => setHasPages(e.target.checked)} />
                                                Has Page Range
                                            </label>
                                            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
                                                <input type="checkbox" checked={hasFeatures} onChange={(e) => setHasFeatures(e.target.checked)} />
                                                Has Features
                                            </label>
                                        </div>
                                    </>
                                )}

                                {category === "PACKAGE" && (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">Parent Service Key</label>
                                            <select className="form-control" value={serviceKey} onChange={(e) => setServiceKey(e.target.value)} required>
                                                <option value="">Select Service...</option>
                                                {servicesList.map(s => (
                                                    <option key={s._id} value={s.key}>{s.name} ({s.key})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Package Base Price (₹)</label>
                                            <input type="number" className="form-control" value={price} onChange={(e) => setPrice(e.target.value)} required />
                                        </div>
                                    </>
                                )}

                                {category === "FEATURE" && (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">Parent Service Key</label>
                                            <select className="form-control" value={serviceKey} onChange={(e) => setServiceKey(e.target.value)} required>
                                                <option value="">Select Service...</option>
                                                {servicesList.map(s => (
                                                    <option key={s._id} value={s.key}>{s.name} ({s.key})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Feature Price (₹)</label>
                                            <input type="number" className="form-control" value={price} onChange={(e) => setPrice(e.target.value)} required />
                                        </div>
                                    </>
                                )}

                                {category === "PAGE_RANGE" && (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">Parent Service Key</label>
                                            <select className="form-control" value={serviceKey} onChange={(e) => setServiceKey(e.target.value)} required>
                                                <option value="">Select Service...</option>
                                                {servicesList.map(s => (
                                                    <option key={s._id} value={s.key}>{s.name} ({s.key})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Included Base Pages</label>
                                            <input type="number" className="form-control" value={extraPages} onChange={(e) => setExtraPages(e.target.value)} required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Price per extra page (₹)</label>
                                            <input type="number" className="form-control" value={pricePerPage} onChange={(e) => setPricePerPage(e.target.value)} required />
                                        </div>
                                    </>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Sort Order</label>
                                    <input type="number" className="form-control" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
                                </div>

                                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                                    <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
                                    <button type="submit" className="btn btn-primary">Create Rule</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Rule Modal */}
                {editingRule && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: "500px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                                <h3 style={{ fontSize: "16px", fontWeight: "600" }}>Modify Pricing Rule</h3>
                                <button onClick={() => setEditingRule(null)} style={{ border: "none", background: "none", fontSize: "20px", color: "var(--text-secondary)", cursor: "pointer" }}>×</button>
                            </div>

                            <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                <div className="form-group">
                                    <label className="form-label">Descriptive Name</label>
                                    <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
                                </div>

                                {category === "SERVICE" && (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">Service Emoji Icon</label>
                                            <input type="text" className="form-control" value={emoji} onChange={(e) => setEmoji(e.target.value)} />
                                        </div>
                                        <div style={{ display: "flex", gap: "20px", margin: "6px 0" }}>
                                            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
                                                <input type="checkbox" checked={hasSubTypes} onChange={(e) => setHasSubTypes(e.target.checked)} />
                                                Has Packages
                                            </label>
                                            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
                                                <input type="checkbox" checked={hasPages} onChange={(e) => setHasPages(e.target.checked)} />
                                                Has Page Range
                                            </label>
                                            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
                                                <input type="checkbox" checked={hasFeatures} onChange={(e) => setHasFeatures(e.target.checked)} />
                                                Has Features
                                            </label>
                                        </div>
                                    </>
                                )}

                                {category === "PACKAGE" && (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">Parent Service Key</label>
                                            <select className="form-control" value={serviceKey} onChange={(e) => setServiceKey(e.target.value)} required>
                                                <option value="">Select Service...</option>
                                                {servicesList.map(s => (
                                                    <option key={s._id} value={s.key}>{s.name} ({s.key})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Package Base Price (₹)</label>
                                            <input type="number" className="form-control" value={price} onChange={(e) => setPrice(e.target.value)} required />
                                        </div>
                                    </>
                                )}

                                {category === "FEATURE" && (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">Parent Service Key</label>
                                            <select className="form-control" value={serviceKey} onChange={(e) => setServiceKey(e.target.value)} required>
                                                <option value="">Select Service...</option>
                                                {servicesList.map(s => (
                                                    <option key={s._id} value={s.key}>{s.name} ({s.key})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Feature Price (₹)</label>
                                            <input type="number" className="form-control" value={price} onChange={(e) => setPrice(e.target.value)} required />
                                        </div>
                                    </>
                                )}

                                {category === "PAGE_RANGE" && (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">Parent Service Key</label>
                                            <select className="form-control" value={serviceKey} onChange={(e) => setServiceKey(e.target.value)} required>
                                                <option value="">Select Service...</option>
                                                {servicesList.map(s => (
                                                    <option key={s._id} value={s.key}>{s.name} ({s.key})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Included Base Pages</label>
                                            <input type="number" className="form-control" value={extraPages} onChange={(e) => setExtraPages(e.target.value)} required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Price per extra page (₹)</label>
                                            <input type="number" className="form-control" value={pricePerPage} onChange={(e) => setPricePerPage(e.target.value)} required />
                                        </div>
                                    </>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Sort Order</label>
                                    <input type="number" className="form-control" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
                                </div>

                                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                                    <button type="button" onClick={() => setEditingRule(null)} className="btn btn-secondary">Cancel</button>
                                    <button type="submit" className="btn btn-primary">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
