import mongoose from "mongoose";
import { handleIncomingMessage } from "../chatbot/index.js";

async function run() {
    try {
        console.log("🔌 Connecting to MongoDB...");
        await mongoose.connect("mongodb://127.0.0.1:27017/majisa_whatsapp_crm");
        console.log("✅ Connected.");

        const mockMessage = {
            from: "160279740575899@lid",
            body: "Hii, I am Deep from ecibate technology, my email is deep@gmail.com, phone number 9456345212 , looking for website devlopment",
            fromMe: false,
            reply: async (text) => {
                console.log("\n💬 [REPLY SENT TO CLIENT]:");
                console.log(text);
                return { id: "mock_msg_id" };
            }
        };

        console.log("\n🚀 Triggering handleIncomingMessage...");
        await handleIncomingMessage(mockMessage);
        console.log("\n🏁 Done.");
    } catch (e) {
        console.error("Simulation failed:", e);
    } finally {
        process.exit(0);
    }
}
run();
