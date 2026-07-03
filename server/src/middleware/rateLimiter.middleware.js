import rateLimit from "express-rate-limit";

const standardLimiterResponse = (msg) => ({
    success: false,
    message: msg || "Too many requests. Please slow down and try again."
});

// General API rate limiter (Increased to 5000 requests per 15 minutes to allow smooth dashboard polling, multi-tab support, and hot reloads)
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5000,
    standardHeaders: true,
    legacyHeaders: false,
    message: standardLimiterResponse("Too many requests. Please slow down and try again.")
});

// 1. Authentication Rate Limiter (Increased to 30 requests/minute to accommodate development and repeated auth checks)
export const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: standardLimiterResponse("Too many authentication attempts. Limit is 30 requests per minute.")
});

// 2. Chat APIs Rate Limiter (200 requests/minute to support fast real-time chat interactions)
export const chatLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: standardLimiterResponse("Too many chat message actions. Limit is 200 requests per minute.")
});

// 3. Admin APIs Rate Limiter (500 requests/minute)
export const adminLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: standardLimiterResponse("Too many admin operations. Limit is 500 requests per minute.")
});

// 4. File Uploads Rate Limiter (30 requests/minute)
export const uploadLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: standardLimiterResponse("Too many media uploads. Limit is 30 uploads per minute.")
});
