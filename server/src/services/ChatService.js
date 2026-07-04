import fs from "fs";
import path from "path";
import pkg from "whatsapp-web.js";
import ChatRepository from "../repositories/ChatRepository.js";
import CustomerRepository from "../repositories/CustomerRepository.js";
import { client } from "./whatsapp.service.js";
import { emitNewMessage } from "../sockets/emitter.js";

const { MessageMedia } = pkg;

class ChatService {
    async getAllChats() {
        return ChatRepository.findAllChats();
    }

    async getChatMessages(customerId, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        // Fetch recent messages
        const messages = await ChatRepository.findRecentMessages(
            { customer: customerId },
            limit
        );
        return messages.reverse();
    }

    async sendMessage(customerId, messageText) {
        const customer = await CustomerRepository.findById(customerId);
        if (!customer) {
            throw new Error("Customer not found.");
        }

        // Deliver through WhatsApp Web client
        await client.sendMessage(customer.customerId, messageText);

        // Update/Create chat session
        let chat = await ChatRepository.findChatByCustomer(customer._id);
        if (!chat) {
            chat = await ChatRepository.createChat({
                customer: customer._id,
                lastMessage: messageText,
                unreadCount: 0
            });
        } else {
            await ChatRepository.updateChat(chat._id, {
                lastMessage: messageText,
                unreadCount: 0
            });
        }

        // Store log message
        const savedMessage = await ChatRepository.createMessage({
            chat: chat._id,
            customer: customer._id,
            sender: "ADMIN",
            message: messageText,
            type: "TEXT",
            status: "SENT"
        });

        // Emit through WebSockets
        try {
            emitNewMessage(savedMessage);
        } catch (err) {
            console.error("Socket emit failed:", err.message);
        }

        return savedMessage;
    }

    async sendMediaMessage({ customerId, fileData, fileName, mimeType, messageText }) {
        const customer = await CustomerRepository.findById(customerId);
        if (!customer) {
            throw new Error("Customer not found.");
        }

        const fileBuffer = Buffer.from(fileData, "base64");
        const uploadsDir = path.resolve("./uploads");
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filePath = path.join(uploadsDir, `${Date.now()}_${fileName}`);
        fs.writeFileSync(filePath, fileBuffer);

        const media = new MessageMedia(mimeType, fileData, fileName);
        await client.sendMessage(customer.customerId, media, {
            caption: messageText || ""
        });

        let msgType = "DOCUMENT";
        if (mimeType.startsWith("image/")) {
            msgType = "IMAGE";
        } else if (mimeType === "application/pdf") {
            msgType = "PDF";
        } else if (mimeType.startsWith("audio/")) {
            msgType = "AUDIO";
        }

        let chat = await ChatRepository.findChatByCustomer(customer._id);
        const lastMsgText = messageText ? `📎 File: ${fileName} - ${messageText}` : `📎 File: ${fileName}`;
        if (!chat) {
            chat = await ChatRepository.createChat({
                customer: customer._id,
                lastMessage: lastMsgText,
                unreadCount: 0
            });
        } else {
            await ChatRepository.updateChat(chat._id, {
                lastMessage: lastMsgText,
                unreadCount: 0
            });
        }

        const fileUrl = `/uploads/${path.basename(filePath)}`;
        const savedMessage = await ChatRepository.createMessage({
            chat: chat._id,
            customer: customer._id,
            sender: "ADMIN",
            message: fileUrl,
            type: msgType,
            status: "SENT"
        });

        try {
            emitNewMessage(savedMessage);
        } catch (err) {
            console.error("Socket emit failed:", err.message);
        }

        return savedMessage;
    }

    async markAsRead(chatId) {
        const chat = await ChatRepository.updateChat(chatId, { unreadCount: 0 });
        if (!chat) {
            throw new Error("Chat not found.");
        }
        return chat;
    }

    async deleteChat(chatId) {
        const chat = await ChatRepository.findChatById(chatId);
        if (!chat) {
            throw new Error("Chat not found.");
        }

        // Delete all messages linked to this chat
        await ChatRepository.deleteMessagesByChat(chatId);

        // Delete ChatState if customer exists
        if (chat.customer) {
            const customer = await CustomerRepository.findById(chat.customer._id);
            if (customer) {
                await ChatRepository.deleteChatStateByCustomerId(customer.customerId);
            }
        }

        // Delete Chat session document itself
        await ChatRepository.deleteChatById(chatId);
    }
}

export default new ChatService();
