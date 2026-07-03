import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import ChatState from "../models/ChatState.js";

class ChatRepository {
    // Chats
    async findChatById(id) {
        return Chat.findById(id).populate("customer");
    }

    async findChatByCustomer(customerId) {
        return Chat.findOne({ customer: customerId });
    }

    async createChat(chatData) {
        return Chat.create(chatData);
    }

    async updateChat(id, updateData) {
        return Chat.findByIdAndUpdate(id, updateData, { new: true }).populate("customer");
    }

    async countChats(query) {
        return Chat.countDocuments(query);
    }

    async findAllChats() {
        return Chat.find().populate("customer").sort({ updatedAt: -1 });
    }

    // Messages
    async createMessage(msgData) {
        return Message.create(msgData);
    }

    async findMessagesByCustomer(customerId, limit = 50) {
        return Message.find({ customer: customerId }).sort({ createdAt: -1 }).limit(limit);
    }

    async countMessages(query) {
        return Message.countDocuments(query);
    }

    async findRecentMessages(query, limit = 300) {
        return Message.find(query).sort({ createdAt: -1 }).limit(limit);
    }

    // ChatState (Chatbot Automation Flow State)
    async findChatState(phone) {
        return ChatState.findOne({ phone });
    }

    async saveChatState(phone, stateData) {
        return ChatState.findOneAndUpdate(
            { phone },
            stateData,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    }

    async deleteChatState(phone) {
        return ChatState.findOneAndDelete({ phone });
    }
}

export default new ChatRepository();
