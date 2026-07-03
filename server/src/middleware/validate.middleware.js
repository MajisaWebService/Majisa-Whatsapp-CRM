import { validationResult } from "express-validator";

export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(err => ({
            field: err.path || err.param,
            message: err.msg
        }));
        return res.status(400).json({
            success: false,
            message: "Input validation failed.",
            errors: formattedErrors
        });
    }
    next();
};
