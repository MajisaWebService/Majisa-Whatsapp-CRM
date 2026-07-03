import mongoose from "mongoose";
import dotenv from "dotenv";
import Chat from "../models/Chat.js";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const chats = await Chat.find().populate("customer");
        console.log("CHATS IN DB:");
        chats.forEach(c => {
            console.log(`_id: ${c._id} | customer._id: ${c.customer?._id} | customerName: ${c.customer?.name} | lastMessage: ${c.lastMessage}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
run();
