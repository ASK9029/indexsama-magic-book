CREATE TABLE IF NOT EXISTS foods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('g','ml')),
  per100_calories REAL NOT NULL,
  per100_protein REAL NOT NULL,
  serving_name TEXT,
  serving_amount REAL,
  built_in INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS meal_entries (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  meal TEXT NOT NULL CHECK (meal IN ('breakfast','lunch','dinner','snack')),
  kind TEXT NOT NULL CHECK (kind IN ('plan','actual')),
  food_id TEXT,
  food_name TEXT NOT NULL,
  amount REAL NOT NULL,
  unit TEXT NOT NULL,
  serving_label TEXT,
  per100_calories REAL NOT NULL,
  per100_protein REAL NOT NULL,
  calories REAL NOT NULL,
  protein REAL NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS meal_status (
  date TEXT NOT NULL,
  meal TEXT NOT NULL CHECK (meal IN ('breakfast','lunch','dinner','snack')),
  done INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (date, meal)
);

CREATE TABLE IF NOT EXISTS water_logs (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  amount_ml INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_foods_category ON foods(category);
CREATE INDEX IF NOT EXISTS idx_meal_entries_date ON meal_entries(date, meal, kind);
CREATE INDEX IF NOT EXISTS idx_meal_entries_food ON meal_entries(food_id);
CREATE INDEX IF NOT EXISTS idx_water_logs_date ON water_logs(date);
