import mongoose from "mongoose";
import dotenv from "dotenv";
import { getServices } from "../chatbot/config/pricing.config.js";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/majisa_whatsapp_crm");
        console.log("Connected to MongoDB.");
        const services = await getServices();
        console.log("getServices() returned:");
        console.dir(services, { depth: null });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
run();
