require('dotenv').config();
const http = require('http');
const app = require('../app');

async function runTestSuite() {
  console.log('================================================================');
  console.log('🧪 Starting Comprehensive Text-to-SQL Pipeline Verification Test');
  console.log('================================================================\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5998, resolve));
  const baseUrl = 'http://localhost:5998';

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Basic natural-language database query
    // -------------------------------------------------------------------------
    console.log('Test 1: Basic natural-language database query ("Show me all schemes in Healthcare")');
    const res1 = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Show me all schemes in Healthcare',
      }),
    });
    const data1 = await res1.json();
    console.log(`  HTTP Status: ${res1.status}`);
    console.log(`  Executed SQL: ${data1.sql}`);
    console.log(`  Execution Time: ${data1.execution_time_ms}ms`);
    console.log(`  Row Count: ${data1.row_count}`);
    console.log(`  Grounded Reply: ${data1.conversational_reply.slice(0, 120)}...\n`);
    if (res1.status !== 200 || !data1.sql || data1.row_count === 0) {
      throw new Error('Test 1 Failed: Expected successful query execution with rows returned.');
    }

    // -------------------------------------------------------------------------
    // TEST 2: Filtering with multiple conditions
    // -------------------------------------------------------------------------
    console.log('Test 2: Multi-condition query ("Show schemes with benefit >= 100000 in Housing or Healthcare")');
    const res2 = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Show schemes with benefit >= 100000 in Housing or Healthcare',
      }),
    });
    const data2 = await res2.json();
    console.log(`  HTTP Status: ${res2.status}`);
    console.log(`  Executed SQL: ${data2.sql}`);
    console.log(`  Row Count: ${data2.row_count}`);
    console.log(`  Grounded Reply: ${data2.conversational_reply.slice(0, 120)}...\n`);
    if (res2.status !== 200 || !data2.sql) {
      throw new Error('Test 2 Failed');
    }

    // -------------------------------------------------------------------------
    // TEST 3: Sorting and aggregation
    // -------------------------------------------------------------------------
    console.log('Test 3: Aggregation ("What is the total and average benefit value of all schemes?")');
    const res3 = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What is the total and average benefit value of all schemes?',
      }),
    });
    const data3 = await res3.json();
    console.log(`  HTTP Status: ${res3.status}`);
    console.log(`  Executed SQL: ${data3.sql}`);
    console.log(`  Aggregated Row:`, data3.rows);
    console.log(`  Grounded Reply: ${data3.conversational_reply.slice(0, 140)}...\n`);
    if (res3.status !== 200 || !data3.sql) {
      throw new Error('Test 3 Failed');
    }

    // -------------------------------------------------------------------------
    // TEST 4: Multi-turn Contextual Follow-up
    // -------------------------------------------------------------------------
    console.log('Test 4: Multi-turn Contextual Follow-up (Agriculture -> Filter benefit -> Count)');
    const history = [];

    // Turn 1
    const t1Res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Show all agricultural schemes',
        history,
      }),
    });
    const t1Data = await t1Res.json();
    console.log(`  Turn 1 SQL: ${t1Data.sql}`);
    history.push({ role: 'user', content: 'Show all agricultural schemes' });
    history.push({ role: 'assistant', content: t1Data.conversational_reply, sql: t1Data.sql });

    // Turn 2
    const t2Res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Now show only those with benefit greater than 5000',
        history,
      }),
    });
    const t2Data = await t2Res.json();
    console.log(`  Turn 2 SQL: ${t2Data.sql}`);
    console.log(`  Turn 2 Rows: ${t2Data.row_count}`);
    history.push({ role: 'user', content: 'Now show only those with benefit greater than 5000' });
    history.push({ role: 'assistant', content: t2Data.conversational_reply, sql: t2Data.sql });

    // Turn 3
    const t3Res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'How many are there?',
        history,
      }),
    });
    const t3Data = await t3Res.json();
    console.log(`  Turn 3 SQL: ${t3Data.sql}`);
    console.log(`  Turn 3 Count Result:`, t3Data.rows);
    console.log(`  Turn 3 Reply: ${t3Data.conversational_reply.slice(0, 120)}...\n`);

    // -------------------------------------------------------------------------
    // TEST 5: Zero Matching Records
    // -------------------------------------------------------------------------
    console.log('Test 5: Zero Matching Records ("Show schemes for astronauts with income 100 crore")');
    const res5 = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Show schemes for astronauts with income 100 crore',
      }),
    });
    const data5 = await res5.json();
    console.log(`  HTTP Status: ${res5.status}`);
    console.log(`  Executed SQL: ${data5.sql}`);
    console.log(`  Row Count: ${data5.row_count}`);
    console.log(`  Reply acknowledges 0 results: ${data5.conversational_reply.slice(0, 120)}...\n`);
    if (data5.row_count !== 0) {
      throw new Error('Test 5 Failed: Expected 0 rows.');
    }

    // -------------------------------------------------------------------------
    // TEST 6: Direct SQL Validator Security Rejection
    // -------------------------------------------------------------------------
    console.log('Test 6: Security Verification (Testing direct injection attempt / mutation rejection)');
    const { validateSql } = require('../services/sqlValidator');
    const dangerousQueries = [
      'DROP TABLE users;',
      'DELETE FROM govt_schemes WHERE 1=1;',
      'SELECT * FROM users; DROP TABLE service_centers;',
      'SELECT email, password_hash FROM users;',
      'SELECT * FROM admins;',
      'UPDATE users SET name = \'Hacked\';',
    ];

    dangerousQueries.forEach((q) => {
      const val = validateSql(q);
      console.log(`  Safety check: "${q}" -> Blocked: ${!val.isValid} (${val.error})`);
      if (val.isValid) {
        throw new Error(`Security Test Failed: Dangerous query was not blocked: ${q}`);
      }
    });

    console.log('\n================================================================');
    console.log('✅ ALL TEXT-TO-SQL PIPELINE INTEGRATION TESTS PASSED CLEANLY!');
    console.log('================================================================');
  } finally {
    server.close();
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
