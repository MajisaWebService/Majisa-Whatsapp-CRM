import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            default: ""
        },
        status: {
            type: String,
            enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "ON_HOLD"],
            default: "IN_PROGRESS"
        },
        startDate: {
            type: Date,
            default: Date.now
        },
        endDate: {
            type: Date
        },
        totalAmount: {
            type: Number,
            required: true
        },
        quotation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Quotation"
        }
    },
    {
        timestamps: true
    }
);

const Project = mongoose.model("Project", projectSchema);

export default Project;
