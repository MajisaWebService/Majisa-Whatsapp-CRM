import express from "express";
import {
    getAllProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject
} from "../controllers/project.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/rbac.middleware.js";
import { adminLimiter } from "../middleware/rateLimiter.middleware.js";
import { projectValidator, mongoIdValidator } from "../validators/api.validator.js";
import { validate } from "../middleware/validate.middleware.js";

const router = express.Router();

router.use(protect);
router.use(adminLimiter);

router.get("/", getAllProjects);
router.get("/:id", mongoIdValidator, validate, getProjectById);
router.post("/", projectValidator, validate, createProject);
router.put("/:id", mongoIdValidator, projectValidator, validate, updateProject);
router.delete("/:id", mongoIdValidator, validate, checkRole("SUPER_ADMIN"), deleteProject);

export default router;
