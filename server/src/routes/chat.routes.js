import express from "express";
import {
    getAllChats,
    getChatMessages,
    sendMessage,
    markAsRead,
    sendMediaMessage
} from "../controllers/chat.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getAllChats);
router.get("/:customerId/messages", getChatMessages);
router.post("/send", sendMessage);
router.post("/upload", sendMediaMessage);
router.patch("/:chatId/read", markAsRead);

export default router;
