// src/app.js



const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const routes = require("./routes/index.js");

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

module.exports = app;