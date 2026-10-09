import axios from 'axios';

const adminClient = axios.create({ baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin`, timeout: 15000 });
adminClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('civic_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
adminClient.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401 && error.config?.url !== '/login') {
    sessionStorage.removeItem('civic_admin_token');
    window.dispatchEvent(new Event('admin-session-expired'));
  }
  return Promise.reject(error);
});
export default adminClient;
