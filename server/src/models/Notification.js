import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            enum: [
                "NEW_LEAD",
                "EXECUTIVE_REQUESTED",
                "QUOTATION_GENERATED",
                "PROJECT_STARTED",
                "PAYMENT_RECEIVED",
                "SYSTEM"
            ]
        },
        title: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        customerId: {
            type: String,
            default: ""
        },
        isRead: {
            type: Boolean,
            default: false
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true
    }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
