// src/chatbot/handlers/service.handler.js

import { updateChatState, getChatState } from "../stateManager.js";
import { updateCustomer, getCustomer } from "../services/customer.service.js";
import {
    calculateQuotation,
    buildQuotationText,
    saveQuotation
} from "../services/quotation.service.js";
import { generateQuotationPDF } from "../services/pdf.service.js";
import { sendPdfToCustomer } from "../../services/whatsapp.service.js";
import {
    SERVICES,
    PAGE_RANGES,
    FEATURES,
    getSubTypeMenu,
    getPageRangeMenu,
    getFeaturesMenu
} from "../config/pricing.config.js";

// ==========================================
// Handle Service Flow
// ==========================================

export const handleServiceFlow = async (message, chatState) => {

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

                return await message.reply(
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
                    `${getPageRangeMenu()}\n\n_⬅️ Type *0* to go back_`
                );

            } else if (service.hasFeatures) {

                await updateChatState(customerId, "SELECT_FEATURES");

                return await message.reply(
                    `${getFeaturesMenu()}\n\n_⬅️ Type *0* to go back_`
                );

            } else {

                // No pages, no features — go straight to quotation
                await updateChatState(customerId, "SHOW_QUOTATION");

                const latestState = await getChatState(customerId);
                const quotationData = calculateQuotation(latestState);
                const quotationText = buildQuotationText(latestState, quotationData);

                return await message.reply(
                    `${quotationText}\n\n_⬅️ Type *0* to go back_`
                );
            }
        }

        // ------------------------------------------
        // Select Page Range
        // ------------------------------------------

        case "SELECT_PAGES": {

            const pageRange = PAGE_RANGES[text];

            if (!pageRange) {

                return await message.reply(
                    `❌ Invalid option. Please choose a number between *1* and *4*.\n\n_⬅️ Type *0* to go back_`
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
                    `${getFeaturesMenu()}\n\n_⬅️ Type *0* to go back_`
                );

            } else {

                await updateChatState(customerId, "SHOW_QUOTATION");

                const latestState = await getChatState(customerId);
                const quotationData = calculateQuotation(latestState);
                const quotationText = buildQuotationText(latestState, quotationData);

                return await message.reply(
                    `${quotationText}\n\n_⬅️ Type *0* to go back_`
                );
            }
        }

        // ------------------------------------------
        // Select Features (comma-separated)
        // Note: "0" = back (handled globally), "skip" = no features
        // ------------------------------------------

        case "SELECT_FEATURES": {

            if (text === "skip" || text === "none") {

                // Skip features — proceed with no features selected
                await updateChatState(customerId, "SHOW_QUOTATION", {
                    "data.selectedFeatures": [],
                    "data.selectedFeatureKeys": []
                });

                const latestState = await getChatState(customerId);
                const quotationData = calculateQuotation(latestState);
                const quotationText = buildQuotationText(latestState, quotationData);

                return await message.reply(
                    `${quotationText}\n\n_⬅️ Type *0* to go back_`
                );
            }

            // Parse comma-separated feature numbers
            const rawKeys = text.split(",").map(s => s.trim());
            const validKeys = [];
            const validNames = [];

            for (const key of rawKeys) {

                if (FEATURES[key]) {

                    validKeys.push(key);
                    validNames.push(FEATURES[key].name);
                }
            }

            if (validKeys.length === 0) {

                return await message.reply(
                    `❌ No valid features found.\n\nPlease enter numbers separated by commas.\n_Example: *1,2,3,4*_\n\nType *skip* to skip features.\n\n_⬅️ Type *0* to go back_`
                );
            }

            // Save selected features
            await updateChatState(customerId, "SHOW_QUOTATION", {
                "data.selectedFeatures": validNames,
                "data.selectedFeatureKeys": validKeys
            });

            const latestState = await getChatState(customerId);
            const quotationData = calculateQuotation(latestState);
            const quotationText = buildQuotationText(latestState, quotationData);

            return await message.reply(
                `${quotationText}\n\n_⬅️ Type *0* to go back_`
            );
        }

        // ------------------------------------------
        // Confirm Quotation
        // ------------------------------------------

        case "SHOW_QUOTATION": {

            if (text === "1" || text === "yes") {

                await message.reply("📄 Generating your quotation PDF...");

                const latestState = await getChatState(customerId);
                const quotationData = calculateQuotation(latestState);

                // Save quotation to DB
                const quotation = await saveQuotation(customerId, latestState, quotationData);

                // Collect feature names
                const featureKeys = latestState.data?.selectedFeatureKeys || [];
                const featureNames = featureKeys
                    .map(k => FEATURES[k]?.name)
                    .filter(Boolean);

                // Update customer record
                await updateCustomer(customerId, {
                    service: latestState.service,
                    features: featureNames,
                    quotationSent: true,
                    status: "Quotation Sent"
                });

                // Generate PDF
                const customer = await getCustomer(customerId);

                const pdfPath = await generateQuotationPDF(
                    customer,
                    latestState,
                    quotationData,
                    quotation._id.toString()
                );

                // Update quotation with PDF path
                quotation.pdfPath = pdfPath;
                quotation.status = "SENT";
                await quotation.save();

                // Send PDF on WhatsApp
                await sendPdfToCustomer(
                    customerId,
                    pdfPath,
                    `📋 Your Quotation from Majisa Web Solutions\n\nTotal: ₹${quotationData.totalAmount.toLocaleString("en-IN")}`
                );

                await updateChatState(customerId, "COMPLETED");

                return await message.reply(
                    `✅ *Quotation Sent Successfully!*

Thank you for choosing *Majisa Web Solutions*.

Our team will review your requirements and contact you shortly.

Type *Hi* to start a new inquiry.`
                );

            } else if (text === "2") {

                await updateChatState(customerId, "COMPLETED");

                await updateCustomer(customerId, {
                    status: "Talk to Executive"
                });

                return await message.reply(
                    `👨‍💼 Thank you for contacting *Majisa Web Solutions*.

One of our executives will contact you shortly.

📞 Majisa Web Solutions`
                );

            } else {

                return await message.reply(
                    `❌ Please choose:\n\n1️⃣ Yes, Send PDF\n2️⃣ Talk to Executive\n\n_⬅️ Type *0* to go back_`
                );
            }
        }

        default:
            return;
    }
};
