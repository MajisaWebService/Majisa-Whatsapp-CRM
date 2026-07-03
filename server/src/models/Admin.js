import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
            minlength: 6,
        },

        role: {
            type: String,
            enum: ["SUPER_ADMIN", "ADMIN"],
            default: "ADMIN",
        },

        isActive: {
            type: Boolean,
            default: true,
        },
        resetPasswordToken: {
            type: String,
            default: null
        },
        resetPasswordExpire: {
            type: Date,
            default: null
        },
        passwordHistory: {
            type: [String],
            default: []
        },
        passwordChangedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true,
    }
);

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;