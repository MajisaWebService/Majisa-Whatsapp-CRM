// src/chatbot/services/quotation.service.js

import Quotation from "../../models/Quotation.js";
import { SERVICES, PAGE_RANGES, FEATURES } from "../config/pricing.config.js";

// ==========================================
// Calculate Quotation from ChatState data
// ==========================================

export const calculateQuotation = (chatState) => {

    const serviceKey = chatState.serviceKey;
    const service = SERVICES[serviceKey];

    if (!service) {
        return { totalAmount: 0, breakdown: { items: [] } };
    }

    const items = [];
    let totalAmount = 0;

    // 1. Base Price from sub-type
    const subTypeKey = chatState.data?.subTypeKey;

    if (subTypeKey && service.subTypes && service.subTypes[subTypeKey]) {

        const subType = service.subTypes[subTypeKey];

        items.push({
            name: `${subType.name} (Base Package)`,
            price: subType.basePrice
        });

        totalAmount += subType.basePrice;
    }

    // 2. Extra Pages (only for services with pages)
    const pageRangeKey = chatState.data?.pageRangeKey;
    let extraPagesPrice = 0;

    if (pageRangeKey && PAGE_RANGES[pageRangeKey]) {

        const pageRange = PAGE_RANGES[pageRangeKey];

        if (pageRange.extraPages > 0) {

            extraPagesPrice = pageRange.extraPages * pageRange.pricePerPage;

            items.push({
                name: `Extra Pages (${pageRange.label})`,
                price: extraPagesPrice
            });

            totalAmount += extraPagesPrice;
        }
    }

    // 3. Selected Features
    const featureKeys = chatState.data?.selectedFeatureKeys || [];
    let featuresPrice = 0;

    for (const key of featureKeys) {

        const feature = FEATURES[key];

        if (feature && feature.price > 0) {

            items.push({
                name: feature.name,
                price: feature.price
            });

            featuresPrice += feature.price;
            totalAmount += feature.price;
        }
    }

    return {
        totalAmount,
        breakdown: {
            basePrice: items.length > 0 ? items[0].price : 0,
            extraPagesPrice,
            featuresPrice,
            items
        }
    };
};

// ==========================================
// Build Quotation Display Text
// ==========================================

export const buildQuotationText = (chatState, quotationData) => {

    const { totalAmount, breakdown } = quotationData;

    const service = SERVICES[chatState.serviceKey];
    const serviceName = service ? service.name : chatState.service;

    const subTypeKey = chatState.data?.subTypeKey;
    const subTypeName = (subTypeKey && service?.subTypes?.[subTypeKey])
        ? service.subTypes[subTypeKey].name
        : "";

    const pageRange = chatState.data?.pageRange || "";

    // Selected feature names
    const featureKeys = chatState.data?.selectedFeatureKeys || [];
    const featureNames = featureKeys
        .map(k => FEATURES[k]?.name)
        .filter(Boolean);

    let text = `📋 *Estimated Quotation*\n\n`;

    text += `*Service:* ${serviceName}\n`;

    if (subTypeName) {
        text += `*Type:* ${subTypeName}\n`;
    }

    if (pageRange) {
        text += `*Pages:* ${pageRange}\n`;
    }

    if (featureNames.length > 0) {
        text += `\n*Selected Features:*\n`;
        for (const name of featureNames) {
            text += `  ✅ ${name}\n`;
        }
    }

    // Itemized Breakdown
    text += `\n--------------------\n`;
    text += `*Cost Breakdown:*\n\n`;

    for (const item of breakdown.items) {
        text += `${item.name}: ₹${item.price.toLocaleString("en-IN")}\n`;
    }

    text += `\n--------------------\n`;
    text += `*Estimated Total: ₹${totalAmount.toLocaleString("en-IN")}*\n`;
    text += `--------------------\n\n`;

    text += `Would you like to receive a PDF quotation?\n\n`;
    text += `1️⃣ Yes, Send PDF\n`;
    text += `2️⃣ Talk to Executive`;

    return text;
};

// ==========================================
// Save Quotation to Database
// ==========================================

export const saveQuotation = async (customerId, chatState, quotationData) => {

    const service = SERVICES[chatState.serviceKey];
    const subTypeKey = chatState.data?.subTypeKey;

    const quotation = await Quotation.create({
        customerId,
        service: service ? service.name : chatState.service,
        subType: (subTypeKey && service?.subTypes?.[subTypeKey])
            ? service.subTypes[subTypeKey].name
            : "",
        pageRange: chatState.data?.pageRange || "",
        selectedFeatures: (chatState.data?.selectedFeatureKeys || [])
            .map(k => FEATURES[k]?.name)
            .filter(Boolean),
        breakdown: quotationData.breakdown,
        totalAmount: quotationData.totalAmount,
        status: "GENERATED"
    });

    console.log("✅ Quotation Saved:", quotation._id);

    return quotation;
};
