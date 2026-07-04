import express from "express";
import {
    getAllChats,
    getChatMessages,
    sendMessage,
    markAsRead,
    sendMediaMessage,
    deleteChat
} from "../controllers/chat.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { chatLimiter, uploadLimiter } from "../middleware/rateLimiter.middleware.js";
import { mongoIdValidator } from "../validators/api.validator.js";
import { validate } from "../middleware/validate.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/", chatLimiter, getAllChats);
router.get("/:customerId/messages", chatLimiter, getChatMessages);
router.post("/send", chatLimiter, sendMessage);
router.post("/upload", uploadLimiter, sendMediaMessage);
router.patch("/:chatId/read", chatLimiter, markAsRead);
router.delete("/:chatId", chatLimiter, deleteChat);

export default router;
