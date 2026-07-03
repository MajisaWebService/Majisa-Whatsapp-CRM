import PricingRule from "../../models/PricingRule.js";

let cachedPricing = null;

export const invalidatePricingCache = () => {
    console.log("⚡ Pricing cache invalidated");
    cachedPricing = null;
};

const loadPricingData = async () => {
    if (cachedPricing) return cachedPricing;

    console.log("⚡ Fetching pricing rules from database...");
    const rules = await PricingRule.find({ isActive: true }).sort({ sortOrder: 1 });

    const services = {};
    const features = {};
    const pageRanges = {};

    // 1. Separate rules by category
    const serviceRules = rules.filter(r => r.category === "SERVICE");
    const packageRules = rules.filter(r => r.category === "PACKAGE");
    const featureRules = rules.filter(r => r.category === "FEATURE");
    const pageRangeRules = rules.filter(r => r.category === "PAGE_RANGE");

    // 2. Build Services & Packages
    serviceRules.forEach(s => {
        services[s.key] = {
            name: s.name,
            emoji: s.emoji,
            hasSubTypes: s.hasSubTypes,
            hasPages: s.hasPages,
            hasFeatures: s.hasFeatures,
            subTypes: {}
        };
    });

    packageRules.forEach(p => {
        const parts = p.key.split("_");
        const sKey = p.serviceKey || parts[0];
        const pKey = parts[1] || p.key;

        if (services[sKey]) {
            services[sKey].subTypes[pKey] = {
                name: p.name,
                basePrice: p.price
            };
        }
    });

    // 3. Build Features
    featureRules.forEach(f => {
        features[f.key] = {
            name: f.name,
            price: f.price
        };
    });

    // 4. Build Page Ranges
    pageRangeRules.forEach(pr => {
        pageRanges[pr.key] = {
            label: pr.name,
            extraPages: pr.extraPages,
            pricePerPage: pr.pricePerPage
        };
    });

    cachedPricing = { services, features, pageRanges };
    return cachedPricing;
};

export const getServices = async () => {
    const data = await loadPricingData();
    return data.services;
};

export const getFeatures = async () => {
    const data = await loadPricingData();
    return data.features;
};

export const getPageRanges = async () => {
    const data = await loadPricingData();
    return data.pageRanges;
};

// Helper: Build Sub-Type Menu Text
export const getSubTypeMenu = async (serviceKey) => {
    const services = await getServices();
    const service = services[serviceKey];

    if (!service || !service.subTypes) return null;

    const emoji = service.emoji;
    let menu = `${emoji} *${service.name}*\n\nChoose a type:\n\n`;

    for (const [key, subType] of Object.entries(service.subTypes)) {
        menu += `${key}️⃣ ${subType.name}\n`;
    }

    return menu.trim();
};

// Helper: Build Page Range Menu Text
export const getPageRangeMenu = async () => {
    const pageRanges = await getPageRanges();
    let menu = `📄 *How many pages?*\n\n`;

    for (const [key, range] of Object.entries(pageRanges)) {
        menu += `${key}️⃣ ${range.label}\n`;
    }

    return menu.trim();
};

// Helper: Build Features Menu Text
export const getFeaturesMenu = async () => {
    const features = await getFeatures();
    let menu = `✨ *Choose Additional Features*\n\nReply with numbers separated by commas.\n\n`;

    for (const [key, feature] of Object.entries(features)) {
        menu += `${key}. ${feature.name}`;
        if (feature.price > 0) {
            menu += ` (₹${feature.price.toLocaleString("en-IN")})`;
        }
        menu += `\n`;
    }

    menu += `\nExample: *1,2,3,4*\n`;
    menu += `Type *skip* to skip features.`;

    return menu.trim();
};
