// src/chatbot/handlers/customer.handler.js

import validator from "validator";
import { updateChatState, getChatState } from "../stateManager.js";
import { updateCustomer } from "../services/customer.service.js";
import { getServices, getSubTypeMenu } from "../config/pricing.config.js";

export const handleCustomerInformation = async (message, chatState) => {

    const customerId = message.from;
    const text = message.body.trim();

    switch (chatState.state) {

        case "ASK_NAME":

            await updateCustomer(customerId, {
                name: text
            });

            await updateChatState(customerId, "ASK_COMPANY");

            return await message.reply(
                `🏢 Please enter your *Company Name*.\n\n_⬅️ Type *0* to go back_`
            );

        case "ASK_COMPANY":

            await updateCustomer(customerId, {
                company: text
            });

            await updateChatState(customerId, "ASK_EMAIL");

            return await message.reply(
                `📧 Please enter your *Email Address*.\n\n_⬅️ Type *0* to go back_`
            );

        case "ASK_EMAIL":

            // Validate email
            if (!validator.isEmail(text)) {
                const { handleInvalidInput } = await import("../index.js");
                return await handleInvalidInput(
                    message,
                    customerId,
                    `❌ Please enter a valid Email Address.\n_Example: example@domain.com_\n\n_⬅️ Type *0* to go back_`
                );
            }

            await updateCustomer(customerId, {
                email: text
            });

            await updateChatState(customerId, "ASK_PHONE");

            return await message.reply(
                `📱 Please enter your *10-digit Mobile Number*.\n\n_⬅️ Type *0* to go back_`
            );

        case "ASK_PHONE": {

            // Validate phone — digits only, 10 digits
            let cleanedPhone = text.replace(/\D/g, "");

            // Strip country code +91 if present
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

            await updateCustomer(customerId, {
                phone: cleanedPhone
            });

            await updateChatState(customerId, "ASK_CITY");

            return await message.reply(
                `📍 Which *city* are you from?\n\n_⬅️ Type *0* to go back_`
            );
        }

        case "ASK_CITY": {

            await updateCustomer(customerId, {
                city: text
            });

            // After city → go to sub-type selection
            const latestState = await getChatState(customerId);
            const serviceKey = latestState.serviceKey;
            const SERVICES = await getServices();
            const service = SERVICES[serviceKey];

            if (service && service.hasSubTypes) {

                await updateChatState(customerId, "SELECT_SUB_TYPE");

                const subTypeMenu = await getSubTypeMenu(serviceKey);

                return await message.reply(
                    `${subTypeMenu}\n\n_⬅️ Type *0* to go back_`
                );

            } else {

                // No sub-types — skip straight to quotation
                await updateChatState(customerId, "SHOW_QUOTATION");

                return await message.reply(
                    "📝 Our team will prepare a custom quotation for you."
                );
            }
        }

        default:
            return;
    }
};