const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool, query } = require('../config/db');
const validate = require('../services/adminValidation');
const router = express.Router();
const audience = 'civichelper-admin';
const attempts = new Map();
const wrap = (fn) => async (req, res, next) => { try { await fn(req, res); } catch (error) { next(error); } };

router.post('/login', wrap(async (req, res) => {
  if (!process.env.JWT_SECRET) return res.status(503).json({ message: 'Admin authentication is not configured.' });
  const now = Date.now();
  for (const [key, entry] of attempts) if (entry.until <= now) attempts.delete(key);
  const attempt = attempts.get(req.ip) || { count: 0, until: now + 15 * 60000 };
  if (attempt.count >= 10) return res.status(429).json({ message: 'Too many attempts. Please try again in 15 minutes.' });
  attempt.count++; attempts.set(req.ip, attempt);
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string' || email.length > 255 || password.length > 256) return res.status(400).json({ message: 'Enter your admin email and password.' });
  const result = await query('SELECT admin_id, email, password_hash FROM admins WHERE email = $1', [email.trim().toLowerCase()]);
  const admin = result.rows[0];
  if (!admin || !await bcrypt.compare(password, admin.password_hash)) return res.status(401).json({ message: 'Invalid admin credentials.' });
  attempts.delete(req.ip);
  await query('DELETE FROM admin_sessions WHERE expires_at < NOW()');
  const session = await query('INSERT INTO admin_sessions(admin_id) VALUES ($1) RETURNING session_id', [admin.admin_id]);
  const token = jwt.sign({ adminId: admin.admin_id, sessionId: session.rows[0].session_id }, process.env.JWT_SECRET, { audience, expiresIn: '8h', algorithm: 'HS256' });
  res.json({ token, admin: { email: admin.email } });
}));

router.use(async (req, res, next) => {
  let claims;
  try {
    claims = jwt.verify(/^Bearer (.+)$/.exec(req.headers.authorization || '')?.[1], process.env.JWT_SECRET, { audience, algorithms: ['HS256'] });
    const uuid = /^[0-9a-f-]{36}$/i;
    if (!uuid.test(claims.adminId) || !uuid.test(claims.sessionId)) throw new Error('Invalid claims');
  } catch { return res.status(401).json({ message: 'Please sign in as an administrator.' }); }
  try {
    const result = await query(`SELECT a.admin_id, a.email FROM admins a JOIN admin_sessions s USING (admin_id)
      WHERE a.admin_id = $1 AND s.session_id = $2 AND s.expires_at > NOW()`, [claims.adminId, claims.sessionId]);
    if (!result.rowCount) return res.status(401).json({ message: 'Your admin session has expired. Please sign in again.' });
    req.admin = result.rows[0]; req.sessionId = claims.sessionId; next();
  } catch (error) { next(error); }
});
router.get('/me', (req, res) => res.json({ admin: { email: req.admin.email } }));
router.post('/logout', wrap(async (req, res) => {
  await query('DELETE FROM admin_sessions WHERE session_id = $1', [req.sessionId]);
  res.json({ status: 'success' });
}));
router.param('id', (req, res, next, id) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return res.status(400).json({ message: 'Invalid record ID.' });
  next();
});
router.get('/schemes', wrap(async (req, res) => {
  const result = await query(`SELECT s.*, COALESCE((SELECT json_agg(r ORDER BY r.rule_id)
    FROM eligibility_rules r WHERE r.scheme_id = s.scheme_id), '[]'::json) AS rules
    FROM govt_schemes s ORDER BY s.created_at DESC, s.scheme_name`);
  res.json({ schemes: result.rows });
}));
async function saveScheme(req, res) {
  const { rules, ...scheme } = validate.scheme(req.body);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const fields = Object.keys(scheme);
    const values = Object.values(scheme);
    let id;
    if (req.params.id) {
      const result = await client.query(`UPDATE govt_schemes SET ${fields.map((key, i) => `${key} = $${i + 1}`).join(', ')}
        WHERE scheme_id = $${values.length + 1} RETURNING scheme_id`, [...values, req.params.id]);
      if (!result.rowCount) { const error = new Error('Scheme not found.'); error.status = 404; throw error; }
      id = result.rows[0].scheme_id;
      await client.query('DELETE FROM eligibility_rules WHERE scheme_id = $1', [id]);
    } else {
      const result = await client.query(`INSERT INTO govt_schemes (${fields.join(', ')}) VALUES (${values.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING scheme_id`, values);
      id = result.rows[0].scheme_id;
    }
    for (const rule of rules) {
      const keys = Object.keys(rule);
      await client.query(`INSERT INTO eligibility_rules(scheme_id, ${keys.join(', ')}) VALUES ($1, ${keys.map((_, i) => `$${i + 2}`).join(', ')})`, [id, ...Object.values(rule)]);
    }
    await client.query('COMMIT');
    res.status(req.params.id ? 200 : 201).json({ scheme_id: id });
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
router.post('/schemes', wrap(saveScheme));
router.put('/schemes/:id', wrap(saveScheme));
router.delete('/schemes/:id', wrap(async (req, res) => {
  const result = await query('DELETE FROM govt_schemes WHERE scheme_id = $1 RETURNING scheme_id', [req.params.id]);
  if (!result.rowCount) return res.status(404).json({ message: 'Scheme not found.' });
  res.json({ status: 'success' });
}));
router.get('/service-centers', wrap(async (req, res) => {
  res.json({ service_centers: (await query('SELECT * FROM service_centers ORDER BY name')).rows });
}));
async function saveCenter(req, res) {
  const center = validate.center(req.body);
  const fields = Object.keys(center), values = Object.values(center);
  const result = req.params.id
    ? await query(`UPDATE service_centers SET ${fields.map((key, i) => `${key} = $${i + 1}`).join(', ')} WHERE center_id = $${values.length + 1} RETURNING center_id`, [...values, req.params.id])
    : await query(`INSERT INTO service_centers(${fields.join(', ')}) VALUES (${values.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING center_id`, values);
  if (!result.rowCount) return res.status(404).json({ message: 'Service center not found.' });
  res.status(req.params.id ? 200 : 201).json(result.rows[0]);
}
router.post('/service-centers', wrap(saveCenter));
router.put('/service-centers/:id', wrap(saveCenter));
router.delete('/service-centers/:id', wrap(async (req, res) => {
  const result = await query('DELETE FROM service_centers WHERE center_id = $1 RETURNING center_id', [req.params.id]);
  if (!result.rowCount) return res.status(404).json({ message: 'Service center not found.' });
  res.json({ status: 'success' });
}));
router.use((error, req, res, next) => {
  if (error.code === '23505') return res.status(409).json({ message: 'A scheme with this name already exists.' });
  if (error.status) return res.status(error.status).json({ message: error.message });
  console.error('[Admin operation failed]', error.code || error.message);
  res.status(500).json({ message: 'Unable to complete this operation. Please try again.' });
});
module.exports = router;
