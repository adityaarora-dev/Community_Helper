BEGIN;
ALTER TABLE govt_schemes ADD COLUMN IF NOT EXISTS location_zone VARCHAR(100);

CREATE TABLE IF NOT EXISTS scheme_notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  scheme_id UUID NOT NULL REFERENCES govt_schemes(scheme_id) ON DELETE CASCADE,
  location_zone VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  UNIQUE (user_id, scheme_id)
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON scheme_notifications(user_id, created_at DESC);
-- Access is through the JWT-protected backend, not anonymous Supabase REST calls.
ALTER TABLE scheme_notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_users_notification_zone ON users(lower(trim(location_zone)));

-- Capture recipients when a scheme is added, even if the application is offline.
-- NULL zone means unspecified/national; it does not generate a local-zone alert.
CREATE OR REPLACE FUNCTION notify_new_zone_scheme() RETURNS trigger AS $$
BEGIN
  IF NULLIF(trim(NEW.location_zone), '') IS NOT NULL THEN
    INSERT INTO scheme_notifications(user_id, scheme_id, location_zone)
    SELECT user_id, NEW.scheme_id, trim(NEW.location_zone)
    FROM users
    WHERE lower(trim(location_zone)) = lower(trim(NEW.location_zone))
    ON CONFLICT (user_id, scheme_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER new_zone_scheme_notification
AFTER INSERT ON govt_schemes FOR EACH ROW EXECUTE FUNCTION notify_new_zone_scheme();
COMMIT;
