import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import AdminRepository from "../repositories/AdminRepository.js";
import generateToken from "../utils/generateToken.js";

// Helper to hash refresh tokens for secure DB storage
const hashToken = (token) => {
    return crypto.createHash("sha256").update(token).digest("hex");
};

class AuthService {
    // Generate a new refresh token (lasts 7 days)
    generateRefreshToken(adminId) {
        return jwt.sign(
            { id: adminId },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );
    }

    async registerAdmin({ name, email, password, role }) {
        const existingAdmin = await AdminRepository.findByEmail(email);
        if (existingAdmin) {
            throw new Error("Admin already exists.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = await AdminRepository.create({
            name,
            email,
            password: hashedPassword,
            role: role || "ADMIN",
            passwordHistory: [hashedPassword],
            passwordChangedAt: new Date()
        });

        return {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role
        };
    }

    async loginAdmin(email, password, ipAddress = "", userAgent = "") {
        const admin = await AdminRepository.findByEmail(email);
        if (!admin) {
            throw new Error("Invalid Credentials");
        }

        if (!admin.isActive) {
            throw new Error("This account has been deactivated.");
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            throw new Error("Invalid Credentials");
        }

        const refreshToken = this.generateRefreshToken(admin._id);
        const tokenHash = hashToken(refreshToken);

        // Save active session in DB
        const session = await AdminRepository.createSession({
            admin: admin._id,
            refreshTokenHash: tokenHash,
            ipAddress,
            userAgent,
            lastActiveAt: new Date()
        });

        // Generate Access JWT embedding the sessionId
        const token = generateToken(admin._id, session._id);

        return {
            token,
            refreshToken,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        };
    }

    async refreshSessionToken(refreshToken, ipAddress = "", userAgent = "") {
        if (!refreshToken) {
            throw new Error("Refresh token is required.");
        }

        // 1. Verify token signature
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        
        // 2. Lookup session in DB using token hash
        const currentHash = hashToken(refreshToken);
        const session = await AdminRepository.findSessionByHash(currentHash);

        if (!session || session.isRevoked || !session.admin.isActive) {
            // Token abuse/reuse: revoke all sessions for safety if reuse is detected
            if (session) {
                await AdminRepository.revokeAllSessions(session.admin._id);
            }
            throw new Error("Invalid session or account deactivated.");
        }

        // 3. Issue rotated credentials (Token Rotation)
        const newRefreshToken = this.generateRefreshToken(session.admin._id);
        const newHash = hashToken(newRefreshToken);

        // Create a new session
        const newSession = await AdminRepository.createSession({
            admin: session.admin._id,
            refreshTokenHash: newHash,
            ipAddress,
            userAgent,
            lastActiveAt: new Date()
        });

        // Generate rotated access token embedding the new sessionId
        const newAccessToken = generateToken(session.admin._id, newSession._id);

        // Revoke the old session
        await AdminRepository.revokeSession(session._id);

        return {
            token: newAccessToken,
            refreshToken: newRefreshToken
        };
    }

    async logoutAdmin(refreshToken) {
        if (!refreshToken) return;
        const tokenHash = hashToken(refreshToken);
        const session = await AdminRepository.findSessionByHash(tokenHash);
        if (session) {
            await AdminRepository.revokeSession(session._id);
        }
    }

    async forgotPassword(email) {
        const admin = await AdminRepository.findByEmail(email);
        if (!admin) {
            // Return standard response to prevent user enumeration
            return true;
        }

        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        await AdminRepository.update(admin._id, {
            resetPasswordToken: resetCode,
            resetPasswordExpire: Date.now() + 10 * 60 * 1000 // 10 mins
        });

        console.log("\n==========================================");
        console.log(`🔑 PASSWORD RESET CODE FOR: ${email}`);
        console.log(`CODE: ${resetCode}`);
        console.log("==========================================\n");
        return true;
    }

