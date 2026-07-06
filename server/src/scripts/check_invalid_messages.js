import mongoose from "mongoose";
import dotenv from "dotenv";
import Message from "../models/Message.js";
import Customer from "../models/Customer.js";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const msgs = await Message.find({ message: /Invalid Option/i }).populate("customer").sort({ createdAt: -1 });
        console.log(`Found ${msgs.length} invalid option messages:`);
        msgs.forEach(m => {
            console.log(`[${m.createdAt.toISOString()}] BOT: ${m.message.substring(0, 50)}... | customerId: ${m.customer?.customerId} | name: ${m.customer?.name}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
run();
