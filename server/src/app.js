// src/app.js

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import routes from "./routes/index.js";
import errorHandler from "./middleware/error.middleware.js";
import { apiLimiter } from "./middleware/rateLimiter.middleware.js";

const app = express();

// Secure headers via Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'"]
        }
    },
    referrerPolicy: { policy: "no-referrer" }
}));

// Configure CORS for trusted domain
const allowedOrigin = process.env.CLIENT_URL || "http://localhost:5173";
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, etc.) in dev
        if (!origin || origin === allowedOrigin || allowedOrigin === "*") {
            callback(null, true);
        } else {
            callback(new Error("CORS policy violation: Unknown origin rejected."));
        }
    },
    credentials: true
}));

app.use(compression());
app.use(cookieParser());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("./uploads"));

// Prevent API responses from being cached by browsers
app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
});

// Root Route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Majisa WhatsApp CRM API Running 🚀"
    });
});

// API Routes with general rate limiter
app.use("/api", apiLimiter, routes);

// Centralized error handler interceptor (must be at the very bottom)
app.use(errorHandler);

export default app;