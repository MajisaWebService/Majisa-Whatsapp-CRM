import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
    {
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            required: true
        },
        action: {
            type: String,
            required: true
        },
        details: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        ipAddress: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
