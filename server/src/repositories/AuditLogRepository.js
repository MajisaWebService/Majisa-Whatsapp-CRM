import AuditLog from "../models/AuditLog.js";

class AuditLogRepository {
    async create(logData) {
        return AuditLog.create(logData);
    }

    async findAndPaginate(query, skip, limit) {
        const items = await AuditLog.find(query)
            .populate("admin", "name email role")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await AuditLog.countDocuments(query);
        return { items, total };
    }
}

export default new AuditLogRepository();
