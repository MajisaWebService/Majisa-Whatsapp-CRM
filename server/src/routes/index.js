import express from "express";
import authRoutes from "./auth.routes.js";
import customerRoutes from "./customer.routes.js";
import pricingRoutes from "./pricing.routes.js";
import quotationRoutes from "./quotation.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import chatRoutes from "./chat.routes.js";
import notificationRoutes from "./notification.routes.js";
import projectRoutes from "./project.routes.js";
import settingsRoutes from "./settings.routes.js";
import analyticsRoutes from "./analytics.routes.js";

const router = express.Router();

// Health Check
router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Majisa WhatsApp CRM API v1"
    });
});

// API v1 Routes
router.use("/v1/auth", authRoutes);
router.use("/v1/customers", customerRoutes);
router.use("/v1/pricing", pricingRoutes);
router.use("/v1/quotations", quotationRoutes);
router.use("/v1/dashboard", dashboardRoutes);
router.use("/v1/chats", chatRoutes);
router.use("/v1/notifications", notificationRoutes);
router.use("/v1/projects", projectRoutes);
router.use("/v1/settings", settingsRoutes);
router.use("/v1/analytics", analyticsRoutes);

export default router;