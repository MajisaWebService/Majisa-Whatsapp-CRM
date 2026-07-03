import mongoose from "mongoose";

const adminSessionSchema = new mongoose.Schema(
    {
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            required: true
        },
        refreshTokenHash: {
            type: String,
            required: true,
            unique: true
        },
        ipAddress: {
            type: String,
            default: ""
        },
        userAgent: {
            type: String,
            default: ""
        },
        lastActiveAt: {
            type: Date,
            default: Date.now
        },
        isRevoked: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

// Compound index to optimize lookup by admin and revoke state
adminSessionSchema.index({ admin: 1, isRevoked: 1 });

const AdminSession = mongoose.model("AdminSession", adminSessionSchema);

export default AdminSession;
