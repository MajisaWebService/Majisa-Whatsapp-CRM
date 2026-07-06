import mongoose from "mongoose";
import dotenv from "dotenv";
import Message from "../models/Message.js";
import Customer from "../models/Customer.js";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const customer = await Customer.findOne({ customerId: "160279740575899@lid" });
        if (!customer) {
            console.log("Customer not found");
            process.exit(1);
        }
        console.log(`Found Customer: ${customer.name} (${customer.customerId})`);
        
        const msgs = await Message.find({ customer: customer._id }).sort({ createdAt: 1 });
        console.log(`Found ${msgs.length} messages:`);
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
