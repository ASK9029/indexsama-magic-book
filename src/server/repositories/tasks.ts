import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { Task, TaskCategory, TaskPriority } from '@shared/types';

interface TaskRow {
  id: string;
  date: string;
  title: string;
  category: string;
  priority: string;
  time: string | null;
  note: string;
  done: number;
  created_at: string;
  updated_at: string;
}

export interface TaskInput {
  date: string;
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  time?: string | null;
  note?: string;
}

const SELECT =
  'SELECT id, date, title, category, priority, time, note, done, created_at, updated_at FROM tasks';

const ORDER =
  "ORDER BY done ASC, CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END ASC, CASE WHEN time IS NULL THEN 1 ELSE 0 END ASC, time ASC, created_at ASC";

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    category: row.category as TaskCategory,
    priority: row.priority as TaskPriority,
    time: row.time,
    note: row.note,
    done: row.done === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listTasks(db: DatabaseSync, date: string): Task[] {
  const rows = db
    .prepare(`${SELECT} WHERE date = ? ${ORDER}`)
    .all(date) as unknown as TaskRow[];
  return rows.map(toTask);
}

export function getTask(db: DatabaseSync, id: string): Task | null {
  const row = db.prepare(`${SELECT} WHERE id = ?`).get(id) as unknown as
    | TaskRow
    | undefined;
  return row ? toTask(row) : null;
}

export function createTask(db: DatabaseSync, input: TaskInput): Task {
  const now = new Date().toISOString();
  const id = randomUUID();

  db.prepare(
    'INSERT INTO tasks(id, date, title, category, priority, time, note, done, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)',
  ).run(
    id,
    input.date,
    input.title,
    input.category,
    input.priority,
    input.time ?? null,
    input.note ?? '',
    now,
    now,
  );

  return getTask(db, id)!;
}

export function updateTask(
  db: DatabaseSync,
  id: string,
  patch: Partial<TaskInput> & { done?: boolean },
): Task | null {
  const current = getTask(db, id);
  if (!current) return null;

  const next = {
    date: patch.date ?? current.date,
    title: patch.title ?? current.title,
    category: patch.category ?? current.category,
    priority: patch.priority ?? current.priority,
    time: patch.time === undefined ? current.time : patch.time,
    note: patch.note ?? current.note,
    done: patch.done ?? current.done,
  };

  db.prepare(
    'UPDATE tasks SET date = ?, title = ?, category = ?, priority = ?, time = ?, note = ?, done = ?, updated_at = ? WHERE id = ?',
  ).run(
    next.date,
    next.title,
    next.category,
    next.priority,
    next.time,
    next.note,
    next.done ? 1 : 0,
    new Date().toISOString(),
    id,
  );

  return getTask(db, id);
}

export function deleteTask(db: DatabaseSync, id: string): boolean {
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  return Number(result.changes) > 0;
}

export function carryOverTask(
  db: DatabaseSync,
  id: string,
  targetDate: string,
): Task | null {
  const current = getTask(db, id);
  if (!current) return null;

  db.prepare('UPDATE tasks SET date = ?, updated_at = ? WHERE id = ?').run(
    targetDate,
    new Date().toISOString(),
    id,
  );

  return getTask(db, id);
}
