const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function setup() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET must be configured.');
  await pool.query(fs.readFileSync(path.join(__dirname, '../db/admin.sql'), 'utf8'));
  const email = (process.env.ADMIN_EMAIL || 'admin@civichelper.local').trim().toLowerCase();
  const existing = await pool.query('SELECT admin_id FROM admins WHERE email = $1', [email]);
  if (existing.rowCount) { console.log(`Admin ${email} already exists; its password was not changed.`); return; }
  const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(18).toString('base64url');
  if (password.length < 12) throw new Error('Admin password must have at least 12 characters.');
  await pool.query('INSERT INTO admins(email, password_hash) VALUES ($1, $2)', [email, await bcrypt.hash(password, 12)]);
  console.log(`Admin created.\nEmail: ${email}\nPassword: ${password}\nStore this password securely; only its hash is saved.`);
}
setup().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
