const fs = require('node:fs');
const path = require('node:path');
const { pool } = require('../config/db');

pool.query(fs.readFileSync(path.join(__dirname, '../db/zoneNotifications.sql'), 'utf8'))
  .then(() => console.log('Zone notifications migration completed. Existing accounts and schemes preserved.'))
  .catch((error) => { console.error('Migration failed:', error.message); process.exitCode = 1; })
  .finally(() => pool.end());
