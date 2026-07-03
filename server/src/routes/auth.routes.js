import express from "express";
import {
    registerAdmin,
    loginAdmin,
    getMe,
    getAllAdmins,
    refreshSessionToken,
    forgotPassword,
    resetPassword,
    changePassword,
    updateAdminStatus,
    updateAdminRole,
    deleteAdmin
} from "../controllers/auth.controller.js";
import { registerValidator, loginValidator } from "../validators/auth.validator.js";
import { validate } from "../middleware/validate.middleware.js";
import { protect, authorize } from "../middleware/auth.middleware.js";
import { authLimiter } from "../middleware/rateLimiter.middleware.js";

const router = express.Router();

router.post("/register", authLimiter, registerValidator, validate, registerAdmin);
router.post("/login", authLimiter, loginValidator, validate, loginAdmin);
router.post("/refresh-token", refreshSessionToken);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

// Protected routes
router.get("/me", protect, getMe);
router.put("/change-password", protect, changePassword);

// Administrative routes (Super Admin only)
router.get("/admins", protect, authorize("SUPER_ADMIN"), getAllAdmins);
router.put("/admins/:id/status", protect, authorize("SUPER_ADMIN"), updateAdminStatus);
router.put("/admins/:id/role", protect, authorize("SUPER_ADMIN"), updateAdminRole);
router.delete("/admins/:id", protect, authorize("SUPER_ADMIN"), deleteAdmin);

export default router;