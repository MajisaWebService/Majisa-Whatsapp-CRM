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
import { getServices, getSubTypeMenu } from "./config/pricing.config.js";

// States where "0" means back (not skip features)
const BACK_ENABLED_STATES = [
    "ASK_NAME", "ASK_COMPANY", "ASK_EMAIL", "ASK_PHONE", "ASK_CITY",
    "ASK_REQUIREMENT", "ASK_BUDGET", "ASK_TIMELINE", "CONFIRM_LEAD", "EDIT_INFO_MENU",
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
        let nlpMatched = false;
        if (["WELCOME", "MAIN_MENU"].includes(chatState.state)) {
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
                        await updateChatState(customerId, "COMPLETED", {
                            "data.detailsCaptured": true
                        });
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
        }

        // ==========================================
        // Global Reset / Greeting Commands
        // ==========================================

        const newSessionGreetings = [
            "hi", "hii", "hiii", "hello", "hey",
            "start", "home", "restart"
        ];
        const websiteGreeting = "hello majisa web solutions, i would like to inquire about your services.";
        const isResetMessage = newSessionGreetings.includes(text) || 
                              text === "menu" || 
                              text.includes("inquire about your services") || 
                              text === websiteGreeting;

        if (isResetMessage) {
            const customer = await getCustomer(customerId);
            if (customer && (customer.isBotPaused || ["In Progress", "Talk to Executive", "Completed"].includes(customer.status))) {
                await updateCustomer(customerId, {
                    isBotPaused: false,
                    status: "New Lead"
                });
                console.log(`🤖 [Reset Command] Bot resumed and status reset to New Lead for customer ${customerId}`);
            }

            await updateChatState(customerId, "WELCOME", {
                "data.detailsCaptured": false,
                "data.subType": "",
                "data.subTypeKey": "",
                "data.pageRange": "",
                "data.pageRangeKey": "",
                "data.selectedFeatures": [],
                "data.selectedFeatureKeys": []
            });
            await showMainMenu(message);
            return;
        }

        // If message was not processed by NLP, and customer has an active executive status, bypass the chatbot
        if (!nlpMatched && customerForNlp && ["In Progress", "Talk to Executive", "Completed"].includes(customerForNlp.status)) {
            console.log(`🤖 Chatbot bypassed for customer: ${customerForNlp.name || customerId} (Bot paused or executive in active conversation).`);
            return;
        }

        // ==========================================
        // Global Back Command — "0", "B", or "back"
        // ==========================================

        const isBackCommand = (text === "0" || text === "back" || text === "b");

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

                // Option 7 — Talk to Executive
                if (text === "7") {
                    await updateChatState(customerId, "COMPLETED");
                    await updateCustomer(customerId, {
                        status: "Talk to Executive"
                    });
                    await message.reply(
                        `👨‍💼 Thank you for contacting *Majisa Web Solutions*.\n\nOne of our executives will contact you shortly.\n\n📞 Majisa Web Solutions`
                    );
                    break;
                }

                // Option 8 — Portfolio
                if (text === "8") {
                    await message.reply(
                        `📁 *Our Portfolio*\n\nCheck out some of our premium projects here:\n🌐 *Websites:* https://portfolio.majisawebsolutions.com/websites\n📱 *Mobile Apps:* https://portfolio.majisawebsolutions.com/apps\n💻 *Softwares:* https://portfolio.majisawebsolutions.com/softwares\n\nType *menu* to return to the main menu.`
                    );
                    break;
                }

                // Option 9 — Pricing
                if (text === "9" || text.includes("pricing") || text.includes("price")) {
                    await message.reply(
                        `💰 *Starting Prices*\n\n🌐 *Website Development:* Starting from ₹9,999\n📱 *Mobile Application:* Starting from ₹19,999\n💻 *Custom Software:* Starting from ₹14,999\n☁️ *Cloud & DevOps:* Starting from ₹9,999\n🤖 *AI Automation:* Starting from ₹14,999\n📈 *Digital Marketing:* Starting from ₹9,999\n\nType *menu* to return to the main menu.`
                    );
                    break;
                }

                // Options 1–6 — Service Selection (number or typed service name)
                const SERVICES = await getServices();
                let serviceKey = text;
                let service = SERVICES[serviceKey];

                const normalizedText = text.replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
                const serviceKeywordMap = [
                    { key: "1", terms: ["website", "web", "website development", "website designing", "website design", "web development"] },
                    { key: "2", terms: ["mobile", "app", "mobile application", "application", "android", "ios", "mobile app"] },
                    { key: "3", terms: ["custom software", "software", "crm", "erp", "portal", "dashboard", "custom app"] },
                    { key: "4", terms: ["cloud", "devops", "hosting", "server", "aws", "deployment"] },
                    { key: "5", terms: ["ai", "automation", "ai automation", "artificial intelligence", "machine learning", "chatbot"] },
                    { key: "6", terms: ["digital marketing", "marketing", "seo", "ads", "social media", "branding"] }
                ];

                if (!service && normalizedText) {
                    for (const candidate of serviceKeywordMap) {
                        if (candidate.terms.some(term => normalizedText.includes(term))) {
                            serviceKey = candidate.key;
                            service = SERVICES[serviceKey];
                            break;
                        }
                    }
                }

                if (!service) {
                    if (normalizedText.includes("portfolio")) {
                        await message.reply(
                            `📁 *Our Portfolio*\n\nCheck out some of our premium projects here:\n🌐 *Websites:* https://portfolio.majisawebsolutions.com/websites\n📱 *Mobile Apps:* https://portfolio.majisawebsolutions.com/apps\n💻 *Softwares:* https://portfolio.majisawebsolutions.com/softwares\n\nType *menu* to return to the main menu.`
                        );
                        break;
                    }

                    if (normalizedText.includes("executive") || normalizedText.includes("talk to executive") || normalizedText.includes("sales")) {
                        await updateChatState(customerId, "COMPLETED");
                        await updateCustomer(customerId, {
                            status: "Talk to Executive"
                        });
                        await message.reply(
                            `👨‍💼 Thank you for contacting *Majisa Web Solutions*.\n\nOne of our executives will contact you shortly.\n\n📞 Majisa Web Solutions`
                        );
                        break;
                    }

                    await handleInvalidInput(
                        message,
                        customerId,
                        `❌ Invalid Option\n\nPlease choose a number between *1* and *9*, or type the service name like *Website Development*.\n\nType *menu* to see the options again.`
                    );
                    break;
                }

                await updateChatState(customerId, "ASK_NAME", {
                    service: service.name,
                    serviceKey: text,
                    "data.detailsCaptured": false,
                    "data.name": "",
                    "data.company": "",
                    "data.email": "",
                    "data.phone": "",
                    "data.city": "",
                    "data.requirement": "",
                    "data.budget": "",
                    "data.timeline": "",
                    "data.subType": "",
                    "data.subTypeKey": "",
                    "data.pageRange": "",
                    "data.pageRangeKey": "",
                    "data.selectedFeatures": [],
                    "data.selectedFeatureKeys": []
                });

                return await message.reply(
                    `👤 Great! Let's start with your *Full Name*.

_⬅️ Type *0* to go back_`
                );
            }

            // ------------------------------------------
            // Customer Information Collection
            // ------------------------------------------

            case "ASK_NAME":
            case "ASK_COMPANY":
            case "ASK_EMAIL":
            case "ASK_PHONE":
            case "ASK_CITY":
            case "ASK_REQUIREMENT":
            case "ASK_BUDGET":
            case "ASK_TIMELINE":
            case "EDIT_INFO_MENU":

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
            case "CONFIRM_LEAD":

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