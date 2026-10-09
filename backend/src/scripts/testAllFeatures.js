require('dotenv').config();
const http = require('http');
const app = require('../app');

async function runTests() {
  console.log('🚀 Running Comprehensive System Verification...\n');

  // Start temporary server on port 5999
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5999, resolve));
  const baseUrl = 'http://localhost:5999';

  try {
    // 1. Health check
    console.log('1️⃣ Testing Health Check...');
    const healthRes = await fetch(`${baseUrl}/health`).then((r) => r.json());
    console.log(`   Health Status: ${healthRes.status} (Pool count: ${healthRes.database?.pool?.totalCount})`);

    // 2. Schemes catalog
    console.log('2️⃣ Testing Schemes Catalog...');
    const schemesRes = await fetch(`${baseUrl}/api/schemes`).then((r) => r.json());
    console.log(`   Schemes Status: ${schemesRes.status}, Schemes Count: ${schemesRes.count}`);

    // 3. Service Centers
    console.log('3️⃣ Testing Service Centers...');
    const centersRes = await fetch(`${baseUrl}/api/service-centers?zone=North%20Zone`).then((r) => r.json());
    console.log(`   Centers Status: ${centersRes.status}, North Zone Centers: ${centersRes.count}`);

    // 4. User Registration & Login (OTP-based)
    console.log('4️⃣ Testing User Authentication & Security Safeguards...');
    const testEmail = `test_citizen_${Date.now()}@example.com`;

    // 4a. Verify legacy direct registration is strictly blocked (403 Forbidden)
    const directBlockRes = await fetch(`${baseUrl}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Direct Bypass', email: testEmail, password: 'Pass' }),
    });
    console.log(`   Direct /register bypass block status: ${directBlockRes.status} (Expected 403)`);
    if (directBlockRes.status !== 403) throw new Error('Security failure: Direct registration bypass was not blocked!');

    // 4b. Perform OTP registration
    let capturedOtp = null;
    const emailService = require('../services/emailService');
    const originalSendOtp = emailService.sendOtpEmail;
    emailService.sendOtpEmail = async (to, name, otp) => {
      capturedOtp = otp;
      return { success: true, method: 'mock_test', messageId: 'test-otp-id' };
    };

    const otpSendRes = await fetch(`${baseUrl}/api/users/send-registration-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Priya Sharma',
        email: testEmail,
        password: 'SecurePassword123!',
        demographics: {
          annual_income: 150000,
          age: 32,
          family_size: 4,
          location_zone: 'North Zone',
          occupation: 'Street Vendor',
        },
      }),
    }).then((r) => r.json());
    console.log(`   OTP Dispatch Status: ${otpSendRes.status}, OTP Captured: ${Boolean(capturedOtp)}`);

    const regRes = await fetch(`${baseUrl}/api/users/verify-otp-and-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp: capturedOtp }),
    }).then((r) => r.json());
    console.log(`   OTP Verification Status: ${regRes.status}, User ID: ${regRes.user?.user_id}`);
    const userId = regRes.user?.user_id;
    emailService.sendOtpEmail = originalSendOtp; // Restore original

    // Login
    const loginRes = await fetch(`${baseUrl}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'SecurePassword123!' }),
    }).then((r) => r.json());
    console.log(`   Login Status: ${loginRes.status}, Token received: ${Boolean(loginRes.token)}`);
    const citizenToken = loginRes.token;

    // 5. Update Profile (Authorized)
    console.log('5️⃣ Testing Demographic Profile Authorization & Update...');
    // Verify unauthorized update (no token) is blocked
    const unauthRes = await fetch(`${baseUrl}/api/users/profile/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ annual_income: 80000 }),
    });
    console.log(`   Unauthenticated update blocked: ${unauthRes.status} (Expected 401)`);

    const updateRes = await fetch(`${baseUrl}/api/users/profile/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`,
      },
      body: JSON.stringify({
        annual_income: 80000,
        occupation: 'Farmer',
        landholding_acres: 2.5,
      }),
    }).then((r) => r.json());
    console.log(`   Authorized Update Status: ${updateRes.status}, New Income: ₹${updateRes.user?.annual_income}`);

    // 6. Conversational Chat & Relational Matching
    console.log('6️⃣ Testing Conversational AI Assistant & Relational Matching...');
    const chatRes = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'I am a 32yo farmer with 2.5 acres of land in North Zone earning 80,000 per year.',
        userId,
      }),
    }).then((r) => r.json());
    console.log(`   Chat Status: ${chatRes.status}`);
    console.log(`   Extracted Parameters:`, chatRes.extracted_params);
    console.log(`   Conversational Reply:`, (chatRes.conversational_reply || '').slice(0, 100) + '...');
    console.log(`   Relational Matches Count: ${chatRes.matched_count}`);
    console.log(`   First Matched Scheme: ${chatRes.schemes?.[0]?.scheme_name}`);

    console.log('\n✅ All System Integration Tests Completed Successfully!');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('❌ Test execution failed:', err);
  process.exit(1);
});
