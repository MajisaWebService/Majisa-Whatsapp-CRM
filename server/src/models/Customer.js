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

        paymentStatus: {
            type: String,
            default: "Pending"
        },

        assignedTo: {
            type: String,
            default: ""
        },

        notes: {
            type: String,
            default: ""
        }

    },
    {
        timestamps: true
    }
);

export default mongoose.model("Customer", customerSchema);