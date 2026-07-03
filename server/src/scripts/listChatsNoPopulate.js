import mongoose from "mongoose";
import dotenv from "dotenv";
import Chat from "../models/Chat.js";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const chats = await Chat.find();
        console.log("CHATS IN DB:");
        console.log(JSON.stringify(chats, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
run();
