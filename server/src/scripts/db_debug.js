import mongoose from "mongoose";
import dotenv from "dotenv";
import PricingRule from "../models/PricingRule.js";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/majisa_whatsapp_crm");
        console.log("Connected to MongoDB.");
        const rules = await PricingRule.find({});
        console.log(`Found ${rules.length} pricing rules total.`);
        
        const activeRules = await PricingRule.find({ isActive: true });
        console.log(`Found ${activeRules.length} active pricing rules.`);
        
        console.log("First 10 rules:");
        rules.slice(0, 10).forEach(r => {
            console.log(`- category: ${r.category}, key: ${r.key}, name: ${r.name}, isActive: ${r.isActive}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
run();
