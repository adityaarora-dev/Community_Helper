require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');

async function seedUsers() {
  console.log('🌱 Seeding demo citizen accounts into Supabase PostgreSQL...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Citizen@123', salt);

  // Dummy Citizen 1: Ramesh Kumar (Farmer, North Zone)
  const user1 = `
    INSERT INTO users (name, email, password_hash, annual_income, family_size, location_zone, age, gender, occupation, social_category, disability_status, landholding_acres)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    ON CONFLICT (email) DO UPDATE SET 
      password_hash = EXCLUDED.password_hash,
      annual_income = EXCLUDED.annual_income,
      occupation = EXCLUDED.occupation
    RETURNING user_id, name, email;
  `;
  const res1 = await query(user1, [
    'Ramesh Kumar',
    'citizen@example.com',
    passwordHash,
    180000,
    3,
    'North Zone',
    32,
    'Male',
    'Farmer',
    'OBC',
    false,
    2.0,
  ]);
  console.log(`✅ Citizen 1: ${res1.rows[0]?.email} (ID: ${res1.rows[0]?.user_id})`);

  // Dummy Citizen 2: Sunita Devi (Street Vendor, Central Zone)
  const user2 = `
    INSERT INTO users (name, email, password_hash, annual_income, family_size, location_zone, age, gender, occupation, social_category, disability_status, landholding_acres)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    ON CONFLICT (email) DO UPDATE SET 
      password_hash = EXCLUDED.password_hash,
      annual_income = EXCLUDED.annual_income,
      occupation = EXCLUDED.occupation
    RETURNING user_id, name, email;
  `;
  const res2 = await query(user2, [
    'Sunita Devi',
    'vendor@example.com',
    passwordHash,
    120000,
    4,
    'Central Zone',
    40,
    'Female',
    'Street Vendor',
    'General',
    false,
    0.0,
  ]);
  console.log(`✅ Citizen 2: ${res2.rows[0]?.email} (ID: ${res2.rows[0]?.user_id})`);

  console.log('\n🔑 Demo Credentials:');
  console.log('   Email: citizen@example.com | Password: Citizen@123');
  console.log('   Email: vendor@example.com  | Password: Citizen@123\n');
  process.exit(0);
}

seedUsers().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
