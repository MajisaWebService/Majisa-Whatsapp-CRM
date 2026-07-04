import React, { useState, useEffect, useRef } from "react";
import { Header } from "../components/Header.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";

export const LiveChat = () => {
    const { token, request } = useAuth();
    const { socket, incomingMessage } = useSocket();
    
    // Conversation States
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    
    // Form & Input States
    const [messageInput, setMessageInput] = useState("");
    const [messageSearch, setMessageSearch] = useState("");
    const [typingStatus, setTypingStatus] = useState("");
    const [searchContact, setSearchContact] = useState("");
    const [sending, setSending] = useState(false);
    
    // Active Customer CRM States (collapsible panel)
    const [isBotPaused, setIsBotPaused] = useState(false);
    const [customerNotes, setCustomerNotes] = useState("");
    const [assignedExec, setAssignedExec] = useState("");
    const [showProfilePanel, setShowProfilePanel] = useState(true);

    const chatBodyRef = useRef(null);
    const fileInputRef = useRef(null);

    // 1. Fetch conversations
    const fetchChats = async () => {
        try {
            const response = await request("http://localhost:5000/api/v1/chats");
            const result = await response.json();
            if (result.success) {
                setChats(result.data);
            }
        } catch (err) {
            console.error("Failed to load chat lists:", err);
        }
    };

    useEffect(() => {
        fetchChats();
    }, [token]);

    // 2. Load conversation thread when active chat changes
    useEffect(() => {
        if (!activeChat) return;

        const fetchMessages = async () => {
            try {
                const response = await request(`http://localhost:5000/api/v1/chats/${activeChat.customer._id}/messages`);
                const result = await response.json();
                if (result.success) {
                    setMessages(result.data);
                }
            } catch (err) {
                console.error("Failed to load messages:", err);
            }
        };

        fetchMessages();

        // Mark chat as read
        const markRead = async () => {
            try {
                await request(`http://localhost:5000/api/v1/chats/${activeChat._id}/read`, {
                    method: "PATCH"
                });
                setChats((prev) =>
                    prev.map((c) => (c._id === activeChat._id ? { ...c, unreadCount: 0 } : c))
                );
            } catch (err) {
                console.error(err);
            }
        };
        markRead();

        // Set local CRM values for the active customer
        setIsBotPaused(activeChat.customer?.isBotPaused || false);
        setCustomerNotes(activeChat.customer?.notes || "");
        setAssignedExec(activeChat.customer?.assignedTo || "");

    }, [activeChat]);

    // 3. Keep messages scrolled to bottom
    useEffect(() => {
        if (chatBodyRef.current) {
            const timer = setTimeout(() => {
                if (chatBodyRef.current) {
                    chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
                }
            }, 80);
            return () => clearTimeout(timer);
        }
    }, [messages, typingStatus]);

    // 4. Handle incoming Socket.IO events
    useEffect(() => {
        if (!incomingMessage) return;

        // Message matches currently active chat
        if (activeChat && incomingMessage.customer === activeChat.customer._id) {
            setMessages((prev) => {
                if (prev.some((msg) => msg._id === incomingMessage._id)) return prev;
                return [...prev, incomingMessage];
            });
        }

        // Always update chat listings
        setChats((prev) => {
            return prev.map((c) => {
                if (c.customer._id === incomingMessage.customer) {
                    return {
                        ...c,
                        lastMessage: incomingMessage.type === "TEXT" ? incomingMessage.message : `📎 [File] ${incomingMessage.type}`,
                        unreadCount: activeChat && activeChat.customer._id === incomingMessage.customer
                            ? 0
                            : c.unreadCount + 1,
                        updatedAt: new Date().toISOString()
                    };
                }
                return c;
            }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        });

    }, [incomingMessage, activeChat]);

    // 5. Connect typing indicators and read acknowledgment events
    useEffect(() => {
        if (!socket) return;

        socket.on("message:typing", (data) => {
            if (activeChat && data.customerId === activeChat.customer.customerId) {
                setTypingStatus(data.isTyping ? "typing..." : "");
            }
        });

        socket.on("message:status", (data) => {
            if (activeChat && data.customerId === activeChat.customer._id) {
                setMessages((prev) =>
                    prev.map((msg) => (msg._id === data.messageId ? { ...msg, status: data.status } : msg))
                );
            }
        });

        return () => {
            socket.off("message:typing");
            socket.off("message:status");
        };
    }, [socket, activeChat]);

    // 6. Handle sending normal text
    const handleSend = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || sending) return;

        setSending(true);
        const textToSend = messageInput;
        setMessageInput("");
        
        // Stop typing presence
        if (socket && activeChat) {
            socket.emit("message:typing", { customerId: activeChat.customer.customerId, isTyping: false });
        }

        try {
            const response = await request("http://localhost:5000/api/v1/chats/send", {
                method: "POST",
                body: JSON.stringify({
                    customerId: activeChat.customer._id,
                    messageText: textToSend
                })
            });

            const result = await response.json();
            if (result.success) {
                setMessages((prev) => [...prev, result.data]);
                setChats((prev) =>
                    prev.map((c) =>
                        c._id === activeChat._id
                            ? { ...c, lastMessage: textToSend, updatedAt: new Date().toISOString() }
                            : c
                    ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                );
            }
        } catch (err) {
            console.error("Message send failure:", err);
        } finally {
            setSending(false);
        }
    };

    // 7. Emit typing indicator when executive is entering text
    const handleInputChange = (e) => {
        setMessageInput(e.target.value);
        if (socket && activeChat) {
            socket.emit("message:typing", {
                customerId: activeChat.customer.customerId,
                isTyping: e.target.value.length > 0
            });
        }
    };

    // 8. Handle media attachment uploads
    const handleMediaUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !activeChat) return;

        const reader = new FileReader();
        reader.onload = async () => {
            const base64Data = reader.result.split(",")[1];
            setSending(true);

            try {
                const response = await request("http://localhost:5000/api/v1/chats/upload", {
                    method: "POST",
                    body: JSON.stringify({
                        customerId: activeChat.customer._id,
                        fileData: base64Data,
                        fileName: file.name,
                        mimeType: file.type,
                        messageText: `Sent ${file.name}`
                    })
                });

                const result = await response.json();
                if (result.success) {
                    setMessages((prev) => [...prev, result.data]);
                    fetchChats();
                }
            } catch (err) {
                console.error("Media upload failure:", err);
            } finally {
                setSending(false);
            }
        };
        reader.readAsDataURL(file);
    };

    // 9. Toggle chatbot automated takeover
    const handleToggleBot = async () => {
        if (!activeChat) return;
        try {
            const response = await request(`http://localhost:5000/api/v1/customers/${activeChat.customer._id}/toggle-bot`, {
                method: "PATCH"
            });
            const result = await response.json();
            if (result.success) {
                setIsBotPaused(result.data.isBotPaused);
                setActiveChat(prev => ({
                    ...prev,
                    customer: { ...prev.customer, isBotPaused: result.data.isBotPaused }
                }));
            }
        } catch (err) {
            console.error("Bot toggle error:", err);
        }
    };

    // 10. Update executive assignment and customer notes
    const handleSaveProfileChanges = async () => {
        if (!activeChat) return;
        try {
            const response = await request(`http://localhost:5000/api/v1/customers/${activeChat.customer._id}`, {
                method: "PUT",
                body: JSON.stringify({
                    notes: customerNotes,
                    assignedTo: assignedExec
                })
            });
            const result = await response.json();
            if (result.success) {
                alert("Client profile card updated.");
                setActiveChat(prev => ({
                    ...prev,
                    customer: {
                        ...prev.customer,
                        notes: result.data.notes,
                        assignedTo: result.data.assignedTo
                    }
                }));
                fetchChats();
            }
        } catch (err) {
            console.error("Save profile error:", err);
        }
    };

    // 11. Delete chat conversation and message logs
    const handleDeleteChat = async () => {
        if (!activeChat) return;
        if (!window.confirm("Are you sure you want to delete this chat conversation? This will permanently delete the conversation listing and all its message history.")) {
            return;
        }

        try {
            const response = await request(`http://localhost:5000/api/v1/chats/${activeChat._id}`, {
                method: "DELETE"
            });
            const result = await response.json();
            if (result.success) {
                alert("Chat deleted successfully.");
                setActiveChat(null);
                fetchChats();
            } else {
                alert(result.message || "Failed to delete chat.");
            }
        } catch (err) {
            console.error("Delete chat error:", err);
            alert("An error occurred while deleting the chat.");
        }
    };

    // --- FILTERS ---
    const filteredChats = chats.filter((c) => {
        const name = c.customer?.name || "";
        const phone = c.customer?.phone || c.customer?.customerId || "";
        const searchLower = searchContact.toLowerCase();
        return name.toLowerCase().includes(searchLower) || phone.includes(searchLower);
    });

    const filteredMessages = messages.filter((msg) => {
        if (!messageSearch) return true;
        // Text messages can be searched. Media paths are ignored in text search
        return msg.type === "TEXT" && msg.message.toLowerCase().includes(messageSearch.toLowerCase());
    });

    return (
        <div className="main-content">
            <Header title="WhatsApp Web Console" />
            <div className="chat-layout" style={{ gridTemplateColumns: showProfilePanel ? "300px 1fr 280px" : "300px 1fr" }}>
                
                {/* 1. Conversations List */}
                <div className="chat-sidebar">
                    <div className="chat-search-container">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="🔍 Search contacts..."
                            value={searchContact}
                            onChange={(e) => setSearchContact(e.target.value)}
                            style={{ width: "100%" }}
                        />
                    </div>
                    <ul className="chat-list">
                        {filteredChats.length === 0 ? (
                            <li style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>No active chats</li>
                        ) : (
                            filteredChats.map((c) => (
                                <li
                                    key={c._id}
                                    className={`chat-item ${activeChat && activeChat._id === c._id ? "active" : ""}`}
                                    onClick={() => setActiveChat(c)}
                                >
                                    <div className="chat-item-avatar">
                                        {(c.customer?.name || "U")[0].toUpperCase()}
                                    </div>
                                    <div className="chat-item-details">
                                        <div className="chat-item-header">
                                            <span className="chat-item-name">{c.customer?.name || c.customer?.customerId.split("@")[0] || "Client"}</span>
                                            <span className="chat-item-time">
                                                {new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span className="chat-item-msg">{c.lastMessage}</span>
                                            {c.unreadCount > 0 && (
                                                <span className="chat-item-unread">{c.unreadCount}</span>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>

                {/* 2. Main Message Stream */}
                {activeChat ? (
                    <div className="chat-window">
                        
                        {/* Stream Header */}
                        <div className="chat-header">
                            <div className="chat-user-info">
                                <div className="chat-item-avatar" style={{ width: "40px", height: "40px" }}>
                                    {(activeChat.customer?.name || "U")[0].toUpperCase()}
                                </div>
                                <div>
                                    <h4 style={{ fontSize: "14px", fontWeight: "700" }}>{activeChat.customer?.name || "Customer Lead"}</h4>
                                    <span style={{ fontSize: "11px", color: typingStatus ? "var(--color-success)" : "var(--text-secondary)" }}>
                                        {typingStatus || activeChat.customer?.phone || activeChat.customer?.customerId.split("@")[0]}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Message Search box & Profile toggle */}
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="🔍 Search messages..."
                                    value={messageSearch}
                                    onChange={(e) => setMessageSearch(e.target.value)}
                                    style={{ width: "160px", padding: "6px 10px", fontSize: "12px" }}
                                />
                                <button
                                    onClick={handleDeleteChat}
                                    className="btn btn-danger"
                                    style={{ padding: "6px 12px", fontSize: "12px" }}
                                >
                                    🗑️ Delete Chat
                                </button>
                                <button
                                    onClick={() => setShowProfilePanel(!showProfilePanel)}
                                    className="btn btn-secondary"
                                    style={{ padding: "6px 12px", fontSize: "12px" }}
                                >
                                    👤 {showProfilePanel ? "Hide Card" : "Show Card"}
                                </button>
                            </div>
                        </div>

                        {/* Stream Body */}
                        <div className="chat-body" ref={chatBodyRef}>
                            {filteredMessages.map((msg) => {
                                const isClient = msg.sender === "CUSTOMER";
                                const isBot = msg.sender === "BOT";
                                
                                // Render ticks for admin messages: grey tick (SENT), double grey (DELIVERED), double blue (READ)
                                const renderStatusTicks = () => {
                                    if (isClient) return null;
                                    if (msg.status === "READ") {
                                        return <span style={{ color: "var(--color-info)", marginLeft: "4px" }}>✓✓</span>;
                                    }
                                    if (msg.status === "DELIVERED") {
                                        return <span style={{ color: "rgba(255,255,255,0.5)", marginLeft: "4px" }}>✓✓</span>;
                                    }
                                    return <span style={{ color: "rgba(255,255,255,0.5)", marginLeft: "4px" }}>✓</span>;
                                };

                                // Render different bubble attachment categories
                                const renderBubbleContent = () => {
                                    if (msg.type === "IMAGE") {
                                        return <img src={`http://localhost:5000${msg.message}`} alt="sent image" style={{ maxWidth: "100%", borderRadius: "8px", cursor: "pointer", display: "block" }} onClick={() => window.open(`http://localhost:5000${msg.message}`)} />;
                                    }
                                    if (msg.type === "PDF") {
                                        return (
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <span style={{ fontSize: "24px" }}>📄</span>
                                                <div style={{ minWidth: 0 }}>
                                                    <span style={{ display: "block", fontSize: "12px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{msg.message.split("/").pop()}</span>
                                                    <a href={`http://localhost:5000${msg.message}`} target="_blank" rel="noreferrer" style={{ color: isClient ? "var(--color-brand)" : "#fff", textDecoration: "underline", fontSize: "11px", fontWeight: "600" }}>Download PDF</a>
                                                </div>
                                            </div>
                                        );
                                    }
                                    if (msg.type === "AUDIO") {
                                        return <audio src={`http://localhost:5000${msg.message}`} controls style={{ maxWidth: "100%" }} />;
                                    }
                                    return <div>{msg.message}</div>;
                                };

                                return (
                                    <div
                                        key={msg._id}
                                        className={`message-bubble ${isClient ? "customer" : isBot ? "bot" : "admin"}`}
                                        style={{ position: "relative" }}
                                    >
                                        {renderBubbleContent()}
                                        <div className="message-meta" style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "4px" }}>
                                            <span>
                                                {isBot ? "🤖 Bot • " : !isClient ? "👨‍💼 You • " : ""}
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {renderStatusTicks()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Stream Input Send Bar */}
                        <form onSubmit={handleSend} className="chat-footer">
                            {/* Attachment trigger */}
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => fileInputRef.current.click()}
                                style={{ padding: "10px 14px", fontSize: "16px" }}
                                title="Attach Image, PDF, or Voice file"
                            >
                                📎
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleMediaUpload}
                                style={{ display: "none" }}
                                accept="image/*,application/pdf,audio/*"
                            />

                            <input
                                type="text"
                                className="form-control chat-input-control"
                                placeholder={sending ? "Uploading file attachment..." : "Type a WhatsApp reply message..."}
                                value={messageInput}
                                onChange={handleInputChange}
                                disabled={sending}
                            />
                            <button type="submit" className="btn btn-primary" disabled={!messageInput.trim() || sending}>
                                Send
                            </button>
                        </form>
                    </div>
                ) : (
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        color: "var(--text-muted)",
                        backgroundColor: "var(--bg-primary)"
                    }}>
                        <span style={{ fontSize: "40px", marginBottom: "16px" }}>💬</span>
                        <h3>Select a conversation to start messaging</h3>
                        <p style={{ fontSize: "13px", marginTop: "4px" }}>Select a lead contact in the left pane to reply via WhatsApp.</p>
                    </div>
                )}

                {/* 3. CRM Lead Control Panel */}
                {activeChat && showProfilePanel && (
                    <div style={{
                        backgroundColor: "var(--bg-secondary)",
                        borderLeft: "1px solid var(--border-color)",
                        padding: "20px",
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: "20px"
                    }}>
                        <h3 style={{ fontSize: "15px", fontWeight: "700", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>CRM Control Card</h3>
                        
                        {/* Bot Toggle Switch */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Chatbot Automation</span>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
                                <span style={{ fontSize: "13px", fontWeight: "500" }}>{isBotPaused ? "⏸️ Bot Paused" : "🤖 Bot Active"}</span>
                                <button
                                    onClick={handleToggleBot}
                                    className={`btn ${isBotPaused ? "btn-secondary" : "btn-primary"}`}
                                    style={{ padding: "4px 10px", fontSize: "11px" }}
                                >
                                    {isBotPaused ? "Resume Bot" : "Pause Bot"}
                                </button>
                            </div>
                        </div>

                        {/* Executive Assignment */}
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Assign Executive</label>
                            <input
                                type="text"
                                className="form-control"
                                value={assignedExec}
                                onChange={(e) => setAssignedExec(e.target.value)}
                                placeholder="Enter owner name..."
                            />
                        </div>

                        {/* Internal Notes Panel */}
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Internal Client Notes</label>
                            <textarea
                                className="form-control"
                                rows="8"
                                value={customerNotes}
                                onChange={(e) => setCustomerNotes(e.target.value)}
                                placeholder="Clients history, budget context..."
                                style={{ fontSize: "12px", resize: "none" }}
                            />
                        </div>

                        <button onClick={handleSaveProfileChanges} className="btn btn-primary" style={{ width: "100%", padding: "10px", fontSize: "13px" }}>
                            Save Profile Updates
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};
