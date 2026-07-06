import mongoose from "mongoose";
import dotenv from "dotenv";
import PricingRule from "../models/PricingRule.js";

dotenv.config();

const SERVICES = {
    "1": {
        name: "Website Development",
        emoji: "🌐",
        hasSubTypes: true,
        hasPages: true,
        hasFeatures: true,
        subTypes: {
            "1": { name: "Business Website", basePrice: 9999 },
            "2": { name: "E-Commerce Website", basePrice: 14999 },
            "3": { name: "Portfolio Website", basePrice: 7999 },
            "4": { name: "Educational Website", basePrice: 12999 },
            "5": { name: "Hospital Website", basePrice: 14999 },
            "6": { name: "Hotel Website", basePrice: 14999 },
            "7": { name: "Real Estate Website", basePrice: 19999 },
            "8": { name: "NGO Website", basePrice: 8999 },
            "9": { name: "Custom Website", basePrice: 24999 }
        }
    },
    "2": {
        name: "Mobile Application",
        emoji: "📱",
        hasSubTypes: true,
        hasPages: false,
        hasFeatures: true,
        subTypes: {
            "1": { name: "Android App", basePrice: 19999 },
            "2": { name: "iOS App", basePrice: 24999 },
            "3": { name: "Cross-Platform App", basePrice: 29999 },
            "4": { name: "Custom Mobile App", basePrice: 34999 }
        }
    },
    "3": {
        name: "Custom Software",
        emoji: "💻",
        hasSubTypes: true,
        hasPages: false,
        hasFeatures: true,
        subTypes: {
            "1": { name: "CRM Software", basePrice: 29999 },
            "2": { name: "ERP Software", basePrice: 49999 },
            "3": { name: "HRMS Software", basePrice: 19999 },
            "4": { name: "Billing Software", basePrice: 14999 },
            "5": { name: "Custom Solution", basePrice: 39999 }
        }
    },
    "4": {
        name: "Cloud & DevOps",
        emoji: "☁️",
        hasSubTypes: true,
        hasPages: false,
        hasFeatures: false,
        subTypes: {
            "1": { name: "AWS Setup", basePrice: 9999 },
            "2": { name: "Docker & Kubernetes", basePrice: 14999 },
            "3": { name: "CI/CD Pipeline", basePrice: 7999 },
            "4": { name: "Cloud Migration", basePrice: 19999 }
        }
    },
    "5": {
        name: "AI Automation",
        emoji: "🤖",
        hasSubTypes: true,
        hasPages: false,
        hasFeatures: true,
        subTypes: {
            "1": { name: "AI Chatbot", basePrice: 14999 },
            "2": { name: "Workflow Automation", basePrice: 19999 },
            "3": { name: "AI Data Analytics", basePrice: 24999 },
            "4": { name: "Custom AI Bot", basePrice: 49999 }
        }
    },
    "6": {
        name: "Digital Marketing",
        emoji: "📈",
        hasSubTypes: true,
        hasPages: false,
        hasFeatures: false,
        subTypes: {
            "1": { name: "SEO Optimization", basePrice: 9999 },
            "2": { name: "Social Media Marketing", basePrice: 12999 },
            "3": { name: "PPC Campaign", basePrice: 14999 },
            "4": { name: "Brand Strategy", basePrice: 19999 }
        }
    }
};

const PAGE_RANGES = {
    "1": { label: "5 Pages", extraPages: 0, pricePerPage: 0 },
    "2": { label: "8 Pages", extraPages: 3, pricePerPage: 500 },
    "3": { label: "10 Pages", extraPages: 5, pricePerPage: 500 },
    "4": { label: "15 Pages", extraPages: 10, pricePerPage: 500 },
    "5": { label: "Custom Pages", extraPages: 0, pricePerPage: 0 }
};

const FEATURES = {
    "1":  { name: "Admin Panel", price: 8000 },
    "2":  { name: "Payment Gateway", price: 5000 },
    "3":  { name: "WhatsApp Chat", price: 1500 },
    "4":  { name: "SEO", price: 3000 },
    "5":  { name: "Blog", price: 3000 },
    "6":  { name: "Contact Form", price: 1500 },
    "7":  { name: "Google Maps", price: 1000 },
    "8":  { name: "Live Chat", price: 4000 },
    "9":  { name: "Login System", price: 4000 },
    "10": { name: "Appointment Booking", price: 6000 },
    "11": { name: "Done Selecting", price: 0 }
};

export const seedPricingData = async (shouldClear = false) => {
    if (shouldClear) {
        console.log("Clearing existing PricingRules...");
        await PricingRule.deleteMany({});
    } else {
        const count = await PricingRule.countDocuments();
        if (count > 0) {
            console.log("PricingRules already seeded. Skipping.");
            return;
        }
    }

    const rules = [];

    // 1. Seed Services & Packages
    Object.entries(SERVICES).forEach(([sKey, sVal], sIndex) => {
        // Add service
        rules.push({
            category: "SERVICE",
            key: sKey,
            name: sVal.name,
            emoji: sVal.emoji,
            hasSubTypes: sVal.hasSubTypes,
            hasPages: sVal.hasPages,
            hasFeatures: sVal.hasFeatures,
            sortOrder: sIndex
        });

        // Add subtypes (packages) of this service
        if (sVal.subTypes) {
            Object.entries(sVal.subTypes).forEach(([pKey, pVal], pIndex) => {
                rules.push({
                    category: "PACKAGE",
                    key: `${sKey}_${pKey}`,
                    name: pVal.name,
                    price: pVal.basePrice,
                    serviceKey: sKey,
                    sortOrder: pIndex
                });
            });
        }
    });

    // 2. Seed Page Ranges
    Object.entries(PAGE_RANGES).forEach(([rKey, rVal], rIndex) => {
        rules.push({
            category: "PAGE_RANGE",
            key: rKey,
            name: rVal.label,
            extraPages: rVal.extraPages,
            pricePerPage: rVal.pricePerPage,
            sortOrder: rIndex
        });
    });

    // 3. Seed Features
    Object.entries(FEATURES).forEach(([fKey, fVal], fIndex) => {
        rules.push({
            category: "FEATURE",
            key: fKey,
            name: fVal.name,
            price: fVal.price,
            sortOrder: fIndex
        });
    });

    console.log(`Inserting ${rules.length} pricing rules...`);
    await PricingRule.insertMany(rules);
    console.log("✅ Database seeded successfully!");
};

// Run directly if executed via node command
const isDirectRun = import.meta.url === `file://${process.argv[1]}` || (process.argv[1] && process.argv[1].endsWith("seedPricing.js"));
if (isDirectRun) {
    dotenv.config();
    mongoose.connect(process.env.MONGO_URI)
        .then(() => seedPricingData(true))
        .then(() => process.exit(0))
        .catch(err => {
            console.error("❌ Seeding failed:", err);
            process.exit(1);
        });
}

