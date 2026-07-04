import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/majisa_whatsapp_crm";

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to database:", mongoose.connection.name);
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("Collections in DB:");
        collections.forEach(c => console.log("- " + c.name));
        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
