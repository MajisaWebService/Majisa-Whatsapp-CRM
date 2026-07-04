// src/chatbot/handlers/service.handler.js

import { updateChatState, getChatState } from "../stateManager.js";
import { updateCustomer } from "../services/customer.service.js";
import Notification from "../../models/Notification.js";
import { emitNotification } from "../../sockets/emitter.js";
import {
    calculateQuotation,
    buildQuotationText,
    saveQuotation
} from "../services/quotation.service.js";
import {
    getServices,
    getPageRanges,
    getFeatures,
    getSubTypeMenu,
    getPageRangeMenu,
    getFeaturesMenu
} from "../config/pricing.config.js";
import { showReviewScreen } from "./customer.handler.js";

export const handleServiceFlow = async (message, chatState) => {
    const SERVICES = await getServices();
    const PAGE_RANGES = await getPageRanges();
    const FEATURES = await getFeatures();

    const customerId = message.from;
    const text = message.body.trim().toLowerCase();
    const serviceKey = chatState.serviceKey;
    const service = SERVICES[serviceKey];

    switch (chatState.state) {

        // ------------------------------------------
        // Select Sub-Type
        // ------------------------------------------

        case "SELECT_SUB_TYPE": {
            if (!service || !service.subTypes) {
                await updateChatState(customerId, "SHOW_QUOTATION");
                return;
            }

            const subType = service.subTypes[text];

            if (!subType) {
                const maxOption = Object.keys(service.subTypes).length;
                const { handleInvalidInput } = await import("../index.js");
                return await handleInvalidInput(
                    message,
                    customerId,
                    `❌ Invalid option. Please choose a number between *1* and *${maxOption}*.\n\n_⬅️ Type *0* to go back_`
                );
            }

            // Save sub-type selection
            await updateChatState(customerId, "SELECT_SUB_TYPE", {
                "data.subType": subType.name,
                "data.subTypeKey": text
            });

            // Next: Pages or Features or Quotation
            if (service.hasPages) {
                await updateChatState(customerId, "SELECT_PAGES");
                return await message.reply(
                    `*${subType.name} Selected ✅*\n\n${await getPageRangeMenu()}\n\n_⬅️ Type *0* to go back_`
                );
            } else if (service.hasFeatures) {
                await updateChatState(customerId, "SELECT_FEATURES");
                return await message.reply(
                    `${await getFeaturesMenu()}\n\n_⬅️ Type *0* to go back_`
                );
            } else {
                await updateChatState(customerId, "SHOW_QUOTATION");
                const latestState = await getChatState(customerId);
                const quotationData = await calculateQuotation(latestState);
                const quotationText = await buildQuotationText(latestState, quotationData);
                return await message.reply(quotationText);
            }
        }

        // ------------------------------------------
        // Select Page Range
        // ------------------------------------------

        case "SELECT_PAGES": {
            const pageRange = PAGE_RANGES[text];

            if (!pageRange) {
                const { handleInvalidInput } = await import("../index.js");
                return await handleInvalidInput(
                    message,
                    customerId,
                    `❌ Invalid option. Please choose a number between *1* and *5*.\n\n_⬅️ Type *0* to go back_`
                );
            }

            // Save page range
            await updateChatState(customerId, "SELECT_PAGES", {
                "data.pageRange": pageRange.label,
                "data.pageRangeKey": text
            });

            // Next: Features or Quotation
            if (service && service.hasFeatures) {
                await updateChatState(customerId, "SELECT_FEATURES");
                return await message.reply(
                    `${await getFeaturesMenu()}\n\n_⬅️ Type *0* to go back_`
                );
            } else {
                await updateChatState(customerId, "SHOW_QUOTATION");
                const latestState = await getChatState(customerId);
                const quotationData = await calculateQuotation(latestState);
                const quotationText = await buildQuotationText(latestState, quotationData);
                return await message.reply(quotationText);
            }
        }

        // ------------------------------------------
        // Select Features (comma-separated or Done Selecting)
        // ------------------------------------------

        case "SELECT_FEATURES": {
            if (text === "11" || text === "done" || text === "skip" || text === "none") {
                await updateChatState(customerId, "SHOW_QUOTATION");

                const latestState = await getChatState(customerId);
                const quotationData = await calculateQuotation(latestState);
                const quotationText = await buildQuotationText(latestState, quotationData);
                return await message.reply(quotationText);
            }

            // Parse comma-separated feature numbers
            const rawKeys = text.split(",").map(s => s.trim());
            const validKeys = [];
            const validNames = [];

            for (const key of rawKeys) {
                if (FEATURES[key] && FEATURES[key].name !== "Done Selecting") {
                    validKeys.push(key);
                    validNames.push(FEATURES[key].name);
                }
            }

            if (validKeys.length === 0) {
                const { handleInvalidInput } = await import("../index.js");
                return await handleInvalidInput(
                    message,
                    customerId,
                    `❌ No valid features found.\n\nPlease enter numbers separated by commas.\n_Example: *1,2,5*_\n\nType *11* when done selecting features.\n\n_⬅️ Type *0* to go back_`
                );
            }

            // Save selected features
            await updateChatState(customerId, "SELECT_FEATURES", {
                "data.selectedFeatures": validNames,
                "data.selectedFeatureKeys": validKeys
            });

            let replyMsg = `✨ *Selected Features:*\n`;
            for (const name of validNames) {
                replyMsg += `  ✔ ${name}\n`;
            }
            replyMsg += `\nType *11️⃣* (Done Selecting) to proceed and see the quotation, or send other numbers to modify your selection.\n\n_⬅️ Type *0* to go back_`;

            return await message.reply(replyMsg);
        }

        // ------------------------------------------
        // Quotation Choice (Step 5)
        // ------------------------------------------

        case "SHOW_QUOTATION": {
            if (text === "1" || text === "continue" || text.includes("yes")) {
                const latestState = await getChatState(customerId);
                const isAlreadyRegistered = latestState.data && latestState.data.detailsCaptured === true;

                if (isAlreadyRegistered) {
                    await updateChatState(customerId, "CONFIRM_LEAD");
                    return await showReviewScreen(message, customerId);
                } else {
                    await updateChatState(customerId, "ASK_NAME");
                    return await message.reply(
                        `👤 Please enter your *Full Name*.\n\n_⬅️ Type *0* to go back_`
                    );
                }
            } else if (text === "2" || text.includes("feature") || text.includes("modify")) {
                await updateChatState(customerId, "SELECT_FEATURES");
                return await message.reply(
                    `${await getFeaturesMenu()}\n\n_⬅️ Type *0* to go back_`
                );
            } else if (text === "3" || text.includes("package") || text.includes("change")) {
                await updateChatState(customerId, "SELECT_SUB_TYPE");
                return await message.reply(
                    `${await getSubTypeMenu(serviceKey)}\n\n_⬅️ Type *0* to go back_`
                );
            } else {
                const { handleInvalidInput } = await import("../index.js");
                return await handleInvalidInput(
                    message,
                    customerId,
                    `❌ Invalid option. Please choose:\n\n1️⃣ Continue\n2️⃣ Modify Features\n3️⃣ Change Package\n\n_⬅️ Type *0* to go back_`
                );
            }
        }

        // ------------------------------------------
        // Final Review & Save Lead (Step 7 & 8)
        // ------------------------------------------

        case "CONFIRM_LEAD": {
            if (text === "1" || text === "confirm") {
                const latestState = await getChatState(customerId);
                const quotationData = await calculateQuotation(latestState);

                // 1. Save quotation
                await saveQuotation(customerId, latestState, quotationData);

                // 2. Collect selected features
                const featureKeys = latestState.data?.selectedFeatureKeys || [];
                const featureNames = featureKeys
                    .map(k => FEATURES[k]?.name)
                    .filter(Boolean);

                // 3. Generate Reference ID
                const refId = `MWS-2026-${Math.floor(100000 + Math.random() * 900000)}`;

                // 4. Save Customer lead details
                await updateCustomer(customerId, {
                    name: latestState.data?.name,
                    company: latestState.data?.company,
                    email: latestState.data?.email,
                    phone: latestState.data?.phone,
                    city: latestState.data?.city,
                    requirement: latestState.data?.requirement,
                    budget: latestState.data?.budget,
                    timeline: latestState.data?.timeline,
                    service: latestState.service,
                    features: featureNames,
                    status: "New Lead",
                    notes: `Reference ID: ${refId}`
                });

                // 5. Complete state
                await updateChatState(customerId, "COMPLETED", {
                    "data.detailsCaptured": true
                });

                // 6. Send socket notification
                try {
                    const notif = await Notification.create({
                        type: "NEW_LEAD",
                        title: "New Qualified Lead",
                        message: `Lead details confirmed for ${latestState.data?.name || customerId} (${latestState.data?.company}). Service: ${latestState.service}. Ref: ${refId}`,
                        customerId
                    });
                    emitNotification(notif);
                } catch (err) {
                    console.error("Failed to create new lead confirmation notification:", err.message);
                }

                // 7. Success Reply
                return await message.reply(
                    `✅ *Thank you!*\n\nYour project inquiry has been submitted successfully.\n\n*Reference ID:*\n${refId}\n\nOur technical consultant will review your requirements and contact you within 24 hours.\n\nThank you for choosing Majisa Web Solutions.\n\nHave a great day! 😊`
                );
            } else if (text === "2" || text === "edit") {
                await updateChatState(customerId, "EDIT_INFO_MENU");
                return await message.reply(
                    `Choose which information to edit:\n\n1️⃣ Name\n2️⃣ Company\n3️⃣ Email\n4️⃣ Phone\n5️⃣ City\n6️⃣ Requirement\n7️⃣ Budget\n8️⃣ Timeline\n\n_⬅️ Type *0* to go back_`
                );
            } else if (text === "3" || text === "change") {
                await updateChatState(customerId, "SELECT_FEATURES");
                return await message.reply(
                    `${await getFeaturesMenu()}\n\n_⬅️ Type *0* to go back_`
                );
            } else {
                const { handleInvalidInput } = await import("../index.js");
                return await handleInvalidInput(
                    message,
                    customerId,
                    `❌ Invalid option. Please choose:\n\n1️⃣ Confirm\n2️⃣ Edit Information\n3️⃣ Change Features\n\n_⬅️ Type *0* to go back_`
                );
            }
        }

        default:
            return;
    }
};
