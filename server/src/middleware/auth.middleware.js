import jwt from "jsonwebtoken";
import AdminRepository from "../repositories/AdminRepository.js";
import AdminSession from "../models/AdminSession.js";

// Authenticate and verify active session
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
        // 1. Verify token signature and expiration
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 2. Fetch admin from DB and verify they are active
        const admin = await AdminRepository.findById(decoded.id);
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "User not found with this token."
            });
        }

        if (!admin.isActive) {
            return res.status(401).json({
                success: false,
                message: "This admin account has been deactivated."
            });
        }

        // 3. Verify session validity if sessionId is present in token
        if (decoded.sessionId) {
            const session = await AdminSession.findById(decoded.sessionId);
            if (!session || session.isRevoked) {
                return res.status(401).json({
                    success: false,
                    message: "Your session has expired or has been revoked."
                });
            }
            
            // Asynchronously touch last active timestamp
            AdminSession.findByIdAndUpdate(session._id, { lastActiveAt: new Date() }).catch(console.error);
            req.adminSession = session;
        }

        req.admin = admin;
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error.message);
        return res.status(401).json({
            success: false,
            message: "Not authorized to access this resource. Invalid token."
        });
    }
};

// Authorize roles (RBAC)
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
