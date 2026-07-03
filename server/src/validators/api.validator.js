import { body, param, query } from "express-validator";

export const mongoIdValidator = [
    param("id").isMongoId().withMessage("Invalid MongoDB identifier format")
];

export const customerValidator = [
    body("name")
        .optional()
        .trim()
        .escape()
        .isLength({ min: 2 })
        .withMessage("Name must be at least 2 characters long"),
    body("company")
        .optional()
        .trim()
        .escape(),
    body("email")
        .optional({ checkFalsy: true })
        .trim()
        .isEmail()
        .withMessage("Must be a valid email address")
        .normalizeEmail(),
    body("phone")
        .optional()
        .trim()
        .matches(/^\+?[1-9]\d{1,14}$/)
        .withMessage("Must be a valid international telephone number"),
    body("city")
        .optional()
        .trim()
        .escape(),
    body("service")
        .optional()
        .trim()
        .escape(),
    body("assignedTo")
        .optional()
        .trim()
        .escape()
];

export const pricingRuleValidator = [
    body("category")
        .trim()
        .isIn(["SERVICE", "PACKAGE", "FEATURE", "PAGE_RANGE"])
        .withMessage("Invalid pricing rule category type"),
    body("key")
        .trim()
        .notEmpty()
        .withMessage("Unique key reference code is required")
        .escape(),
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Pricing rule name is required")
        .escape(),
    body("price")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Price must be a positive number"),
    body("serviceKey")
        .optional()
        .trim()
        .escape(),
    body("emoji")
        .optional()
        .trim(),
    body("hasSubTypes")
        .optional()
        .isBoolean()
        .withMessage("hasSubTypes must be a boolean"),
    body("hasPages")
        .optional()
        .isBoolean()
        .withMessage("hasPages must be a boolean"),
    body("hasFeatures")
        .optional()
        .isBoolean()
        .withMessage("hasFeatures must be a boolean"),
    body("extraPages")
        .optional()
        .isInt({ min: 0 })
        .withMessage("extraPages count must be a non-negative integer"),
    body("pricePerPage")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("pricePerPage amount must be non-negative"),
    body("sortOrder")
        .optional()
        .isInt()
        .withMessage("Sort order must be an integer value")
];

export const projectValidator = [
    body("customer")
        .isMongoId()
        .withMessage("Valid Customer reference identifier is required"),
    body("title")
        .trim()
        .notEmpty()
        .withMessage("Project contract title is required")
        .escape(),
    body("description")
        .optional()
        .trim()
        .escape(),
    body("status")
        .optional()
        .isIn(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "ON_HOLD", "CANCELLED"])
        .withMessage("Invalid project operational status"),
    body("totalAmount")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Project amount must be a positive number"),
    body("notes")
        .optional()
        .trim()
        .escape()
];
