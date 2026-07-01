// src/server.js

import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/database.js";
import { initializeWhatsApp, closeWhatsApp } from "./services/whatsapp.service.js";

// Load Environment Variables
dotenv.config();

// Connect MongoDB
await connectDB();

const PORT = process.env.PORT || 5000;

// Start Express Server
const server = app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);

    // Initialize WhatsApp
    initializeWhatsApp();
});

// Graceful shutdown handler
const handleShutdown = async (signal) => {
    console.log(`\n⚠️ Received ${signal}. Graceful shutdown initiated...`);
    
    // Close WhatsApp client (closes Puppeteer browser cleanly)
    await closeWhatsApp();
    
    // Close HTTP server
    server.close(() => {
        console.log("💤 Express server stopped.");
        process.exit(0);
    });
    
    // Force exit if shutdown takes too long
    setTimeout(() => {
        console.log("⚠️ Shutdown timed out, forcing exit.");
        process.exit(1);
    }, 10000);
};

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));