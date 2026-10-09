const express = require('express');
const router = express.Router();
const {
  sendRegistrationOtp,
  verifyOtpAndRegister,
  register,
  login,
  getProfile,
  updateProfile,
} = require('../controllers/userController');

// OTP Registration Flow (Brevo Email Verification)
router.post('/send-registration-otp', sendRegistrationOtp);
router.post('/verify-otp-and-register', verifyOtpAndRegister);

// Direct Auth & Profile
router.post('/register', register);
router.post('/login', login);
router.get('/profile/:userId', getProfile);
router.put('/profile/:userId', updateProfile);

module.exports = router;
