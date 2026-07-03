import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

// Protect routes
export const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Not authorized to access this resource. No token provided."
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get admin from DB
        req.admin = await Admin.findById(decoded.id).select("-password");

        if (!req.admin) {
            return res.status(401).json({
                success: false,
                message: "User not found with this token."
            });
        }

        if (!req.admin.isActive) {
            return res.status(401).json({
                success: false,
                message: "This admin account is suspended."
            });
        }

        next();
    } catch (error) {
        console.error("JWT Verification Error:", error.message);
        return res.status(401).json({
            success: false,
            message: "Not authorized to access this resource. Invalid token."
        });
    }
};

// Authorize roles
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.admin || !roles.includes(req.admin.role)) {
            return res.status(403).json({
                success: false,
                message: `Role (${req.admin ? req.admin.role : "none"}) is not authorized to access this resource.`
            });
        }
        next();
    };
};
