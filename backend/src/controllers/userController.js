const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { sendOtpEmail } = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'civic-community-helper-secret-key-2026';

// In-memory store for pending OTP registrations (keyed by email)
// Stored for 10 minutes
const pendingRegistrations = new Map();

/**
 * Send OTP to user's registered email before creating account
 * POST /api/users/send-registration-otp
 */
async function sendRegistrationOtp(req, res) {
  try {
    const { name, email, password, demographics = {} } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, email, and password are required.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if citizen account already exists in DB
    const existing = await query('SELECT user_id FROM users WHERE email = $1;', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'A citizen account with this email already exists. Please sign in instead.',
      });
    }

    // Generate 6-digit cryptographic-quality OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store in pending cache
    pendingRegistrations.set(cleanEmail, {
      name: name.trim(),
      email: cleanEmail,
      password,
      demographics,
      otp,
      expiresAt,
    });

    // Deliver OTP via Brevo
    await sendOtpEmail(cleanEmail, name.trim(), otp);

    return res.status(200).json({
      status: 'success',
      message: `Verification OTP sent to ${cleanEmail}. Valid for 10 minutes.`,
      email: cleanEmail,
    });
  } catch (error) {
    console.error('❌ [Send OTP Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to send OTP verification email.',
      error: error.message,
    });
  }
}

/**
 * Verify OTP and insert verified credentials into Supabase PostgreSQL
 * POST /api/users/verify-otp-and-register
 */
async function verifyOtpAndRegister(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and 6-digit OTP code are required.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const pending = pendingRegistrations.get(cleanEmail);

    if (!pending) {
      return res.status(400).json({
        status: 'error',
        message: 'No pending registration request found for this email. Please request a new OTP.',
      });
    }

    if (Date.now() > pending.expiresAt) {
      pendingRegistrations.delete(cleanEmail);
      return res.status(400).json({
        status: 'error',
        message: 'Verification OTP has expired. Please request a new OTP.',
      });
    }

    if (pending.otp !== otp.toString().trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid verification OTP. Please enter the correct code sent to your email.',
      });
    }

    // OTP Verified! Now hash password and insert credentials into database
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(pending.password, salt);

    const insertSql = `
      INSERT INTO users (
        name,
        email,
        password_hash,
        annual_income,
        family_size,
        location_zone,
        age,
        gender,
        occupation,
        social_category,
        disability_status,
        landholding_acres
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING user_id, name, email, annual_income, family_size, location_zone, age, gender, occupation, social_category, disability_status, landholding_acres, created_at;
    `;

    const demo = pending.demographics || {};
    const values = [
      pending.name,
      cleanEmail,
      passwordHash,
      demo.annual_income || null,
      demo.family_size || 1,
      demo.location_zone || null,
      demo.age || null,
      demo.gender || null,
      demo.occupation || null,
      demo.social_category || null,
      Boolean(demo.disability_status),
      demo.landholding_acres || 0,
    ];

    const result = await query(insertSql, values);
    const user = result.rows[0];

    // Clean up pending registration
    pendingRegistrations.delete(cleanEmail);

    // Issue JWT Token
    const token = jwt.sign({ userId: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    console.log(`✅ [Citizen Created in DB] ${user.name} (${user.email}) verified and saved.`);

    return res.status(201).json({
      status: 'success',
      message: 'Citizen account verified and registered successfully!',
      token,
      user,
    });
  } catch (error) {
    console.error('❌ [Verify OTP & Register Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to complete citizen registration.',
      error: error.message,
    });
  }
}

/**
 * Register a new citizen (direct endpoint for testing/automated suites)
 * POST /api/users/register
 */
