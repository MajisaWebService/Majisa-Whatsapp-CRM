import express from "express";
import {
    getSettings,
    updateSettings,
    backupDatabase
} from "../controllers/settings.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getSettings);
router.put("/", authorize("SUPER_ADMIN", "ADMIN"), updateSettings);
router.post("/backup", authorize("SUPER_ADMIN"), backupDatabase);

export default router;
