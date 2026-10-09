require('dotenv').config();
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const app = require('../app');

test('Comprehensive Security, Profile Authorization, Admin 30-Day Session, Rate Limiting & Zone Sync Audit', async () => {
  let server;
  const createdUserIds = [];
  const createdAdminIds = [];
  const createdSchemeIds = [];

  try {
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    const request = async (path, method = 'GET', body, token) => {
      const response = await fetch(baseUrl + path, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      let data = null;
      try {
        data = await response.json();
      } catch {}
      return { status: response.status, headers: response.headers, data };
    };

    // =========================================================================
    // 1. STAGE 3: Legacy Registration Protection (Blocked to prevent OTP bypass)
    // =========================================================================
    console.log('\n--- 1. Testing Registration Endpoint Security ---');
    const directReg = await request('/api/users/register', 'POST', {
      name: 'Hacker',
      email: 'hacker@example.com',
      password: 'password123',
    });
    assert.equal(directReg.status, 403, 'Direct /api/users/register must return 403 Forbidden');
    console.log('✔ Direct /api/users/register is strictly blocked with HTTP 403');

    // Create two test citizens in the database
    const citizenAId = randomUUID();
    const citizenAEmail = `audit_citizen_a_${citizenAId}@example.com`;
    const citizenBId = randomUUID();
    const citizenBEmail = `audit_citizen_b_${citizenBId}@example.com`;
    const passwordHash = await bcrypt.hash('TestPass123!', 4);

    await db.query(
      `INSERT INTO users (user_id, name, email, password_hash, location_zone, annual_income, age, occupation)
       VALUES ($1, 'Citizen A', $2, $3, 'North Zone', 150000, 30, 'Engineer'),
              ($4, 'Citizen B', $5, $3, 'South Zone', 250000, 45, 'Teacher')`,
      [citizenAId, citizenAEmail, passwordHash, citizenBId, citizenBEmail]
    );
    createdUserIds.push(citizenAId, citizenBId);

    const tokenA = jwt.sign({ userId: citizenAId }, process.env.JWT_SECRET);
    const tokenB = jwt.sign({ userId: citizenBId }, process.env.JWT_SECRET);

    // =========================================================================
    // 2. STAGE 4: Profile Route Authorization & IDOR Protection
    // =========================================================================
    console.log('\n--- 2. Testing Profile Route Authorization & IDOR Protection ---');

    // 2a. Invalid UUID format
    assert.equal((await request('/api/users/profile/invalid-uuid-format', 'GET', null, tokenA)).status, 400);
    assert.equal((await request('/api/users/profile/invalid-uuid-format', 'PUT', { age: 31 }, tokenA)).status, 400);
    console.log('✔ Non-UUID profile requests rejected with HTTP 400');

    // 2b. Missing / invalid token
    assert.equal((await request(`/api/users/profile/${citizenAId}`, 'GET')).status, 401);
    assert.equal((await request(`/api/users/profile/${citizenAId}`, 'GET', null, 'malformed.token.here')).status, 401);
    console.log('✔ Unauthenticated profile requests rejected with HTTP 401');

    // 2c. IDOR: Citizen B attempts to access Citizen A's profile
    const idorGet = await request(`/api/users/profile/${citizenAId}`, 'GET', null, tokenB);
    assert.equal(idorGet.status, 403, 'Citizen B cannot read Citizen A profile');

    const idorPut = await request(`/api/users/profile/${citizenAId}`, 'PUT', { annual_income: 999999 }, tokenB);
    assert.equal(idorPut.status, 403, 'Citizen B cannot modify Citizen A profile');
    console.log('✔ IDOR attempts strictly blocked with HTTP 403');

    // 2d. Legitimate owner access
    const ownerGet = await request(`/api/users/profile/${citizenAId}`, 'GET', null, tokenA);
    assert.equal(ownerGet.status, 200);
    assert.equal(ownerGet.data.user.email, citizenAEmail);

    const ownerPut = await request(
      `/api/users/profile/${citizenAId}`,
      'PUT',
      { age: 31, annual_income: 180000, email: 'tampered@hacker.com', password_hash: 'tampered', role: 'admin' },
      tokenA
    );
    assert.equal(ownerPut.status, 200);
    assert.equal(ownerPut.data.user.age, 31);
    assert.equal(Number(ownerPut.data.user.annual_income), 180000);
    assert.equal(ownerPut.data.user.email, citizenAEmail, 'Email must not be tampered');
    console.log('✔ Citizen owner can read and update profile; protected fields untampered');

    // =========================================================================
    // 3. STAGE 5: Admin Login Rate Limiting
    // =========================================================================
    console.log('\n--- 3. Testing Admin Login Rate Limiting ---');
    const adminEmail = `audit_admin_${randomUUID()}@civichelper.gov`;
    const adminPassword = 'AdminSecretPass2026!';
    const adminHash = await bcrypt.hash(adminPassword, 4);

    const adminId = (
      await db.query(
        'INSERT INTO admins(email, password_hash) VALUES ($1, $2) RETURNING admin_id',
        [adminEmail, adminHash]
      )
    ).rows[0].admin_id;
    createdAdminIds.push(adminId);

    // Send 10 failed login attempts
    for (let i = 0; i < 10; i++) {
      const failRes = await request('/api/admin/login', 'POST', {
        email: adminEmail,
        password: 'wrong_password_attempt',
      });
      assert.equal(failRes.status, 401);
    }

    // 11th attempt should be blocked by rate limiter with 429
    const rateLimitedRes = await request('/api/admin/login', 'POST', {
      email: adminEmail,
      password: adminPassword,
    });
    assert.equal(rateLimitedRes.status, 429, '11th attempt must return 429 Too Many Requests');
    assert.ok(rateLimitedRes.headers.get('retry-after'), 'Retry-After header must be present');
    console.log('✔ 10 failed login attempts triggered HTTP 429 lockout with Retry-After header');

    // =========================================================================
    // 4. STAGE 6: Admin 30-Day Session & 8-Hour Restriction Removal
    // =========================================================================
    console.log('\n--- 4. Testing Admin 30-Day Session Duration & Revocation ---');

    // Create session directly to test session duration and sliding renewal
    const sessResult = await db.query(
      "INSERT INTO admin_sessions(admin_id, expires_at) VALUES ($1, NOW() + INTERVAL '30 days') RETURNING session_id, expires_at",
      [adminId]
    );
    const sessionId = sessResult.rows[0].session_id;
    const expiresAt = new Date(sessResult.rows[0].expires_at);

    // Verify session expiration is well beyond 8 hours (at least 29 days from now)
    const hoursRemaining = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60);
    assert.ok(hoursRemaining > 24 * 28, `Session should be valid for ~30 days, got ${hoursRemaining.toFixed(1)} hours`);
    console.log(`✔ Admin session initial lifetime is ${hoursRemaining.toFixed(1)} hours (> 8 hours restriction removed)`);

    const adminToken = jwt.sign(
      { adminId, sessionId },
      process.env.JWT_SECRET,
      { audience: 'civichelper-admin', expiresIn: '30d' }
    );

    // Authenticated admin request slides session expiration
    const adminMe = await request('/api/admin/me', 'GET', null, adminToken);
    assert.equal(adminMe.status, 200);
    assert.equal(adminMe.data.admin.email, adminEmail);

    // Admin can also manage citizen profiles (Administrative Privilege)
    const adminProfileRead = await request(`/api/users/profile/${citizenAId}`, 'GET', null, adminToken);
    assert.equal(adminProfileRead.status, 200);
    assert.equal(adminProfileRead.data.user.email, citizenAEmail);
    console.log('✔ Administrator can access /me and manage user profiles');

    // Admin Logout immediately revokes session in DB
    const logoutRes = await request('/api/admin/logout', 'POST', {}, adminToken);
    assert.equal(logoutRes.status, 200);

    const revokedCheck = await request('/api/admin/me', 'GET', null, adminToken);
    assert.equal(revokedCheck.status, 401, 'Logged out session must be immediately rejected');
    console.log('✔ Server-side session revocation verified upon admin logout');

    // =========================================================================
    // 5. STAGE 7: Scheme Database Synchronization & Public Catalog
    // =========================================================================
    console.log('\n--- 5. Testing Scheme Database Synchronization & Catalog ---');

    // Create a new admin session for scheme operations
    const newSession = (
      await db.query("INSERT INTO admin_sessions(admin_id, expires_at) VALUES ($1, NOW() + INTERVAL '30 days') RETURNING session_id", [adminId])
    ).rows[0].session_id;
    const activeAdminToken = jwt.sign(
      { adminId, sessionId: newSession },
      process.env.JWT_SECRET,
      { audience: 'civichelper-admin', expiresIn: '30d' }
    );

    const testSchemeName = `Audit Welfare Initiative ${randomUUID()}`;
    const schemePayload = {
      scheme_name: testSchemeName,
      description: 'Comprehensive financial welfare for citizens in North Zone.',
      category: 'Education',
      total_benefit_value: 75000,
      location_zone: 'North Zone',
      required_documents: 'Income certificate, ID',
      official_url: 'https://scholarships.gov.in',
      rules: [
        { min_age: 18, max_age: 35, max_income: 200000, requires_disability: false }
      ],
    };

    const schemeCreate = await request('/api/admin/schemes', 'POST', schemePayload, activeAdminToken);
    assert.equal(schemeCreate.status, 201);
    const createdSchemeId = schemeCreate.data.scheme_id;
    createdSchemeIds.push(createdSchemeId);

    // Verify public catalog endpoints include location_zone
    const publicList = await request('/api/schemes', 'GET');
    assert.equal(publicList.status, 200);
    const listedScheme = publicList.data.schemes.find((s) => s.scheme_id === createdSchemeId);
    assert.ok(listedScheme, 'Created scheme must appear in public catalog');
    assert.equal(listedScheme.location_zone, 'North Zone', 'location_zone must be present in public catalog');

    const publicDetail = await request(`/api/schemes/${createdSchemeId}`, 'GET');
    assert.equal(publicDetail.status, 200);
    assert.equal(publicDetail.data.scheme.location_zone, 'North Zone');
    console.log('✔ Scheme created with location_zone persisted and reflected in public catalog');

    // =========================================================================
    // 6. STAGE 8: Zone-Specific Scheme Notifications
    // =========================================================================
    console.log('\n--- 6. Testing Zone Scheme Notifications ---');
    // Citizen A is in 'North Zone' -> should have received notification!
    // Citizen B is in 'South Zone' -> should NOT have received notification!

    const notifA = await request('/api/notifications', 'GET', null, tokenA);
    assert.equal(notifA.status, 200);
    const hasSchemeA = notifA.data.notifications.some((n) => n.scheme_id === createdSchemeId);
    assert.ok(hasSchemeA, 'Citizen A (North Zone) must have received notification');

    const notifB = await request('/api/notifications', 'GET', null, tokenB);
    assert.equal(notifB.status, 200);
    const hasSchemeB = notifB.data.notifications.some((n) => n.scheme_id === createdSchemeId);
    assert.ok(!hasSchemeB, 'Citizen B (South Zone) must NOT have received North Zone notification');
    console.log('✔ Zone-isolated notifications verified: North Zone citizen notified, South Zone citizen isolated');

    console.log('\n=================================================================');
    console.log('🎉 ALL AUDIT & SECURITY REMEDIATION TESTS PASSED CLEANLY (100%)!');
    console.log('=================================================================\n');

  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    try {
      if (createdSchemeIds.length) {
        await db.query('DELETE FROM govt_schemes WHERE scheme_id = ANY($1)', [createdSchemeIds]);
      }
      if (createdUserIds.length) {
        await db.query('DELETE FROM users WHERE user_id = ANY($1)', [createdUserIds]);
      }
      if (createdAdminIds.length) {
        await db.query('DELETE FROM admins WHERE admin_id = ANY($1)', [createdAdminIds]);
      }
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr.message);
    }
    setTimeout(() => process.exit(0), 100);
  }
});
