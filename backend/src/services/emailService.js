require('dotenv').config();
const nodemailer = require('nodemailer');

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'civic-notifications@example.com';
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'CivicHelper AI Portal';
const SMTP_PORT = parseInt(process.env.BREVO_SMTP_PORT || '2525', 10);

/**
 * Configure Nodemailer with Port 2525 Render Bypass
 * Brevo provides Port 2525 as an alternative SMTP port that Render does NOT block.
 */
const nodemailerTransporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: SMTP_PORT, // Port 2525
  secure: false, // TLS upgraded automatically via STARTTLS
  auth: {
    user: SENDER_EMAIL,
    pass: BREVO_API_KEY,
  },
  connectionTimeout: 10000,
});

/**
 * Send OTP Email via Brevo REST API (HTTPS port 443 - zero firewall blockage)
 * with Nodemailer Port 2525 fallback.
 *
 * @param {string} toEmail - Recipient email
 * @param {string} recipientName - Citizen name
 * @param {string} otp - 6-digit verification code
 */
async function sendOtpEmail(toEmail, recipientName, otp) {
  const subject = `[CivicHelper AI] ${otp} is your verification code`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f17; color: #f1f5f9; padding: 24px; margin: 0; }
        .card { max-width: 520px; margin: 0 auto; background-color: #131826; border: 1px solid #10b98133; border-radius: 20px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
        .header { display: flex; align-items: center; margin-bottom: 24px; border-bottom: 1px solid #1e293b; padding-bottom: 16px; }
        .logo { font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
        .logo span { color: #10b981; }
        .badge { display: inline-block; background-color: #10b9811a; border: 1px solid #10b98140; color: #10b981; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 12px; margin-bottom: 16px; }
        h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 8px; }
        p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 8px 0; }
        .otp-box { background: linear-gradient(135deg, #090d14 0%, #111827 100%); border: 1px solid #10b98140; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #10b981; margin: 0; }
        .expiry { font-size: 12px; color: #f59e0b; margin-top: 8px; font-weight: 600; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #1e293b; font-size: 11px; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="logo">Civic<span>Helper</span> AI</div>
        </div>
        <div class="badge">Official Citizen Verification</div>
        <h1>Verify Your Citizen Account</h1>
        <p>Namaste <strong>${recipientName || 'Citizen'}</strong>,</p>
        <p>Thank you for registering on the Intelligent Community Resource Portal. Please use the one-time verification code below to verify your email address before creating your account credentials in our database:</p>
        
        <div class="otp-box">
          <p class="otp-code">${otp}</p>
          <div class="expiry">⏱️ Valid for 10 minutes only</div>
        </div>

        <p>If you did not request this verification code, please ignore this email. Do not share this OTP with anyone for your privacy and safety.</p>

        <div class="footer">
          <p>CivicHelper AI &bull; Intelligent Community Resource & Welfare Matcher</p>
          <p>Powered by Supabase PostgreSQL (5432) & Brevo Transactional Email Engine</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Method 1: Send via Brevo REST API v3 (Direct HTTPS 443 - zero SMTP port blockage)
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: toEmail, name: recipientName || 'Citizen' }],
        subject,
        htmlContent,
      }),
    });

    const data = await res.json();
    if (res.ok && data.messageId) {
      console.log(`📧 [Brevo REST Email Success] OTP sent to ${toEmail}. Message ID: ${data.messageId}`);
      return { success: true, method: 'brevo_rest', messageId: data.messageId };
    }

    console.warn('⚠️ [Brevo REST Notice] REST returned unexpected body, attempting Nodemailer port 2525:', data);
  } catch (restErr) {
    console.warn('⚠️ [Brevo REST Warning] REST call failed, attempting Nodemailer port 2525:', restErr.message);
  }

  // Method 2: Nodemailer fallback using Brevo SMTP Port 2525 (Render Firewall Bypass)
  try {
    const info = await nodemailerTransporter.sendMail({
      from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
      to: toEmail,
      subject,
      html: htmlContent,
    });
    console.log(`📧 [Nodemailer Port 2525 Success] OTP sent to ${toEmail}. Message ID: ${info.messageId}`);
    return { success: true, method: 'nodemailer_port_2525', messageId: info.messageId };
  } catch (smtpErr) {
    console.error('❌ [Email Delivery Error] Both Brevo REST and SMTP Port 2525 failed:', smtpErr.message);
    throw new Error(`Failed to deliver OTP email to ${toEmail}: ${smtpErr.message}`);
  }
}

/**
 * Send Scheme Notification Email to citizen residing in the matching location zone
 * via Brevo REST API v3 with Nodemailer Port 2525 fallback.
 *
 * @param {Object} params
 * @param {string} params.toEmail - Recipient email
 * @param {string} params.recipientName - Citizen name
 * @param {Object} params.scheme - Scheme details
 */
