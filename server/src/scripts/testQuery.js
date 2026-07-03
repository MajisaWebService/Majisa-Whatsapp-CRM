import mongoose from "mongoose";
import dotenv from "dotenv";
import Message from "../models/Message.js";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const messages = await Message.find({ customer: "6a46338966dda0605d7d30d8" })
            .sort({ createdAt: -1 })
            .limit(50);
        console.log(`QUERY RESULTS (total: ${messages.length}):`);
        messages.forEach(m => {
            console.log(`[${m.createdAt.toISOString()}] ${m.sender}: ${m.message.substring(0, 40)}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
run();
