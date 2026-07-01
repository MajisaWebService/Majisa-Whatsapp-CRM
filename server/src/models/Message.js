const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        chat: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chat",
            required: true,
        },

        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
        },

        sender: {
            type: String,
            enum: ["BOT", "CUSTOMER", "ADMIN"],
            required: true,
        },

        message: {
            type: String,
            default: "",
        },

        type: {
            type: String,
            enum: ["TEXT", "IMAGE", "PDF", "VIDEO", "AUDIO", "DOCUMENT"],
            default: "TEXT",
        },

        status: {
            type: String,
            enum: ["SENT", "DELIVERED", "READ"],
            default: "SENT",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Message", messageSchema);