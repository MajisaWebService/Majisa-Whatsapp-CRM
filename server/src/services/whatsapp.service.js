// src/services/whatsapp.service.js

import pkg from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import fs from "fs";
import path from "path";
import { handleIncomingMessage } from "../chatbot/index.js";
import Customer from "../models/Customer.js";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import {
    emitWhatsAppQR,
    emitWhatsAppStatus,
    emitNewCustomer,
    emitNewMessage,
    emitTypingStatus,
    emitMessageStatus
} from "../sockets/emitter.js";

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
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--no-first-run",
            "--no-default-browser-check"
        ],
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    }
});

// ==============================
// Connection State
// ==============================

let whatsappStatus = "offline";

export const getWhatsAppStatus = () => {
    // If client is ready, it is connected
    if (client && client.info && client.info.wid) {
        return "connected";
    }
    return whatsappStatus;
};

// ==============================
// QR Code
// ==============================

client.on("qr", (qr) => {
    whatsappStatus = "offline";
    console.clear();

    console.log("========================================");
    console.log("📱 Scan this QR using WhatsApp Business");
    console.log("========================================");

    qrcode.generate(qr, {
        small: true
    });

    emitWhatsAppQR(qr);
    emitWhatsAppStatus("offline");
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
    whatsappStatus = "connected";
    console.log("========================================");
    console.log("✅ WhatsApp Connected Successfully");
    console.log("========================================");
    emitWhatsAppStatus("connected");
});

// ==============================
// Authentication Failure
// ==============================

client.on("auth_failure", (msg) => {
    whatsappStatus = "offline";
    console.error("❌ Authentication Failed");
    console.error(msg);
    emitWhatsAppStatus("auth_failed");
});

// ==============================
// Disconnected
// ==============================

client.on("disconnected", (reason) => {
    whatsappStatus = "offline";
    console.log("⚠ WhatsApp Disconnected");
    console.log("Reason:", reason);
    emitWhatsAppStatus("offline");
});

// ==============================
// Messages Logging & Handling
// ==============================

client.on("message_create", async (message) => {
    try {
        const customerId = message.fromMe ? message.to : message.from;

        if (customerId === "status@broadcast") return;

        // Only allow direct messages (chats ending in @c.us or @lid)
        const isDirectMessage = customerId.endsWith("@c.us") || customerId.endsWith("@lid");
        if (!isDirectMessage) return;

        // Auto-create customer record
        let customer = await Customer.findOne({ customerId });
        if (!customer) {
            customer = await Customer.create({
                customerId,
                name: message.fromMe ? "Admin/Bot" : (message._data?.notifyName || "WhatsApp Contact")
            });
            emitNewCustomer(customer);
        }

        // Auto-create chat session
        let chat = await Chat.findOne({ customer: customer._id });
        if (!chat) {
            chat = await Chat.create({
                customer: customer._id,
                lastMessage: message.hasMedia ? "📎 Media attachment" : message.body
            });
        }

        if (message.fromMe) {
            // Check if this admin message was already saved by the API
            const threeSecondsAgo = new Date(Date.now() - 3000);
            const exists = await Message.findOne({
                customer: customer._id,
                sender: { $in: ["ADMIN", "BOT"] },
                message: message.body,
                createdAt: { $gte: threeSecondsAgo }
            });

            if (!exists) {
                // Log the message as BOT
                const savedMessage = await Message.create({
                    chat: chat._id,
                    customer: customer._id,
                    sender: "BOT",
                    message: message.body,
                    type: "TEXT",
                    status: "SENT"
                });

                chat.lastMessage = message.body;
                await chat.save();

                emitNewMessage(savedMessage);
            }
        } else {
            // Check for media attachments
            let msgType = "TEXT";
            let msgBody = message.body;

            if (message.hasMedia) {
                try {
                    const media = await message.downloadMedia();
                    if (media) {
                        const fileBuffer = Buffer.from(media.data, "base64");
                        const uploadsDir = path.resolve("./uploads");
                        if (!fs.existsSync(uploadsDir)) {
                            fs.mkdirSync(uploadsDir, { recursive: true });
                        }
                        const ext = media.mimetype.split("/")[1]?.split(";")[0] || "bin";
                        const fileName = `${Date.now()}.${ext}`;
                        const filePath = path.join(uploadsDir, fileName);
                        fs.writeFileSync(filePath, fileBuffer);

                        msgBody = `/uploads/${fileName}`;
                        if (media.mimetype.startsWith("image/")) {
                            msgType = "IMAGE";
                        } else if (media.mimetype === "application/pdf") {
                            msgType = "PDF";
                        } else if (media.mimetype.startsWith("audio/")) {
                            msgType = "AUDIO";
                        } else {
                            msgType = "DOCUMENT";
                        }
                    }
                } catch (mediaError) {
                    console.error("Failed to download incoming WhatsApp media:", mediaError.message);
                }
            }

            // Log incoming customer message
            const savedMessage = await Message.create({
                chat: chat._id,
                customer: customer._id,
                sender: "CUSTOMER",
                message: msgBody,
                type: msgType,
                status: "READ"
            });

            chat.lastMessage = message.hasMedia ? `📎 [File] ${msgType}` : message.body;
            chat.unreadCount += 1;
            await chat.save();

            emitNewMessage(savedMessage);

            // Pass to chatbot state machine if not paused by administrator and not a media message.
            if (!customer.isBotPaused && !message.hasMedia) {
                await handleIncomingMessage(message);
            } else if (message.hasMedia) {
                console.log(`🤖 Chatbot bypassed for customer: ${customer.name || customer.customerId} (Media message ignored).`);
            } else {
                console.log(`🤖 Chatbot bypassed for customer: ${customer.name || customer.customerId} (Bot paused by administrator).`);
            }
        }

    } catch (error) {
        console.error("Message Handler Error:", error);
    }
});

// Broadcast typing indicator from WhatsApp contacts
client.on("chat_state_changed", async (chat) => {
    try {
        if (chat.isTyping) {
            emitTypingStatus(chat.id._serialized, true);
        } else {
            emitTypingStatus(chat.id._serialized, false);
        }
    } catch (e) {
        console.error("Failed to emit typing state:", e.message);
    }
});

// Listen for message read/delivered checks from WhatsApp and update status
client.on("message_ack", async (msg, ack) => {
    try {
        // ack: 1 = sent, 2 = delivered, 3 = read
        let status = "SENT";
        if (ack === 2) status = "DELIVERED";
        else if (ack === 3) status = "READ";

        const customer = await Customer.findOne({ customerId: msg.to });
        if (customer) {
            const lastMsg = await Message.findOne({
                customer: customer._id,
                sender: { $in: ["ADMIN", "BOT"] }
            }).sort({ createdAt: -1 });

            if (lastMsg) {
                lastMsg.status = status;
                await lastMsg.save();

                emitMessageStatus(lastMsg._id, customer._id, status);
            }
        }
    } catch (e) {
        console.error("Failed to handle message acknowledgment:", e.message);
    }
});


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