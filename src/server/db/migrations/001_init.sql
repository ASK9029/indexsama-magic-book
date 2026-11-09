CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO settings(key, value) VALUES
  ('theme', '"light"'),
  ('weekStart', '1'),
  ('weightUnit', '"kg"'),
  ('calorieTarget', 'null'),
  ('proteinTarget', 'null'),
  ('waterTarget', 'null'),
  ('lastBackupAt', 'null'),
  ('appVersion', '"1.0.0"');
