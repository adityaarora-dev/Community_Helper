// Citizen sessions deliberately live only in this page, never in shared browser storage.
let token = null;
let activity = 0;
export const IDLE_TIMEOUT = 15 * 60 * 1000;
export function clearSession() {
  token = null; activity = 0;
  localStorage.removeItem('civic_auth_token');
  localStorage.removeItem('civic_user');
  sessionStorage.removeItem('civic_auth_token');
  sessionStorage.removeItem('civic_user');
}
export function startSession(value) { clearSession(); token = value; activity = Date.now(); }
export function getSessionToken() {
  if (token && Date.now() - activity >= IDLE_TIMEOUT) {
    clearSession(); window.dispatchEvent(new Event('civic-session-ended'));
  }
  return token;
}
export function touchSession() { if (getSessionToken()) activity = Date.now(); }
