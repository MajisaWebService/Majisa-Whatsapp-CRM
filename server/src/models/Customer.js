import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
    {
        customerId: {
            type: String,
            required: true,
            unique: true
        },

        name: {
            type: String,
            default: ""
        },

        company: {
            type: String,
            default: ""
        },

        email: {
            type: String,
            default: ""
        },

        phone: {
            type: String,
            default: ""
        },

        city: {
            type: String,
            default: ""
        },

        service: {
            type: String,
            default: ""
        },

        requirement: {
            type: String,
            default: ""
        },

        budget: {
            type: String,
            default: ""
        },

        timeline: {
            type: String,
            default: ""
        },

        features: {
            type: [String],
            default: []
        },

        status: {
            type: String,
            default: "New Lead"
        },

        source: {
            type: String,
            default: "WhatsApp"
        },

        quotationSent: {
            type: Boolean,
            default: false
        },

        assignedTo: {
            type: String,
            default: ""
        },

        notes: {
            type: String,
            default: ""
        },
        isBotPaused: {
            type: Boolean,
            default: false
        },
        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

customerSchema.index({ customerId: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ assignedTo: 1 });
customerSchema.index({ isDeleted: 1 });

export default mongoose.model("Customer", customerSchema);