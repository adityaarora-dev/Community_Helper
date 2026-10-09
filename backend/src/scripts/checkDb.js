const { query, pool } = require('../config/db');

async function checkDatabase() {
  console.log('====================================================');
  console.log('🔍 Supabase PostgreSQL Table Inspector');
  console.log('====================================================');

  try {
    // 1. Connection & Location Information
    const infoRes = await query(`
      SELECT 
        current_database() AS db_name,
        current_schema() AS schema_name,
        current_user AS user_name,
        version() AS pg_version;
    `);

    const info = infoRes.rows[0];
    console.log('📍 DATABASE LOCATION DETAILS:');
    console.log(`   • Host:            aws-0-ap-northeast-2.pooler.supabase.com (Port 5432)`);
    console.log(`   • Database Name:   ${info.db_name}`);
    console.log(`   • Schema:          ${info.schema_name} (Standard PostgreSQL Public Schema)`);
    console.log(`   • Database User:   ${info.user_name}`);
    console.log(`   • Supabase URL:    https://supabase.com/dashboard/project/jluaxwcdyyvmmazrhjqv/editor\n`);

    // 2. Query All User Tables in Schema 'public'
    const tablesRes = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    if (tablesRes.rows.length === 0) {
      console.log('⚠️ No tables found in public schema. Run "npm run db:init" to create them.');
      return;
    }

    console.log(`📋 TABLES IN SCHEMA '${info.schema_name}': (${tablesRes.rows.length} found)\n`);

    for (const row of tablesRes.rows) {
      const tableName = row.table_name;

      // Count columns
      const colRes = await query(`
        SELECT COUNT(*) AS count
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1;
      `, [tableName]);

      // Count rows
      const countRes = await query(`SELECT COUNT(*) AS count FROM "${tableName}";`);

      const colCount = colRes.rows[0].count;
      const rowCount = countRes.rows[0].count;

      console.log(`  ✓ Table: ${tableName.padEnd(20)} | Columns: ${colCount.toString().padEnd(3)} | Rows: ${rowCount}`);
    }

    console.log('\n====================================================');
    console.log('💡 HOW TO VIEW IN SUPABASE DASHBOARD:');
    console.log('1. Open: https://supabase.com/dashboard/project/jluaxwcdyyvmmazrhjqv');
    console.log('2. Click on "Table Editor" in the left sidebar.');
    console.log('3. Ensure the schema dropdown (top left) is set to "public".');
    console.log('4. Click on any table to view, edit, or filter data directly.');
    console.log('====================================================');
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabase();
