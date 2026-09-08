CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  locationId TEXT NOT NULL,
  locationName TEXT,
  density TEXT NOT NULL,
  comment TEXT,
  timestamp TEXT NOT NULL,
  authorId TEXT,
  helpful INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_reports_loc ON reports(locationId);
CREATE INDEX IF NOT EXISTS idx_reports_ts ON reports(timestamp);

CREATE TABLE IF NOT EXISTS corrections (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  correctionType TEXT NOT NULL,
  targetId TEXT NOT NULL,
  targetType TEXT,
  note TEXT,
  timestamp TEXT NOT NULL,
  authorId TEXT
);
CREATE INDEX IF NOT EXISTS idx_corr_target ON corrections(targetId);
CREATE INDEX IF NOT EXISTS idx_corr_ts ON corrections(timestamp);
