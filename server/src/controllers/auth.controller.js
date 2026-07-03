import AuthService from "../services/AuthService.js";
import AuditLogService from "../services/AuditLogService.js";

export const registerAdmin = async (req, res, next) => {
    try {
        const result = await AuthService.registerAdmin(req.body);
        
        // Log action
        const executorId = req.admin?._id || result.id; // handle initial seed registration
        await AuditLogService.logAction(
            executorId,
            "ADMIN_REGISTER",
            { adminId: result.id, email: result.email },
            req.ip
        );

        return res.status(201).json({
            success: true,
            message: "Admin registered successfully.",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const loginAdmin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const ipAddress = req.ip || "";
        const userAgent = req.headers["user-agent"] || "";

        const result = await AuthService.loginAdmin(email, password, ipAddress, userAgent);

        await AuditLogService.logAction(
            result.admin.id,
            "LOGIN",
            { email },
            ipAddress
        );

        return res.status(200).json({
            success: true,
            message: "Login Successful",
            token: result.token,
            refreshToken: result.refreshToken,
            admin: result.admin
        });
    } catch (error) {
        next(error);
    }
};

export const logoutAdmin = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await AuthService.logoutAdmin(refreshToken);
        }
        
        if (req.admin) {
            await AuditLogService.logAction(req.admin._id, "LOGOUT", {}, req.ip);
        }

        return res.status(200).json({
            success: true,
            message: "Logged out successfully."
        });
    } catch (error) {
        next(error);
    }
};

export const getMe = async (req, res, next) => {
    try {
        const result = await AuthService.getMe(req.admin._id);
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const getAllAdmins = async (req, res, next) => {
    try {
        const result = await AuthService.getAllAdmins();
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const refreshSessionToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        const ipAddress = req.ip || "";
        const userAgent = req.headers["user-agent"] || "";

        const result = await AuthService.refreshSessionToken(refreshToken, ipAddress, userAgent);
        return res.status(200).json({
            success: true,
            token: result.token,
            refreshToken: result.refreshToken
        });
    } catch (error) {
        next(error);
    }
};

export const forgotPassword = async (req, res, next) => {
    try {
        await AuthService.forgotPassword(req.body.email);
        return res.status(200).json({
            success: true,
            message: "If email exists in our records, a reset code was sent."
        });
    } catch (error) {
        next(error);
    }
};

export const resetPassword = async (req, res, next) => {
    try {
        await AuthService.resetPassword(req.body);
        return res.status(200).json({
            success: true,
            message: "Password reset successful. You can now login with your new password."
        });
    } catch (error) {
        next(error);
    }
};

export const changePassword = async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;
        await AuthService.changePassword(req.admin._id, oldPassword, newPassword);
        
        await AuditLogService.logAction(req.admin._id, "CHANGE_PASSWORD", {}, req.ip);

        return res.status(200).json({
            success: true,
            message: "Password updated successfully."
        });
    } catch (error) {
        next(error);
    }
};

export const updateAdminStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        const result = await AuthService.updateAdminStatus(req.admin, id, isActive);

        await AuditLogService.logAction(
            req.admin._id,
            isActive ? "ADMIN_ACTIVATE" : "ADMIN_DEACTIVATE",
            { adminId: id, email: result.email },
            req.ip
        );

        return res.status(200).json({
            success: true,
            message: `Admin account has been ${isActive ? "activated" : "deactivated"}.`,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const updateAdminRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const result = await AuthService.updateAdminRole(req.admin, id, role);

        await AuditLogService.logAction(
            req.admin._id,
            "ADMIN_ROLE_CHANGE",
            { adminId: id, role, email: result.email },
            req.ip
        );

        return res.status(200).json({
            success: true,
            message: `Admin role updated to ${role}.`,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const deleteAdmin = async (req, res, next) => {
    try {
        const { id } = req.params;
        await AuthService.deleteAdmin(req.admin, id);

        await AuditLogService.logAction(
            req.admin._id,
            "ADMIN_DELETE",
            { adminId: id },
            req.ip
        );

        return res.status(200).json({
            success: true,
            message: "Admin account deleted successfully."
        });
    } catch (error) {
        next(error);
    }
};

export const getActiveSessions = async (req, res, next) => {
    try {
        const sessions = await AuthService.getActiveSessions(req.admin._id);
        return res.status(200).json({
            success: true,
            data: sessions
        });
    } catch (error) {
        next(error);
    }
};

export const revokeSession = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        await AuthService.revokeSession(req.admin._id, sessionId);
        return res.status(200).json({
            success: true,
            message: "Session revoked successfully."
        });
    } catch (error) {
        next(error);
    }
};