async function register(req, res) {
  try {
    const { name, email, password, demographics = {} } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, email, and password are required for registration.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await query('SELECT user_id FROM users WHERE email = $1;', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'A citizen account with this email already exists.',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const insertSql = `
      INSERT INTO users (
        name,
        email,
        password_hash,
        annual_income,
        family_size,
        location_zone,
        age,
        gender,
        occupation,
        social_category,
        disability_status,
        landholding_acres
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING user_id, name, email, annual_income, family_size, location_zone, age, gender, occupation, social_category, disability_status, landholding_acres, created_at;
    `;

    const values = [
      name.trim(),
      cleanEmail,
      passwordHash,
      demographics.annual_income || null,
      demographics.family_size || 1,
      demographics.location_zone || null,
      demographics.age || null,
      demographics.gender || null,
      demographics.occupation || null,
      demographics.social_category || null,
      Boolean(demographics.disability_status),
      demographics.landholding_acres || 0,
    ];

    const result = await query(insertSql, values);
    const user = result.rows[0];

    // Generate JWT
    const token = jwt.sign({ userId: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      status: 'success',
      message: 'Citizen account registered successfully!',
      token,
      user,
    });
  } catch (error) {
    console.error('❌ [User Register Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to register citizen account.',
      error: error.message,
    });
  }
}

/**
 * Login citizen
 * POST /api/users/login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required.',
      });
    }

    const result = await query(
      `SELECT user_id, name, email, password_hash, annual_income, family_size, location_zone, age, gender, occupation, social_category, disability_status, landholding_acres
       FROM users 
       WHERE email = $1;`,
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.',
      });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.',
      });
    }

    delete user.password_hash;

    const token = jwt.sign({ userId: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      status: 'success',
      message: 'Authentication successful!',
      token,
      user,
    });
  } catch (error) {
    console.error('❌ [User Login Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to authenticate user.',
      error: error.message,
    });
  }
}

/**
 * Get profile
 * GET /api/users/profile/:userId
 */
async function getProfile(req, res) {
  try {
    const { userId } = req.params;
    const result = await query(
      `SELECT user_id, name, email, annual_income, family_size, location_zone, age, gender, occupation, social_category, disability_status, landholding_acres, created_at
       FROM users 
       WHERE user_id = $1;`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }

    return res.status(200).json({
      status: 'success',
      user: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', error: error.message });
  }
}

/**
 * Update demographic profile
 * PUT /api/users/profile/:userId
 */
async function updateProfile(req, res) {
  try {
    const { userId } = req.params;
    const {
      name,
      annual_income,
      family_size,
      location_zone,
      age,
      gender,
      occupation,
      social_category,
      disability_status,
      landholding_acres,
    } = req.body;

    const updateSql = `
      UPDATE users
      SET
        name = COALESCE($1, name),
        annual_income = COALESCE($2, annual_income),
        family_size = COALESCE($3, family_size),
        location_zone = COALESCE($4, location_zone),
        age = COALESCE($5, age),
        gender = COALESCE($6, gender),
        occupation = COALESCE($7, occupation),
        social_category = COALESCE($8, social_category),
        disability_status = COALESCE($9, disability_status),
        landholding_acres = COALESCE($10, landholding_acres)
      WHERE user_id = $11
      RETURNING user_id, name, email, annual_income, family_size, location_zone, age, gender, occupation, social_category, disability_status, landholding_acres, created_at;
    `;

    const values = [
      name || null,
      annual_income !== undefined ? Number(annual_income) : null,
      family_size !== undefined ? parseInt(family_size, 10) : null,
      location_zone || null,
      age !== undefined ? parseInt(age, 10) : null,
      gender || null,
      occupation || null,
      social_category || null,
      disability_status !== undefined ? Boolean(disability_status) : null,
      landholding_acres !== undefined ? Number(landholding_acres) : null,
      userId,
    ];

    const result = await query(updateSql, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Citizen profile updated successfully!',
      user: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', error: error.message });
  }
}

module.exports = {
  sendRegistrationOtp,
  verifyOtpAndRegister,
  register,
  login,
  getProfile,
  updateProfile,
};
