import PricingService from "../services/PricingService.js";
import { invalidatePricingCache } from "../chatbot/config/pricing.config.js";

// Get all pricing rules (with optional active filtering)
export const getAllPricingRules = async (req, res, next) => {
    try {
        const activeOnly = req.query.activeOnly === "true";
        const rules = await PricingService.getRules(activeOnly);
        return res.status(200).json({ success: true, data: rules });
    } catch (error) {
        next(error);
    }
};

// Create a new pricing rule
export const createPricingRule = async (req, res, next) => {
    try {
        const adminId = req.admin._id;
        const ipAddress = req.ip || "";
        const rule = await PricingService.createRule(req.body, adminId, ipAddress);
        
        invalidatePricingCache();
        return res.status(201).json({ success: true, data: rule });
    } catch (error) {
        next(error);
    }
};

// Update an existing pricing rule
export const updatePricingRule = async (req, res, next) => {
    try {
        const adminId = req.admin._id;
        const ipAddress = req.ip || "";
        const rule = await PricingService.updateRule(req.params.id, req.body, adminId, ipAddress);
        
        invalidatePricingCache();
        return res.status(200).json({ success: true, data: rule });
    } catch (error) {
        next(error);
    }
};

// Delete a pricing rule
export const deletePricingRule = async (req, res, next) => {
    try {
        const adminId = req.admin._id;
        const ipAddress = req.ip || "";
        await PricingService.deleteRule(req.params.id, adminId, ipAddress);
        
        invalidatePricingCache();
        return res.status(200).json({ success: true, message: "Pricing rule deleted successfully." });
    } catch (error) {
        next(error);
    }
};

// Toggle active status
export const togglePricingRuleActive = async (req, res, next) => {
    try {
        const adminId = req.admin._id;
        const ipAddress = req.ip || "";
        const rule = await PricingService.toggleRuleActive(req.params.id, adminId, ipAddress);
        
        invalidatePricingCache();
        return res.status(200).json({ success: true, data: rule });
    } catch (error) {
        next(error);
    }
};
