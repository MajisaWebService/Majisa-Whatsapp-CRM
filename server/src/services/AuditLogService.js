import AuditLogRepository from "../repositories/AuditLogRepository.js";

class AuditLogService {
    async logAction(adminId, action, details, ipAddress = "") {
        try {
            await AuditLogRepository.create({
                admin: adminId,
                action,
                details,
                ipAddress
            });
        } catch (error) {
            console.error("Failed to write audit log:", error);
        }
    }

    async getLogs(query, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        return AuditLogRepository.findAndPaginate(query, skip, limit);
    }
}

export default new AuditLogService();
