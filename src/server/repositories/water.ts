import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { WaterLog } from '@shared/types';

interface WaterRow {
  id: string;
  date: string;
  amount_ml: number;
  created_at: string;
}

interface WeightRow {
  weight_kg: number;
  created_at: string;
}

export interface LatestWeight {
  weightKg: number;
  loggedAt: string;
}

const SELECT =
  'SELECT id, date, amount_ml, created_at FROM water_logs';

function toWater(row: WaterRow): WaterLog {
  return {
    id: row.id,
    date: row.date,
    amountMl: row.amount_ml,
    createdAt: row.created_at,
  };
}

export function listWater(db: DatabaseSync, date: string): WaterLog[] {
  const rows = db
    .prepare(`${SELECT} WHERE date = ? ORDER BY created_at ASC, rowid ASC`)
    .all(date) as unknown as WaterRow[];
  return rows.map(toWater);
}

export function getWater(db: DatabaseSync, id: string): WaterLog | null {
  const row = db.prepare(`${SELECT} WHERE id = ?`).get(id) as unknown as
    | WaterRow
    | undefined;
  return row ? toWater(row) : null;
}

export function createWater(
  db: DatabaseSync,
  date: string,
  amountMl: number,
): WaterLog {
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO water_logs(id, date, amount_ml, created_at) VALUES (?, ?, ?, ?)',
  ).run(id, date, amountMl, now);

  return getWater(db, id)!;
}

export function deleteWater(db: DatabaseSync, id: string): boolean {
  const result = db.prepare('DELETE FROM water_logs WHERE id = ?').run(id);
  return Number(result.changes) > 0;
}

export function undoWater(db: DatabaseSync, date: string): boolean {
  const row = db
    .prepare(
      'SELECT id FROM water_logs WHERE date = ? ORDER BY created_at DESC, rowid DESC LIMIT 1',
    )
    .get(date) as unknown as { id: string } | undefined;
  if (!row) return false;
  deleteWater(db, row.id);
  return true;
}

export function totalWater(db: DatabaseSync, date: string): number {
  const row = db
    .prepare(
      'SELECT COALESCE(SUM(amount_ml), 0) AS total FROM water_logs WHERE date = ?',
    )
    .get(date) as unknown as { total: number };
  return row.total;
}

export function latestWeight(
  db: DatabaseSync,
  date: string,
): LatestWeight | null {
  const row = db
    .prepare(
      'SELECT weight_kg, created_at FROM weight_logs WHERE date = ? ORDER BY created_at DESC, rowid DESC LIMIT 1',
    )
    .get(date) as unknown as WeightRow | undefined;
  if (!row) return null;
  return { weightKg: row.weight_kg, loggedAt: row.created_at };
}
