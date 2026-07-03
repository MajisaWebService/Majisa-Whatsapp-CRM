import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

let io = null;

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Authentication Handshake Middleware for Socket.IO connections
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.token || socket.handshake.query.token;

            if (!token) {
                return next(new Error("Authentication error. No token provided."));
            }

            // Verify JWT Token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch and check Admin account
            const admin = await Admin.findById(decoded.id);
            if (!admin) {
                return next(new Error("Authentication error. Admin not found."));
            }

            if (!admin.isActive) {
                return next(new Error("Authentication error. Account suspended."));
            }

            socket.admin = admin;
            next();
        } catch (error) {
            console.error("Socket Auth Error:", error.message);
            return next(new Error("Authentication error. Invalid credentials."));
        }
    });

    io.on("connection", (socket) => {
        console.log(`🔌 Admin connected: ${socket.id} (${socket.admin.name})`);

        // Automatically assign admin socket to the administrative room for broadcasts
        socket.join("admins");

        // Broadcast typing presence from dashboard admin to WhatsApp user
        socket.on("message:typing", async (data) => {
            try {
                const { client } = await import("../services/whatsapp.service.js");
                const whatsappId = data.customerId.includes("@") ? data.customerId : `${data.customerId}@c.us`;
                const chat = await client.getChatById(whatsappId);
                if (data.isTyping) {
                    await chat.sendStateTyping();
                } else {
                    await chat.clearState();
                }
            } catch (err) {
                // WhatsApp client might not be connected yet
            }
        });

        socket.on("disconnect", () => {
            console.log(`🔌 Admin disconnected: ${socket.id}`);
        });
    });

    return io;
};

// Getter to fetch the socket instance from controllers/chatbot hooks
export const getIO = () => {
    if (!io) {
        // Return a mock/noop interface if requested before startup to prevent crashing
        return {
            to: () => ({ emit: () => {} }),
            emit: () => {}
        };
    }
    return io;
};
