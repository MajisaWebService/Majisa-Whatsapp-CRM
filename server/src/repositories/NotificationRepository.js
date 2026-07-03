import Notification from "../models/Notification.js";

class NotificationRepository {
    async findById(id) {
        return Notification.findById(id);
    }

    async create(notificationData) {
        return Notification.create(notificationData);
    }

    async update(id, updateData) {
        return Notification.findByIdAndUpdate(id, updateData, { new: true });
    }

    async updateMany(query, updateData) {
        return Notification.updateMany(query, updateData);
    }

    async findAndPaginate(query, skip, limit) {
        const items = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await Notification.countDocuments(query);
        return { items, total };
    }

    async count(query) {
        return Notification.countDocuments(query);
    }
}

export default new NotificationRepository();
