import rateLimit from "express-rate-limit";

// General API rate limiter (100 requests per 15 minutes)
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests, please try again later."
    }
});

// Authentication rate limiter (15 requests per hour for sensitive login/register routes)
export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many login/registration attempts, please try again after an hour."
    }
});
