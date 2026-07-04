// src/chatbot/handlers/customer.handler.js

import validator from "validator";
import { updateChatState, getChatState } from "../stateManager.js";
import { getServices, getFeatures } from "../config/pricing.config.js";

export const showReviewScreen = async (message, customerId) => {
    const latestState = await getChatState(customerId);
    const SERVICES = await getServices();
    const service = SERVICES[latestState.serviceKey];
    const serviceName = service ? service.name : latestState.service;

    const subTypeKey = latestState.data?.subTypeKey;
    const subTypeName = (subTypeKey && service?.subTypes?.[subTypeKey])
        ? service.subTypes[subTypeKey].name
        : "";

    const pageRange = latestState.data?.pageRange || "";
    const featureKeys = latestState.data?.selectedFeatureKeys || [];
    const FEATURES = await getFeatures();
    const featureNames = featureKeys.map(k => FEATURES[k]?.name).filter(Boolean);

    const { calculateQuotation } = await import("../services/quotation.service.js");
    const quotationData = await calculateQuotation(latestState);

    let text = `━━━━━━━━━━━━━━━━━━\n`;
    text += `📋 *Please Review*\n`;
    text += `━━━━━━━━━━━━━━━━━━\n\n`;
    text += `*Name:*\n${latestState.data?.name || ""}\n\n`;
    text += `*Company:*\n${latestState.data?.company || ""}\n\n`;
    text += `*Email:*\n${latestState.data?.email || ""}\n\n`;
    text += `*Phone:*\n${latestState.data?.phone || ""}\n\n`;
    text += `*City:*\n${latestState.data?.city || ""}\n\n`;
    text += `*Project Requirement:*\n${latestState.data?.requirement || ""}\n\n`;
    text += `*Expected Budget:*\n${latestState.data?.budget || ""}\n\n`;
    text += `*Expected Timeline:*\n${latestState.data?.timeline || ""}\n\n`;
    text += `━━━━━━━━━━━━━━━━━━\n\n`;
    text += `*Selected Service*\n`;
    text += `${serviceName}\n`;
    if (subTypeName) text += `${subTypeName}\n`;
    if (pageRange) text += `${pageRange}\n\n`;

    if (featureNames.length > 0) {
        for (const f of featureNames) {
            text += `✔ ${f}\n`;
        }
        text += `\n`;
    }

    text += `*Estimated Cost*\n`;
    text += `₹${quotationData.totalAmount.toLocaleString("en-IN")}\n\n`;
    text += `━━━━━━━━━━━━━━━━━━\n\n`;
    text += `1️⃣ Confirm\n`;
    text += `2️⃣ Edit Information\n`;
    text += `3️⃣ Change Features\n\n`;
    text += `_⬅️ Type *0* to go back_`;

    await message.reply(text);
};

