const express = require("express");
const authRoutes = require("./auth.routes");

const router = express.Router();

// Health Check
router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Majisa WhatsApp CRM API v1"
    });
});

// API v1 Routes
router.use("/v1/auth", authRoutes);

module.exports = router;