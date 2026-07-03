import mongoose from "mongoose";
import dotenv from "dotenv";
import Message from "../models/Message.js";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const msgs = await Message.find().sort({ createdAt: -1 }).limit(10);
        console.log("LATEST MESSAGES IN DB:");
        msgs.forEach(m => {
            console.log(`[${m.createdAt.toISOString()}] ${m.sender}: ${m.message}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
run();
