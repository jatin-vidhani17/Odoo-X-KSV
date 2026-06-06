const db = require('../config/db');

// 1. Get Notifications for current logged-in user
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const query = "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC";
        const [rows] = await db.query(query, [userId]);
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error in getNotifications:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 2. Mark specific notification as read
const markAsRead = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const userId = req.user.id;

        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid notification ID format" });
        }

        const [result] = await db.query(
            "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?",
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Notification not found or access denied" });
        }

        return res.status(200).json({ success: true, message: "Notification marked as read" });
    } catch (error) {
        console.error("Error in markAsRead:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 3. Mark all notifications as read for current user
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        await db.query(
            "UPDATE notifications SET is_read = TRUE WHERE user_id = ?",
            [userId]
        );
        return res.status(200).json({ success: true, message: "All notifications marked as read" });
    } catch (error) {
        console.error("Error in markAllAsRead:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Helper function to insert a notification programmatically
const createNotification = async (userId, title, message) => {
    try {
        await db.query(
            "INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)",
            [userId, title, message]
        );
        return true;
    } catch (error) {
        console.error("Error creating notification via helper:", error);
        return false;
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    createNotification
};
