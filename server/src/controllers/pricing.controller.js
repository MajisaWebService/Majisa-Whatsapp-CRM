import PricingRule from "../models/PricingRule.js";
import { invalidatePricingCache } from "../chatbot/config/pricing.config.js";

// Get all pricing rules (with category filtering)
export const getAllPricingRules = async (req, res) => {
    try {
        const query = {};
        if (req.query.category) query.category = req.query.category;

        const rules = await PricingRule.find(query).sort({ category: 1, sortOrder: 1 });
        return res.status(200).json({ success: true, data: rules });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Create a new pricing rule
export const createPricingRule = async (req, res) => {
    try {
        const rule = await PricingRule.create(req.body);
        invalidatePricingCache();
        return res.status(201).json({ success: true, data: rule });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Update an existing pricing rule
export const updatePricingRule = async (req, res) => {
    try {
        const rule = await PricingRule.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!rule) {
            return res.status(404).json({ success: false, message: "Pricing rule not found." });
        }
        invalidatePricingCache();
        return res.status(200).json({ success: true, data: rule });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a pricing rule
export const deletePricingRule = async (req, res) => {
    try {
        const rule = await PricingRule.findByIdAndDelete(req.params.id);
        if (!rule) {
            return res.status(404).json({ success: false, message: "Pricing rule not found." });
        }
        invalidatePricingCache();
        return res.status(200).json({ success: true, message: "Pricing rule deleted successfully." });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Toggle active status
export const togglePricingRuleActive = async (req, res) => {
    try {
        const rule = await PricingRule.findById(req.params.id);
        if (!rule) {
            return res.status(404).json({ success: false, message: "Pricing rule not found." });
        }
        rule.isActive = !rule.isActive;
        await rule.save();
        invalidatePricingCache();
        return res.status(200).json({ success: true, data: rule });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
