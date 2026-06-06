const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load environment variables from your .env file
dotenv.config();

// Create a connection pool using the configurations from your .env file
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 22427, // Default Aiven port fallback
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'defaultdb',
    
    // Connection Management Settings
    waitForConnections: true,
    connectionLimit: 10, // Limits open connections to save server memory
    queueLimit: 0,
    
    // Crucial setting for cloud databases like Aiven
    ssl: {
        rejectUnauthorized: false // Allows SSL encryption without needing physical .pem files locally
    }
});

// A quick self-test block to verify the connection is alive when the server boots
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Successfully connected to the Aiven MySQL Database Cluster!');
        
        // Auto-create notifications table if not exists
        await connection.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                title VARCHAR(150) NOT NULL,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);
        console.log('✅ Checked/created notifications table successfully!');
        
        connection.release(); // Return it to the pool immediately
    } catch (error) {
        console.error('❌ Database connection/setup failed! Check your .env credentials.');
        console.error('Error Details:', error.message);
    }
})();

module.exports = pool;