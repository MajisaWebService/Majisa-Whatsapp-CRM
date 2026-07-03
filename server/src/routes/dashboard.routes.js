import express from "express";
import { getDashboardStats } from "../controllers/dashboard.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { adminLimiter } from "../middleware/rateLimiter.middleware.js";

const router = express.Router();

router.use(protect);
router.use(adminLimiter);

router.get("/stats", getDashboardStats);

export default router;
