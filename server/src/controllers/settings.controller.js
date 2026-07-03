import Settings from "../models/Settings.js";
import Admin from "../models/Admin.js";
import Customer from "../models/Customer.js";
import PricingRule from "../models/PricingRule.js";
import Project from "../models/Project.js";
import Notification from "../models/Notification.js";
import ChatState from "../models/ChatState.js";
import Message from "../models/Message.js";
import Chat from "../models/Chat.js";

// Fetch global settings (auto-creates default on first load)
export const getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({});
        }
        return res.status(200).json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update global settings
export const updateSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create(req.body);
        } else {
            settings = await Settings.findByIdAndUpdate(settings._id, req.body, {
                new: true,
                runValidators: true
            });
        }
        return res.status(200).json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Pack and dump database collections as JSON backup
export const backupDatabase = async (req, res) => {
    try {
        const admins = await Admin.find().select("-password");
        const customers = await Customer.find();
        const pricingRules = await PricingRule.find();
        const projects = await Project.find();
        const notifications = await Notification.find();
        const chatStates = await ChatState.find();
        const messages = await Message.find();
        const chats = await Chat.find();

        const backupData = {
            metadata: {
                appName: "Majisa CRM",
                timestamp: new Date().toISOString(),
                exportedBy: req.admin.email
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

        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", `attachment; filename=majisa_crm_backup_${Date.now()}.json`);
        return res.status(200).send(JSON.stringify(backupData, null, 2));

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to create database backup: " + error.message
        });
    }
};
