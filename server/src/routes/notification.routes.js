import express from "express";
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount
} from "../controllers/notification.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { adminLimiter } from "../middleware/rateLimiter.middleware.js";
import { mongoIdValidator } from "../validators/api.validator.js";
import { validate } from "../middleware/validate.middleware.js";

const router = express.Router();

router.use(protect);
router.use(adminLimiter);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", mongoIdValidator, validate, markAsRead);

export default router;
