import Admin from "../models/Admin.js";
import AdminSession from "../models/AdminSession.js";

class AdminRepository {
    async findById(id) {
        return Admin.findById(id);
    }

    async findByEmail(email) {
        return Admin.findOne({ email: email.toLowerCase() });
    }

    async findByResetToken(token) {
        return Admin.findOne({
            resetPasswordToken: token,
            resetPasswordExpire: { $gt: Date.now() }
        });
    }

    async create(adminData) {
        return Admin.create(adminData);
    }

    async update(id, updateData) {
        return Admin.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    }

    async delete(id) {
        return Admin.findByIdAndDelete(id);
    }

    async findAll() {
        return Admin.find().select("-password");
    }

    // Sessions Queries
    async createSession(sessionData) {
        return AdminSession.create(sessionData);
    }

    async findSessionByHash(hash) {
        return AdminSession.findOne({ refreshTokenHash: hash }).populate("admin");
    }

    async findActiveSessions(adminId) {
        return AdminSession.find({ admin: adminId, isRevoked: false });
    }

    async revokeSession(sessionId) {
        return AdminSession.findByIdAndUpdate(sessionId, { isRevoked: true }, { new: true });
    }

    async revokeAllSessions(adminId) {
        return AdminSession.updateMany({ admin: adminId }, { isRevoked: true });
    }
}

export default new AdminRepository();
