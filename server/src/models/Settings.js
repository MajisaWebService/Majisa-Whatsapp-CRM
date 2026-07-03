import mongoose from "mongoose";
import { encrypt, decrypt } from "../utils/crypto.js";

const settingsSchema = new mongoose.Schema(
    {
        companyName: {
            type: String,
            default: "Majisa Web Solutions"
        },
        email: {
            type: String,
            default: "info@majisawebsolutions.com"
        },
        phone: {
            type: String,
            default: "+919400000000"
        },
        logo: {
            type: String,
            default: ""
        },
        gstDetails: {
            companyName: { type: String, default: "" },
            gstNumber: { type: String, default: "", get: decrypt, set: encrypt },
            address: { type: String, default: "" }
        },
        whatsappConfig: {
            sessionName: { type: String, default: "default" },
            autoReply: { type: Boolean, default: true }
        },
        termsAndConditions: {
            type: String,
            default: "1. All quotations are valid for 30 days.\n2. 50% advance payment is required to start the project."
        },
        paymentInfo: {
            bankName: { type: String, default: "" },
            accountNumber: { type: String, default: "", get: decrypt, set: encrypt },
            ifscCode: { type: String, default: "", get: decrypt, set: encrypt },
            upiId: { type: String, default: "" }
        },
        theme: {
            type: String,
            enum: ["light", "dark"],
            default: "dark"
        },
        manualAvgResponseTime: {
            type: String,
            default: "15 mins"
        },
        manualAvgCycleTime: {
            type: String,
            default: "7 Days"
        }
    },
    {
        timestamps: true,
        toJSON: { getters: true },
        toObject: { getters: true }
    }
);

const Settings = mongoose.model("Settings", settingsSchema);

export default Settings;