async function sendSchemeNotificationEmail({ toEmail, recipientName, scheme }) {
  const zoneName = scheme.location_zone || 'Your Zone';
  const benefitFormatted = Number(scheme.total_benefit_value || 0).toLocaleString('en-IN');
  const subject = `[CivicHelper Alert] New Welfare Scheme in ${zoneName}: ${scheme.scheme_name}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f17; color: #f1f5f9; padding: 24px; margin: 0; }
        .card { max-width: 560px; margin: 0 auto; background-color: #131826; border: 1px solid #10b98133; border-radius: 20px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
        .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; border-bottom: 1px solid #1e293b; padding-bottom: 16px; }
        .logo { font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
        .logo span { color: #10b981; }
        .badge { display: inline-block; background-color: #10b9811a; border: 1px solid #10b98140; color: #10b981; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 12px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
        .category-tag { display: inline-block; background-color: #3b82f61a; border: 1px solid #3b82f640; color: #60a5fa; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px; margin-left: 8px; }
        h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 8px; line-height: 1.3; }
        p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 8px 0; }
        .highlight-box { background: linear-gradient(135deg, #090d14 0%, #111827 100%); border: 1px solid #10b98140; border-radius: 16px; padding: 20px; margin: 24px 0; }
        .benefit-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 700; margin-bottom: 4px; }
        .benefit-val { font-size: 28px; font-weight: 800; color: #10b981; margin: 0 0 12px 0; }
        .section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.8px; color: #cbd5e1; font-weight: 700; margin-top: 16px; margin-bottom: 4px; }
        .desc-text { font-size: 13px; color: #94a3b8; line-height: 1.5; margin: 0; }
        .docs-box { background-color: #1e293b40; border: 1px solid #334155; border-radius: 8px; padding: 12px; margin-top: 16px; }
        .docs-text { font-size: 12px; color: #cbd5e1; margin: 0; }
        .btn { display: inline-block; background-color: #10b981; color: #041f18; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 10px; text-decoration: none; margin-top: 24px; text-align: center; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #1e293b; font-size: 11px; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="logo">Civic<span>Helper</span> AI</div>
        </div>
        <div>
          <span class="badge">📍 ${zoneName}</span>
          ${scheme.category ? `<span class="category-tag">${scheme.category}</span>` : ''}
        </div>
        <h1>${scheme.scheme_name}</h1>
        <p>Namaste <strong>${recipientName || 'Citizen'}</strong>,</p>
        <p>A new government welfare initiative has just been published matching your registered residential zone (<strong>${zoneName}</strong>).</p>
        
        <div class="highlight-box">
          <div class="benefit-label">Total Benefit Value</div>
          <div class="benefit-val">₹${benefitFormatted}</div>
          
          <div class="section-title">Overview</div>
          <p class="desc-text">${scheme.description || 'No detailed description provided.'}</p>
          
          ${scheme.required_documents ? `
            <div class="docs-box">
              <div class="section-title" style="margin-top:0;">Required Documents</div>
              <p class="docs-text">${scheme.required_documents}</p>
            </div>
          ` : ''}
        </div>

        ${scheme.official_url ? `
          <div style="text-align: center;">
            <a href="${scheme.official_url}" class="btn" target="_blank" rel="noopener noreferrer">View Official Portal & Apply</a>
          </div>
        ` : ''}

        <div class="footer">
          <p>You received this automated notification because your CivicHelper citizen profile is registered in <strong>${zoneName}</strong>.</p>
          <p>CivicHelper AI &bull; Intelligent Community Resource & Welfare Matcher</p>
          <p>Powered by Supabase PostgreSQL (5432) & Brevo Transactional Email Engine</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Method 1: Send via Brevo REST API v3 (Direct HTTPS 443)
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: toEmail, name: recipientName || 'Citizen' }],
        subject,
        htmlContent,
      }),
    });

    const data = await res.json();
    if (res.ok && data.messageId) {
      console.log(`📧 [Brevo REST Email Success] Scheme alert sent to ${toEmail}. Message ID: ${data.messageId}`);
      return { success: true, method: 'brevo_rest', messageId: data.messageId };
    }

    console.warn('⚠️ [Brevo REST Notice] REST returned unexpected body, attempting Nodemailer port 2525:', data);
  } catch (restErr) {
    console.warn('⚠️ [Brevo REST Warning] REST call failed, attempting Nodemailer port 2525:', restErr.message);
  }

  // Method 2: Nodemailer fallback using Brevo SMTP Port 2525
  try {
    const info = await nodemailerTransporter.sendMail({
      from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
      to: toEmail,
      subject,
      html: htmlContent,
    });
    console.log(`📧 [Nodemailer Port 2525 Success] Scheme alert sent to ${toEmail}. Message ID: ${info.messageId}`);
    return { success: true, method: 'nodemailer_port_2525', messageId: info.messageId };
  } catch (smtpErr) {
    console.error('❌ [Email Delivery Error] Both Brevo REST and SMTP Port 2525 failed:', smtpErr.message);
    throw new Error(`Failed to deliver scheme notification email to ${toEmail}: ${smtpErr.message}`);
  }
}

module.exports = {
  sendOtpEmail,
  sendSchemeNotificationEmail,
};

