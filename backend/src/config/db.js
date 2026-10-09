const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ [Database Config Error] DATABASE_URL is not defined in environment variables.');
}

/**
 * PostgreSQL Connection Pool Configuration for Supabase
 *
 * Strict Constraints Applied:
 * 1. SSL: { rejectUnauthorized: false } for Supabase remote connections from local/mobile environments.
 * 2. Pool limits: max: 10, idleTimeoutMillis: 30000 to prevent connection exhaustion.
 * 3. Connection Timeout: 10000ms to fail quickly on bad network / mobile Wi-Fi drops.
 * 4. IPv4 Session Pooler: Uses port 5432 via pooler.supabase.com to avoid mobile hotspot IPv6 drops.
 */
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

/**
 * Error Handling:
 * Attach an 'error' event listener to the pool to catch and log idle client errors
 * without crashing the entire Express server process.
 */
pool.on('error', (err, client) => {
  console.error('❌ [Database Pool Error] Unexpected error on idle PostgreSQL client:', err.message);
});

/**
 * Helper function to test connection and log success
 * @returns {Promise<Object>}
 */
const testConnection = async () => {
  try {
    const result = await pool.query(
      'SELECT NOW() AS server_time, current_database() AS db_name, version() AS pg_version;'
    );
    const serverTime = result.rows[0].server_time;
    const dbName = result.rows[0].db_name;
    console.log(
      `✅ [Database Connected] Successfully connected to Supabase PostgreSQL database '${dbName}' at ${serverTime}`
    );
    return {
      connected: true,
      serverTime,
      dbName,
    };
  } catch (error) {
    console.error('❌ [Database Connection Failed]:', error.message);
    throw error;
  }
};

/**
 * Query Helper Export:
 * Simplifies query execution in controller files without manually checking out and releasing clients.
 * Usage: const { query } = require('./config/db');
 *        const res = await query('SELECT * FROM users WHERE id = $1', [userId]);
 */
const query = (text, params) => pool.query(text, params);

module.exports = {
  pool,
  query,
  testConnection,
};
