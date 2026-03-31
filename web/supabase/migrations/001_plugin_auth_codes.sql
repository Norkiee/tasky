-- Plugin auth codes: temporary storage for plugin OAuth-style login flow
CREATE TABLE IF NOT EXISTS plugin_auth_codes (
  code TEXT PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at BIGINT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-cleanup: delete rows older than 10 minutes
-- Run this as a cron or manually periodically:
-- DELETE FROM plugin_auth_codes WHERE created_at < NOW() - INTERVAL '10 minutes';
