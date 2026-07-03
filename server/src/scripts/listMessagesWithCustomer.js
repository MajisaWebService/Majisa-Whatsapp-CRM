import mongoose from "mongoose";
import dotenv from "dotenv";
import Message from "../models/Message.js";
import Customer from "../models/Customer.js";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const msgs = await Message.find().populate("customer").sort({ createdAt: -1 }).limit(20);
        console.log("MESSAGES IN DB:");
        msgs.forEach(m => {
            console.log(`[${m.createdAt.toISOString()}] ${m.sender}: ${m.message.substring(0, 30)}... | customer._id: ${m.customer?._id} | customerId: ${m.customer?.customerId} | name: ${m.customer?.name}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
run();
