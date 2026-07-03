import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import generateToken from "../utils/generateToken.js";

// Helper to generate a refresh token
const generateRefreshToken = (adminId) => {
    return jwt.sign(
        { id: adminId },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

export const registerAdmin = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        // Check if email already exists
        const existingAdmin = await Admin.findOne({ email });

        if (existingAdmin) {
            return res.status(409).json({
                success: false,
                message: "Admin already exists."
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save admin
        const admin = await Admin.create({
            name,
            email,
            password: hashedPassword,
            role: role || "ADMIN"
        });

        return res.status(201).json({
            success: true,
            message: "Admin registered successfully.",
            data: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

export const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and Password are required."
            });
        }

        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Invalid Credentials"
            });
        }

        if (!admin.isActive) {
            return res.status(403).json({
                success: false,
                message: "This account has been deactivated."
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            admin.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid Credentials"
            });
        }

        const token = generateToken(admin._id);
        const refreshToken = generateRefreshToken(admin._id);

        return res.status(200).json({
            success: true,
            message: "Login Successful",
            token,
            refreshToken,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getMe = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            data: {
                id: req.admin._id,
                name: req.admin.name,
                email: req.admin.email,
                role: req.admin.role,
                isActive: req.admin.isActive
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.find().select("-password");
        return res.status(200).json({
            success: true,
            data: admins
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 1. Refresh Token support
export const refreshSessionToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh token is required."
            });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const admin = await Admin.findById(decoded.id);

        if (!admin || !admin.isActive) {
            return res.status(401).json({
                success: false,
                message: "Invalid session or account deactivated."
            });
        }

        const newToken = generateToken(admin._id);
        const newRefreshToken = generateRefreshToken(admin._id);

        return res.status(200).json({
            success: true,
            token: newToken,
            refreshToken: newRefreshToken
        });
    } catch (error) {
        console.error("Refresh token error:", error.message);
        return res.status(401).json({
            success: false,
            message: "Invalid or expired session token."
        });
    }
};

// 2. Forgot Password support
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required."
            });
        }

        const admin = await Admin.findOne({ email });

        if (!admin) {
            // Standard security practice: do not leak whether account exists or not
            return res.status(200).json({
                success: true,
                message: "If email exists in our records, a reset code was sent."
            });
        }

        // Generate 6-digit random code
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        admin.resetPasswordToken = resetCode;
        admin.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
        await admin.save();

        // Print reset code in logs (since no email service is hooked up)
        console.log("\n==========================================");
        console.log(`🔑 PASSWORD RESET CODE FOR: ${email}`);
        console.log(`CODE: ${resetCode}`);
        console.log("==========================================\n");

        return res.status(200).json({
            success: true,
            message: "If email exists in our records, a reset code was sent."
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 3. Reset Password support
export const resetPassword = async (req, res) => {
    try {
        const { email, resetCode, newPassword } = req.body;

        if (!email || !resetCode || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        const admin = await Admin.findOne({
            email,
            resetPasswordToken: resetCode,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!admin) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired password reset code."
            });
        }

        // Hash new password
        admin.password = await bcrypt.hash(newPassword, 10);
        admin.resetPasswordToken = null;
        admin.resetPasswordExpire = null;
        await admin.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successful. You can now login with your new password."
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 4. Change Password support
export const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const adminId = req.admin._id;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Old and New Passwords are required."
            });
        }

        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found."
            });
        }

        const isPasswordCorrect = await bcrypt.compare(oldPassword, admin.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({
                success: false,
                message: "Incorrect old password."
            });
        }

        admin.password = await bcrypt.hash(newPassword, 10);
        await admin.save();

        return res.status(200).json({
            success: true,
            message: "Password updated successfully."
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 5. Admin management CRUD endpoints
export const updateAdminStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        if (req.admin._id.toString() === id) {
            return res.status(400).json({
                success: false,
                message: "You cannot deactivate or activate your own account."
            });
        }

        const admin = await Admin.findByIdAndUpdate(
            id,
            { isActive },
            { new: true }
        ).select("-password");

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin account not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: `Admin account has been ${isActive ? "activated" : "deactivated"}.`,
            data: admin
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const updateAdminRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (req.admin._id.toString() === id) {
            return res.status(400).json({
                success: false,
                message: "You cannot change your own role."
            });
        }

        if (!["SUPER_ADMIN", "ADMIN"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role value."
            });
        }

        const admin = await Admin.findByIdAndUpdate(
            id,
            { role },
            { new: true }
        ).select("-password");

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin account not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: `Admin role updated to ${role}.`,
            data: admin
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.admin._id.toString() === id) {
            return res.status(400).json({
                success: false,
                message: "You cannot delete your own account."
            });
        }

        const admin = await Admin.findByIdAndDelete(id);

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin account not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Admin account deleted successfully."
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};