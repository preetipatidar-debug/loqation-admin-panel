// server/db.js
require('dotenv').config(); // Loads .env variables locally
const mysql = require('mysql2/promise');

const dbConfig = {
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD, // Reads from .env (Local) or app.yaml (Cloud)
    database: process.env.DB_NAME || 'gbp_dashboard',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// LOGIC: If a Cloud SQL Connection Name exists, use Unix Socket. Otherwise, use Localhost.
if (process.env.INSTANCE_CONNECTION_NAME) {
    console.log(`🔌 Connecting to Cloud SQL via Socket: ${process.env.INSTANCE_CONNECTION_NAME}`);
    dbConfig.socketPath = `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`;
} else {
    console.log(`💻 Connecting to Local MySQL via TCP`);
    dbConfig.host = process.env.DB_HOST || 'localhost';
}

const pool = mysql.createPool(dbConfig);

// Test Connection on Start
pool.getConnection()
    .then(conn => {
        console.log("✅ Database Connected Successfully");
        conn.release();
    })
    .catch(err => {
        console.error("❌ Database Connection Failed:", err.message);
    });

module.exports = pool;