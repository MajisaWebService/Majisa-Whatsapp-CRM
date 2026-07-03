import express from "express";
import {
    getAllPricingRules,
    createPricingRule,
    updatePricingRule,
    deletePricingRule,
    togglePricingRuleActive
} from "../controllers/pricing.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/rbac.middleware.js";
import { adminLimiter } from "../middleware/rateLimiter.middleware.js";
import { pricingRuleValidator, mongoIdValidator } from "../validators/api.validator.js";
import { validate } from "../middleware/validate.middleware.js";

const router = express.Router();

router.use(protect);
router.use(adminLimiter);

router.get("/", getAllPricingRules);

// Read configurations is open to all logged in admins, write requires role validation
router.post("/", checkRole("SUPER_ADMIN", "ADMIN"), pricingRuleValidator, validate, createPricingRule);
router.put("/:id", mongoIdValidator, checkRole("SUPER_ADMIN", "ADMIN"), pricingRuleValidator, validate, updatePricingRule);
router.delete("/:id", mongoIdValidator, validate, checkRole("SUPER_ADMIN"), deletePricingRule);
router.patch("/:id/toggle", mongoIdValidator, validate, checkRole("SUPER_ADMIN", "ADMIN"), togglePricingRuleActive);

export default router;
