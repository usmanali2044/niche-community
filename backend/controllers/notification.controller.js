import Notification from "../models/notification.model.js";

// ── Get Notifications ────────────────────────────────────────────────────────
export const getNotifications = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const [notifications, total] = await Promise.all([
            Notification.find({ userId: req.userId })
                .sort({ readAt: 1, createdAt: -1 }) // unread first, then newest
                .skip(skip)
                .limit(limit)
                .lean(),
            Notification.countDocuments({ userId: req.userId }),
        ]);

        const unreadCount = await Notification.countDocuments({
            userId: req.userId,
            readAt: null,
        });

        res.status(200).json({
            success: true,
            notifications,
            unreadCount,
            currentPage: page,
            totalPages: Math.ceil(total / limit) || 1,
            total,
        });
    } catch (error) {
        console.log("Error in getNotifications:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── Mark Notification as Read ────────────────────────────────────────────────
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId: req.userId }, // only owner can mark
            { readAt: new Date() },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
            });
        }

        res.status(200).json({ success: true, notification });
    } catch (error) {
        console.log("Error in markAsRead:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── Mark All Notifications as Read ───────────────────────────────────────────
export const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.userId, readAt: null },
            { readAt: new Date() }
        );

        res.status(200).json({ success: true });
    } catch (error) {
        console.log("Error in markAllAsRead:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
