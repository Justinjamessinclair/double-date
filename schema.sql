-- Double Date D1 Schema

CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  name        TEXT,
  partner_name TEXT,
  couple_name TEXT,
  color       TEXT DEFAULT '#c2714f',
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS magic_tokens (
  token      TEXT PRIMARY KEY,
  email      TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used       INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT REFERENCES users(id),
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS circles (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  color      TEXT DEFAULT '#c2714f',
  created_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS circle_members (
  circle_id TEXT REFERENCES circles(id),
  user_id   TEXT REFERENCES users(id),
  joined_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (circle_id, user_id)
);

CREATE TABLE IF NOT EXISTS circle_invites (
  token      TEXT PRIMARY KEY,
  circle_id  TEXT REFERENCES circles(id),
  created_by TEXT REFERENCES users(id),
  expires_at TEXT NOT NULL,
  used       INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS moments (
  id         TEXT PRIMARY KEY,
  type       TEXT NOT NULL CHECK(type IN ('text','voice','place','photo','prompt')),
  content    TEXT,
  circle_id  TEXT REFERENCES circles(id),
  author_id  TEXT REFERENCES users(id),
  coords     TEXT,
  media_key  TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS prompts (
  id         TEXT PRIMARY KEY,
  week_key   TEXT NOT NULL,
  question   TEXT NOT NULL,
  circle_id  TEXT REFERENCES circles(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS prompt_responses (
  id         TEXT PRIMARY KEY,
  prompt_id  TEXT REFERENCES prompts(id),
  author_id  TEXT REFERENCES users(id),
  type       TEXT NOT NULL,
  content    TEXT,
  media_key  TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_moments_circle_id   ON moments(circle_id);
CREATE INDEX IF NOT EXISTS idx_moments_author_id   ON moments(author_id);
CREATE INDEX IF NOT EXISTS idx_prompt_responses_prompt_id ON prompt_responses(prompt_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_user_id ON circle_members(user_id);
