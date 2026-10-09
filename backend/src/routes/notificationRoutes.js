const express = require('express');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const router = express.Router();

// Identity comes only from the signed token, never a client-supplied account ID.
router.use((req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not configured');
    const token = /^Bearer (.+)$/.exec(req.headers.authorization || '')?.[1];
    const claims = jwt.verify(token, process.env.JWT_SECRET);
    if (!claims.userId) throw new Error('Missing account');
    req.userId = claims.userId;
    next();
  } catch {
    res.status(401).json({ message: 'Please sign in to see your notifications.' });
  }
});

router.get('/', async (req, res, next) => {
  try {
    const result = await query(`SELECT n.notification_id, n.scheme_id, n.location_zone,
      n.created_at, n.read_at, s.scheme_name
      FROM scheme_notifications n JOIN govt_schemes s USING (scheme_id)
      WHERE n.user_id = $1 ORDER BY n.created_at DESC, n.notification_id DESC`, [req.userId]);
    res.json({ notifications: result.rows, unreadCount: result.rows.filter((n) => !n.read_at).length });
  } catch (error) { next(error); }
});

router.patch('/:notificationId/read', async (req, res, next) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.notificationId)) {
    return res.status(400).json({ message: 'Invalid notification.' });
  }
  try {
    const result = await query(`UPDATE scheme_notifications SET read_at = COALESCE(read_at, NOW())
      WHERE notification_id = $1 AND user_id = $2 RETURNING notification_id, read_at`, [req.params.notificationId, req.userId]);
    if (!result.rows.length) return res.status(404).json({ message: 'Notification not found.' });
    res.json(result.rows[0]);
  } catch (error) { next(error); }
});
module.exports = router;
