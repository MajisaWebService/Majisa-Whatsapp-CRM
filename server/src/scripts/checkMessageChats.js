import mongoose from "mongoose";
import dotenv from "dotenv";
import Message from "../models/Message.js";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const msgs = await Message.find({ customer: "6a46338966dda0605d7d30d8" });
        const chatIds = new Set(msgs.map(m => m.chat?.toString()));
        console.log("Chat IDs associated with customer messages:", Array.from(chatIds));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
run();
