import NotificationService from "../services/NotificationService.js";

// Fetch paginated admin notifications
export const getNotifications = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;

        const result = await NotificationService.getNotifications(page, limit);

        return res.status(200).json({
            success: true,
            data: result.items,
            pagination: {
                total: result.total,
                page,
                limit,
                pages: Math.ceil(result.total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

// Mark single notification as read
export const markAsRead = async (req, res, next) => {
    try {
        const notification = await NotificationService.markAsRead(req.params.id);
        return res.status(200).json({ success: true, data: notification });
    } catch (error) {
        next(error);
    }
};

// Mark all unread notifications as read
export const markAllAsRead = async (req, res, next) => {
    try {
        await NotificationService.markAllAsRead();
        return res.status(200).json({ success: true, message: "All notifications marked as read." });
    } catch (error) {
        next(error);
    }
};

// Count unread notifications
export const getUnreadCount = async (req, res, next) => {
    try {
        const count = await NotificationService.getUnreadCount();
        return res.status(200).json({ success: true, count });
    } catch (error) {
        next(error);
    }
};
