// src/chatbot/index.js

import { getChatState, updateChatState } from "./stateManager.js";
import { showMainMenu } from "./menuHandler.js";
import { handleCustomerInformation } from "./handlers/customer.handler.js";
import { handleServiceFlow } from "./handlers/service.handler.js";
import { handleBack } from "./handlers/back.handler.js";
import {
    createCustomer,
    updateCustomer
} from "./services/customer.service.js";
import { getServices } from "./config/pricing.config.js";

// States where "0" means back (not skip features)
const BACK_ENABLED_STATES = [
    "ASK_NAME", "ASK_COMPANY", "ASK_EMAIL", "ASK_PHONE", "ASK_CITY",
    "SELECT_SUB_TYPE", "SELECT_PAGES", "SELECT_FEATURES", "SHOW_QUOTATION"
];

export const handleIncomingMessage = async (message) => {
    try {

        // Ignore bot's own messages
        if (message.fromMe) return;

        // Ignore status broadcasts
        if (message.from === "status@broadcast") return;

        const customerId = message.from;
        const text = message.body.trim().toLowerCase();

        // Create customer if not exists
        await createCustomer(customerId);

        // Get current chat state
        const chatState = await getChatState(customerId);

        console.log("========================================");
        console.log("📩 Incoming Message");
        console.log("Customer :", customerId);
        console.log("State    :", chatState.state);
        console.log("Message  :", text);
        console.log("========================================");

        // ==========================================
        // Global Commands
        // ==========================================

        const greetings = [
            "hi", "hii", "hiii", "hello", "hey",
            "start", "menu", "home"
        ];

        if (greetings.includes(text)) {
            await updateChatState(customerId, "WELCOME");
            await showMainMenu(message);
            return;
        }

        if (text === "restart") {
            await updateChatState(customerId, "WELCOME");
            await showMainMenu(message);
            return;
        }

        // ==========================================
        // Global Back Command — "0" or "back"
        // ==========================================

        const isBackCommand = (text === "0" || text === "back");

        if (isBackCommand && BACK_ENABLED_STATES.includes(chatState.state)) {

            // SELECT_FEATURES uses "skip" to skip — "0" here still means back
            const handled = await handleBack(message, chatState);

            if (handled) return;
        }

        // ==========================================
        // Conversation State Machine
        // ==========================================

        switch (chatState.state) {

            // ------------------------------------------
            // Welcome
            // ------------------------------------------

            case "WELCOME":

                await showMainMenu(message);
                break;

            // ------------------------------------------
            // Main Menu (10 services)
            // ------------------------------------------

            case "MAIN_MENU": {

                // Option 10 — Talk to Executive
                if (text === "10") {

                    await updateChatState(customerId, "COMPLETED");

                    await updateCustomer(customerId, {
                        status: "Talk to Executive"
                    });

                    await message.reply(
                        `👨‍💼 Thank you for contacting *Majisa Web Solutions*.

One of our executives will contact you shortly.

📞 Majisa Web Solutions`
                    );

                    break;
                }

                // Options 1–9 — Service Selection
                const SERVICES = await getServices();
                const service = SERVICES[text];

                if (!service) {

                    await message.reply(
                        `❌ Invalid Option

Please choose a number between *1* and *10*.

Type *menu* to see the options again.`
                    );

                    break;
                }

                // Save selected service
                await updateCustomer(customerId, {
                    service: service.name
                });

                await updateChatState(customerId, "ASK_NAME", {
                    service: service.name,
                    serviceKey: text
                });

                await message.reply(
                    `${service.emoji} *${service.name}*

Great choice!

👤 Please enter your Full Name.

_⬅️ Type *0* to go back_`
                );

                break;
            }

            // ------------------------------------------
            // Customer Information Collection
            // ------------------------------------------

            case "ASK_NAME":
            case "ASK_COMPANY":
            case "ASK_EMAIL":
            case "ASK_PHONE":
            case "ASK_CITY":

                await handleCustomerInformation(message, chatState);
                break;

            // ------------------------------------------
            // Service Sub-Flow
            // (Sub-Type → Pages → Features → Quotation)
            // ------------------------------------------

            case "SELECT_SUB_TYPE":
            case "SELECT_PAGES":
            case "SELECT_FEATURES":
            case "SHOW_QUOTATION":

                await handleServiceFlow(message, chatState);
                break;

            // ------------------------------------------
            // Completed
            // ------------------------------------------

            case "COMPLETED":

                await message.reply(
                    "✅ Your inquiry is complete.\n\nType *Hi* to start a new inquiry."
                );

                break;

            // ------------------------------------------
            // Unknown State — Reset
            // ------------------------------------------

            default:

                await updateChatState(customerId, "WELCOME");
                await showMainMenu(message);
                break;
        }

    } catch (error) {

        console.error("❌ Chatbot Error:", error);

        try {
            await message.reply(
                `⚠️ Something went wrong.\n\nPlease type *menu* to start again.`
            );
        } catch (replyError) {
            console.error("❌ Error sending error message:", replyError);
        }
    }
};