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
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(cookieParser());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Majisa WhatsApp CRM API Running 🚀"
    });
});

// API Routes
app.use("/api", routes);

export default app;