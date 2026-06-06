const db = require('../config/db');
const bcrypt = require('bcrypt');

const getAllVendors = async (req, res) => {
    try {
        const query = `
            SELECT 
                u.id AS user_id,
                u.username,
                u.name,
                u.email,
                u.phone,
                u.profile_photo,
                u.status AS user_status,
                vd.id AS vendor_id,
                vd.company_name,
                vd.gst_number,
                vd.category,
                vd.address,
                vd.rating_indicator,
                vd.status AS vendor_status
            FROM users u
            INNER JOIN vendor_details vd ON u.id = vd.user_id
            WHERE u.role = 'Vendor'
            ORDER BY vd.id DESC
        `;
        const [rows] = await db.query(query);
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error in getAllVendors:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getVendorById = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid ID format" });
        }
        const query = `
            SELECT 
                u.id AS user_id,
                u.username,
                u.name,
                u.email,
                u.phone,
                u.profile_photo,
                u.status AS user_status,
                vd.id AS vendor_id,
                vd.company_name,
                vd.gst_number,
                vd.category,
                vd.address,
                vd.rating_indicator,
                vd.status AS vendor_status
            FROM users u
            INNER JOIN vendor_details vd ON u.id = vd.user_id
            WHERE (vd.id = ? OR u.id = ?) AND u.role = 'Vendor'
        `;
        const [rows] = await db.query(query, [id, id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Vendor not found" });
        }
        return res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("Error in getVendorById:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const createVendor = async (req, res) => {
    try {
        const { username, password, name, email, phone, profile_photo, company_name, gst_number, category, address } = req.body;
        if (!username || !password || !name || !email || !company_name || !gst_number) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const [existing] = await db.query("SELECT id FROM users WHERE username = ? OR email = ?", [username, email]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: "Username or email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const [userResult] = await connection.query(
                "INSERT INTO users (username, password, name, email, phone, role, profile_photo) VALUES (?, ?, ?, ?, ?, 'Vendor', ?)",
                [username, hashedPassword, name, email, phone || null, profile_photo || null]
            );

            const userId = userResult.insertId;

            const [vendorResult] = await connection.query(
                "INSERT INTO vendor_details (user_id, company_name, gst_number, category, address) VALUES (?, ?, ?, ?, ?)",
                [userId, company_name, gst_number, category || null, address || null]
            );

            await connection.commit();
            return res.status(201).json({
                success: true,
                message: "Vendor created successfully",
                data: { user_id: userId, vendor_id: vendorResult.insertId }
            });
        } catch (err) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: err.message });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Error in createVendor:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const updateVendor = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid ID format" });
        }

        const { name, phone, profile_photo, user_status, company_name, gst_number, category, address, rating_indicator, vendor_status } = req.body;

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const [vendorRecord] = await connection.query(
                "SELECT user_id FROM vendor_details WHERE id = ? OR user_id = ?",
                [id, id]
            );

            if (vendorRecord.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(404).json({ success: false, message: "Vendor not found" });
            }

            const userId = vendorRecord[0].user_id;

            await connection.query(
                `UPDATE users SET
                    name = COALESCE(?, name),
                    phone = COALESCE(?, phone),
                    profile_photo = COALESCE(?, profile_photo),
                    status = COALESCE(?, status)
                WHERE id = ?`,
                [name || null, phone || null, profile_photo || null, user_status || null, userId]
            );

            await connection.query(
                `UPDATE vendor_details SET
                    company_name = COALESCE(?, company_name),
                    gst_number = COALESCE(?, gst_number),
                    category = COALESCE(?, category),
                    address = COALESCE(?, address),
                    rating_indicator = COALESCE(?, rating_indicator),
                    status = COALESCE(?, status)
                WHERE user_id = ?`,
                [company_name || null, gst_number || null, category || null, address || null, rating_indicator || null, vendor_status || null, userId]
            );

            await connection.commit();
            return res.status(200).json({ success: true, message: "Vendor updated successfully" });
        } catch (err) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: err.message });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Error in updateVendor:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const deleteVendor = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid ID format" });
        }

        const [vendorRecord] = await db.query(
            "SELECT user_id FROM vendor_details WHERE id = ? OR user_id = ?",
            [id, id]
        );

        if (vendorRecord.length === 0) {
            return res.status(404).json({ success: false, message: "Vendor not found" });
        }

        const userId = vendorRecord[0].user_id;

        const [result] = await db.query("DELETE FROM users WHERE id = ?", [userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Vendor user not found" });
        }

        return res.status(200).json({ success: true, message: "Vendor deleted successfully" });
    } catch (error) {
        console.error("Error in deleteVendor:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
    getAllVendors,
    getVendorById,
    createVendor,
    updateVendor,
    deleteVendor
};
