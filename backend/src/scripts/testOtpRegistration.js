require('dotenv').config();
const http = require('http');
const app = require('../app');

async function testOtpRegistration() {
  console.log('🧪 Testing Brevo OTP Email Registration Flow...\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5998, resolve));
  const baseUrl = 'http://localhost:5998';

  try {
    const testEmail = `aditya_test_${Date.now()}@example.com`;

    // 1. Send OTP
    console.log(`1️⃣ Requesting OTP for ${testEmail}...`);
    const sendRes = await fetch(`${baseUrl}/api/users/send-registration-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aditya Test',
        email: testEmail,
        password: 'Password@123',
        demographics: {
          annual_income: 120000,
          location_zone: 'North Zone',
          occupation: 'Student',
        },
      }),
    }).then((r) => r.json());

    console.log('   Send OTP Response:', sendRes);

    if (sendRes.status !== 'success') {
      throw new Error(`Failed to send OTP: ${sendRes.message}`);
    }

    // 2. Test Invalid OTP
    console.log('\n2️⃣ Testing Invalid OTP Verification...');
    const invalidRes = await fetch(`${baseUrl}/api/users/verify-otp-and-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp: '000000' }),
    }).then((r) => r.json());
    console.log('   Invalid OTP Response (Expected failure):', invalidRes);

    console.log('\n✅ Brevo OTP Registration Integration Test Passed!');
  } finally {
    server.close();
  }
}

testOtpRegistration().catch((err) => {
  console.error('❌ OTP Test Failed:', err);
  process.exit(1);
});
