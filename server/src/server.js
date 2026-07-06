// src/server.js

import dotenv from "dotenv";
import http from "http";
import app from "./app.js";
import connectDB from "./config/database.js";
import { initializeWhatsApp, closeWhatsApp } from "./services/whatsapp.service.js";
import { initializeSocket } from "./sockets/socketManager.js";

// Load Environment Variables
dotenv.config();

// Connect MongoDB
await connectDB();

// Auto-seed if database is empty
try {
    const PricingRule = (await import("./models/PricingRule.js")).default;
    const count = await PricingRule.countDocuments();
    if (count === 0) {
        console.log("ℹ️ No pricing rules found in database. Auto-seeding defaults...");
        const { seedPricingData } = await import("./scripts/seedPricing.js");
        await seedPricingData(false);
    }
} catch (seedError) {
    console.error("⚠️ Auto-seeding failed:", seedError);
}

const PORT = process.env.PORT || 5000;

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

// Start HTTP Server
server.listen(PORT, async () => {
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
// Force Nodemon restart: 1