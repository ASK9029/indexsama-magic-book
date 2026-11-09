CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  equipment TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('weight','bodyweight')),
  notes TEXT NOT NULL DEFAULT '',
  built_in INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS training_plan_days (
  weekday INTEGER PRIMARY KEY CHECK (weekday BETWEEN 1 AND 7),
  name TEXT NOT NULL DEFAULT '',
  is_rest INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS training_plan_exercises (
  id TEXT PRIMARY KEY,
  weekday INTEGER NOT NULL REFERENCES training_plan_days(weekday) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  target_sets INTEGER NOT NULL,
  target_reps TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','completed')),
  start_at TEXT NOT NULL,
  end_at TEXT,
  duration_minutes INTEGER,
  note TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS workout_sets (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id TEXT REFERENCES exercises(id) ON DELETE SET NULL,
  exercise_name TEXT NOT NULL,
  set_no INTEGER NOT NULL,
  weight_kg REAL,
  reps INTEGER NOT NULL,
  done INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS exercise_upgrades (
  id TEXT PRIMARY KEY,
  exercise_id TEXT REFERENCES exercises(id) ON DELETE SET NULL,
  exercise_name TEXT NOT NULL,
  date TEXT NOT NULL,
  from_weight_kg REAL NOT NULL,
  to_weight_kg REAL NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS weight_logs (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  weight_kg REAL NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_exercises_group ON exercises(muscle_group);
CREATE INDEX IF NOT EXISTS idx_plan_exercises_weekday ON training_plan_exercises(weekday, sort_order);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON workout_sessions(date);
CREATE INDEX IF NOT EXISTS idx_workout_sets_session ON workout_sets(session_id, set_no);
CREATE INDEX IF NOT EXISTS idx_upgrades_exercise ON exercise_upgrades(exercise_id, date);
CREATE INDEX IF NOT EXISTS idx_weight_logs_date ON weight_logs(date);

INSERT OR IGNORE INTO training_plan_days(weekday, name, is_rest) VALUES
  (1, '', 1),
  (2, '', 1),
  (3, '', 1),
  (4, '', 1),
  (5, '', 1),
  (6, '', 1),
  (7, '', 1);
