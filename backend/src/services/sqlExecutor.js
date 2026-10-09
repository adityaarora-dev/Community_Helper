const { pool } = require('../config/db');

const DEFAULT_QUERY_TIMEOUT_MS = parseInt(process.env.SQL_EXECUTION_TIMEOUT_MS, 10) || 5000;

/**
 * Executes a pre-validated, sanitized SQL query against PostgreSQL with:
 * 1. Strict read-only transaction (BEGIN READ ONLY)
 * 2. Dedicated per-query statement timeout (SET LOCAL statement_timeout)
 * 3. Exact execution timing
 * 4. Safe error categorization (syntax error, timeout, connection failure)
 *
 * @param {string} sql - Validated SQL query
 * @param {Array} [params=[]] - Optional query parameters
 * @param {number} [timeoutMs=DEFAULT_QUERY_TIMEOUT_MS] - Timeout in milliseconds
 * @returns {Promise<{
 *   success: boolean,
 *   rows?: Array,
 *   rowCount?: number,
 *   columns?: Array<string>,
 *   executionTimeMs: number,
 *   error?: string,
 *   errorCode?: string,
 *   isTimeout?: boolean
 * }>}
 */
async function executeSafeQuery(sql, params = [], timeoutMs = DEFAULT_QUERY_TIMEOUT_MS) {
  const startTime = performance.now();
  let client = null;

  try {
    client = await pool.connect();

    // Start read-only transaction and set statement timeout
    await client.query('BEGIN READ ONLY;');
    await client.query(`SET LOCAL statement_timeout = ${Math.max(100, timeoutMs)};`);

    // Execute query
    const result = await client.query(sql, params);

    // Rollback read-only transaction to release locks immediately
    await client.query('ROLLBACK;');

    const executionTimeMs = Math.round(performance.now() - startTime);

    const columns = (result.fields || []).map((f) => f.name);

    return {
      success: true,
      rows: result.rows || [],
      rowCount: result.rowCount || 0,
      columns,
      executionTimeMs,
    };
  } catch (error) {
    const executionTimeMs = Math.round(performance.now() - startTime);

    // PostgreSQL code 57014 represents statement_timeout
    const isTimeout =
      error.code === '57014' ||
      error.message?.includes('statement timeout') ||
      error.message?.includes('canceling statement due to statement timeout');

    if (client) {
      try {
        await client.query('ROLLBACK;');
      } catch (rollbackErr) {
        // ignore rollback errors on failed connection
      }
    }

    return {
      success: false,
      error: error.message,
      errorCode: error.code || 'EXECUTION_ERROR',
      isTimeout,
      executionTimeMs,
    };
  } finally {
    if (client) {
      client.release();
    }
  }
}

module.exports = {
  executeSafeQuery,
  DEFAULT_QUERY_TIMEOUT_MS,
};
