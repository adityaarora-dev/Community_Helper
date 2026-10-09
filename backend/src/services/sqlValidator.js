/**
 * SQL Security Validator and Sanitizer
 * Enforces zero-trust read-only access for AI-generated SQL queries.
 */

const FORBIDDEN_COMMANDS = [
  'INSERT',
  'UPDATE',
  'DELETE',
  'DROP',
  'ALTER',
  'TRUNCATE',
  'CREATE',
  'REPLACE',
  'GRANT',
  'REVOKE',
  'EXEC',
  'EXECUTE',
  'CALL',
  'COPY',
  'VACUUM',
  'COMMENT',
  'REINDEX',
  'LOCK',
  'SET',
  'RESET',
  'SHOW',
  'DISCARD',
  'DO',
  'LISTEN',
  'NOTIFY',
  'PREPARE',
  'UNLISTEN',
];

const FORBIDDEN_OBJECTS = [
  'admins',
  'admin_sessions',
  'pg_catalog',
  'information_schema',
  'password_hash',
  'token_hash',
  'pg_sleep',
  'pg_read_file',
  'pg_write_file',
  'dblink',
  'current_setting',
  'set_config',
];

const DEFAULT_ROW_LIMIT = 50;
const MAX_ROW_LIMIT = 100;

/**
 * Removes string literals ('...') and comments (-- or /* ... *\/)
 * so we can safely check keywords outside of user text.
 */
function stripLiteralsAndComments(sql) {
  // Replace single-quoted literals with ''
  let cleaned = sql.replace(/'(?:''|[^'])*'/g, "''");
  // Replace line comments --
  cleaned = cleaned.replace(/--.*$/gm, '');
  // Replace block comments /* */
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
  return cleaned;
}

/**
 * Validates and sanitizes a model-generated SQL query.
 * @param {string} rawSql
 * @returns {{ isValid: boolean, sanitizedSql?: string, error?: string, limitApplied?: number }}
 */
function validateSql(rawSql) {
  if (!rawSql || typeof rawSql !== 'string') {
    return { isValid: false, error: 'Empty or non-string SQL provided.' };
  }

  // 1. Remove markdown formatting if model wrapped in ```sql ... ```
  let sql = rawSql.trim();
  if (sql.startsWith('```')) {
    sql = sql.replace(/^```(?:sql)?/i, '').replace(/```$/, '').trim();
  }

  // Remove trailing semicolons and whitespace
  sql = sql.replace(/;+\s*$/, '').trim();

  if (!sql) {
    return { isValid: false, error: 'Query contains no executable SQL.' };
  }

  const cleanedForCheck = stripLiteralsAndComments(sql);

  // 2. Reject multi-statement queries (semicolon outside of strings)
  if (cleanedForCheck.includes(';')) {
    return {
      isValid: false,
      error: 'Multiple SQL statements are strictly prohibited for execution safety.',
    };
  }

  // 3. Must begin with SELECT or WITH
  const trimmedClean = cleanedForCheck.trim();
  const startsWithSelectOrWith = /^(?:SELECT|WITH)\b/i.test(trimmedClean);
  if (!startsWithSelectOrWith) {
    return {
      isValid: false,
      error: 'Only read-only SELECT or WITH statements are permitted.',
    };
  }

  // If starts with WITH, verify it does not contain mutating CTEs (e.g. WITH d AS (DELETE ...))
  if (/^WITH\b/i.test(trimmedClean)) {
    const hasMutatingCte = /\b(?:INSERT|UPDATE|DELETE)\s+INTO?\b/i.test(cleanedForCheck);
    if (hasMutatingCte) {
      return {
        isValid: false,
        error: 'Mutating operations inside Common Table Expressions (CTEs) are strictly prohibited.',
      };
    }
  }

  // 4. Check for forbidden DDL / DML / Admin keywords
  for (const cmd of FORBIDDEN_COMMANDS) {
    const regex = new RegExp(`\\b${cmd}\\b`, 'i');
    if (regex.test(cleanedForCheck)) {
      return {
        isValid: false,
        error: `Unauthorized operation detected: Keyword "${cmd}" is not permitted in read-only queries.`,
      };
    }
  }

  // 5. Check for forbidden objects, tables, or sensitive columns
  for (const obj of FORBIDDEN_OBJECTS) {
    const regex = new RegExp(`\\b${obj}\\b`, 'i');
    if (regex.test(cleanedForCheck)) {
      return {
        isValid: false,
        error: `Access denied to restricted database object or column: "${obj}".`,
      };
    }
  }

  // 6. Enforce row limit
  let sanitizedSql = sql;
  const limitMatch = cleanedForCheck.match(/\bLIMIT\s+(\d+)\b/i);
  let limitApplied = DEFAULT_ROW_LIMIT;

  if (limitMatch) {
    const limitVal = parseInt(limitMatch[1], 10);
    if (limitVal > MAX_ROW_LIMIT) {
      // Replace with capped limit
      sanitizedSql = sanitizedSql.replace(/\bLIMIT\s+\d+\b/i, `LIMIT ${MAX_ROW_LIMIT}`);
      limitApplied = MAX_ROW_LIMIT;
    } else {
      limitApplied = limitVal;
    }
  } else {
    // Append default limit
    sanitizedSql = `${sanitizedSql} LIMIT ${DEFAULT_ROW_LIMIT}`;
    limitApplied = DEFAULT_ROW_LIMIT;
  }

  return {
    isValid: true,
    sanitizedSql,
    limitApplied,
  };
}

module.exports = {
  validateSql,
  DEFAULT_ROW_LIMIT,
  MAX_ROW_LIMIT,
};
