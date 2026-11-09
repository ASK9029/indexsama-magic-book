CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('work','life','other')),
  priority TEXT NOT NULL CHECK (priority IN ('high','medium','low')),
  time TEXT,
  note TEXT NOT NULL DEFAULT '',
  done INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
