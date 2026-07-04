import mongoose from "mongoose";
import ChatService from "../services/ChatService.js";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import ChatState from "../models/ChatState.js";
import Customer from "../models/Customer.js";

async function run() {
    try {
        console.log("🔌 Connecting to MongoDB...");
        await mongoose.connect("mongodb://127.0.0.1:27017/majisa_whatsapp_crm");
        console.log("✅ Connected.");

        // 1. Create mock Customer
        let customer = await Customer.findOne({ customerId: "test_delete_contact@c.us" });
        if (!customer) {
            customer = await Customer.create({
                customerId: "test_delete_contact@c.us",
                name: "Test Delete Customer",
                phone: "9999988888"
            });
        }

        // 2. Create mock ChatState
        let chatState = await ChatState.findOne({ customerId: customer.customerId });
        if (!chatState) {
            chatState = await ChatState.create({
                customerId: customer.customerId,
                state: "MAIN_MENU"
            });
        }

        // 3. Create mock Chat
        let chat = await Chat.findOne({ customer: customer._id });
        if (!chat) {
            chat = await Chat.create({
                customer: customer._id,
                lastMessage: "Hello test delete",
                unreadCount: 2
            });
        }

        // 4. Create mock Messages
        await Message.create([
            { chat: chat._id, customer: customer._id, sender: "CUSTOMER", message: "Hi", type: "TEXT" },
            { chat: chat._id, customer: customer._id, sender: "BOT", message: "Hello", type: "TEXT" }
        ]);

        console.log("\nCreated mock data:");
        console.log("- Chat ID:", chat._id);
        console.log("- Customer ID:", customer.customerId);
        console.log("- Messages count before delete:", await Message.countDocuments({ chat: chat._id }));

        console.log("\n🚀 Triggering ChatService.deleteChat...");
        await ChatService.deleteChat(chat._id);
        console.log("✅ Deletion service ran successfully.");

        // 5. Verification checks
        const chatCheck = await Chat.findById(chat._id);
        const msgCountCheck = await Message.countDocuments({ chat: chat._id });
        const stateCheck = await ChatState.findOne({ customerId: customer.customerId });
        const customerCheck = await Customer.findById(customer._id);

        console.log("\n--- Verification Results ---");
        console.log("Chat exists in DB       :", !!chatCheck, "(Expected: false)");
        console.log("Messages count in DB    :", msgCountCheck, "(Expected: 0)");
        console.log("ChatState exists in DB  :", !!stateCheck, "(Expected: false)");
        console.log("Customer exists in DB   :", !!customerCheck, "(Expected: true - we do NOT delete Customer profiles)");

        if (!chatCheck && msgCountCheck === 0 && !stateCheck && customerCheck) {
            console.log("\n🎉 SUCCESS: Chat deletion backend flow is working perfectly!");
        } else {
            console.error("\n❌ FAILURE: Verification conditions not met.");
        }

        // Cleanup customer
        await Customer.findByIdAndDelete(customer._id);

    } catch (e) {
        console.error("Simulation failed:", e);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}
run();
