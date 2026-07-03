import React, { createContext, useState, useEffect, useContext } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [token, setToken] = useState(
        localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken") || null
    );
    const [refreshToken, setRefreshToken] = useState(
        localStorage.getItem("adminRefreshToken") || sessionStorage.getItem("adminRefreshToken") || null
    );
    const [loading, setLoading] = useState(true);

    const API_URL = "http://localhost:5000/api/v1/auth";

    // Reusable HTTP request client with automatic JWT refresh interception
    const request = async (url, options = {}) => {
        // Build headers
        const headers = {
            "Content-Type": "application/json",
            ...options.headers
        };

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const fetchOptions = {
            ...options,
            headers
        };

        try {
            let response = await fetch(url, fetchOptions);

            // Access token expired, attempt auto-refresh
            if (response.status === 401 && refreshToken) {
                console.log("🔒 Access token expired. Attempting token refresh...");
                
                const refreshResponse = await fetch(`${API_URL}/refresh-token`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ refreshToken })
                });

                const refreshResult = await refreshResponse.json();

                if (refreshResult.success) {
                    console.log("🔑 Session renewed successfully.");
                    const isLocal = !!localStorage.getItem("adminToken");
                    
                    // Save new tokens
                    if (isLocal) {
                        localStorage.setItem("adminToken", refreshResult.token);
                        localStorage.setItem("adminRefreshToken", refreshResult.refreshToken);
                    } else {
                        sessionStorage.setItem("adminToken", refreshResult.token);
                        sessionStorage.setItem("adminRefreshToken", refreshResult.refreshToken);
                    }

                    // Update memory state
                    setToken(refreshResult.token);
                    setRefreshToken(refreshResult.refreshToken);

                    // Retry original request with new token
                    headers["Authorization"] = `Bearer ${refreshResult.token}`;
                    response = await fetch(url, { ...options, headers });
                } else {
                    console.warn("❌ Session expired. Logging out.");
                    logout();
                }
            }

            return response;
        } catch (error) {
            console.error("Network or API Request error:", error);
            throw error;
        }
    };

    useEffect(() => {
        const loadAdmin = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await request(`${API_URL}/me`);
                const result = await response.json();

                if (result.success) {
                    setAdmin(result.data);
                } else {
                    logout();
                }
            } catch (err) {
                console.error("Failed to load admin profile:", err);
                logout();
            } finally {
                setLoading(false);
            }
        };

        loadAdmin();
    }, [token]);

    const login = async (email, password, rememberMe = false) => {
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (result.success) {
                if (rememberMe) {
                    localStorage.setItem("adminToken", result.token);
                    localStorage.setItem("adminRefreshToken", result.refreshToken);
                } else {
                    sessionStorage.setItem("adminToken", result.token);
                    sessionStorage.setItem("adminRefreshToken", result.refreshToken);
                }

                setToken(result.token);
                setRefreshToken(result.refreshToken);
                setAdmin(result.admin);
                return { success: true };
            } else {
                return { success: false, message: result.message || "Login failed" };
            }
        } catch (err) {
            console.error("Login API Error:", err);
            return { success: false, message: "Server connection failed" };
        }
    };

    const logout = () => {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminRefreshToken");
        sessionStorage.removeItem("adminToken");
        sessionStorage.removeItem("adminRefreshToken");
        setToken(null);
        setRefreshToken(null);
        setAdmin(null);
    };

    return (
        <AuthContext.Provider value={{ admin, token, loading, login, logout, request }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
