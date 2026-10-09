const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const {
  sendRegistrationOtp,
  verifyOtpAndRegister,
  login,
  getProfile,
  updateProfile,
} = require('../controllers/userController');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Authentication and Authorization Middleware for Citizen Profile Operations
 * Derives identity strictly from cryptographically verified JWT.
 * Allows access if:
 * 1. Authenticated user matches req.params.userId, OR
 * 2. Authenticated user is an authorized administrator (claims.adminId or claims.role === 'admin')
 */
function requireAuth(req, res, next) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return res.status(500).json({ status: 'error', message: 'JWT authentication is not configured on server.' });
  }

  try {
    const authHeader = req.headers.authorization || '';
    const match = /^Bearer (.+)$/i.exec(authHeader);
    if (!match) {
      return res.status(401).json({ status: 'error', message: 'Authentication required. Please sign in.' });
    }

    const token = match[1];
    let claims;
    try {
      // First try standard user audience/algorithms, or admin audience if admin token
      claims = jwt.verify(token, jwtSecret);
    } catch (verifyErr) {
      // Try with admin audience if standard verify failed due to audience
      try {
        claims = jwt.verify(token, jwtSecret, { audience: 'civichelper-admin' });
      } catch (adminVerifyErr) {
        throw verifyErr;
      }
    }

    const targetUserId = req.params.userId;
    if (targetUserId && !UUID_REGEX.test(targetUserId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid user ID format.' });
    }

    const isAdmin = Boolean(claims.adminId || claims.role === 'admin');
    const isOwner = Boolean(claims.userId && targetUserId && String(claims.userId) === String(targetUserId));

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized access to this profile.' });
    }

    req.userId = claims.userId || targetUserId;
    req.user = claims;
    req.isAdmin = isAdmin;
    next();
  } catch (err) {
    return res.status(401).json({ status: 'error', message: 'Invalid or expired session. Please sign in again.' });
  }
}

// -----------------------------------------------------------------------------
// Active Secure Registration Flow (OTP Email Verification via Brevo)
// -----------------------------------------------------------------------------
router.post('/send-registration-otp', sendRegistrationOtp);
router.post('/verify-otp-and-register', verifyOtpAndRegister);

// -----------------------------------------------------------------------------
// Legacy Registration Protection (Blocked to prevent OTP bypass)
// -----------------------------------------------------------------------------
router.post('/register', (req, res) => {
  return res.status(403).json({
    status: 'error',
    message: 'Direct registration is disabled. Please register using OTP verification via /api/users/send-registration-otp and /api/users/verify-otp-and-register.',
  });
});

// -----------------------------------------------------------------------------
// Citizen Authentication & Profile Routes
// -----------------------------------------------------------------------------
router.post('/login', login);
router.get('/profile/:userId', requireAuth, getProfile);
router.put('/profile/:userId', requireAuth, updateProfile);

router.requireAuth = requireAuth;
module.exports = router;
