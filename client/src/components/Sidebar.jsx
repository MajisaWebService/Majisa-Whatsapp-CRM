import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useSidebar } from "../context/SidebarContext.jsx";

export const Sidebar = () => {
    const { logout, admin } = useAuth();
    const { isOpen, close } = useSidebar();

    return (
        <aside className={`sidebar ${isOpen ? "open" : ""}`}>
            <div className="sidebar-logo" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "20px 16px", borderBottom: "1px solid var(--border-color)", marginBottom: "15px" }}>
                <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #f97316 0%, #ec4899 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                        <path d="M2 12h20" />
                    </svg>
                </div>
                <span style={{ fontSize: "16px", fontWeight: "700", color: "#ffffff", letterSpacing: "0.5px" }}>
                    MAJISA CRM
                </span>

                {/* Close button — visible only on mobile */}
                <button
                    className="sidebar-close-btn"
                    onClick={close}
                    aria-label="Close sidebar"
                >
                    ✕
                </button>
            </div>
            <ul className="sidebar-menu">
                <li className="sidebar-item">
                    <NavLink to="/" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} end onClick={close}>
                        📊 Dashboard
                    </NavLink>
                </li>
                <li className="sidebar-item">
                    <NavLink to="/customers" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} onClick={close}>
                        👥 Customers
                    </NavLink>
                </li>
                <li className="sidebar-item">
                    <NavLink to="/chat" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} onClick={close}>
                        💬 Live Chat
                    </NavLink>
                </li>
                <li className="sidebar-item">
                    <NavLink to="/pricing" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} onClick={close}>
                        ⚙️ Pricing Config
                    </NavLink>
                </li>
                <li className="sidebar-item">
                    <NavLink to="/projects" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} onClick={close}>
                        💼 Projects
                    </NavLink>
                </li>
                <li className="sidebar-item">
                    <NavLink to="/reports" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} onClick={close}>
                        📈 Business Analytics
                    </NavLink>
                </li>
                <li className="sidebar-item">
                    <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} onClick={close}>
                        👤 Settings
                    </NavLink>
                </li>
            </ul>
            <div className="sidebar-footer">
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Logged in as</span>
                    <span style={{ fontSize: "13px", fontWeight: "600" }}>{admin?.name}</span>
                </div>
                <button onClick={logout} className="btn btn-secondary" style={{ padding: "6px 10px", fontSize: "12px" }} title="Logout">
                    Logout
                </button>
            </div>
        </aside>
    );
};
