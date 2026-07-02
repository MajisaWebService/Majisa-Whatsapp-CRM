// src/chatbot/config/pricing.config.js

// ==========================================
// Services Configuration
// ==========================================

export const SERVICES = {

    "1": {
        name: "Website Development",
        emoji: "🌐",
        hasSubTypes: true,
        hasPages: true,
        hasFeatures: true,
        subTypes: {
            "1": { name: "Business Website", basePrice: 9999 },
            "2": { name: "E-Commerce", basePrice: 14999 },
            "3": { name: "Portfolio", basePrice: 7999 },
            "4": { name: "School Website", basePrice: 12999 },
            "5": { name: "Hospital Website", basePrice: 14999 },
            "6": { name: "NGO Website", basePrice: 8999 },
            "7": { name: "Custom Web Application", basePrice: 24999 }
        }
    },

    "2": {
        name: "Mobile App",
        emoji: "📱",
        hasSubTypes: true,
        hasPages: false,
        hasFeatures: true,
        subTypes: {
            "1": { name: "Android App", basePrice: 19999 },
            "2": { name: "iOS App", basePrice: 24999 },
            "3": { name: "Cross-Platform (Flutter)", basePrice: 29999 },
            "4": { name: "PWA (Progressive Web App)", basePrice: 14999 }
        }
    },

    "3": {
        name: "Software",
        emoji: "💻",
        hasSubTypes: true,
        hasPages: false,
        hasFeatures: true,
        subTypes: {
            "1": { name: "CRM Software", basePrice: 29999 },
            "2": { name: "ERP Software", basePrice: 49999 },
            "3": { name: "Inventory Management", basePrice: 19999 },
            "4": { name: "Billing Software", basePrice: 14999 },
            "5": { name: "Custom Software", basePrice: 39999 }
        }
    },

    "4": {
        name: "AI Solutions",
        emoji: "🤖",
        hasSubTypes: true,
        hasPages: false,
        hasFeatures: true,
        subTypes: {
            "1": { name: "AI Chatbot", basePrice: 14999 },
            "2": { name: "AI Data Analytics", basePrice: 24999 },
            "3": { name: "AI Automation", basePrice: 19999 },
            "4": { name: "Custom AI Solution", basePrice: 49999 }
        }
    },

    "5": {
        name: "Automation",
        emoji: "⚡",
        hasSubTypes: true,
        hasPages: false,
        hasFeatures: true,
        subTypes: {
            "1": { name: "WhatsApp Automation", basePrice: 9999 },
            "2": { name: "Email Automation", basePrice: 7999 },
            "3": { name: "Social Media Automation", basePrice: 12999 },
            "4": { name: "Business Process Automation", basePrice: 19999 }
        }
    },

    "6": {
        name: "E-Commerce",
        emoji: "🛒",
        hasSubTypes: true,
        hasPages: false,
        hasFeatures: true,
        subTypes: {
            "1": { name: "Shopify Store", basePrice: 14999 },
            "2": { name: "WooCommerce Store", basePrice: 12999 },
            "3": { name: "Custom E-Commerce", basePrice: 24999 },
            "4": { name: "Marketplace (Multi-Vendor)", basePrice: 39999 }
        }
    },

    "7": {
        name: "Digital Marketing",
        emoji: "📈",
        hasSubTypes: true,
        hasPages: false,
        hasFeatures: false,
        subTypes: {
            "1": { name: "SEO Package", basePrice: 9999 },
            "2": { name: "Google Ads", basePrice: 14999 },
            "3": { name: "Social Media Marketing", basePrice: 12999 },
            "4": { name: "Complete Digital Marketing", basePrice: 24999 }
        }
    },

    "8": {
        name: "UI/UX",
        emoji: "🎨",
        hasSubTypes: true,
        hasPages: false,
        hasFeatures: false,
        subTypes: {
            "1": { name: "Website UI/UX Design", basePrice: 9999 },
            "2": { name: "Mobile App UI/UX Design", basePrice: 14999 },
            "3": { name: "Dashboard UI Design", basePrice: 12999 },
            "4": { name: "Brand Identity Design", basePrice: 19999 }
        }
    },

    "9": {
        name: "AR/VR",
        emoji: "🥽",
        hasSubTypes: true,
        hasPages: false,
        hasFeatures: true,
        subTypes: {
            "1": { name: "AR Application", basePrice: 49999 },
            "2": { name: "VR Application", basePrice: 59999 },
            "3": { name: "360° Virtual Tour", basePrice: 29999 },
            "4": { name: "AR Product Viewer", basePrice: 34999 }
        }
    }

};

// ==========================================
// Page Range Options (for Website Development)
// ==========================================

export const PAGE_RANGES = {
    "1": { label: "1-5 Pages", extraPages: 0, pricePerPage: 0 },
    "2": { label: "6-10 Pages", extraPages: 5, pricePerPage: 500 },
    "3": { label: "11-20 Pages", extraPages: 15, pricePerPage: 500 },
    "4": { label: "20+ Pages", extraPages: 25, pricePerPage: 500 }
};

// ==========================================
// Additional Features
// ==========================================

export const FEATURES = {
    "1":  { name: "SEO", price: 3000 },
    "2":  { name: "WhatsApp Chat", price: 1500 },
    "3":  { name: "Payment Gateway", price: 5000 },
    "4":  { name: "Admin Panel", price: 8000 },
    "5":  { name: "Login System", price: 4000 },
    "6":  { name: "Blog", price: 3000 },
    "7":  { name: "Booking System", price: 6000 },
    "8":  { name: "Multi Language", price: 5000 },
    "9":  { name: "API Integration", price: 7000 },
    "10": { name: "Live Chat", price: 4000 },
    "11": { name: "Google Analytics", price: 2000 },
    "12": { name: "Domain & Hosting", price: 5000 },
    "13": { name: "SSL Certificate", price: 2000 },
    "14": { name: "Email Setup", price: 3000 },
    "15": { name: "Other", price: 0 }
};

// ==========================================
// Helper: Build Sub-Type Menu Text
// ==========================================

export const getSubTypeMenu = (serviceKey) => {

    const service = SERVICES[serviceKey];

    if (!service || !service.subTypes) return null;

    const emoji = service.emoji;
    let menu = `${emoji} *${service.name}*\n\nChoose a type:\n\n`;

    for (const [key, subType] of Object.entries(service.subTypes)) {
        menu += `${key}️⃣ ${subType.name}\n`;
    }

    return menu.trim();
};

// ==========================================
// Helper: Build Page Range Menu Text
// ==========================================

export const getPageRangeMenu = () => {

    let menu = `📄 *How many pages?*\n\n`;

    for (const [key, range] of Object.entries(PAGE_RANGES)) {
        menu += `${key}️⃣ ${range.label}\n`;
    }

    return menu.trim();
};

// ==========================================
// Helper: Build Features Menu Text
// ==========================================

export const getFeaturesMenu = () => {

    let menu = `✨ *Choose Additional Features*\n\nReply with numbers separated by commas.\n\n`;

    for (const [key, feature] of Object.entries(FEATURES)) {
        menu += `${key}. ${feature.name}`;
        if (feature.price > 0) {
            menu += ` (₹${feature.price.toLocaleString("en-IN")})`;
        }
        menu += `\n`;
    }

    menu += `\nExample: *1,2,3,4*\n`;
    menu += `Type *skip* to skip features.`;

    return menu;
};
