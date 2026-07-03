import express from "express";
import {
    getSettings,
    updateSettings,
    backupDatabase
} from "../controllers/settings.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/rbac.middleware.js";
import { adminLimiter } from "../middleware/rateLimiter.middleware.js";

const router = express.Router();

router.use(protect);
router.use(adminLimiter);

router.get("/", getSettings);
router.put("/", checkRole("SUPER_ADMIN", "ADMIN"), updateSettings);
router.post("/backup", checkRole("SUPER_ADMIN"), backupDatabase);

export default router;
