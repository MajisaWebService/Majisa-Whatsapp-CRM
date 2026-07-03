import express from "express";
import {
    calculateQuotationAdmin,
    createQuotation,
    getAllQuotations,
    getQuotationById,
    updateQuotationStatus
} from "../controllers/quotation.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/rbac.middleware.js";
import { adminLimiter } from "../middleware/rateLimiter.middleware.js";
import { mongoIdValidator } from "../validators/api.validator.js";
import { validate } from "../middleware/validate.middleware.js";

const router = express.Router();

router.use(protect);
router.use(adminLimiter);

router.post("/calculate", calculateQuotationAdmin);
router.post("/", createQuotation);
router.get("/", getAllQuotations);
router.get("/:id", mongoIdValidator, validate, getQuotationById);
router.patch("/:id/status", mongoIdValidator, validate, updateQuotationStatus);

export default router;
