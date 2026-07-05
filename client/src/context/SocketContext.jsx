import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext.jsx";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const { token } = useAuth();
    const [socket, setSocket] = useState(null);
    const [whatsappStatus, setWhatsappStatus] = useState("offline");
    const [whatsappQR, setWhatsappQR] = useState("");
    const [notifications, setNotifications] = useState([]);
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);
    const [incomingMessage, setIncomingMessage] = useState(null);

    useEffect(() => {
        if (!token) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        // Connect to Socket.IO backend with token in query params
        const newSocket = io(window.API_BASE_URL, {
            query: { token },
            transports: ["websocket"]
        });

        newSocket.on("connect", () => {
            console.log("⚡ Connected to Socket.IO Server");
        });

        // Handle connection updates
        newSocket.on("whatsapp:status", (data) => {
            setWhatsappStatus(data.status);
            if (data.status === "connected") {
                setWhatsappQR(""); // QR is cleared once connected successfully
            }
        });

        newSocket.on("whatsapp:qr", (data) => {
            setWhatsappQR(data.qr);
            setWhatsappStatus("offline");
        });

        newSocket.on("notification:new", (notif) => {
            setNotifications((prev) => [notif, ...prev]);
            setUnreadNotifCount((prev) => prev + 1);
            triggerNotificationToast(notif.title, notif.message);
        });

        newSocket.on("message:new", (msg) => {
            setIncomingMessage(msg);
        });

        setSocket(newSocket);

        // Fetch initial status of WhatsApp
        const getInitialStatus = async () => {
            try {
                const response = await fetch(window.API_BASE_URL + "/api/v1/dashboard/stats", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const result = await response.json();
                if (result.success) {
                    setWhatsappStatus(result.data.whatsappStatus);
                }
            } catch (err) {
                console.error("Failed to load initial whatsapp status:", err);
            }
        };
        getInitialStatus();

        // Fetch initial unread count
        const getUnreadNotifCount = async () => {
            try {
                const response = await fetch(window.API_BASE_URL + "/api/v1/notifications/unread-count", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const result = await response.json();
                if (result.success) {
                    setUnreadNotifCount(result.count);
                }
            } catch (err) {
                console.error("Failed to fetch initial unread notifications:", err);
            }
        };
        getUnreadNotifCount();

        return () => {
            newSocket.disconnect();
        };
    }, [token]);

    const triggerNotificationToast = (title, message) => {
        if ("Notification" in window) {
            if (Notification.permission === "granted") {
                new Notification(title, { body: message });
            } else if (Notification.permission !== "denied") {
                Notification.requestPermission().then(permission => {
                    if (permission === "granted") {
                        new Notification(title, { body: message });
                    }
                });
            }
        }
    };

    return (
        <SocketContext.Provider value={{
            socket,
            whatsappStatus,
            whatsappQR,
            notifications,
            unreadNotifCount,
            setUnreadNotifCount,
            setNotifications,
            incomingMessage
        }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
