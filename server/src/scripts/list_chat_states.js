import mongoose from "mongoose";
import dotenv from "dotenv";
import ChatState from "../models/ChatState.js";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/majisa_whatsapp_crm");
        console.log("Connected to MongoDB.");
        const states = await ChatState.find().sort({ updatedAt: -1 }).limit(10);
        console.log("LATEST 10 CHAT STATES:");
        states.forEach(s => {
            console.log(`customerId: ${s.customerId} | state: ${s.state} | service: ${s.service} | updatedAt: ${s.updatedAt}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
run();
