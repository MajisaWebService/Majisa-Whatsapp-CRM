import PricingRepository from "../repositories/PricingRepository.js";
import AuditLogService from "./AuditLogService.js";

class PricingService {
    async getRules(activeOnly = false) {
        if (activeOnly) {
            return PricingRepository.findActive();
        }
        return PricingRepository.findAll();
    }

    async getRuleById(id) {
        const rule = await PricingRepository.findById(id);
        if (!rule) {
            throw new Error("Pricing rule not found");
        }
        return rule;
    }

    async createRule(ruleData, adminId, ipAddress = "") {
        const existing = await PricingRepository.findByKey(ruleData.key);
        if (existing) {
            throw new Error(`Pricing rule with key "${ruleData.key}" already exists.`);
        }

        const rule = await PricingRepository.create(ruleData);
        await AuditLogService.logAction(
            adminId,
            "PRICING_CREATE",
            { ruleId: rule._id, name: rule.name, key: rule.key },
            ipAddress
        );
        return rule;
    }

    async updateRule(id, ruleData, adminId, ipAddress = "") {
        const original = await PricingRepository.findById(id);
        if (!original) {
            throw new Error("Pricing rule not found");
        }

        const rule = await PricingRepository.update(id, ruleData);
        await AuditLogService.logAction(
            adminId,
            "PRICING_UPDATE",
            { ruleId: id, key: rule.key, changes: ruleData },
            ipAddress
        );
        return rule;
    }

    async deleteRule(id, adminId, ipAddress = "") {
        const rule = await PricingRepository.delete(id);
        if (!rule) {
            throw new Error("Pricing rule not found");
        }

        await AuditLogService.logAction(
            adminId,
            "PRICING_DELETE",
            { ruleId: id, name: rule.name, key: rule.key },
            ipAddress
        );
        return rule;
    }

    async toggleRuleActive(id, adminId, ipAddress = "") {
        const original = await PricingRepository.findById(id);
        if (!original) {
            throw new Error("Pricing rule not found");
        }

        const nextActive = !original.isActive;
        const rule = await PricingRepository.update(id, { isActive: nextActive });

        await AuditLogService.logAction(
            adminId,
            nextActive ? "PRICING_ENABLE" : "PRICING_DISABLE",
            { ruleId: id, key: rule.key },
            ipAddress
        );
        return rule;
    }
}

export default new PricingService();
