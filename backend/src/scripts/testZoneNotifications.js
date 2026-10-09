// All fixtures stay in one transaction and are rolled back. No emails are sent.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

test('verified signup and durable, account-isolated zone notifications', async () => {
  const client = await db.pool.connect();
  let server;
  const originalQuery = db.query;
  try {
    await client.query('BEGIN');
    db.query = (...args) => client.query(...args);
    let otp;
    require('../services/emailService').sendOtpEmail = async (_email, _name, code) => { otp = code; };
    const app = require('../app');
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const request = async (path, method = 'GET', body, token) => {
      const response = await fetch(base + path, { method, headers: {
        'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }, ...(body ? { body: JSON.stringify(body) } : {}) });
      return { status: response.status, data: await response.json() };
    };
    const id = randomUUID();
    const zone = `Test-${id}`;
    const email = `${id}@example.invalid`;
    assert.equal((await request('/api/users/send-registration-otp', 'POST', {
      name: 'Notification Test', email, password: randomUUID(), demographics: { location_zone: 'North Zone' },
    })).status, 200);
    const registered = await request('/api/users/verify-otp-and-register', 'POST', { email, otp });
    assert.equal(registered.status, 201);
    assert.equal(registered.data.user.location_zone, 'North Zone');
    const userId = registered.data.user.user_id;
    const token = registered.data.token;
    await client.query('UPDATE users SET location_zone = $1 WHERE user_id = $2', [zone, userId]);
    const other = (await client.query('INSERT INTO users(name, location_zone) VALUES ($1, $2) RETURNING user_id', ['Other test', `${zone}-other`])).rows[0].user_id;
    const otherToken = jwt.sign({ userId: other }, process.env.JWT_SECRET || 'civic-community-helper-secret-key-2026');
    const scheme = async (suffix, location) => (await client.query(`INSERT INTO govt_schemes
      (scheme_name, description, category, total_benefit_value, location_zone)
      VALUES ($1, 'Test only', 'Education', 100, $2) RETURNING scheme_id`, [`Test-${id}-${suffix}`, location])).rows[0].scheme_id;
    const first = await scheme('first', ` ${zone.toUpperCase()} `);
    await scheme('unspecified', null);
    await scheme('elsewhere', `${zone}-elsewhere`);
    assert.equal((await request('/api/notifications')).status, 401);
    assert.equal((await request('/api/notifications', 'GET', null, 'bad-token')).status, 401);
    const inbox = await request('/api/notifications', 'GET', null, token);
    assert.equal(inbox.data.unreadCount, 1);
    assert.equal(inbox.data.notifications[0].scheme_id, first);
    assert.equal((await request('/api/notifications', 'GET', null, otherToken)).data.notifications.length, 0);
    const notification = inbox.data.notifications[0].notification_id;
    assert.equal((await request(`/api/notifications/${notification}/read`, 'PATCH', {}, otherToken)).status, 404);
    assert.equal((await request('/api/notifications/invalid/read', 'PATCH', {}, token)).status, 400);
    const read = await request(`/api/notifications/${notification}/read`, 'PATCH', {}, token);
    assert.equal(read.status, 200);
    assert.equal((await request(`/api/notifications/${notification}/read`, 'PATCH', {}, token)).data.read_at, read.data.read_at);
    assert.equal((await request('/api/notifications', 'GET', null, token)).data.unreadCount, 0);
    await client.query('UPDATE govt_schemes SET description = $1 WHERE scheme_id = $2', ['Updated', first]);
    assert.equal((await request('/api/notifications', 'GET', null, token)).data.notifications.length, 1);
    // Moving into a zone does not backfill old schemes; future additions do notify.
    await client.query('UPDATE users SET location_zone = $1 WHERE user_id = $2', [zone, other]);
    assert.equal((await request('/api/notifications', 'GET', null, otherToken)).data.notifications.length, 0);
    await scheme('second', zone);
    assert.equal((await request('/api/notifications', 'GET', null, otherToken)).data.unreadCount, 1);
    assert.equal((await request('/api/notifications', 'GET', null, token)).data.unreadCount, 1);
    const late = (await client.query('INSERT INTO users(name, location_zone) VALUES ($1, $2) RETURNING user_id', ['Late test', zone])).rows[0].user_id;
    assert.equal((await client.query('SELECT * FROM scheme_notifications WHERE user_id = $1', [late])).rowCount, 0);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await client.query('ROLLBACK');
    db.query = originalQuery;
    client.release();
    await db.pool.end();
  }
});
