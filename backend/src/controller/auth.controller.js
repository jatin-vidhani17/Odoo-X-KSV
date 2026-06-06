const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const user = users[0];

        if (user.status !== 'Active') {
            return res.status(403).json({ message: "Account is suspended or pending verification" });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                profile_photo: user.profile_photo
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const register = async (req, res) => {
    try {
        const { name, email, password, phone, role, company_name, gst_number, profile_photo } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Check if user already exists
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(409).json({ message: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Use a transaction since we might insert into vendor_details too
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const [result] = await connection.query(
                'INSERT INTO users (username, password, name, email, phone, role, profile_photo) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [email, hashedPassword, name, email, phone || null, role, profile_photo] // Using email as username for simplicity
            );

            const userId = result.insertId;

            if (role === 'Vendor') {
                if (!company_name || !gst_number) {
                    throw new Error("Company name and GST number are required for vendors");
                }
                
                await connection.query(
                    'INSERT INTO vendor_details (user_id, company_name, gst_number) VALUES (?, ?, ?)',
                    [userId, company_name, gst_number]
                );
            }

            await connection.commit();
            
            res.status(201).json({ message: "Registration successful" });
        } catch (error) {
            await connection.rollback();
            if (error.message.includes('Company name')) {
                return res.status(400).json({ message: error.message });
            }
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Internal server error", detail: error.message, stack: error.stack });
    }
};

module.exports = {
    login,
    register
};