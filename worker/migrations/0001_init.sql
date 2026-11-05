-- Like counts per post path
CREATE TABLE IF NOT EXISTS likes (
  path  TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0
);

-- Per-visitor daily rate limit. ip_hash = SHA-256(salt | ip), never the raw IP.
CREATE TABLE IF NOT EXISTS votes (
  ip_hash TEXT NOT NULL,
  path    TEXT NOT NULL,
  day     TEXT NOT NULL,
  n       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ip_hash, path, day)
);

CREATE INDEX IF NOT EXISTS votes_day ON votes (day);
