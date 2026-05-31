const Notification = require("../models/Notification");

// GET /api/notifications
exports.getNotifications = async (req, res) => {
    try {
        const notifs = await Notification.find({ user_id: req.user.id }).sort({ created_at: -1 });
        res.json({ success: true, data: notifs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PATCH /api/notifications/:id/read
exports.markRead = async (req, res) => {
    try {
        const notif = await Notification.findOneAndUpdate(
            { _id: req.params.id, user_id: req.user.id },
            { is_read: true },
            { new: true }
        );
        if (!notif) return res.status(404).json({ success: false, message: "Notification not found" });
        res.json({ success: true, data: notif });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PATCH /api/notifications/read-all
exports.markAllRead = async (req, res) => {
    try {
        await Notification.updateMany({ user_id: req.user.id }, { is_read: true });
        res.json({ success: true, message: "All notifications marked as read" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
    try {
        const notif = await Notification.findOneAndDelete({
            _id: req.params.id,
            user_id: req.user.id,
        });
        if (!notif) return res.status(404).json({ success: false, message: "Notification not found" });
        res.json({ success: true, message: "Notification deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/notifications
exports.clearAll = async (req, res) => {
    try {
        await Notification.deleteMany({ user_id: req.user.id });
        res.json({ success: true, message: "All notifications cleared" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};