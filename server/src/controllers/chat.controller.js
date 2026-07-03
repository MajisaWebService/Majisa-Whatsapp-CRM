import fs from "fs";
import path from "path";
import pkg from "whatsapp-web.js";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import Customer from "../models/Customer.js";
import { client } from "../services/whatsapp.service.js";
import { emitNewMessage } from "../sockets/emitter.js";

const { MessageMedia } = pkg;

// Retrieve all active chat conversations sorted by recent activity
export const getAllChats = async (req, res) => {
    try {
        const chats = await Chat.find()
            .populate("customer")
            .sort({ updatedAt: -1 });
        return res.status(200).json({ success: true, data: chats });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Retrieve paginated message thread of a specific customer
export const getChatMessages = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const messages = await Message.find({ customer: req.params.customerId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Sort chronologically for client display
        messages.reverse();

        return res.status(200).json({ success: true, data: messages });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Send an outgoing admin message via WhatsApp Web and save to DB
export const sendMessage = async (req, res) => {
    try {
        const { customerId, messageText } = req.body;
        if (!customerId || !messageText) {
            return res.status(400).json({ success: false, message: "Customer ID and Message Text are required." });
        }

        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found." });
        }

        // Deliver actual message through the initialized WhatsApp instance
        const whatsappId = customer.customerId;
        await client.sendMessage(whatsappId, messageText);

        // Maintain or update the parent Chat session
        let chat = await Chat.findOne({ customer: customer._id });
        if (!chat) {
            chat = await Chat.create({ customer: customer._id, lastMessage: messageText });
        } else {
            chat.lastMessage = messageText;
            chat.unreadCount = 0; // Admin replied, clear unread status
            await chat.save();
        }

        // Store log into messages collection
        const savedMessage = await Message.create({
            chat: chat._id,
            customer: customer._id,
            sender: "ADMIN",
            message: messageText,
            type: "TEXT",
            status: "SENT"
        });

        // Broadcast event through Socket.IO to keep dashboard screens synchronised
        try {
            emitNewMessage(savedMessage);
        } catch (socketError) {
            console.error("Socket emit failed:", socketError.message);
        }

        return res.status(201).json({ success: true, data: savedMessage });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Reset unread message count
export const markAsRead = async (req, res) => {
    try {
        const chat = await Chat.findByIdAndUpdate(
            req.params.chatId,
            { unreadCount: 0 },
            { new: true }
        );
        if (!chat) {
            return res.status(404).json({ success: false, message: "Chat not found." });
        }
        return res.status(200).json({ success: true, data: chat });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Send media (Images, PDFs, Audio, Voice Notes) via base64 upload
export const sendMediaMessage = async (req, res) => {
    try {
        const { customerId, fileData, fileName, mimeType, messageText } = req.body;
        if (!customerId || !fileData || !fileName || !mimeType) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: customerId, fileData, fileName, mimeType."
            });
        }

        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found." });
        }

        // Decode base64 to buffer
        const fileBuffer = Buffer.from(fileData, "base64");

        // Ensure uploads directory exists
        const uploadsDir = path.resolve("./uploads");
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filePath = path.join(uploadsDir, `${Date.now()}_${fileName}`);
        fs.writeFileSync(filePath, fileBuffer);

        // Send media using whatsapp-web.js MessageMedia
        const media = new MessageMedia(mimeType, fileData, fileName);
        await client.sendMessage(customer.customerId, media, {
            caption: messageText || ""
        });

        // Determine message type
        let msgType = "DOCUMENT";
        if (mimeType.startsWith("image/")) {
            msgType = "IMAGE";
        } else if (mimeType === "application/pdf") {
            msgType = "PDF";
        } else if (mimeType.startsWith("audio/")) {
            msgType = "AUDIO";
        }

        // Maintain or update the parent Chat session
        let chat = await Chat.findOne({ customer: customer._id });
        const lastMsgText = messageText ? `📎 File: ${fileName} - ${messageText}` : `📎 File: ${fileName}`;
        if (!chat) {
            chat = await Chat.create({ customer: customer._id, lastMessage: lastMsgText });
        } else {
            chat.lastMessage = lastMsgText;
            chat.unreadCount = 0;
            await chat.save();
        }

        // Store log into messages collection
        const fileUrl = `/uploads/${path.basename(filePath)}`;
        const savedMessage = await Message.create({
            chat: chat._id,
            customer: customer._id,
            sender: "ADMIN",
            message: fileUrl,
            type: msgType,
            status: "SENT"
        });

        // If caption was sent, also log it as a separate text message or caption parameter (captions are logged with media)
        try {
            emitNewMessage(savedMessage);
        } catch (socketError) {
            console.error("Socket emit failed:", socketError.message);
        }

        return res.status(201).json({ success: true, data: savedMessage });

    } catch (error) {
        console.error("Failed to send media message:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
