import React, { useState, useEffect } from "react";
import { Header } from "../components/Header.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export const Quotations = () => {
    const { token } = useAuth();
    const [quotations, setQuotations] = useState([]);
    const [pricingRules, setPricingRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);

    // Form states
    const [customerId, setCustomerId] = useState("");
    const [serviceKey, setServiceKey] = useState("");
    const [subTypeKey, setSubTypeKey] = useState("");
    const [pageRangeKey, setPageRangeKey] = useState("");
    const [selectedFeatures, setSelectedFeatures] = useState([]);
    const [additionalCharges, setAdditionalCharges] = useState([{ name: "", amount: 0 }]);
    const [discount, setDiscount] = useState(0);
    const [tax, setTax] = useState(0);
    const [notes, setNotes] = useState("");
    
    // Calculation preview state
    const [preview, setPreview] = useState(null);

    const fetchQuotations = async () => {
        try {
            const response = await fetch(window.API_BASE_URL + "/api/v1/quotations", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setQuotations(result.data);
            }
        } catch (err) {
            console.error("Failed to load quotations:", err);
        }
    };

    const fetchPricingRules = async () => {
        try {
            const response = await fetch(window.API_BASE_URL + "/api/v1/pricing", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setPricingRules(result.data);
            }
        } catch (err) {
            console.error("Failed to load pricing configurations:", err);
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            await Promise.all([fetchQuotations(), fetchPricingRules()]);
            setLoading(false);
        };
        loadInitialData();
    }, [token]);

    // Separate rules
    const services = pricingRules.filter(r => r.category === "SERVICE" && r.isActive);
    const packages = pricingRules.filter(r => r.category === "PACKAGE" && r.serviceKey === serviceKey && r.isActive);
    const pageRanges = pricingRules.filter(r => r.category === "PAGE_RANGE" && r.isActive);
    const features = pricingRules.filter(r => r.category === "FEATURE" && r.isActive);

    // Calculate quotation preview dynamically on dependency changes
    useEffect(() => {
        if (!serviceKey) {
            setPreview(null);
            return;
        }

        const fetchPreview = async () => {
            try {
                const response = await fetch(window.API_BASE_URL + "/api/v1/quotations/calculate", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        serviceKey,
                        subTypeKey,
                        pageRangeKey,
                        selectedFeatureKeys: selectedFeatures,
                        additionalCharges: additionalCharges.filter(c => c.name && c.amount > 0),
                        discount,
                        tax
                    })
                });
                const result = await response.json();
                if (result.success) {
                    setPreview(result.data);
                }
            } catch (err) {
                console.error(err);
            }
        };

        fetchPreview();
    }, [serviceKey, subTypeKey, pageRangeKey, selectedFeatures, additionalCharges, discount, tax, token]);

    const handleFeatureToggle = (key) => {
        setSelectedFeatures((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );
    };

    const handleAddCharge = () => {
        setAdditionalCharges((prev) => [...prev, { name: "", amount: 0 }]);
    };

    const handleChargeChange = (index, field, value) => {
        setAdditionalCharges((prev) => {
            const updated = [...prev];
            updated[index][field] = field === "amount" ? parseFloat(value) || 0 : value;
            return updated;
        });
    };

    const handleCreateQuotation = async (e) => {
        e.preventDefault();
        if (!customerId || !serviceKey || !preview) return;

        const serviceName = services.find(s => s.key === serviceKey)?.name || "";
        const subTypeName = packages.find(p => p.key === `${serviceKey}_${subTypeKey}`)?.name || "";
        const pageRangeLabel = pageRanges.find(pr => pr.key === pageRangeKey)?.name || "";

        const selectFeatNames = selectedFeatures.map(k => features.find(f => f.key === k)?.name).filter(Boolean);

        try {
            const response = await fetch(window.API_BASE_URL + "/api/v1/quotations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    customerId,
                    service: serviceName,
                    subType: subTypeName,
                    pageRange: pageRangeLabel,
                    selectedFeatures: selectFeatNames,
                    breakdown: {
                        basePrice: preview.breakdown.basePrice,
                        extraPagesPrice: preview.breakdown.extraPagesPrice,
                        featuresPrice: preview.breakdown.featuresPrice,
                        items: preview.breakdown.items
                    },
                    discount,
                    tax,
                    additionalCharges: additionalCharges.filter(c => c.name && c.amount > 0),
                    notes,
                    totalAmount: preview.totalAmount
                })
            });

            const result = await response.json();
            if (result.success) {
                // Refresh list and reset form
                fetchQuotations();
                setShowCreateForm(false);
                setCustomerId("");
                setServiceKey("");
                setSubTypeKey("");
                setPageRangeKey("");
                setSelectedFeatures([]);
                setAdditionalCharges([{ name: "", amount: 0 }]);
                setDiscount(0);
                setTax(0);
                setNotes("");
                setPreview(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="main-content">
            <Header title="Quotation Engine" />
            <div className="page-body">
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "600" }}>Manage Proposals</h3>
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="btn btn-primary"
                    >
                        {showCreateForm ? "View Proposals" : "🆕 New Quotation"}
                    </button>
                </div>

                {showCreateForm ? (
                    <div className="dashboard-grid">
                        {/* Form */}
                        <div className="panel-card">
                            <h3 className="panel-title" style={{ marginBottom: "20px" }}>Build Estimate</h3>
                            <form onSubmit={handleCreateQuotation}>
                                <div className="form-group">
                                    <label className="form-label">Customer Mobile Number / JID</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={customerId}
                                        onChange={(e) => setCustomerId(e.target.value)}
                                        placeholder="e.g. 919876543210@c.us"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Service Type</label>
                                    <select
                                        className="form-control"
                                        value={serviceKey}
                                        onChange={(e) => {
                                            setServiceKey(e.target.value);
                                            setSubTypeKey("");
                                            setSelectedFeatures([]);
                                        }}
                                        required
                                    >
                                        <option value="">Select Service...</option>
                                        {services.map(s => (
                                            <option key={s._id} value={s.key}>{s.emoji} {s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {serviceKey && packages.length > 0 && (
                                    <div className="form-group">
                                        <label className="form-label">Package Plan / Sub-Type</label>
                                        <select
                                            className="form-control"
                                            value={subTypeKey}
                                            onChange={(e) => setSubTypeKey(e.target.value)}
                                        >
                                            <option value="">Select Package...</option>
                                            {packages.map(p => (
                                                <option key={p._id} value={p.key.split("_")[1]}>{p.name} (₹{p.price.toLocaleString("en-IN")})</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {serviceKey && services.find(s => s.key === serviceKey)?.hasPages && (
                                    <div className="form-group">
                                        <label className="form-label">Page Ranges</label>
                                        <select
                                            className="form-control"
                                            value={pageRangeKey}
                                            onChange={(e) => setPageRangeKey(e.target.value)}
                                        >
                                            <option value="">Select Pages...</option>
                                            {pageRanges.map(pr => (
                                                <option key={pr._id} value={pr.key}>{pr.name} (Extra pages rate: ₹{pr.pricePerPage})</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {serviceKey && services.find(s => s.key === serviceKey)?.hasFeatures && features.length > 0 && (
                                    <div className="form-group">
                                        <label className="form-label" style={{ marginBottom: "8px" }}>Select Add-on Features</label>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                            {features.map(f => (
                                                <label key={f._id} style={{ display: "flex", gap: "8px", fontSize: "13px", alignItems: "center", cursor: "pointer" }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedFeatures.includes(f.key)}
                                                        onChange={() => handleFeatureToggle(f.key)}
                                                    />
                                                    {f.name} (+₹{f.price.toLocaleString("en-IN")})
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Additional Charges */}
                                <div style={{ borderTop: "1px solid var(--border-color)", marginTop: "20px", paddingTop: "16px" }}>
                                    <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                        <span>Additional Charges</span>
                                        <button type="button" onClick={handleAddCharge} className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "11px" }}>+ Add Charge</button>
                                    </label>
                                    {additionalCharges.map((charge, idx) => (
                                        <div key={idx} style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Charge description (e.g. Expedited Delivery)"
                                                value={charge.name}
                                                onChange={(e) => handleChargeChange(idx, "name", e.target.value)}
                                                style={{ flex: 2 }}
                                            />
                                            <input
                                                type="number"
                                                className="form-control"
                                                placeholder="Amount"
                                                value={charge.amount}
                                                onChange={(e) => handleChargeChange(idx, "amount", e.target.value)}
                                                style={{ flex: 1 }}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Financial deductions & taxes */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
                                    <div className="form-group">
                                        <label className="form-label">Discount Amount (₹)</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={discount}
                                            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Tax / GST (%)</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={tax}
                                            onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                                            placeholder="e.g. 18"
                                        />
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginTop: "12px", marginBottom: "24px" }}>
                                    <label className="form-label">Notes for Proposal</label>
                                    <textarea
                                        className="form-control"
                                        rows="2"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Add terms or details shown to customer..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ width: "100%", padding: "12px" }}
                                    disabled={!customerId || !serviceKey || !preview}
                                >
                                    Save & Issue Proposal
                                </button>
                            </form>
                        </div>

                        {/* Calculation Live Preview */}
                        <div>
                            <div className="panel-card" style={{ borderLeft: "4px solid var(--color-brand)" }}>
                                <h3 className="panel-title" style={{ marginBottom: "20px" }}>Proposal Summary</h3>
                                {preview ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                        <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                                            <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>Customer JID</span>
                                            <p style={{ fontSize: "14px", fontWeight: "600", marginTop: "2px" }}>{customerId || "Enter Customer ID..."}</p>
                                        </div>

                                        <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                                            <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>Cost Items</span>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                                                {preview.breakdown.items.map((item, idx) => (
                                                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                                                        <span style={{ color: "var(--text-secondary)" }}>{item.name}</span>
                                                        <span style={{ fontWeight: "500" }}>₹{item.price.toLocaleString("en-IN")}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                                            {preview.breakdown.discountAmount > 0 && (
                                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--color-danger)" }}>
                                                    <span>Discount:</span>
                                                    <span>- ₹{preview.breakdown.discountAmount.toLocaleString("en-IN")}</span>
                                                </div>
                                            )}
                                            {preview.breakdown.taxAmount > 0 && (
                                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--color-warning)" }}>
                                                    <span>Tax ({tax}% GST):</span>
                                                    <span>+ ₹{preview.breakdown.taxAmount.toLocaleString("en-IN")}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px" }}>
                                            <strong style={{ fontSize: "15px" }}>Estimated Net:</strong>
                                            <strong style={{ fontSize: "20px", color: "var(--color-brand)" }}>₹{preview.totalAmount.toLocaleString("en-IN")}</strong>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                                        Select a service to show proposal calculation details.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Quotations list */
                    <div className="panel-card">
                        {loading ? (
                            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>Loading quotations list...</div>
                        ) : quotations.length === 0 ? (
                            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>No generated quotations found.</div>
                        ) : (
                            <div className="table-responsive">
                                <table className="custom-table">
                                    <thead>
                                        <tr>
                                            <th>Client JID</th>
                                            <th>Service</th>
                                            <th>Package</th>
                                            <th>Discount</th>
                                            <th>GST Tax</th>
                                            <th>Total Price</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {quotations.map((q) => (
                                            <tr key={q._id}>
                                                <td style={{ fontWeight: "500" }}>{q.customerId.split("@")[0]}</td>
                                                <td>{q.service}</td>
                                                <td>{q.subType || "N/A"}</td>
                                                <td style={{ color: q.discount > 0 ? "var(--color-danger)" : "var(--text-primary)" }}>
                                                    {q.discount > 0 ? `₹${q.discount.toLocaleString("en-IN")}` : "None"}
                                                </td>
                                                <td>{q.tax > 0 ? `${q.tax}%` : "0%"}</td>
                                                <td style={{ fontWeight: "700", color: "var(--color-brand)" }}>₹{q.totalAmount.toLocaleString("en-IN")}</td>
                                                <td>
                                                    <span className={`pill ${
                                                        q.status === "ACCEPTED" ? "pill-success" :
                                                        q.status === "REJECTED" ? "pill-danger" :
                                                        q.status === "SENT" ? "pill-info" :
                                                        "pill-warning"
                                                    }`}>
                                                        {q.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
