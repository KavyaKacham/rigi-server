const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// TiDB Cloud requires an encrypted (SSL) connection, unlike local MySQL.
// This reads the certificate file you downloaded and moved into this
// server folder earlier (isrgrootx1.pem).
const caCertPath = path.join(__dirname, '..', 'isrgrootx1.pem');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    ca: fs.readFileSync(caCertPath),
    minVersion: 'TLSv1.2',
  },
  waitForConnections: true,
  connectionLimit: 10,
});
// Without this, connection errors from the pool can crash the whole
// process instead of just failing the one request that caused them.
pool.on('error', (err) => {
  console.error('❌ MySQL pool error:', err.message);
});
module.exports = pool;