// src/chatbot/handlers/back.handler.js

import { updateChatState, getChatState } from "../stateManager.js";
import { showMainMenu } from "../menuHandler.js";
import {
    getServices,
    getSubTypeMenu,
    getPageRangeMenu,
    getFeaturesMenu
} from "../config/pricing.config.js";

// ==========================================
// Back Navigation Handler
// ==========================================
// Returns true if it handled the "back" action,
// so the caller can stop further processing.

export const handleBack = async (message, chatState) => {
    const SERVICES = await getServices();
    const customerId = message.from;
    const state = chatState.state;
    const serviceKey = chatState.serviceKey;
    const service = SERVICES[serviceKey];

    switch (state) {

        // From ASK_NAME → back to MAIN_MENU
        case "ASK_NAME":

            await updateChatState(customerId, "WELCOME");
            await showMainMenu(message);
            return true;

        // From ASK_COMPANY → back to ASK_NAME
        case "ASK_COMPANY":

            await updateChatState(customerId, "ASK_NAME");

            await message.reply(
                `👤 *Enter Your Full Name*\n\nPlease enter your Full Name.\n\n_⬅️ Type *0* to go back_`
            );

            return true;

        // From ASK_EMAIL → back to ASK_COMPANY
        case "ASK_EMAIL":

            await updateChatState(customerId, "ASK_COMPANY");

            await message.reply(
                `🏢 *Enter Company Name*\n\nPlease enter your Company Name.\n\n_⬅️ Type *0* to go back_`
            );

            return true;

        // From ASK_PHONE → back to ASK_EMAIL
        case "ASK_PHONE":

            await updateChatState(customerId, "ASK_EMAIL");

            await message.reply(
                `📧 *Enter Email Address*\n\nPlease enter your Email Address.\n\n_⬅️ Type *0* to go back_`
            );

            return true;

        // From ASK_CITY → back to ASK_PHONE
        case "ASK_CITY":

            await updateChatState(customerId, "ASK_PHONE");

            await message.reply(
                `📱 *Enter Mobile Number*\n\nPlease enter your 10-digit Mobile Number.\n\n_⬅️ Type *0* to go back_`
            );

            return true;

        // From SELECT_SUB_TYPE → back to ASK_CITY
        case "SELECT_SUB_TYPE":

            await updateChatState(customerId, "ASK_CITY");

            await message.reply(
                `📍 *Your City*\n\nWhich city are you from?\n\n_⬅️ Type *0* to go back_`
            );

            return true;

        // From SELECT_PAGES → back to SELECT_SUB_TYPE
        case "SELECT_PAGES":

            await updateChatState(customerId, "SELECT_SUB_TYPE");

            if (service && service.subTypes) {
                await message.reply(await getSubTypeMenu(serviceKey));
            }

            return true;

        // From SELECT_FEATURES → back to SELECT_PAGES (if has pages) or SELECT_SUB_TYPE
        case "SELECT_FEATURES":

            if (service && service.hasPages) {

                await updateChatState(customerId, "SELECT_PAGES");
                await message.reply(await getPageRangeMenu());

            } else {

                await updateChatState(customerId, "SELECT_SUB_TYPE");

                if (service && service.subTypes) {
                    await message.reply(await getSubTypeMenu(serviceKey));
                }
            }

            return true;

        // From SHOW_QUOTATION → back to SELECT_FEATURES (if has) or SELECT_PAGES or SELECT_SUB_TYPE
        case "SHOW_QUOTATION":

            if (service && service.hasFeatures) {

                await updateChatState(customerId, "SELECT_FEATURES");
                await message.reply(await getFeaturesMenu());

            } else if (service && service.hasPages) {

                await updateChatState(customerId, "SELECT_PAGES");
                await message.reply(await getPageRangeMenu());

            } else {

                await updateChatState(customerId, "SELECT_SUB_TYPE");

                if (service && service.subTypes) {
                    await message.reply(await getSubTypeMenu(serviceKey));
                }
            }

            return true;

        default:
            return false;
    }
};
