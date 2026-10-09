const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const audience = 'civichelper-citizen-session';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function issueSession(user) {
  await query('DELETE FROM citizen_sessions WHERE expires_at <= NOW() OR last_active_at <= NOW() - INTERVAL \'15 minutes\'');
  const result = await query('INSERT INTO citizen_sessions(user_id) VALUES ($1) RETURNING session_id', [user.user_id]);
  return jwt.sign({ userId: user.user_id, sessionId: result.rows[0].session_id }, process.env.JWT_SECRET,
    { audience, algorithm: 'HS256', expiresIn: '8h' });
}
async function requireCitizen(req, res, next) {
  let claims;
  try {
    claims = jwt.verify(/^Bearer (.+)$/i.exec(req.headers.authorization || '')?.[1], process.env.JWT_SECRET, { audience, algorithms: ['HS256'] });
    if (!uuid.test(claims.userId) || !uuid.test(claims.sessionId)) throw new Error('Invalid session');
  } catch { return res.status(401).json({ message: 'Please sign in again.' }); }
  try {
    const activeRequest = req.method !== 'GET' || req.path === '/session';
    const result = await query(`UPDATE citizen_sessions
      SET last_active_at = CASE WHEN $3 THEN NOW() ELSE last_active_at END
      WHERE session_id = $1 AND user_id = $2 AND expires_at > NOW()
      AND last_active_at > NOW() - INTERVAL '15 minutes' RETURNING session_id`,
    [claims.sessionId, claims.userId, activeRequest]);
    if (!result.rowCount) return res.status(401).json({ message: 'Your session has ended. Please sign in again.' });
    req.userId = claims.userId; req.sessionId = claims.sessionId; next();
  } catch (error) { next(error); }
}
module.exports = { issueSession, requireCitizen };