export const handleCustomerInformation = async (message, chatState) => {
    const customerId = message.from;
    const text = message.body.trim();

    switch (chatState.state) {

        case "ASK_NAME": {
            await updateChatState(customerId, "ASK_NAME", {
                "data.name": text
            });

            if (chatState.data?.editMode) {
                await updateChatState(customerId, "CONFIRM_LEAD", { "data.editMode": false });
                return await showReviewScreen(message, customerId);
            }

            await updateChatState(customerId, "ASK_COMPANY");
            return await message.reply(
                `🏢 Please enter your *Company Name*.\n\n_⬅️ Type *0* to go back_`
            );
        }

        case "ASK_COMPANY": {
            await updateChatState(customerId, "ASK_COMPANY", {
                "data.company": text
            });

            if (chatState.data?.editMode) {
                await updateChatState(customerId, "CONFIRM_LEAD", { "data.editMode": false });
                return await showReviewScreen(message, customerId);
            }

            await updateChatState(customerId, "ASK_EMAIL");
            return await message.reply(
                `📧 Please enter your *Email Address*.\n\n_⬅️ Type *0* to go back_`
            );
        }

        case "ASK_EMAIL": {
            if (!validator.isEmail(text)) {
                const { handleInvalidInput } = await import("../index.js");
                return await handleInvalidInput(
                    message,
                    customerId,
                    `❌ Please enter a valid Email Address.\n_Example: example@domain.com_\n\n_⬅️ Type *0* to go back_`
                );
            }

            await updateChatState(customerId, "ASK_EMAIL", {
                "data.email": text
            });

            if (chatState.data?.editMode) {
                await updateChatState(customerId, "CONFIRM_LEAD", { "data.editMode": false });
                return await showReviewScreen(message, customerId);
            }

            await updateChatState(customerId, "ASK_PHONE");
            return await message.reply(
                `📱 Please enter your *10-digit Mobile Number*.\n\n_⬅️ Type *0* to go back_`
            );
        }

        case "ASK_PHONE": {
            let cleanedPhone = text.replace(/\D/g, "");
            if (cleanedPhone.length === 12 && cleanedPhone.startsWith("91")) {
                cleanedPhone = cleanedPhone.substring(2);
            }

            if (cleanedPhone.length !== 10) {
                const { handleInvalidInput } = await import("../index.js");
                return await handleInvalidInput(
                    message,
                    customerId,
                    `❌ Please enter a valid *10-digit* Mobile Number.\n_Only digits allowed._\n\n_⬅️ Type *0* to go back_`
                );
            }

            await updateChatState(customerId, "ASK_PHONE", {
                "data.phone": cleanedPhone
            });

            if (chatState.data?.editMode) {
                await updateChatState(customerId, "CONFIRM_LEAD", { "data.editMode": false });
                return await showReviewScreen(message, customerId);
            }

            await updateChatState(customerId, "ASK_CITY");
            return await message.reply(
                `📍 Which *city* are you from?\n\n_⬅️ Type *0* to go back_`
            );
        }

        case "ASK_CITY": {
            await updateChatState(customerId, "ASK_CITY", {
                "data.city": text
            });

            if (chatState.data?.editMode) {
                await updateChatState(customerId, "CONFIRM_LEAD", { "data.editMode": false });
                return await showReviewScreen(message, customerId);
            }

            await updateChatState(customerId, "ASK_REQUIREMENT");
            return await message.reply(
                `📝 Please describe your *Project Requirement*:\n\n_⬅️ Type *0* to go back_`
            );
        }

        case "ASK_REQUIREMENT": {
            await updateChatState(customerId, "ASK_REQUIREMENT", {
                "data.requirement": text
            });

            if (chatState.data?.editMode) {
                await updateChatState(customerId, "CONFIRM_LEAD", { "data.editMode": false });
                return await showReviewScreen(message, customerId);
            }

            await updateChatState(customerId, "ASK_BUDGET");
            return await message.reply(
                `💰 What is your *Expected Budget*?\n\n_⬅️ Type *0* to go back_`
            );
        }

        case "ASK_BUDGET": {
            await updateChatState(customerId, "ASK_BUDGET", {
                "data.budget": text
            });

            if (chatState.data?.editMode) {
                await updateChatState(customerId, "CONFIRM_LEAD", { "data.editMode": false });
                return await showReviewScreen(message, customerId);
            }

            await updateChatState(customerId, "ASK_TIMELINE");
            return await message.reply(
                `📅 What is your *Expected Timeline*? (e.g. 1 month, 3 weeks)\n\n_⬅️ Type *0* to go back_`
            );
        }

        case "ASK_TIMELINE": {
            await updateChatState(customerId, "ASK_TIMELINE", {
                "data.timeline": text
            });

            await updateChatState(customerId, "CONFIRM_LEAD", {
                "data.editMode": false
            });

            return await showReviewScreen(message, customerId);
        }

        case "EDIT_INFO_MENU": {
            if (text === "1") {
                await updateChatState(customerId, "ASK_NAME", { "data.editMode": true });
                return await message.reply(`👤 Please enter your *Full Name*:\n\n_⬅️ Type *0* to go back_`);
            } else if (text === "2") {
                await updateChatState(customerId, "ASK_COMPANY", { "data.editMode": true });
                return await message.reply(`🏢 Please enter your *Company Name*:\n\n_⬅️ Type *0* to go back_`);
            } else if (text === "3") {
                await updateChatState(customerId, "ASK_EMAIL", { "data.editMode": true });
                return await message.reply(`📧 Please enter your *Email Address*:\n\n_⬅️ Type *0* to go back_`);
            } else if (text === "4") {
                await updateChatState(customerId, "ASK_PHONE", { "data.editMode": true });
                return await message.reply(`📱 Please enter your *Mobile Number*:\n\n_⬅️ Type *0* to go back_`);
            } else if (text === "5") {
                await updateChatState(customerId, "ASK_CITY", { "data.editMode": true });
                return await message.reply(`📍 Which *city* are you from?:\n\n_⬅️ Type *0* to go back_`);
            } else if (text === "6") {
                await updateChatState(customerId, "ASK_REQUIREMENT", { "data.editMode": true });
                return await message.reply(`📝 Please describe your *Project Requirement*:\n\n_⬅️ Type *0* to go back_`);
            } else if (text === "7") {
                await updateChatState(customerId, "ASK_BUDGET", { "data.editMode": true });
                return await message.reply(`💰 What is your *Expected Budget*?:\n\n_⬅️ Type *0* to go back_`);
            } else if (text === "8") {
                await updateChatState(customerId, "ASK_TIMELINE", { "data.editMode": true });
                return await message.reply(`📅 What is your *Expected Timeline*?:\n\n_⬅️ Type *0* to go back_`);
            } else if (text === "0" || text === "back") {
                await updateChatState(customerId, "CONFIRM_LEAD");
                return await showReviewScreen(message, customerId);
            } else {
                const { handleInvalidInput } = await import("../index.js");
                return await handleInvalidInput(
                    message,
                    customerId,
                    `❌ Invalid option. Please choose a number between *1* and *8* or type *0* to go back.`
                );
            }
        }

        default:
            return;
    }
};