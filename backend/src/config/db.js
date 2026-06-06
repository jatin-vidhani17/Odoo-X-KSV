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
        connection.release(); // Return it to the pool immediately
    } catch (error) {
        console.error('❌ Database connection failed! Check your .env credentials.');
        console.error('Error Details:', error.message);
    }
})();

module.exports = pool;