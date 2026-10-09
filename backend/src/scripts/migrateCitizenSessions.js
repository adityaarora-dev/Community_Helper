const fs = require('node:fs');
const path = require('node:path');
const { pool } = require('../config/db');
pool.query(fs.readFileSync(path.join(__dirname, '../db/citizenSessions.sql'), 'utf8'))
  .then(() => console.log('Citizen session storage installed.'))
  .catch((error) => { console.error(error.message); process.exitCode = 1; })
  .finally(() => pool.end());
