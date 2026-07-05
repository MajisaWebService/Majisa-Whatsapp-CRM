import mongoose from "mongoose";
import dotenv from "dotenv";
import Customer from "../models/Customer.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/majisa_whatsapp_crm";

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to database:", mongoose.connection.name);
        const customers = await Customer.find().lean();
        console.log("Customers in DB count:", customers.length);
        customers.forEach(c => {
            console.log(`ID: ${c.customerId}, Name: ${c.name}, Status: ${c.status}, isBotPaused: ${c.isBotPaused}`);
        });
        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
