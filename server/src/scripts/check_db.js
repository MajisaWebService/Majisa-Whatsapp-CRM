import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import Message from "../models/Message.js";

async function run() {
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/majisa_whatsapp_crm");
        const customer = await Customer.findOne({ name: /Modh Tirth/i });
        if (!customer) {
            console.log("❌ Customer 'Modh Tirth' not found in database.");
            process.exit(0);
        }
        console.log("Found Customer:", customer._id, "| Name:", customer.name, "| Phone:", customer.phone);
        
        const messages = await Message.find({ customer: customer._id }).sort({ createdAt: 1 });
        console.log(`Total messages logged in DB: ${messages.length}`);
        messages.forEach((m, idx) => {
            console.log(`${idx + 1}. [${m.createdAt.toLocaleTimeString()}] ${m.sender}: ${m.message.substring(0, 60)}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
