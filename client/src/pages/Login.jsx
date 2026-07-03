import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    
    // Auth errors & loading states
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Forgot Password Flow States
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotStep, setForgotStep] = useState(1); // 1 = enter email, 2 = enter code & new password
    const [resetCode, setResetCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [forgotError, setForgotError] = useState("");
    const [forgotSuccess, setForgotSuccess] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const res = await login(email, password, rememberMe);
        setLoading(false);

        if (res.success) {
            navigate("/");
        } else {
            setError(res.message);
        }
    };

    // Send reset code to email (logs in console on backend)
    const handleSendResetCode = async (e) => {
        e.preventDefault();
        setForgotError("");
        setForgotSuccess("");
        setForgotLoading(true);

        try {
            const response = await fetch("http://localhost:5000/api/v1/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: forgotEmail })
            });
            const result = await response.json();
            
            if (result.success) {
                setForgotSuccess("A 6-digit reset code has been sent (check backend console logs).");
                setForgotStep(2);
            } else {
                setForgotError(result.message || "Failed to trigger password recovery.");
            }
        } catch (err) {
            setForgotError("Server connection failed.");
        } finally {
            setForgotLoading(false);
        }
    };

    // Verify code and submit new password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setForgotError("");
        setForgotSuccess("");
        setForgotLoading(true);

        try {
            const response = await fetch("http://localhost:5000/api/v1/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: forgotEmail,
                    resetCode,
                    newPassword
                })
            });
            const result = await response.json();

            if (result.success) {
                setForgotSuccess("Password reset successful! You can now log in.");
                setTimeout(() => {
                    setShowForgotModal(false);
                    setForgotStep(1);
                    setForgotEmail("");
                    setResetCode("");
                    setNewPassword("");
                    setForgotSuccess("");
                }, 2000);
            } else {
                setForgotError(result.message || "Incorrect reset code or expired session.");
            }
        } catch (err) {
            setForgotError("Server connection failed.");
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            width: "100vw",
            background: "radial-gradient(circle at center, #121526 0%, #0b0d19 100%)"
        }}>
            <div className="panel-card" style={{ width: "100%", maxWidth: "420px", padding: "40px", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "30px" }}>
                    {/* Logo matching the design image */}
                    <div style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "14px",
                        background: "linear-gradient(135deg, #f97316 0%, #ec4899 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "14px",
                        boxShadow: "0 4px 15px rgba(249, 115, 22, 0.3)"
                    }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                            <path d="M2 12h20" />
                        </svg>
                    </div>
                    <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#ffffff", letterSpacing: "0.5px" }}>MAJISA CRM</h2>
                    <p style={{ color: "var(--text-secondary)", fontSize: "12px", marginTop: "4px" }}>Authorized administrative access only</p>
                </div>

                {error && (
                    <div style={{
                        backgroundColor: "rgba(239, 68, 68, 0.1)",
                        color: "var(--color-danger)",
                        padding: "12px",
                        borderRadius: "var(--border-radius-sm)",
                        fontSize: "13px",
                        marginBottom: "20px",
                        border: "1px solid rgba(239, 68, 68, 0.2)"
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            className="form-control"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@majisa.com"
                            required
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: "16px" }}>
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {/* Remember me & Forgot Password */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", fontSize: "13px" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "var(--text-secondary)" }}>
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                style={{ accentColor: "var(--color-brand)" }}
                            />
                            Remember Me
                        </label>
                        <button
                            type="button"
                            onClick={() => {
                                setShowForgotModal(true);
                                setForgotStep(1);
                                setForgotError("");
                                setForgotSuccess("");
                            }}
                            style={{ border: "none", background: "none", color: "var(--color-brand)", cursor: "pointer", fontWeight: "600" }}
                        >
                            Forgot Password?
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ width: "100%", padding: "12px", fontSize: "14px" }}
                    >
                        {loading ? "Accessing..." : "Access CRM"}
                    </button>
                </form>
            </div>

            {/* Forgot Password Recovery Modal */}
            {showForgotModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: "400px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                            <h3 style={{ fontSize: "16px", fontWeight: "600" }}>Recover Account</h3>
                            <button onClick={() => setShowForgotModal(false)} style={{ border: "none", background: "none", fontSize: "20px", color: "var(--text-secondary)", cursor: "pointer" }}>×</button>
                        </div>

                        {forgotError && (
                            <div style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "var(--color-danger)", padding: "10px", borderRadius: "4px", fontSize: "13px", marginBottom: "16px" }}>
                                ⚠️ {forgotError}
                            </div>
                        )}

                        {forgotSuccess && (
                            <div style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "var(--color-success)", padding: "10px", borderRadius: "4px", fontSize: "13px", marginBottom: "16px" }}>
                                ✅ {forgotSuccess}
                            </div>
                        )}

                        {forgotStep === 1 ? (
                            <form onSubmit={handleSendResetCode}>
                                <div className="form-group" style={{ marginBottom: "20px" }}>
                                    <label className="form-label">Admin Email Address</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
                                        placeholder="Enter email to receive code..."
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "10px" }} disabled={forgotLoading}>
                                    {forgotLoading ? "Sending Code..." : "Send Reset Code"}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleResetPassword}>
                                <div className="form-group">
                                    <label className="form-label">6-Digit Verification Code</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={resetCode}
                                        onChange={(e) => setResetCode(e.target.value)}
                                        placeholder="e.g. 123456"
                                        maxLength="6"
                                        required
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: "20px" }}>
                                    <label className="form-label">New Secure Password</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Min 6 characters..."
                                        required
                                    />
                                </div>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <button type="button" onClick={() => setForgotStep(1)} className="btn btn-secondary" style={{ flex: 1 }}>Back</button>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1.5 }} disabled={forgotLoading}>
                                        {forgotLoading ? "Resetting..." : "Save Password"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
