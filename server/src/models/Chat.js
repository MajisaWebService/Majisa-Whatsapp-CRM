const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
        },

        lastMessage: {
            type: String,
            default: "",
        },

        unreadCount: {
            type: Number,
            default: 0,
        },

        isArchived: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Chat", chatSchema);