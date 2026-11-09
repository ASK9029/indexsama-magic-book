import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { Meal, MealEntry, MealState } from '@shared/types';

interface EntryRow {
  id: string;
  date: string;
  meal: string;
  kind: string;
  food_id: string | null;
  food_name: string;
  amount: number;
  unit: string;
  serving_label: string | null;
  per100_calories: number;
  per100_protein: number;
  calories: number;
  protein: number;
  created_at: string;
}

export interface MealEntryInput {
  date: string;
  meal: Meal;
  kind: 'plan' | 'actual';
  foodId: string;
  foodName: string;
  amount: number;
  unit: 'g' | 'ml';
  servingLabel?: string | null;
  per100Calories: number;
  per100Protein: number;
  calories: number;
  protein: number;
}

const SELECT =
  'SELECT id, date, meal, kind, food_id, food_name, amount, unit, serving_label, per100_calories, per100_protein, calories, protein, created_at FROM meal_entries';

function toEntry(row: EntryRow): MealEntry {
  return {
    id: row.id,
    date: row.date,
    meal: row.meal as Meal,
    kind: row.kind as MealEntry['kind'],
    foodId: row.food_id,
    foodName: row.food_name,
    amount: row.amount,
    unit: row.unit as MealEntry['unit'],
    servingLabel: row.serving_label,
    per100Calories: row.per100_calories,
    per100Protein: row.per100_protein,
    calories: row.calories,
    protein: row.protein,
    createdAt: row.created_at,
  };
}

export function listEntries(db: DatabaseSync, date: string): MealEntry[] {
  const rows = db
    .prepare(`${SELECT} WHERE date = ? ORDER BY created_at ASC, rowid ASC`)
    .all(date) as unknown as EntryRow[];
  return rows.map(toEntry);
}

export function getEntry(db: DatabaseSync, id: string): MealEntry | null {
  const row = db.prepare(`${SELECT} WHERE id = ?`).get(id) as unknown as
    | EntryRow
    | undefined;
  return row ? toEntry(row) : null;
}

export function createEntry(
  db: DatabaseSync,
  input: MealEntryInput,
): MealEntry {
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO meal_entries(id, date, meal, kind, food_id, food_name, amount, unit, serving_label, per100_calories, per100_protein, calories, protein, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(
    id,
    input.date,
    input.meal,
    input.kind,
    input.foodId,
    input.foodName,
    input.amount,
    input.unit,
    input.servingLabel ?? null,
    input.per100Calories,
    input.per100Protein,
    input.calories,
    input.protein,
    now,
  );

  return getEntry(db, id)!;
}

export function updateEntry(
  db: DatabaseSync,
  id: string,
  patch: { amount?: number; meal?: Meal },
): MealEntry | null {
  const current = getEntry(db, id);
  if (!current) return null;

  const amount = patch.amount ?? current.amount;
  const meal = patch.meal ?? current.meal;
  const calories = (current.per100Calories * amount) / 100;
  const protein = (current.per100Protein * amount) / 100;

  db.prepare(
    'UPDATE meal_entries SET amount = ?, meal = ?, calories = ?, protein = ? WHERE id = ?',
  ).run(amount, meal, calories, protein, id);

  return getEntry(db, id);
}

export function deleteEntry(db: DatabaseSync, id: string): boolean {
  const result = db.prepare('DELETE FROM meal_entries WHERE id = ?').run(id);
  return Number(result.changes) > 0;
}

export function listMealStatus(
  db: DatabaseSync,
  date: string,
): Map<Meal, boolean> {
  const rows = db
    .prepare('SELECT meal, done FROM meal_status WHERE date = ?')
    .all(date) as unknown as { meal: Meal; done: number }[];
  return new Map(rows.map((row) => [row.meal, row.done === 1]));
}

export function setMealDone(
  db: DatabaseSync,
  date: string,
  meal: Meal,
  done: boolean,
): MealState {
  db.prepare(
    'INSERT INTO meal_status(date, meal, done) VALUES (?, ?, ?) ON CONFLICT(date, meal) DO UPDATE SET done = excluded.done',
  ).run(date, meal, done ? 1 : 0);

  return { date, meal, done };
}

export function clearEntries(
  db: DatabaseSync,
  date: string,
  meal: Meal,
  kind: 'plan' | 'actual',
): number {
  const result = db
    .prepare(
      'DELETE FROM meal_entries WHERE date = ? AND meal = ? AND kind = ?',
    )
    .run(date, meal, kind);
  return Number(result.changes);
}

export function copyPlan(
  db: DatabaseSync,
  date: string,
  meal: Meal,
  mode: 'replace' | 'append',
): MealEntry[] {
  db.exec('BEGIN');
  try {
    if (mode === 'replace') {
      db.prepare(
        "DELETE FROM meal_entries WHERE date = ? AND meal = ? AND kind = 'actual'",
      ).run(date, meal);
    }

    const plan = listEntries(db, date).filter(
      (entry) => entry.meal === meal && entry.kind === 'plan',
    );
    const now = new Date().toISOString();
    const insert = db.prepare(
      'INSERT INTO meal_entries(id, date, meal, kind, food_id, food_name, amount, unit, serving_label, per100_calories, per100_protein, calories, protein, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    );

    for (const entry of plan) {
      insert.run(
        randomUUID(),
        date,
        meal,
        'actual',
        entry.foodId,
        entry.foodName,
        entry.amount,
        entry.unit,
        entry.servingLabel,
        entry.per100Calories,
        entry.per100Protein,
        entry.calories,
        entry.protein,
        now,
      );
    }

    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  return listEntries(db, date).filter(
    (entry) => entry.meal === meal && entry.kind === 'actual',
  );
}
