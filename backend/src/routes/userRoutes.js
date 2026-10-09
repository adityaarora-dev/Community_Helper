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

const { query } = require('../config/db');
const { requireCitizen } = require('../services/citizenSession');
function requireAuth(req, res, next) {
  const target = req.params.userId;
  if (!UUID_REGEX.test(target)) return res.status(400).json({ message: 'Invalid user ID.' });
  const token = /^Bearer (.+)$/i.exec(req.headers.authorization || '')?.[1];
  // Decode only to select the verifier; the selected verifier must authenticate it.
  if (jwt.decode(token)?.aud === 'civichelper-admin') {
    return (async () => {
      let claims;
      try {
        claims = jwt.verify(token, process.env.JWT_SECRET, { audience: 'civichelper-admin', algorithms: ['HS256'] });
        if (!UUID_REGEX.test(claims.adminId) || !UUID_REGEX.test(claims.sessionId)) throw new Error('Invalid session');
      } catch { return res.status(401).json({ message: 'Please sign in again.' }); }
      try {
        const result = await query('SELECT session_id FROM admin_sessions WHERE admin_id = $1 AND session_id = $2 AND expires_at > NOW()', [claims.adminId, claims.sessionId]);
        if (!result.rowCount) return res.status(401).json({ message: 'Admin session has ended.' });
        req.userId = target; req.isAdmin = true; next();
      } catch (error) { next(error); }
    })();
  }
  return requireCitizen(req, res, (error) => {
    if (error) return next(error);
    if (req.userId !== target) return res.status(403).json({ message: 'Unauthorized access to this profile.' });
    next();
  });
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
router.post('/session', requireCitizen, (req, res) => res.json({ status: 'success' }));
router.post('/logout', requireCitizen, async (req, res, next) => {
  try {
    await query('DELETE FROM citizen_sessions WHERE session_id = $1 AND user_id = $2', [req.sessionId, req.userId]);
    res.json({ status: 'success' });
  } catch (error) { next(error); }
});
router.get('/profile/:userId', requireAuth, getProfile);
router.put('/profile/:userId', requireAuth, updateProfile);

router.requireAuth = requireAuth;
module.exports = router;
