// src/routes/index.js

const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "API Working Successfully"
    });
});

module.exports = router;