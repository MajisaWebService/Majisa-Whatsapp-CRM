import mongoose from "mongoose";
import dotenv from "dotenv";
import Message from "../models/Message.js";
import Customer from "../models/Customer.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/majisa_whatsapp_crm";

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to database:", mongoose.connection.name);
        
        const recentMessages = await Message.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("customer")
            .lean();

        console.log("Recent 10 Messages in DB:");
        recentMessages.forEach(m => {
            console.log(`[${m.createdAt.toISOString()}] Sender: ${m.sender}, Message: "${m.message}", Customer ID: ${m.customer?.customerId}, Customer Status: ${m.customer?.status}, isBotPaused: ${m.customer?.isBotPaused}`);
        });

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
