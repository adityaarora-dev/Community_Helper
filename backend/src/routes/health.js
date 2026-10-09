const express = require('express');
const router = express.Router();
const { query, pool } = require('../config/db');

/**
 * GET /health (or /api/health)
 * Health check endpoint to verify Supabase PostgreSQL connection
 */
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    const result = await query(
      'SELECT NOW() AS server_time, current_database() AS db_name, version() AS pg_version;'
    );
    const durationMs = Date.now() - startTime;

    const serverTime = result.rows[0].server_time;
    const dbName = result.rows[0].db_name;

    // Console success message
    console.log(
      `✅ [Health Check Success] Supabase PostgreSQL database '${dbName}' ping successful (${durationMs}ms) at ${serverTime}`
    );

    // Router response message
    return res.status(200).json({
      status: 'success',
      message: 'Database connection successful and healthy!',
      timestamp: new Date().toISOString(),
      database: {
        name: dbName,
        serverTime,
        responseTimeMs: durationMs,
        pool: {
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
          waitingCount: pool.waitingCount,
        },
      },
    });
  } catch (error) {
    // Console error message
    console.error('❌ [Health Check Failed] Database connection error:', error.message);

    return res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
    });
  }
});

module.exports = router;
