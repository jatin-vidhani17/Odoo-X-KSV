const db = require("../config/db"); 
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Use a secret key from your .env file, or fall back to a default for development
const JWT_SECRET = process.env.JWT_SECRET;

// ==========================================
// REGISTER CONTROLLER
// ==========================================
const register = async (req, res) => {
    try {
        const { email, username, password, name, phone } = req.body;

        // 1. Basic validation
        if (!email || !password || !username || !name) {
            return res.status(400).json({
                success: false,
                message: "Email, username, password, and name are required."
            });
        }

        // 2. Check if the username or email already exists
        const [existingUser] = await db.execute(
            "SELECT a.username, u.email FROM auth a LEFT JOIN users u ON a.id = u.auth_id WHERE a.username = ? OR u.email = ?",
            [username, email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Username or Email already registered"
            });
        }

        // 3. Hash the password safely using bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 4. Insert into the 'auth' table first
        const [authResult] = await db.execute(
            "INSERT INTO auth (username, password) VALUES (?, ?)",
            [username, hashedPassword]
        );
        
        const newAuthId = authResult.insertId;

        // 5. Insert profile details into the 'users' table using the new auth ID
        await db.execute(
            "INSERT INTO users (auth_id, name, phone, email) VALUES (?, ?, ?, ?)",
            [newAuthId, name, phone || null, email]
        );

        return res.status(201).json({
            success: true,
            message: "User Created Successfully",
            user: email
        });

    } catch (error) {
        console.error("Registration Error:", error);
        return res.status(500).json({
            success: false,
            message: "Registration failed",
            error: error.message
        });
    }
}

// ==========================================
// LOGIN CONTROLLER
// ==========================================
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        // 1. Look up the user by email by joining users and auth tables
        const [rows] = await db.execute(
            "SELECT a.id AS auth_id, a.password AS hashedPassword, u.id AS user_id, u.name, u.email FROM users u JOIN auth a ON u.auth_id = a.id WHERE u.email = ?",
            [email]
        );

        if (rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const user = rows[0];

        // 2. Compare the plain-text password sent in the request with the hashed password from the DB
        const isPasswordMatch = await bcrypt.compare(password, user.hashedPassword);

        if (!isPasswordMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // 3. Generate a JWT token for the session instead of letting Supabase handle it
        const token = jwt.sign(
            { userId: user.user_id, authId: user.auth_id, email: user.email },
            JWT_SECRET,
            { expiresIn: "24h" } // Token expires in 1 day
        );

        // 4. Return success along with the session token and user profile data
        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                token: token,
                user: {
                    id: user.user_id,
                    name: user.name,
                    email: user.email
                }
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({
            success: false,
            message: "Login failed",
            error: error.message
        });
    }
}

module.exports = {
    login,
    register
}