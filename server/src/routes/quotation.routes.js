import express from "express";
import {
    calculateQuotationAdmin,
    createQuotation,
    getAllQuotations,
    getQuotationById,
    updateQuotationStatus
} from "../controllers/quotation.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/calculate", calculateQuotationAdmin);
router.post("/", createQuotation);
router.get("/", getAllQuotations);
router.get("/:id", getQuotationById);
router.patch("/:id/status", updateQuotationStatus);

export default router;
