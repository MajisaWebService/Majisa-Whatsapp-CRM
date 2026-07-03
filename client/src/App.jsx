import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";
import { SidebarProvider, useSidebar } from "./context/SidebarContext.jsx";
import { Sidebar } from "./components/Sidebar.jsx";

import { Login } from "./pages/Login.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Customers } from "./pages/Customers.jsx";
import { LiveChat } from "./pages/LiveChat.jsx";
import { Pricing } from "./pages/Pricing.jsx";
import { Projects } from "./pages/Projects.jsx";
import { Reports } from "./pages/Reports.jsx";
import { Settings } from "./pages/Settings.jsx";

// Backdrop component using context
const SidebarBackdrop = () => {
    const { isOpen, close } = useSidebar();
    return (
        <div
            className={`sidebar-backdrop ${isOpen ? "active" : ""}`}
            onClick={close}
            aria-hidden="true"
        />
    );
};

// Route protection wrapper for logged-in administration access
const ProtectedRoute = ({ children }) => {
    const { token, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#0b0d19", color: "#fff" }}>
                <h3>Verifying session...</h3>
            </div>
        );
    }

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return (
        <SocketProvider>
            <SidebarProvider>
                <div className="app-container">
                    <Sidebar />
                    <SidebarBackdrop />
                    {children}
                </div>
            </SidebarProvider>
        </SocketProvider>
    );
};

// Route protection wrapper for public endpoints (like login)
const PublicRoute = ({ children }) => {
    const { token, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#0b0d19", color: "#fff" }}>
                <h3>Verifying session...</h3>
            </div>
        );
    }

    if (token) {
        return <Navigate to="/" replace />;
    }

    return children;
};

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={
                        <PublicRoute>
                            <Login />
                        </PublicRoute>
                    } />
                    <Route path="/" element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/customers" element={
                        <ProtectedRoute>
                            <Customers />
                        </ProtectedRoute>
                    } />
                    <Route path="/chat" element={
                        <ProtectedRoute>
                            <LiveChat />
                        </ProtectedRoute>
                    } />

                    <Route path="/pricing" element={
                        <ProtectedRoute>
                            <Pricing />
                        </ProtectedRoute>
                    } />
                    <Route path="/projects" element={
                        <ProtectedRoute>
                            <Projects />
                        </ProtectedRoute>
                    } />
                    <Route path="/reports" element={
                        <ProtectedRoute>
                            <Reports />
                        </ProtectedRoute>
                    } />
                    <Route path="/settings" element={
                        <ProtectedRoute>
                            <Settings />
                        </ProtectedRoute>
                    } />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
