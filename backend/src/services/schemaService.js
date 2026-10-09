const { pool } = require('../config/db');

// In-memory cache for database schema
let cachedSchemaText = null;
let cachedSchemaJson = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Sensitive tables and columns that must NEVER be exposed to the LLM or chat queries
const EXCLUDED_TABLES = ['admins', 'admin_sessions', 'schema_migrations'];
const EXCLUDED_COLUMNS = ['password_hash', 'token_hash'];

/**
 * Discovers and builds PostgreSQL schema context directly from information_schema.
 * Includes tables, columns, data types, primary keys, and foreign key relationships.
 * @param {boolean} forceRefresh - If true, bypasses the in-memory cache.
 * @returns {Promise<{ schemaText: string, schemaJson: Object }>}
 */
async function getSchemaContext(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedSchemaText && now - cacheTimestamp < CACHE_TTL_MS) {
    return {
      schemaText: cachedSchemaText,
      schemaJson: cachedSchemaJson,
    };
  }

  // 1. Fetch all user tables in public schema
  const tablesResult = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  const allowedTables = tablesResult.rows
    .map((r) => r.table_name)
    .filter((name) => !EXCLUDED_TABLES.includes(name.toLowerCase()));

  if (allowedTables.length === 0) {
    throw new Error('No public tables found in the database.');
  }

  // 2. Fetch column definitions for allowed tables
  const columnsResult = await pool.query(
    `
    SELECT 
      table_name,
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ANY($1)
    ORDER BY table_name, ordinal_position;
  `,
    [allowedTables]
  );

  // 3. Fetch Primary Keys
  const pkResult = await pool.query(`
    SELECT
      tc.table_name,
      kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public';
  `);

  const primaryKeysByTable = {};
  for (const row of pkResult.rows) {
    if (!primaryKeysByTable[row.table_name]) {
      primaryKeysByTable[row.table_name] = [];
    }
    primaryKeysByTable[row.table_name].push(row.column_name);
  }

  // 4. Fetch Foreign Keys
  const fkResult = await pool.query(`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';
  `);

  const foreignKeysByTable = {};
  for (const row of fkResult.rows) {
    if (!foreignKeysByTable[row.table_name]) {
      foreignKeysByTable[row.table_name] = [];
    }
    foreignKeysByTable[row.table_name].push({
      column: row.column_name,
      foreignTable: row.foreign_table_name,
      foreignColumn: row.foreign_column_name,
    });
  }

  // 5. Structure into schema model
  const schemaJson = {};
  const schemaLines = [
    '### PostgreSQL Database Schema (Dialect: PostgreSQL)',
    'Database: public schema',
    '',
  ];

  for (const tableName of allowedTables) {
    const cols = columnsResult.rows.filter(
      (c) => c.table_name === tableName && !EXCLUDED_COLUMNS.includes(c.column_name.toLowerCase())
    );

    const pks = primaryKeysByTable[tableName] || [];
    const fks = foreignKeysByTable[tableName] || [];

    schemaJson[tableName] = {
      columns: cols.map((c) => ({
        name: c.column_name,
        type: c.data_type,
        nullable: c.is_nullable === 'YES',
      })),
      primaryKeys: pks,
      foreignKeys: fks,
    };

    schemaLines.push(`Table: "${tableName}"`);
    schemaLines.push('Columns:');
    for (const c of cols) {
      const isPk = pks.includes(c.column_name) ? ' [PRIMARY KEY]' : '';
      const nullableStr = c.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      schemaLines.push(`  - "${c.column_name}" (${c.data_type}, ${nullableStr})${isPk}`);
    }

    if (fks.length > 0) {
      schemaLines.push('Foreign Key Relationships:');
      for (const fk of fks) {
        schemaLines.push(`  - "${fk.column}" REFERENCES "${fk.foreignTable}"("${fk.foreignColumn}")`);
      }
    }
    schemaLines.push('');
  }

  // Add critical domain notes to guide accurate joins and filtering
  schemaLines.push('### Schema Notes & Domain Guidance:');
  schemaLines.push('1. "govt_schemes" holds government welfare schemes (scheme_id, scheme_name, description, category, total_benefit_value, required_documents, official_url).');
  schemaLines.push('2. "eligibility_rules" defines criteria per scheme (rule_id, scheme_id REFERENCES govt_schemes, max_income, min_age, max_age, target_gender, min_family_size, target_occupation, target_social_category, requires_disability, max_landholding). To inspect both scheme details and its eligibility rules, JOIN eligibility_rules r ON s.scheme_id = r.scheme_id.');
  schemaLines.push('3. "service_centers" contains offline help centers (center_id, name, address, location_zone, contact_phone, operating_hours).');
  schemaLines.push('4. "users" contains registered citizens (user_id, name, email, annual_income, family_size, location_zone, age, gender, occupation, social_category, disability_status, landholding_acres).');
  schemaLines.push('5. "scheme_notifications" records notifications sent to citizens regarding new schemes (notification_id, user_id, scheme_id, title, message, is_read, created_at).');
  schemaLines.push('6. Case-insensitive string matching: In PostgreSQL, use ILIKE instead of LIKE (e.g. category ILIKE \'%Healthcare%\').');

  cachedSchemaText = schemaLines.join('\n');
  cachedSchemaJson = schemaJson;
  cacheTimestamp = now;

  return {
    schemaText: cachedSchemaText,
    schemaJson: cachedSchemaJson,
  };
}

/**
 * Clear schema cache to force fresh inspection on next request
 */
function invalidateSchemaCache() {
  cachedSchemaText = null;
  cachedSchemaJson = null;
  cacheTimestamp = 0;
}

module.exports = {
  getSchemaContext,
  invalidateSchemaCache,
  EXCLUDED_TABLES,
  EXCLUDED_COLUMNS,
};
