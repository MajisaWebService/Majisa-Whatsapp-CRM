import mongoose from "mongoose";
import { handleIncomingMessage } from "../chatbot/index.js";
import Customer from "../models/Customer.js";
import ChatState from "../models/ChatState.js";
import { updateChatState } from "../chatbot/stateManager.js";

async function run() {
    try {
        console.log("🔌 Connecting to MongoDB...");
        await mongoose.connect("mongodb://127.0.0.1:27017/majisa_whatsapp_crm");
        console.log("✅ Connected.");

        const testCustomerId = "test_loop_bot@c.us";

        // Clean up / setup customer
        let customer = await Customer.findOne({ customerId: testCustomerId });
        if (!customer) {
            customer = await Customer.create({
                customerId: testCustomerId,
                name: "Test Loop Customer"
            });
        }
        customer.isBotPaused = false;
        customer.status = "New Lead";
        await customer.save();

        // Setup ChatState session to MAIN_MENU
        let chatState = await ChatState.findOne({ customerId: testCustomerId }).sort({ createdAt: -1 });
        if (!chatState) {
            chatState = await ChatState.create({
                customerId: testCustomerId,
                state: "MAIN_MENU",
                service: "",
                data: {}
            });
        } else {
            await updateChatState(testCustomerId, "MAIN_MENU", { invalidAttempts: 0 });
        }

        console.log("\n--- Starting Bot Loop Prevention Simulation ---");

        const sendInvalidMessage = async (index) => {
            console.log(`\n📬 Sending invalid message #${index}...`);
            const mockMessage = {
                from: testCustomerId,
                body: "This is some invalid option",
                fromMe: false,
                reply: async (text) => {
                    console.log(`💬 [BOT RESPONSE]:\n${text}`);
                    return { id: `mock_msg_${index}` };
                }
            };
            await handleIncomingMessage(mockMessage);
        };

        // Send 1st invalid option
        await sendInvalidMessage(1);

        // Send 2nd invalid option
        await sendInvalidMessage(2);

        // Send 3rd invalid option (should trigger bot pause)
        await sendInvalidMessage(3);

        // Fetch updated customer status
        const updatedCustomer = await Customer.findOne({ customerId: testCustomerId });
        const updatedState = await ChatState.findOne({ customerId: testCustomerId }).sort({ createdAt: -1 });

        console.log("\n--- Verification Results ---");
        console.log("Customer isBotPaused :", updatedCustomer.isBotPaused, "(Expected: true)");
        console.log("Customer status      :", updatedCustomer.status, "(Expected: Talk to Executive)");
        console.log("ChatState state      :", updatedState.state, "(Expected: COMPLETED)");
        console.log("Invalid Attempts count:", updatedState.invalidAttempts, "(Expected: 0 or reset)");

        if (updatedCustomer.isBotPaused === true && updatedCustomer.status === "Talk to Executive" && updatedState.state === "COMPLETED") {
            console.log("\n🎉 SUCCESS: Loop prevention working perfectly!");
        } else {
            console.error("\n❌ FAILURE: Verification conditions not met.");
        }

    } catch (e) {
        console.error("Simulation failed:", e);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}
run();