    async resetPassword({ email, resetCode, newPassword }) {
        const admin = await AdminRepository.findByResetToken(resetCode);
        if (!admin || admin.email.toLowerCase() !== email.toLowerCase()) {
            throw new Error("Invalid or expired password reset code.");
        }

        // Enforce password history validation (not in last 3 passwords)
        for (const oldHash of admin.passwordHistory || []) {
            const isMatch = await bcrypt.compare(newPassword, oldHash);
            if (isMatch) {
                throw new Error("You cannot reuse any of your last 3 passwords.");
            }
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Push new hash and shift history if it exceeds 3 items
        const history = admin.passwordHistory || [];
        history.push(hashedPassword);
        if (history.length > 3) {
            history.shift();
        }

        await AdminRepository.update(admin._id, {
            password: hashedPassword,
            passwordHistory: history,
            passwordChangedAt: new Date(),
            resetPasswordToken: null,
            resetPasswordExpire: null
        });

        // Revoke all existing sessions to enforce re-login
        await AdminRepository.revokeAllSessions(admin._id);
        return true;
    }

    async changePassword(adminId, oldPassword, newPassword) {
        const admin = await AdminRepository.findById(adminId);
        if (!admin) {
            throw new Error("Admin not found.");
        }

        const isMatch = await bcrypt.compare(oldPassword, admin.password);
        if (!isMatch) {
            throw new Error("Incorrect old password.");
        }

        // Validate password history
        for (const oldHash of admin.passwordHistory || []) {
            const isMatch = await bcrypt.compare(newPassword, oldHash);
            if (isMatch) {
                throw new Error("You cannot reuse any of your last 3 passwords.");
            }
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const history = admin.passwordHistory || [];
        history.push(hashedPassword);
        if (history.length > 3) {
            history.shift();
        }

        await AdminRepository.update(admin._id, {
            password: hashedPassword,
            passwordHistory: history,
            passwordChangedAt: new Date()
        });

        // Revoke other active sessions for safety
        await AdminRepository.revokeAllSessions(admin._id);
        return true;
    }

    async getMe(adminId) {
        const admin = await AdminRepository.findById(adminId);
        if (!admin) {
            throw new Error("Admin profile not found.");
        }
        return {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            isActive: admin.isActive
        };
    }

    async getAllAdmins() {
        return AdminRepository.findAll();
    }

    async updateAdminStatus(currentAdmin, targetId, isActive) {
        if (currentAdmin._id.toString() === targetId) {
            throw new Error("You cannot deactivate or activate your own account.");
        }

        const admin = await AdminRepository.update(targetId, { isActive });
        if (!admin) {
            throw new Error("Admin account not found.");
        }

        if (!isActive) {
            // Revoke active sessions for deactivated user
            await AdminRepository.revokeAllSessions(targetId);
        }

        return admin;
    }

    async updateAdminRole(currentAdmin, targetId, role) {
        if (currentAdmin._id.toString() === targetId) {
            throw new Error("You cannot change your own role.");
        }

        if (!["SUPER_ADMIN", "ADMIN"].includes(role)) {
            throw new Error("Invalid role value.");
        }

        const admin = await AdminRepository.update(targetId, { role });
        if (!admin) {
            throw new Error("Admin account not found.");
        }

        return admin;
    }

    async deleteAdmin(currentAdmin, targetId) {
        if (currentAdmin._id.toString() === targetId) {
            throw new Error("You cannot delete your own account.");
        }

        const admin = await AdminRepository.delete(targetId);
        if (!admin) {
            throw new Error("Admin account not found.");
        }

        await AdminRepository.revokeAllSessions(targetId);
        return true;
    }

    async getActiveSessions(adminId) {
        return AdminRepository.findActiveSessions(adminId);
    }

    async revokeSession(adminId, sessionId) {
        const session = await AdminSession.findById(sessionId);
        if (!session || session.admin.toString() !== adminId.toString()) {
            throw new Error("Session not found or permission denied.");
        }
        await AdminRepository.revokeSession(sessionId);
        return true;
    }
}

export default new AuthService();
