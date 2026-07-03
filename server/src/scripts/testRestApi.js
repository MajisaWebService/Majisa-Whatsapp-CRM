import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "../models/Admin.js";
import generateToken from "../utils/generateToken.js";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const admin = await Admin.findOne({ email: "admin@majisa.com" });
        if (!admin) {
            console.error("Admin user not found");
            process.exit(1);
        }
        const token = generateToken(admin._id);

        console.log("Fetching REST API endpoint directly...");
        const response = await fetch("http://localhost:5000/api/v1/chats/6a46338966dda0605d7d30d8/messages", {
            headers: { Authorization: `Bearer ${token}` }
        });
        const result = await response.json();
        
        console.log("REST API RESPONSE SUCCESS:", result.success);
        if (result.success) {
            console.log(`Returned messages count: ${result.data.length}`);
            console.log("First message in response:", result.data[0]?.message);
            console.log("Last message in response:", result.data[result.data.length - 1]?.message);
        } else {
            console.log("Error response:", result);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
run();
