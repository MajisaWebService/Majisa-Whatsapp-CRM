import mongoose from "mongoose";

const pricingRuleSchema = new mongoose.Schema(
    {
        category: {
            type: String,
            required: true,
            enum: ["SERVICE", "PACKAGE", "FEATURE", "PAGE_RANGE"]
        },
        key: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        price: {
            type: Number,
            default: 0
        },
        serviceKey: {
            type: String,
            default: ""
        },
        emoji: {
            type: String,
            default: ""
        },
        hasSubTypes: {
            type: Boolean,
            default: false
        },
        hasPages: {
            type: Boolean,
            default: false
        },
        hasFeatures: {
            type: Boolean,
            default: false
        },
        extraPages: {
            type: Number,
            default: 0
        },
        pricePerPage: {
            type: Number,
            default: 0
        },
        isActive: {
            type: Boolean,
            default: true
        },
        sortOrder: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

// Unique combination index for category & key
pricingRuleSchema.index({ category: 1, key: 1 }, { unique: true });

const PricingRule = mongoose.model("PricingRule", pricingRuleSchema);

export default PricingRule;
