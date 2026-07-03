// src/app.js

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import routes from "./routes/index.js";

const app = express();

// Middlewares
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}));
app.use(helmet());
app.use(compression());
app.use(cookieParser());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("./uploads"));

// Root Route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Majisa WhatsApp CRM API Running 🚀"
    });
});

import { apiLimiter } from "./middleware/rateLimiter.middleware.js";

// Prevent API responses from being cached by browsers
app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
});

// API Routes with general rate limiter
app.use("/api", apiLimiter, routes);

export default app;