// src/chatbot/handlers/back.handler.js

import { updateChatState, getChatState } from "../stateManager.js";
import { showMainMenu } from "../menuHandler.js";
import {
    getServices,
    getSubTypeMenu,
    getPageRangeMenu,
    getFeaturesMenu
} from "../config/pricing.config.js";
import {
    calculateQuotation,
    buildQuotationText
} from "../services/quotation.service.js";
import { showReviewScreen } from "./customer.handler.js";

export const handleBack = async (message, chatState) => {
    const SERVICES = await getServices();
    const customerId = message.from;
    const state = chatState.state;
    const serviceKey = chatState.serviceKey;
    const service = SERVICES[serviceKey];

    switch (state) {

        case "SELECT_SUB_TYPE":
            await updateChatState(customerId, "ASK_TIMELINE");
            await message.reply(`📅 What is your *Expected Timeline*? (e.g. 1 month, 3 weeks)\n\n_⬅️ Type *0* to go back_`);
            return true;

        case "SELECT_PAGES":
            if (service && service.subTypes) {
                await updateChatState(customerId, "SELECT_SUB_TYPE");
                await message.reply(await getSubTypeMenu(serviceKey));
            } else {
                await updateChatState(customerId, "ASK_TIMELINE");
                await message.reply(`📅 What is your *Expected Timeline*? (e.g. 1 month, 3 weeks)\n\n_⬅️ Type *0* to go back_`);
            }
            return true;

        case "SELECT_FEATURES":
            if (service && service.hasPages) {
                await updateChatState(customerId, "SELECT_PAGES");
                await message.reply(await getPageRangeMenu());
            } else if (service && service.subTypes) {
                await updateChatState(customerId, "SELECT_SUB_TYPE");
                await message.reply(await getSubTypeMenu(serviceKey));
            } else {
                await updateChatState(customerId, "ASK_TIMELINE");
                await message.reply(`📅 What is your *Expected Timeline*? (e.g. 1 month, 3 weeks)\n\n_⬅️ Type *0* to go back_`);
            }
            return true;

        case "SHOW_QUOTATION":
            if (service && service.hasFeatures) {
                await updateChatState(customerId, "SELECT_FEATURES");
                await message.reply(await getFeaturesMenu());
            } else if (service && service.hasPages) {
                await updateChatState(customerId, "SELECT_PAGES");
                await message.reply(await getPageRangeMenu());
            } else if (service && service.subTypes) {
                await updateChatState(customerId, "SELECT_SUB_TYPE");
                await message.reply(await getSubTypeMenu(serviceKey));
            } else {
                await updateChatState(customerId, "ASK_TIMELINE");
                await message.reply(`📅 What is your *Expected Timeline*? (e.g. 1 month, 3 weeks)\n\n_⬅️ Type *0* to go back_`);
            }
            return true;

        case "ASK_NAME": {
            await updateChatState(customerId, "WELCOME");
            await showMainMenu(message);
            return true;
        }

        case "ASK_COMPANY":
            await updateChatState(customerId, "ASK_NAME");
            await message.reply(`👤 Please enter your *Full Name*.\n\n_⬅️ Type *0* to go back_`);
            return true;

        case "ASK_EMAIL":
            await updateChatState(customerId, "ASK_COMPANY");
            await message.reply(`🏢 Please enter your *Company Name*.\n\n_⬅️ Type *0* to go back_`);
            return true;

        case "ASK_PHONE":
            await updateChatState(customerId, "ASK_EMAIL");
            await message.reply(`📧 Please enter your *Email Address*.\n\n_⬅️ Type *0* to go back_`);
            return true;

        case "ASK_CITY":
            await updateChatState(customerId, "ASK_PHONE");
            await message.reply(`📱 Please enter your *10-digit Mobile Number*.\n\n_⬅️ Type *0* to go back_`);
            return true;

        case "ASK_REQUIREMENT":
            await updateChatState(customerId, "ASK_CITY");
            await message.reply(`📍 Which *city* are you from?\n\n_⬅️ Type *0* to go back_`);
            return true;

        case "ASK_BUDGET":
            await updateChatState(customerId, "ASK_REQUIREMENT");
            await message.reply(`📝 Please describe your *Project Requirement*:\n\n_⬅️ Type *0* to go back_`);
            return true;

        case "ASK_TIMELINE":
            await updateChatState(customerId, "ASK_BUDGET");
            await message.reply(`💰 What is your *Expected Budget*?\n\n_⬅️ Type *0* to go back_`);
            return true;

        case "CONFIRM_LEAD":
            await updateChatState(customerId, "SHOW_QUOTATION");
            const latestState = await getChatState(customerId);
            const quotationData = await calculateQuotation(latestState);
            const quotationText = await buildQuotationText(latestState, quotationData);
            await message.reply(quotationText);
            return true;

        case "EDIT_INFO_MENU":
            await updateChatState(customerId, "CONFIRM_LEAD");
            await showReviewScreen(message, customerId);
            return true;

        default:
            return false;
    }
};
