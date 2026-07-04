import ChatService from "../services/ChatService.js";

// Retrieve all active chat conversations sorted by recent activity
export const getAllChats = async (req, res, next) => {
    try {
        const chats = await ChatService.getAllChats();
        return res.status(200).json({ success: true, data: chats });
    } catch (error) {
        next(error);
    }
};

// Retrieve paginated message thread of a specific customer
export const getChatMessages = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const messages = await ChatService.getChatMessages(req.params.customerId, page, limit);
        return res.status(200).json({ success: true, data: messages });
    } catch (error) {
        next(error);
    }
};

// Send an outgoing admin message via WhatsApp Web and save to DB
export const sendMessage = async (req, res, next) => {
    try {
        const { customerId, messageText } = req.body;
        if (!customerId || !messageText) {
            return res.status(400).json({ success: false, message: "Customer ID and Message Text are required." });
        }

        const savedMessage = await ChatService.sendMessage(customerId, messageText);
        return res.status(201).json({ success: true, data: savedMessage });
    } catch (error) {
        next(error);
    }
};

// Reset unread message count
export const markAsRead = async (req, res, next) => {
    try {
        const chat = await ChatService.markAsRead(req.params.chatId);
        return res.status(200).json({ success: true, data: chat });
    } catch (error) {
        next(error);
    }
};

// Send media (Images, PDFs, Audio, Voice Notes) via base64 upload
export const sendMediaMessage = async (req, res, next) => {
    try {
        const { customerId, fileData, fileName, mimeType, messageText } = req.body;
        if (!customerId || !fileData || !fileName || !mimeType) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: customerId, fileData, fileName, mimeType."
            });
        }

        const savedMessage = await ChatService.sendMediaMessage({
            customerId,
            fileData,
            fileName,
            mimeType,
            messageText
        });

        return res.status(201).json({ success: true, data: savedMessage });
    } catch (error) {
        next(error);
    }
};

// Delete a chat conversation and its history
export const deleteChat = async (req, res, next) => {
    try {
        await ChatService.deleteChat(req.params.chatId);
        return res.status(200).json({ success: true, message: "Chat deleted successfully." });
    } catch (error) {
        next(error);
    }
};
