const db = require("../config/db"); 
const bcrypt = require("bcrypt");

const getAllUsers = async (req, res) => {
    try {
        const query = `
            SELECT 
                id, 
                username, 
                name, 
                email, 
                phone, 
                role,
                status,
                profile_photo,
                created_at,
                updated_at 
            FROM users
            ORDER BY id DESC
        `;
        const [rows] = await db.query(query);
        return res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Error in getAllUsers:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error occurred"
        });
    }
};

const getUserById = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);

        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format"
            });
        }

        const query = `
            SELECT 
                id, 
                username, 
                name, 
                phone, 
                email, 
                role,
                status,
                profile_photo,
                created_at,
                updated_at 
            FROM users
            WHERE id = ?
        `;

        const [rows] = await db.execute(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const userData = rows[0];

        return res.status(200).json({
            success: true,
            message: "User data found",
            data: userData
        });

    } catch (error) {
        console.log("MySQL Error Details:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error occurred"
        });
    }
};

const createUser = async (req, res) => {
    try {
        const { username, password, name, email, phone, role, profile_photo, company_name, gst_number } = req.body;

        if (!username || !password || !name || !email || !role) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        const [existing] = await db.query("SELECT id FROM users WHERE username = ? OR email = ?", [username, email]);
        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Username or email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const [result] = await connection.query(
                "INSERT INTO users (username, password, name, email, phone, role, profile_photo) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [username, hashedPassword, name, email, phone || null, role, profile_photo || null]
            );

            const userId = result.insertId;

            if (role === "Vendor") {
                if (!company_name || !gst_number) {
                    throw new Error("Company name and GST number are required for vendors");
                }
                await connection.query(
                    "INSERT INTO vendor_details (user_id, company_name, gst_number) VALUES (?, ?, ?)",
                    [userId, company_name, gst_number]
                );
            }

            await connection.commit();
            return res.status(201).json({
                success: true,
                message: "User created successfully",
                data: { id: userId }
            });
        } catch (err) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: err.message
            });
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Error in createUser:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error occurred"
        });
    }
};

const updateUser = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format"
            });
        }

        const { name, phone, profile_photo, role, status, company_name, gst_number, category, address, rating_indicator, vendor_status } = req.body;

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const [existing] = await connection.query("SELECT role FROM users WHERE id = ?", [id]);
            if (existing.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            const currentRole = existing[0].role;

            await connection.query(
                `UPDATE users SET 
                    name = COALESCE(?, name),
                    phone = COALESCE(?, phone),
                    profile_photo = COALESCE(?, profile_photo),
                    role = COALESCE(?, role),
                    status = COALESCE(?, status)
                WHERE id = ?`,
                [name || null, phone || null, profile_photo || null, role || null, status || null, id]
            );

            const targetRole = role || currentRole;
            if (targetRole === "Vendor") {
                const [vendorExist] = await connection.query("SELECT id FROM vendor_details WHERE user_id = ?", [id]);
                if (vendorExist.length > 0) {
                    await connection.query(
                        `UPDATE vendor_details SET
                            company_name = COALESCE(?, company_name),
                            gst_number = COALESCE(?, gst_number),
                            category = COALESCE(?, category),
                            address = COALESCE(?, address),
                            rating_indicator = COALESCE(?, rating_indicator),
                            status = COALESCE(?, status)
                        WHERE user_id = ?`,
                        [company_name || null, gst_number || null, category || null, address || null, rating_indicator || null, vendor_status || null, id]
                    );
                } else {
                    if (company_name && gst_number) {
                        await connection.query(
                            "INSERT INTO vendor_details (user_id, company_name, gst_number, category, address) VALUES (?, ?, ?, ?, ?)",
                            [id, company_name, gst_number, category || null, address || null]
                        );
                    }
                }
            }

            await connection.commit();
            return res.status(200).json({
                success: true,
                message: "User updated successfully"
            });
        } catch (err) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: err.message
            });
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Error in updateUser:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error occurred"
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format"
            });
        }

        const [result] = await db.query("DELETE FROM users WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (error) {
        console.error("Error in deleteUser:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error occurred"
        });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};