const db = require('../config/db');

const getAllCategories = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT name FROM categories ORDER BY name ASC');
        const categories = rows.map(r => r.name);
        return res.status(200).json({ success: true, data: categories });
    } catch (error) {
        console.error("Error fetching categories:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = { getAllCategories };
