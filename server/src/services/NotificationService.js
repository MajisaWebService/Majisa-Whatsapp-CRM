import NotificationRepository from "../repositories/NotificationRepository.js";

class NotificationService {
    async getNotifications(page = 1, limit = 15) {
        const skip = (page - 1) * limit;
        return NotificationRepository.findAndPaginate({}, skip, limit);
    }

    async createNotification(notificationData) {
        return NotificationRepository.create(notificationData);
    }

    async markAsRead(id) {
        const notification = await NotificationRepository.update(id, { isRead: true });
        if (!notification) {
            throw new Error("Notification not found.");
        }
        return notification;
    }

    async markAllAsRead() {
        return NotificationRepository.updateMany({ isRead: false }, { isRead: true });
    }

    async getUnreadCount() {
        return NotificationRepository.count({ isRead: false });
    }
}

export default new NotificationService();
