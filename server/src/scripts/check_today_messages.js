import mongoose from "mongoose";
import dotenv from "dotenv";
import Message from "../models/Message.js";
import Customer from "../models/Customer.js";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        
        const msgs = await Message.find({ createdAt: { $gte: startOfToday } })
            .populate("customer")
            .sort({ createdAt: 1 });
            
        console.log(`Found ${msgs.length} messages from today:`);
        msgs.forEach(m => {
            console.log(`[${m.createdAt.toISOString()}] ${m.sender}: ${m.message.substring(0, 60)}... | customer: ${m.customer?.customerId} | name: ${m.customer?.name}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
run();
