const { pool } = require('../config/db');
const { centers } = require('../db/delhiServiceCenters.json');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Serialize repeat runs; never overwrite centers edited by an administrator.
    await client.query('LOCK TABLE service_centers IN SHARE ROW EXCLUSIVE MODE');
    let inserted = 0;
    for (const center of centers) {
      const result = await client.query(`INSERT INTO service_centers
        (name, address, location_zone, contact_phone, operating_hours)
        SELECT $1::varchar, $2::text, $3::varchar, $4::varchar, $5::varchar WHERE NOT EXISTS (
          SELECT 1 FROM service_centers WHERE name = $1 AND location_zone = $3
        ) RETURNING center_id`, [center.name, center.address, center.location_zone,
        center.contact_phone, 'Call to confirm visiting hours']);
      inserted += result.rowCount;
    }
    await client.query('COMMIT');
    console.log(`Added ${inserted} real Delhi service centers. ${centers.length - inserted} already present. Existing records preserved.`);
    console.log('Dataset: two centers each for North, South, East, West and Central zones.');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
seed().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
