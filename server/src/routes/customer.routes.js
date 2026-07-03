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

const router = express.Router();

router.use(protect);

router.get("/", getAllCustomers);
router.get("/:id", getCustomerById);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);
router.patch("/:id/status", changeLeadStatus);
router.patch("/:id/assign", assignExecutive);
router.patch("/:id/notes", addNotes);
router.patch("/:id/toggle-bot", toggleBotPause);

export default router;
