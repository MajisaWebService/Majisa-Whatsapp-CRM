import React, { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useSidebar } from "../context/SidebarContext.jsx";

export const Header = ({ title }) => {
    const { whatsappStatus, notifications, unreadNotifCount, setUnreadNotifCount } = useSocket();
    const { token } = useAuth();
    const { toggle } = useSidebar();
    const [showNotif, setShowNotif] = useState(false);
    const [localNotifications, setLocalNotifications] = useState([]);

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!token) return;
            try {
                const response = await fetch("http://localhost:5000/api/v1/notifications?limit=15", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const result = await response.json();
                if (result.success) {
                    setLocalNotifications(result.data);
                }
            } catch (err) {
                console.error("Failed to load notifications:", err);
            }
        };

        fetchNotifications();
    }, [token]);

    useEffect(() => {
        if (notifications.length > 0) {
            setLocalNotifications((prev) => {
                const newNotifs = notifications.filter(
                    (n) => !prev.some((p) => p._id === n._id)
                );
                return [...newNotifs, ...prev].slice(0, 15);
            });
        }
    }, [notifications]);

    const handleMarkAllRead = async () => {
        try {
            await fetch("http://localhost:5000/api/v1/notifications/read-all", {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` }
            });
            setUnreadNotifCount(0);
            setLocalNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkSingleRead = async (id) => {
        try {
            await fetch(`http://localhost:5000/api/v1/notifications/${id}/read`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` }
            });
            setUnreadNotifCount((prev) => Math.max(0, prev - 1));
            setLocalNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
            );
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <header className="header">
            <div className="header-left">
                {/* Hamburger button — visible only on mobile */}
                <button
                    className="hamburger-btn"
                    onClick={toggle}
                    aria-label="Toggle navigation menu"
                >
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                </button>

                <div className="header-title">
                    <h1>{title}</h1>
                </div>
            </div>

            <div className="header-actions">
                {/* WhatsApp Status Badge */}
                <div className={`badge-status ${whatsappStatus === "connected" ? "connected" : "offline"}`}>
                    <span className={`pulse-dot ${whatsappStatus === "connected" ? "" : whatsappStatus === "offline" ? "offline" : "qr"}`}></span>
                    <span className="badge-status-text">
                        {whatsappStatus === "connected" ? "Online" : whatsappStatus === "auth_failed" ? "Auth Failed" : "Offline"}
                    </span>
                </div>

                {/* Notifications Panel */}
                <div style={{ position: "relative" }}>
                    <button
                        className="btn btn-secondary notif-btn"
                        onClick={() => setShowNotif(!showNotif)}
                        style={{ position: "relative", padding: "8px 12px" }}
                    >
                        🔔
                        {unreadNotifCount > 0 && (
                            <span style={{
                                position: "absolute",
                                top: "-4px",
                                right: "-4px",
                                backgroundColor: "var(--color-danger)",
                                color: "#fff",
                                fontSize: "10px",
                                fontWeight: "700",
                                borderRadius: "50%",
                                width: "16px",
                                height: "16px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}>
                                {unreadNotifCount}
                            </span>
                        )}
                    </button>

                    {showNotif && (
                        <div className="notif-dropdown">
                            <div style={{
                                padding: "12px 16px",
                                borderBottom: "1px solid var(--border-color)",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}>
                                <span style={{ fontWeight: "600", fontSize: "13px" }}>Notifications</span>
                                <button
                                    onClick={handleMarkAllRead}
                                    style={{
                                        border: "none",
                                        background: "none",
                                        color: "var(--color-brand)",
                                        fontSize: "11px",
                                        fontWeight: "600",
                                        cursor: "pointer"
                                    }}
                                >
                                    Mark all read
                                </button>
                            </div>

                            {localNotifications.length === 0 ? (
                                <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                                    No notifications
                                </div>
                            ) : (
                                localNotifications.map((notif) => (
                                    <div
                                        key={notif._id}
                                        className={`notif-item ${notif.isRead ? "" : "unread"}`}
                                        onClick={() => handleMarkSingleRead(notif._id)}
                                    >
                                        <h4>{notif.title}</h4>
                                        <p style={{ fontSize: "11px", margin: "2px 0" }}>{notif.message}</p>
                                        <span>{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
