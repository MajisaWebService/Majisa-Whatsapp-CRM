// src/models/Quotation.js

import mongoose from "mongoose";

const quotationSchema = new mongoose.Schema(
    {
        customerId: {
            type: String,
            required: true,
            index: true
        },

        service: {
            type: String,
            required: true
        },

        subType: {
            type: String,
            default: ""
        },

        pageRange: {
            type: String,
            default: ""
        },

        selectedFeatures: {
            type: [String],
            default: []
        },

        breakdown: {
            basePrice: {
                type: Number,
                default: 0
            },
            extraPagesPrice: {
                type: Number,
                default: 0
            },
            featuresPrice: {
                type: Number,
                default: 0
            },
            items: [
                {
                    name: String,
                    price: Number
                }
            ]
        },

        totalAmount: {
            type: Number,
            required: true
        },

        pdfPath: {
            type: String,
            default: ""
        },

        status: {
            type: String,
            enum: ["GENERATED", "SENT", "ACCEPTED", "REJECTED"],
            default: "GENERATED"
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model("Quotation", quotationSchema);
