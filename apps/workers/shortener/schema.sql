-- D1 migration for shortener worker
-- wrangler d1 execute shortener-db --file=./schema.sql

CREATE TABLE IF NOT EXISTS links (
  code TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  clicks INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_links_created_at ON links (created_at);
