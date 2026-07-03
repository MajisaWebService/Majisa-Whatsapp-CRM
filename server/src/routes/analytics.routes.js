import express from "express";
import { getAnalyticsStats } from "../controllers/analytics.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/stats", getAnalyticsStats);

export default router;
