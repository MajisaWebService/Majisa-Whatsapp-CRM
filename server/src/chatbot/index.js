// src/chatbot/index.js

import { getChatState, updateChatState, incrementInvalidAttempts } from "./stateManager.js";
import { showMainMenu } from "./menuHandler.js";
import { handleCustomerInformation } from "./handlers/customer.handler.js";
import { handleServiceFlow } from "./handlers/service.handler.js";
import { handleBack } from "./handlers/back.handler.js";
import {
    createCustomer,
    updateCustomer,
    getCustomer
} from "./services/customer.service.js";
import { getServices } from "./config/pricing.config.js";

// States where "0" means back (not skip features)
const BACK_ENABLED_STATES = [
    "ASK_NAME", "ASK_COMPANY", "ASK_EMAIL", "ASK_PHONE", "ASK_CITY",
    "SELECT_SUB_TYPE", "SELECT_PAGES", "SELECT_FEATURES", "SHOW_QUOTATION"
];

export const handleInvalidInput = async (message, customerId, replyText) => {
    try {
        const attempts = await incrementInvalidAttempts(customerId);
        console.log(`⚠️ Invalid input attempt ${attempts}/3 for customer ${customerId}`);

        if (attempts >= 3) {
            // Pause bot and notify support
            await updateCustomer(customerId, { isBotPaused: true, status: "Talk to Executive" });
            await updateChatState(customerId, "COMPLETED");

            const NotificationModel = (await import("../models/Notification.js")).default;
            const notif = await NotificationModel.create({
                type: "EXECUTIVE_REQUESTED",
                title: "Bot Paused (Chat Loop Prevention)",
                message: `The chatbot was automatically paused for customer ${customerId} after 3 consecutive invalid inputs. An executive contact might be needed.`,
                customerId
            });

            const { emitNotification } = await import("../sockets/emitter.js");
            emitNotification(notif);

            return await message.reply(
                `🤖 *Majisa Assistant*:\n\nIt looks like we are having trouble processing your options. I have paused the chatbot and notified our team.\n\n👨‍💼 One of our executives will contact you shortly to help you directly.`
            );
        }

        return await message.reply(replyText);
    } catch (error) {
        console.error("Error in handleInvalidInput:", error);
        return await message.reply(replyText);
    }
};

export const handleIncomingMessage = async (message) => {
    try {
        // Ignore non-direct message senders (like groups)
        if (!message.from.endsWith("@c.us") && !message.from.endsWith("@lid")) {
            return;
        }

        // Ignore bot's own messages
        if (message.fromMe) return;

        // Ignore status broadcasts
        if (message.from === "status@broadcast") return;

        // Ignore media messages
        if (message.hasMedia) return;

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

        // --- NLP Auto-Extraction Block ---
        const customerForNlp = await getCustomer(customerId);
        const isDetailsIncomplete = customerForNlp && (!customerForNlp.name || !customerForNlp.company || !customerForNlp.email || !customerForNlp.phone);

        // Always attempt NLP extraction if customer details are sent (signaled by at least 2 profile properties)
        let nlpMatched = false;
        const { extractLeadDetails } = await import("./utils/nlpExtractor.js");
        const extracted = extractLeadDetails(message.body);
        const extractedFields = Object.entries(extracted).filter(([k, v]) => v !== null);

        if (extractedFields.length >= 2) {
            nlpMatched = true;
            const customer = customerForNlp;
            if (customer) {
                const updates = {};
                if (extracted.name && (customer.name !== extracted.name)) updates.name = extracted.name;
                if (extracted.company && (customer.company !== extracted.company)) updates.company = extracted.company;
                if (extracted.email && (customer.email !== extracted.email)) updates.email = extracted.email;
                if (extracted.phone && (customer.phone !== extracted.phone)) updates.phone = extracted.phone;
                if (extracted.service && (customer.service !== extracted.service)) updates.service = extracted.service;

                if (Object.keys(updates).length > 0) {
                    await updateCustomer(customerId, updates);
                    console.log(`🤖 [NLP Extractor] Auto-extracted details for ${customerId}:`, updates);
                }

                const updatedCustomer = await getCustomer(customerId);
                const isLead = updatedCustomer.name && updatedCustomer.company && updatedCustomer.email && updatedCustomer.phone;

                if (isLead) {
                    await updateChatState(customerId, "COMPLETED");
                    await updateCustomer(customerId, { status: "New Lead" });

                    const NotificationModel = (await import("../models/Notification.js")).default;
                    const notif = await NotificationModel.create({
                        type: "NEW_LEAD",
                        title: "New Qualified Lead (NLP Auto-extracted)",
                        message: `Lead details auto-extracted for ${updatedCustomer.name} (${updatedCustomer.company}) interested in ${updatedCustomer.service || "Website Development"}.`,
                        customerId
                    });

                    const { emitNotification } = await import("../sockets/emitter.js");
                    emitNotification(notif);

                    await message.reply(
                        `🤖 *Majisa Lead Assistant*\n\nWelcome! I have automatically registered your details:\n👤 *Name:* ${updatedCustomer.name}\n🏢 *Company:* ${updatedCustomer.company}\n📧 *Email:* ${updatedCustomer.email}\n📱 *Phone:* ${updatedCustomer.phone}\n🛠️ *Service:* ${updatedCustomer.service || "Website Development"}\n\n✅ *Status:* Registered as New Qualified Lead.\n\nOne of our executives will contact you shortly. If you'd like to check our pricing model, feel free to reply with *menu* to explore!`
                    );
                    return;
                } else if (Object.keys(updates).length > 0) {
                    const capturedList = Object.keys(updates).map(k => `*${k.charAt(0).toUpperCase() + k.slice(1)}*`).join(", ");
                    await message.reply(
                        `🤖 *Majisa Assistant*: I've noted down your ${capturedList}. Let's continue filling out the remaining details.`
                    );
                    return;
                }
            }
        }

        // If message was not processed by NLP, and customer has an active executive status, bypass the chatbot
        if (!nlpMatched && customerForNlp && ["In Progress", "Talk to Executive", "Completed"].includes(customerForNlp.status)) {
            console.log(`🤖 Chatbot bypassed for customer: ${customerForNlp.name || customerId} (Bot paused or executive in active conversation).`);
            return;
        }

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
                    await handleInvalidInput(
                        message,
                        customerId,
                        `❌ Invalid Option\n\nPlease choose a number between *1* and *10*.\n\nType *menu* to see the options again.`
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