import express from "express";
import {
    getAllPricingRules,
    createPricingRule,
    updatePricingRule,
    deletePricingRule,
    togglePricingRuleActive
} from "../controllers/pricing.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getAllPricingRules);

// Creation, deletion, and toggle operations require write permissions (ADMIN or SUPER_ADMIN)
router.post("/", authorize("SUPER_ADMIN", "ADMIN"), createPricingRule);
router.put("/:id", authorize("SUPER_ADMIN", "ADMIN"), updatePricingRule);
router.delete("/:id", authorize("SUPER_ADMIN", "ADMIN"), deletePricingRule);
router.patch("/:id/toggle", authorize("SUPER_ADMIN", "ADMIN"), togglePricingRuleActive);

export default router;
