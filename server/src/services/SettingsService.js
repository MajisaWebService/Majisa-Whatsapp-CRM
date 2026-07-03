import Settings from "../models/Settings.js";
import Admin from "../models/Admin.js";
import Customer from "../models/Customer.js";
import PricingRule from "../models/PricingRule.js";
import Project from "../models/Project.js";
import Notification from "../models/Notification.js";
import ChatState from "../models/ChatState.js";
import Message from "../models/Message.js";
import Chat from "../models/Chat.js";

class SettingsService {
    async getSettings() {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({});
        }
        return settings;
    }

    async updateSettings(updateData) {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create(updateData);
        } else {
            settings = await Settings.findByIdAndUpdate(settings._id, updateData, {
                new: true,
                runValidators: true
            });
        }
        return settings;
    }

    async backupDatabase(adminEmail) {
        const admins = await Admin.find().select("-password");
        const customers = await Customer.find();
        const pricingRules = await PricingRule.find();
        const projects = await Project.find();
        const notifications = await Notification.find();
        const chatStates = await ChatState.find();
        const messages = await Message.find();
        const chats = await Chat.find();

        return {
            metadata: {
                appName: "Majisa CRM",
                timestamp: new Date().toISOString(),
                exportedBy: adminEmail
            },
            admins,
            customers,
            pricingRules,
            projects,
            notifications,
            chatStates,
            messages,
            chats
        };
    }
}

export default new SettingsService();
