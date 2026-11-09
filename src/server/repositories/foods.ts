import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { Food } from '@shared/types';

interface FoodRow {
  id: string;
  name: string;
  category: string;
  unit: string;
  per100_calories: number;
  per100_protein: number;
  serving_name: string | null;
  serving_amount: number | null;
  built_in: number;
}

export interface FoodInput {
  name: string;
  category: string;
  unit: 'g' | 'ml';
  per100Calories: number;
  per100Protein: number;
  servingName?: string | null;
  servingAmount?: number | null;
}

export interface FoodFilters {
  q?: string;
  category?: string;
}

const SELECT =
  'SELECT foods.id, foods.name, foods.category, foods.unit, foods.per100_calories, foods.per100_protein, foods.serving_name, foods.serving_amount, foods.built_in FROM foods';

function toFood(row: FoodRow): Food {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    unit: row.unit as Food['unit'],
    per100Calories: row.per100_calories,
    per100Protein: row.per100_protein,
    servingName: row.serving_name,
    servingAmount: row.serving_amount,
    builtIn: row.built_in === 1,
  };
}

export function listFoods(
  db: DatabaseSync,
  filters: FoodFilters = {},
): Food[] {
  const clauses: string[] = [];
  const params: string[] = [];

  if (filters.q) {
    clauses.push('(name LIKE ? OR category LIKE ?)');
    const like = `%${filters.q}%`;
    params.push(like, like);
  }
  if (filters.category) {
    clauses.push('category = ?');
    params.push(filters.category);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = db
    .prepare(`${SELECT} ${where} ORDER BY category ASC, name ASC`)
    .all(...params) as unknown as FoodRow[];

  return rows.map(toFood);
}

export function getFood(db: DatabaseSync, id: string): Food | null {
  const row = db.prepare(`${SELECT} WHERE id = ?`).get(id) as unknown as
    | FoodRow
    | undefined;
  return row ? toFood(row) : null;
}

export function createFood(db: DatabaseSync, input: FoodInput): Food {
  const id = randomUUID();

  db.prepare(
    'INSERT INTO foods(id, name, category, unit, per100_calories, per100_protein, serving_name, serving_amount, built_in) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)',
  ).run(
    id,
    input.name,
    input.category,
    input.unit,
    input.per100Calories,
    input.per100Protein,
    input.servingName ?? null,
    input.servingAmount ?? null,
  );

  return getFood(db, id)!;
}

export function updateFood(
  db: DatabaseSync,
  id: string,
  patch: Partial<FoodInput>,
): Food | null {
  const current = getFood(db, id);
  if (!current) return null;

  db.prepare(
    'UPDATE foods SET name = ?, category = ?, unit = ?, per100_calories = ?, per100_protein = ?, serving_name = ?, serving_amount = ? WHERE id = ?',
  ).run(
    patch.name ?? current.name,
    patch.category ?? current.category,
    patch.unit ?? current.unit,
    patch.per100Calories ?? current.per100Calories,
    patch.per100Protein ?? current.per100Protein,
    patch.servingName === undefined ? current.servingName : patch.servingName,
    patch.servingAmount === undefined
      ? current.servingAmount
      : patch.servingAmount,
    id,
  );

  return getFood(db, id);
}

export function deleteFood(db: DatabaseSync, id: string): boolean {
  const result = db.prepare('DELETE FROM foods WHERE id = ?').run(id);
  return Number(result.changes) > 0;
}

export function recentFoods(db: DatabaseSync, limit = 8): Food[] {
  const rows = db
    .prepare(
      `${SELECT} JOIN (SELECT food_id, MAX(created_at) AS last_at FROM meal_entries WHERE kind = 'actual' AND food_id IS NOT NULL GROUP BY food_id ORDER BY last_at DESC LIMIT ?) recent ON recent.food_id = foods.id ORDER BY recent.last_at DESC`,
    )
    .all(limit) as unknown as FoodRow[];
  return rows.map(toFood);
}

export function frequentFoods(db: DatabaseSync, limit = 8): Food[] {
  const rows = db
    .prepare(
      `${SELECT} JOIN meal_entries entries ON entries.food_id = foods.id WHERE entries.kind = 'actual' GROUP BY foods.id ORDER BY COUNT(*) DESC, MAX(entries.created_at) DESC LIMIT ?`,
    )
    .all(limit) as unknown as FoodRow[];
  return rows.map(toFood);
}
