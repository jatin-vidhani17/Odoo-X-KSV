const pool = require('./src/config/db');

async function run() {
  try {
    await pool.query("ALTER TABLE users MODIFY COLUMN status ENUM('Active', 'Suspended', 'Pending') DEFAULT 'Pending';");
    // Change all existing users to Active so they don't get locked out
    await pool.query("UPDATE users SET status = 'Active';");
    console.log('Success altering users table');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
