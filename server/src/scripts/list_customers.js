import mongoose from "mongoose";
import Customer from "../models/Customer.js";

async function run() {
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/majisa_whatsapp_crm");
        const customers = await Customer.find({});
        console.log("=== CUSTOMERS IN DB ===");
        customers.forEach((c) => {
            console.log(`
JID: ${c.customerId}
ID: ${c._id}
Name: "${c.name}"
Company: "${c.company}"
Email: "${c.email}"
Phone: "${c.phone}"
Status: "${c.status}"
Bot Paused: ${c.isBotPaused}
            `);
        });
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
