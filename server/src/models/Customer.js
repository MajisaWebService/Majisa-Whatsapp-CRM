const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            default: "",
        },

        phone: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: "",
        },

        company: {
            type: String,
            default: "",
        },

        tags: {
            type: [String],
            default: [],
        },

        status: {
            type: String,
            enum: ["NEW", "INTERESTED", "FOLLOW_UP", "CUSTOMER", "BLOCKED"],
            default: "NEW",
        },

        source: {
            type: String,
            default: "WhatsApp",
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Customer", customerSchema);