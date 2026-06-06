const db = require('../config/db');

// 1. Get All Activity Logs
const getAllLogs = async (req, res) => {
    try {
        const query = `
            SELECT al.*, u.name AS user_name, u.email AS user_email, u.role AS user_role
            FROM activity_logs al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.recorded_at DESC
        `;
        const [rows] = await db.query(query);
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error in getAllLogs:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 2. Get Log by ID
const getLogById = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid log ID format" });
        }

        const query = `
            SELECT al.*, u.name AS user_name, u.email AS user_email, u.role AS user_role
            FROM activity_logs al
            LEFT JOIN users u ON al.user_id = u.id
            WHERE al.id = ?
        `;
        const [rows] = await db.query(query, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Log entry not found" });
        }

        return res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("Error in getLogById:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 3. Helper to write logs programmatically
const logActivity = async (userId, type, summary) => {
    try {
        await db.query(
            "INSERT INTO activity_logs (user_id, activity_type, log_summary) VALUES (?, ?, ?)",
            [userId || null, type, summary]
        );
        return true;
    } catch (error) {
        console.error("Activity logging helper error:", error);
        return false;
    }
};

module.exports = {
    getAllLogs,
    getLogById,
    logActivity
};
