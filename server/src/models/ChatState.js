// src/models/ChatState.js

import mongoose from "mongoose";

const chatStateSchema = new mongoose.Schema(
    {
        customerId: {
            type: String,
            required: true,
            index: true
        },

        state: {
            type: String,
            default: "WELCOME"
        },

        service: {
            type: String,
            default: ""
        },

        serviceKey: {
            type: String,
            default: ""
        },

        invalidAttempts: {
            type: Number,
            default: 0
        },

        data: {
            name: String,
            company: String,
            email: String,
            phone: String,
            city: String,
            requirement: String,
            budget: String,
            timeline: String,

            // Quotation flow fields
            subType: String,
            subTypeKey: String,
            pageRange: String,
            pageRangeKey: String,
            selectedFeatures: [String],
            selectedFeatureKeys: [String]
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model("ChatState", chatStateSchema);