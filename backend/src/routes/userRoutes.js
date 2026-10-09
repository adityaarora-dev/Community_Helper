const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const {
  sendRegistrationOtp,
  verifyOtpAndRegister,
  register,
  login,
  getProfile,
  updateProfile,
} = require('../controllers/userController');

const JWT_SECRET = process.env.JWT_SECRET || 'civic-community-helper-secret-key-2026';

function requireAuth(req, res, next) {
  try {
    const token = /^Bearer (.+)$/.exec(req.headers.authorization || '')?.[1];
    if (!token) {
      return res.status(401).json({ status: 'error', message: 'Authentication required. Please sign in.' });
    }
    const claims = jwt.verify(token, JWT_SECRET);
    if (!claims.userId) {
      return res.status(401).json({ status: 'error', message: 'Invalid authentication token.' });
    }
    if (req.params.userId && String(req.params.userId) !== String(claims.userId)) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized access to this profile.' });
    }
    req.userId = claims.userId;
    req.user = claims;
    next();
  } catch (err) {
    return res.status(401).json({ status: 'error', message: 'Invalid or expired session. Please sign in again.' });
  }
}

// OTP Registration Flow (Brevo Email Verification)
router.post('/send-registration-otp', sendRegistrationOtp);
router.post('/verify-otp-and-register', verifyOtpAndRegister);

// Direct Auth & Profile
router.post('/register', register);
router.post('/login', login);
router.get('/profile/:userId', requireAuth, getProfile);
router.put('/profile/:userId', requireAuth, updateProfile);

module.exports = router;

