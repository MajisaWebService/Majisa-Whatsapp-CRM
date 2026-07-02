// src/services/whatsapp.service.js

import pkg from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { handleIncomingMessage } from "../chatbot/index.js";

const { Client, LocalAuth, MessageMedia } = pkg;

// Create WhatsApp Client
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: "./sessions"
    }),
    puppeteer: {
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox"
        ]
    }
});

// ==============================
// QR Code
// ==============================

client.on("qr", (qr) => {

    console.clear();

    console.log("========================================");
    console.log("📱 Scan this QR using WhatsApp Business");
    console.log("========================================");

    qrcode.generate(qr, {
        small: true
    });

});

// ==============================
// Authentication
// ==============================

client.on("authenticated", () => {
    console.log("🔐 WhatsApp Authenticated");
});

// ==============================
// Ready
// ==============================

client.on("ready", () => {
    console.log("========================================");
    console.log("✅ WhatsApp Connected Successfully");
    console.log("========================================");
});

// ==============================
// Authentication Failure
// ==============================

client.on("auth_failure", (msg) => {
    console.error("❌ Authentication Failed");
    console.error(msg);
});

// ==============================
// Disconnected
// ==============================

client.on("disconnected", (reason) => {
    console.log("⚠ WhatsApp Disconnected");
    console.log("Reason:", reason);
});

// ==============================
// Incoming Messages
// ==============================

// For newer versions of whatsapp-web.js
client.on("message_create", async (message) => {

    try {

        if (message.fromMe) return;

        await handleIncomingMessage(message);

    } catch (error) {

        console.error("Message Handler Error:", error);

    }

});

// If your version doesn't support "message_create",
// comment the above block and uncomment this:

/*
client.on("message", async (message) => {

    try {

        if (message.fromMe) return;

        await handleIncomingMessage(message);

    } catch (error) {

        console.error("Message Handler Error:", error);

    }

});
*/

// ==============================
// Initialize WhatsApp
// ==============================

const initializeWhatsApp = async () => {

    try {

        console.log("📱 Initializing WhatsApp...");

        await client.initialize();

    } catch (error) {

        console.error("Initialization Error:", error);

    }

};

// ==============================
// Close WhatsApp
// ==============================

const closeWhatsApp = async () => {

    try {

        console.log("Closing WhatsApp...");

        await client.destroy();

        console.log("✅ WhatsApp Closed");

    } catch (error) {

        console.error(error);

    }

};

// ==============================
// Send PDF to Customer
// ==============================

const sendPdfToCustomer = async (customerId, pdfPath, caption = "") => {

    try {

        const media = MessageMedia.fromFilePath(pdfPath);

        await client.sendMessage(customerId, media, {
            caption
        });

        console.log("✅ PDF Sent to:", customerId);

    } catch (error) {

        console.error("❌ Error sending PDF:", error);
        throw error;

    }

};

export {
    client,
    initializeWhatsApp,
    closeWhatsApp,
    sendPdfToCustomer
};