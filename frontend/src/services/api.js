import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

export async function getNotifications() {
  return (await client.get('/api/notifications')).data;
}

export async function markNotificationRead(id) {
  return (await client.patch(`/api/notifications/${id}/read`)).data;
}

// Attach JWT token to requests if present in localStorage
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('civic_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Health Check API
 */
export async function checkHealth() {
  const response = await client.get('/health');
  return response.data;
}

/**
 * Send Conversational Query or Structured Demographics to LLM & Relational Matching Engine
 * @param {Object} payload - { query?: string, history?: Array, demographics?: Object, userId?: string }
 */
export async function sendChatMessage(payload) {
  const response = await client.post('/api/chat', payload);
  return response.data;
}

/**
 * Send Verification OTP via Brevo to citizen email before creating account
 * @param {Object} data - { name, email, password, demographics?: Object }
 */
export async function sendRegistrationOtp(data) {
  const response = await client.post('/api/users/send-registration-otp', data);
  return response.data;
}

/**
 * Verify OTP and persist citizen credentials into Supabase PostgreSQL
 * @param {Object} data - { email, otp }
 */
export async function verifyOtpAndRegister(data) {
  const response = await client.post('/api/users/verify-otp-and-register', data);
  return response.data;
}

/**
 * User Authentication - Register (Direct fallback)
 * @param {Object} data - { name, email, password, demographics?: Object }
 */
export async function registerUser(data) {
  const response = await client.post('/api/users/register', data);
  return response.data;
}

/**
 * User Authentication - Login
 * @param {Object} data - { email, password }
 */
export async function loginUser(data) {
  const response = await client.post('/api/users/login', data);
  return response.data;
}

/**
 * Get Citizen Profile
 * @param {string} userId
 */
export async function getUserProfile(userId) {
  const response = await client.get(`/api/users/profile/${userId}`);
  return response.data;
}

/**
 * Update Citizen Demographic Profile
 * @param {string} userId
 * @param {Object} data - Demographic fields
 */
export async function updateUserProfile(userId, data) {
  const response = await client.put(`/api/users/profile/${userId}`, data);
  return response.data;
}

/**
 * Get All Government Welfare Schemes Catalog
 */
export async function getAllSchemes() {
  const response = await client.get('/api/schemes');
  return response.data;
}

/**
 * Get Single Scheme Details
 * @param {string} schemeId
 */
export async function getSchemeById(schemeId) {
  const response = await client.get(`/api/schemes/${schemeId}`);
  return response.data;
}

/**
 * Get Facilitation Service Centers
 * @param {string} [zone]
 */
export async function getServiceCenters(zone) {
  const params = zone && zone !== 'All Zones' ? { zone } : {};
  const response = await client.get('/api/service-centers', { params });
  return response.data;
}
