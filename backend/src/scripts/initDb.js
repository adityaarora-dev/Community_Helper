const fs = require('fs').promises;
const path = require('path');
const { query, pool } = require('../config/db');

async function initializeDatabase() {
  console.log('====================================================');
  console.log('🚀 Starting Database Initialization & Seeding...');
  console.log('====================================================');

  const sqlFilePath = path.join(__dirname, '../db/init.sql');

  try {
    console.log(`📄 Reading SQL file: ${sqlFilePath}`);
    const sqlContent = await fs.readFile(sqlFilePath, 'utf8');

    console.log('⏳ Executing DDL and Seed queries on Supabase PostgreSQL...');
    const startTime = Date.now();
    await query(sqlContent);
    await query(await fs.readFile(path.join(__dirname, '../db/zoneNotifications.sql'), 'utf8'));
    const elapsed = Date.now() - startTime;
    console.log(`✅ SQL script executed successfully in ${elapsed}ms!\n`);

    // Verify row counts for all created tables
    console.log('📊 Verifying Table Counts & Seed Data:');
    console.log('----------------------------------------------------');

    const tables = [
      'govt_schemes',
      'eligibility_rules',
      'service_centers',
      'users',
      'user_interactions',
    ];

    for (const table of tables) {
      const res = await query(`SELECT COUNT(*) AS count FROM ${table};`);
      const count = res.rows[0].count;
      console.log(`  ✓ Table '${table.padEnd(20)}': ${count} rows`);
    }

    console.log('----------------------------------------------------');
    console.log('🎉 Database initialization completed successfully!');
    console.log('====================================================');
  } catch (error) {
    console.error('\n❌ [Database Initialization Failed]:', error.message);
    if (error.position) {
      console.error(`Error position in SQL: character ${error.position}`);
    }
    process.exit(1);
  } finally {
    // Close the pool so the CLI script exits cleanly
    await pool.end();
  }
}

initializeDatabase();
