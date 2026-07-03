import express from "express";
import {
    getAllCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
    changeLeadStatus,
    assignExecutive,
    addNotes,
    toggleBotPause
} from "../controllers/customer.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/rbac.middleware.js";
import { adminLimiter } from "../middleware/rateLimiter.middleware.js";
import { customerValidator, mongoIdValidator } from "../validators/api.validator.js";
import { validate } from "../middleware/validate.middleware.js";

const router = express.Router();

router.use(protect);
router.use(adminLimiter);

router.get("/", getAllCustomers);
router.get("/:id", mongoIdValidator, validate, getCustomerById);
router.put("/:id", mongoIdValidator, customerValidator, validate, updateCustomer);
router.delete("/:id", mongoIdValidator, validate, checkRole("SUPER_ADMIN"), deleteCustomer);
router.patch("/:id/status", mongoIdValidator, validate, changeLeadStatus);
router.patch("/:id/assign", mongoIdValidator, validate, assignExecutive);
router.patch("/:id/notes", mongoIdValidator, validate, addNotes);
router.patch("/:id/toggle-bot", mongoIdValidator, validate, toggleBotPause);

export default router;
