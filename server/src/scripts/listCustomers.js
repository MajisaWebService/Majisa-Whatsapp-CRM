import mongoose from "mongoose";
import dotenv from "dotenv";
import Customer from "../models/Customer.js";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const custs = await Customer.find();
        console.log("CUSTOMERS IN DB:");
        custs.forEach(c => {
            console.log(`_id: ${c._id} | customerId: ${c.customerId} | name: ${c.name} | phone: ${c.phone}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
run();
