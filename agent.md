# Architecture & Technical Reference

## Architecture Overview
* **Backend**: Express.js with `pg.Pool` querying remote Supabase PostgreSQL.
* **Frontend**: React (Vite) monitoring dashboard showing connection health and pool metrics.

---

## Core Constraints

| Constraint | Value | Rationale |
|---|---|---|
| **Host & Port** | `*.pooler.supabase.com:5432` | IPv4 Session Pooler avoids mobile Wi-Fi IPv6 disconnects. |
| **SSL** | `ssl: { rejectUnauthorized: false }` | Required for Supabase cloud connections from local environments. |
| **Pool Limits** | `max: 10`, `idleTimeoutMillis: 30000` | Prevents connection exhaustion in serverless/free tiers. |
| **Error Trap** | `pool.on('error', ...)` | Prevents idle client drops from crashing the Node.js process. |
| **Query Helper**| `query(text, params)` | Direct export in `src/config/db.js` for clean controller code. |

---

## Usage in Code

```javascript
const { query } = require('../config/db');

// Run query without manual client management
const { rows } = await query('SELECT * FROM my_table WHERE id = $1', [id]);
```

---

## Service Endpoints
* **Backend**: `http://localhost:5000`
* **Health Check**: `http://localhost:5000/health`
* **Frontend**: `http://localhost:3000`
