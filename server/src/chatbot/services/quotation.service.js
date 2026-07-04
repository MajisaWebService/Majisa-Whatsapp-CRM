import Quotation from "../../models/Quotation.js";
import Notification from "../../models/Notification.js";
import { getServices, getPageRanges, getFeatures } from "../config/pricing.config.js";
import { emitNotification } from "../../sockets/emitter.js";

// ==========================================
// Calculate Quotation from ChatState data
// ==========================================

export const calculateQuotation = async (chatState) => {
    const SERVICES = await getServices();
    const PAGE_RANGES = await getPageRanges();
    const FEATURES = await getFeatures();

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

export const buildQuotationText = async (chatState, quotationData) => {
    const SERVICES = await getServices();
    const FEATURES = await getFeatures();

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

    let text = `━━━━━━━━━━━━━━━━━━\n\n`;
    text += `📋 *Project Summary*\n\n`;
    text += `━━━━━━━━━━━━━━━━━━\n\n`;
    text += `*Service:*\n${serviceName}\n\n`;

    if (subTypeName) {
        text += `*Type:*\n${subTypeName}\n\n`;
    }

    if (pageRange) {
        text += `*Pages:*\n${pageRange}\n\n`;
    }

    if (featureNames.length > 0) {
        text += `*Features:*\n`;
        for (const name of featureNames) {
            text += `✔ ${name}\n`;
        }
        text += `\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━\n\n`;
    text += `*Cost Breakdown:*\n\n`;

    for (const item of breakdown.items) {
        text += `${item.name}: ₹${item.price.toLocaleString("en-IN")}\n`;
    }

    text += `\n━━━━━━━━━━━━━━━━━━\n\n`;
    text += `*Estimated Price*\n\n`;
    text += `*₹${totalAmount.toLocaleString("en-IN")}*\n\n`;
    text += `━━━━━━━━━━━━━━━━━━\n\n`;

    text += `Would you like to continue?\n\n`;
    text += `1️⃣ Continue\n`;
    text += `2️⃣ Modify Features\n`;
    text += `3️⃣ Change Package\n\n`;
    text += `_⬅️ Type *0* to go back_`;

    return text;
};

// ==========================================
// Save Quotation to Database
// ==========================================

export const saveQuotation = async (customerId, chatState, quotationData) => {
    const SERVICES = await getServices();
    const FEATURES = await getFeatures();

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

    try {
        const notif = await Notification.create({
            type: "QUOTATION_GENERATED",
            title: "Quotation Generated",
            message: `Quotation for ${chatState.data?.name || customerId} has been generated. Total: ₹${quotation.totalAmount.toLocaleString("en-IN")}`,
            customerId
        });
        emitNotification(notif);
    } catch (err) {
        console.error("Failed to create quotation notification:", err.message);
    }

    return quotation;
};
