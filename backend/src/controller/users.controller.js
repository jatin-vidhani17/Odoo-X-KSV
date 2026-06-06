// We replace the Supabase config import with your standard database pool import
// (Make sure to install 'mysql2' in your project: npm install mysql2)
const db = require("../config/db"); 

const getUserById = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);

        // Check if ID is a valid number before querying
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format"
            });
        }

        // MySQL Query joining the 'users' details with their 'auth' username
        const query = `
            SELECT 
                id, 
                username, 
                name, 
                phone, 
                email, 
                role,
                status,
                created_at,
                updated_at 
            FROM users
            WHERE id = ?
        `;

        // Executing the query safely using placeholders (?) to prevent SQL injection
        const [rows] = await db.execute(query, [id]);

        // MySQL returns an array. If length is 0, no user was found.
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "user not found"
            });
        }

        // Extract the single user object from the rows array
        const userData = rows[0];

        return res.status(200).json({
            success: true,
            message: "user data found",
            data: userData
        });

    } catch (error) {
        console.log("MySQL Error Details:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error occurred"
        });
    }
}

module.exports = {
    getUserById,
}