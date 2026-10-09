// Integration checks use one outer transaction; all test records are rolled back.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

test('admin-only authentication, scheme and center management, notification atomicity', async () => {
  const client = await db.pool.connect();
  const originalQuery = db.query, originalConnect = db.pool.connect;
  let server, failRule = false;
  try {
    await client.query('BEGIN');
    db.query = (...args) => client.query(...args);
    db.pool.connect = async () => ({
      query: (sql, values) => {
        if (sql === 'BEGIN') return client.query('SAVEPOINT admin_request');
        if (sql === 'COMMIT') return client.query('RELEASE SAVEPOINT admin_request');
        if (sql === 'ROLLBACK') return client.query('ROLLBACK TO SAVEPOINT admin_request');
        if (failRule && sql.startsWith('INSERT INTO eligibility_rules')) throw new Error('Simulated rule failure');
        return client.query(sql, values);
      }, release: () => {},
    });
    const id = randomUUID(), email = `${id}@example.invalid`, password = randomUUID();
    const adminId = (await client.query('INSERT INTO admins(email, password_hash) VALUES ($1, $2) RETURNING admin_id', [email, await bcrypt.hash(password, 4)])).rows[0].admin_id;
    const citizen = (await client.query("INSERT INTO users(name, location_zone) VALUES ('Admin test citizen', 'North Zone') RETURNING user_id")).rows[0].user_id;
    const south = (await client.query("INSERT INTO users(name, location_zone) VALUES ('Other zone test citizen', 'South Zone') RETURNING user_id")).rows[0].user_id;
    server = require('../app').listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const request = async (path, method = 'GET', body, token) => {
      const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
      return { status: response.status, data: await response.json() };
    };
    assert.equal((await request('/api/admin/schemes')).status, 401);
    const citizenToken = jwt.sign({ userId: citizen, role: 'admin' }, process.env.JWT_SECRET);
    for (const [path, method] of [['/schemes', 'GET'], ['/schemes', 'POST'], [`/schemes/${randomUUID()}`, 'PUT'], [`/schemes/${randomUUID()}`, 'DELETE'], ['/service-centers', 'GET'], ['/service-centers', 'POST'], [`/service-centers/${randomUUID()}`, 'PUT'], [`/service-centers/${randomUUID()}`, 'DELETE']]) {
      assert.equal((await request(`/api/admin${path}`, method, method === 'GET' ? null : {}, citizenToken)).status, 401);
    }
    assert.equal((await request('/api/admin/login', 'POST', { email, password: 'wrong' })).status, 401);
    const login = await request('/api/admin/login', 'POST', { email, password });
    assert.equal(login.status, 200);
    assert.equal(login.data.admin.email, email);
    const token = login.data.token;
    assert.equal((await request('/api/admin/me', 'GET', null, token)).status, 200);
    const fake = jwt.sign({ adminId, sessionId: randomUUID() }, process.env.JWT_SECRET, { audience: 'civichelper-admin' });
    assert.equal((await request('/api/admin/me', 'GET', null, fake)).status, 401);
    const payload = { scheme_name: `Admin test ${id}`, description: 'Test only', category: 'Education', total_benefit_value: 5000, location_zone: 'North Zone', official_url: 'https://example.org', required_documents: 'ID', rules: [{ min_age: 18, max_age: 60, max_income: 0, requires_disability: false }] };
    assert.equal((await request('/api/admin/schemes', 'POST', { ...payload, official_url: 'javascript:alert(1)' }, token)).status, 400);
    assert.equal((await request('/api/admin/schemes', 'POST', { ...payload, rules: [{ min_age: 90, max_age: 20 }] }, token)).status, 400);
    assert.equal((await request('/api/admin/schemes', 'POST', { ...payload, location_zone: 'Unknown' }, token)).status, 400);
    const created = await request('/api/admin/schemes', 'POST', payload, token);
    assert.equal(created.status, 201);
    const schemeId = created.data.scheme_id;
    const notifications = await client.query('SELECT user_id FROM scheme_notifications WHERE scheme_id = $1', [schemeId]);
    assert.ok(notifications.rows.some((row) => row.user_id === citizen));
    assert.ok(!notifications.rows.some((row) => row.user_id === south));
    const list = await request('/api/admin/schemes', 'GET', null, token);
    const saved = list.data.schemes.find((s) => s.scheme_id === schemeId);
    assert.equal(Number(saved.rules[0].max_income), 0);
    const updated = { ...payload, location_zone: 'South Zone', total_benefit_value: 9000, rules: [{ min_age: 21, max_age: 55 }, { target_occupation: 'Student' }] };
    assert.equal((await request(`/api/admin/schemes/${schemeId}`, 'PUT', updated, token)).status, 200);
    assert.equal((await client.query('SELECT * FROM eligibility_rules WHERE scheme_id = $1', [schemeId])).rowCount, 2);
    assert.equal((await client.query('SELECT * FROM scheme_notifications WHERE scheme_id = $1', [schemeId])).rowCount, notifications.rowCount);
    assert.equal(Number((await request(`/api/schemes/${schemeId}`)).data.scheme.total_benefit_value), 9000);
    assert.equal((await request('/api/admin/schemes', 'POST', payload, token)).status, 409);
    // If rules fail, neither the scheme nor the trigger-generated alerts can survive.
    const before = Number((await client.query('SELECT count(*) FROM scheme_notifications')).rows[0].count);
    failRule = true;
    assert.equal((await request('/api/admin/schemes', 'POST', { ...payload, scheme_name: `${payload.scheme_name} fail` }, token)).status, 500);
    failRule = false;
    assert.equal((await client.query('SELECT * FROM govt_schemes WHERE scheme_name = $1', [`${payload.scheme_name} fail`])).rowCount, 0);
    assert.equal(Number((await client.query('SELECT count(*) FROM scheme_notifications')).rows[0].count), before);
    const center = { name: `Center ${id}`, address: 'Test address', location_zone: 'North Zone', contact_phone: '1234567890', operating_hours: 'Mon–Fri 9–5' };
    assert.equal((await request('/api/admin/service-centers', 'POST', { ...center, address: '' }, token)).status, 400);
    const addedCenter = await request('/api/admin/service-centers', 'POST', center, token);
    assert.equal(addedCenter.status, 201);
    const centerId = addedCenter.data.center_id;
    assert.equal((await request(`/api/admin/service-centers/${centerId}`, 'PUT', { ...center, address: 'Updated address' }, token)).status, 200);
    assert.equal((await request('/api/service-centers')).data.service_centers.find((c) => c.center_id === centerId).address, 'Updated address');
    assert.equal((await request(`/api/admin/service-centers/${centerId}`, 'DELETE', null, token)).status, 200);
    assert.equal((await request(`/api/admin/schemes/${schemeId}`, 'DELETE', null, token)).status, 200);
    assert.equal((await client.query('SELECT * FROM scheme_notifications WHERE scheme_id = $1', [schemeId])).rowCount, 0);
    assert.equal((await request(`/api/admin/schemes/${schemeId}`, 'DELETE', null, token)).status, 404);
    assert.equal((await request('/api/admin/logout', 'POST', {}, token)).status, 200);
    assert.equal((await request('/api/admin/me', 'GET', null, token)).status, 401);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await client.query('ROLLBACK');
    db.query = originalQuery; db.pool.connect = originalConnect;
    client.release(); await db.pool.end();
  }
});
