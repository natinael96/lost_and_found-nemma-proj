CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('lost', 'found')),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  color TEXT,
  location TEXT NOT NULL,
  event_date TEXT NOT NULL,
  event_time TEXT,
  brand TEXT,
  description TEXT,
  distinguishing_features TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'claimed', 'closed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS dismissed_matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lost_report_id INTEGER NOT NULL,
  found_report_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(lost_report_id, found_report_id),
  FOREIGN KEY (lost_report_id) REFERENCES reports(id) ON DELETE CASCADE,
  FOREIGN KEY (found_report_id) REFERENCES reports(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reports_type_status ON reports(type, status);
CREATE INDEX IF NOT EXISTS idx_reports_event_date ON reports(event_date);
CREATE INDEX IF NOT EXISTS idx_dismissed_pairs ON dismissed_matches(lost_report_id, found_report_id);
