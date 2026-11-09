import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { toLocalDate } from '@shared/dates';
import type { Game, GameStats, GameStatus } from '@shared/types';

interface GameRow {
  id: string;
  title: string;
  platform: string;
  status: string;
  rating: number | null;
  playtime_minutes: number;
  start_date: string | null;
  finish_date: string | null;
  cover_file_id: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface GameInput {
  title: string;
  platform: string;
  status?: GameStatus;
  rating?: number | null;
  playtimeMinutes?: number;
  startDate?: string | null;
  finishDate?: string | null;
  notes?: string;
}

export interface GameFilters {
  status?: string;
  platform?: string;
  q?: string;
  sort?: string;
}

const SELECT =
  'SELECT id, title, platform, status, rating, playtime_minutes, start_date, finish_date, cover_file_id, notes, created_at, updated_at FROM games';

function toGame(row: GameRow): Game {
  return {
    id: row.id,
    title: row.title,
    platform: row.platform,
    status: row.status as GameStatus,
    rating: row.rating,
    playtimeMinutes: row.playtime_minutes,
    startDate: row.start_date,
    finishDate: row.finish_date,
    coverFileId: row.cover_file_id,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listGames(
  db: DatabaseSync,
  filters: GameFilters = {},
): Game[] {
  const clauses: string[] = [];
  const params: string[] = [];

  if (filters.status) {
    clauses.push('status = ?');
    params.push(filters.status);
  }
  if (filters.platform) {
    clauses.push('platform = ?');
    params.push(filters.platform);
  }
  if (filters.q) {
    clauses.push('title LIKE ?');
    params.push(`%${filters.q}%`);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  const order =
    filters.sort === 'title'
      ? 'title COLLATE NOCASE ASC'
      : filters.sort === 'playtime'
        ? 'playtime_minutes DESC, updated_at DESC'
        : filters.sort === 'rating'
          ? 'rating IS NULL ASC, rating DESC, updated_at DESC'
          : 'updated_at DESC';

  const rows = db
    .prepare(`${SELECT} ${where} ORDER BY ${order}`)
    .all(...params) as unknown as GameRow[];

  return rows.map(toGame);
}

export function getGame(db: DatabaseSync, id: string): Game | null {
  const row = db.prepare(`${SELECT} WHERE id = ?`).get(id) as unknown as
    | GameRow
    | undefined;
  return row ? toGame(row) : null;
}

export function createGame(db: DatabaseSync, input: GameInput): Game {
  const id = randomUUID();
  const now = new Date().toISOString();
  const today = toLocalDate(new Date());
  const status = input.status ?? 'wishlist';

  let startDate = input.startDate ?? null;
  let finishDate = input.finishDate ?? null;

  if (status === 'playing') {
    startDate = startDate ?? today;
    finishDate = null;
  } else if (status === 'completed') {
    finishDate = finishDate ?? today;
  } else if (status === 'wishlist') {
    startDate = null;
    finishDate = null;
  }

  db.prepare(
    'INSERT INTO games(id, title, platform, status, rating, playtime_minutes, start_date, finish_date, cover_file_id, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)',
  ).run(
    id,
    input.title,
    input.platform,
    status,
    input.rating ?? null,
    input.playtimeMinutes ?? 0,
    startDate,
    finishDate,
    input.notes ?? '',
    now,
    now,
  );

  return getGame(db, id)!;
}

export function updateGame(
  db: DatabaseSync,
  id: string,
  patch: Partial<GameInput>,
): Game | null {
  const current = getGame(db, id);
  if (!current) return null;

  const today = toLocalDate(new Date());
  const status = patch.status ?? current.status;
  let startDate = current.startDate;
  let finishDate = current.finishDate;

  if (patch.status && patch.status !== current.status) {
    if (status === 'playing') {
      startDate = startDate ?? today;
      finishDate = null;
    } else if (status === 'completed') {
      finishDate = finishDate ?? today;
    } else if (status === 'wishlist') {
      startDate = null;
      finishDate = null;
    }
  }

  if (patch.startDate !== undefined) startDate = patch.startDate;
  if (patch.finishDate !== undefined) finishDate = patch.finishDate;

  db.prepare(
    'UPDATE games SET title = ?, platform = ?, status = ?, rating = ?, playtime_minutes = ?, start_date = ?, finish_date = ?, notes = ?, updated_at = ? WHERE id = ?',
  ).run(
    patch.title ?? current.title,
    patch.platform ?? current.platform,
    status,
    patch.rating === undefined ? current.rating : patch.rating,
    patch.playtimeMinutes ?? current.playtimeMinutes,
    startDate,
    finishDate,
    patch.notes ?? current.notes,
    new Date().toISOString(),
    id,
  );

  return getGame(db, id);
}

export function addPlaytime(
  db: DatabaseSync,
  id: string,
  minutes: number,
): Game | null {
  const current = getGame(db, id);
  if (!current) return null;

  db.prepare(
    'UPDATE games SET playtime_minutes = ?, updated_at = ? WHERE id = ?',
  ).run(
    current.playtimeMinutes + minutes,
    new Date().toISOString(),
    id,
  );

  return getGame(db, id);
}

export function setCover(
  db: DatabaseSync,
  id: string,
  coverFileId: string | null,
): Game | null {
  const current = getGame(db, id);
  if (!current) return null;

  db.prepare(
    'UPDATE games SET cover_file_id = ?, updated_at = ? WHERE id = ?',
  ).run(coverFileId, new Date().toISOString(), id);

  return getGame(db, id);
}

export function deleteGame(db: DatabaseSync, id: string): Game | null {
  const current = getGame(db, id);
  if (!current) return null;
  db.prepare('DELETE FROM games WHERE id = ?').run(id);
  return current;
}

export function gameStats(db: DatabaseSync): GameStats {
  const rows = db
    .prepare('SELECT status, COUNT(*) AS count FROM games GROUP BY status')
    .all() as unknown as { status: GameStatus; count: number }[];
  const counts = new Map(rows.map((row) => [row.status, row.count]));

  const total = db
    .prepare('SELECT COALESCE(SUM(playtime_minutes), 0) AS total FROM games')
    .get() as unknown as { total: number };

  const year = toLocalDate(new Date()).slice(0, 4);
  const completedThisYear = db
    .prepare(
      "SELECT COUNT(*) AS count FROM games WHERE status = 'completed' AND finish_date LIKE ?",
    )
    .get(`${year}-%`) as unknown as { count: number };

  const recentRows = db
    .prepare(
      `${SELECT} WHERE status = 'completed' ORDER BY finish_date DESC, updated_at DESC LIMIT 5`,
    )
    .all() as unknown as GameRow[];
  const currentRow = db
    .prepare(`${SELECT} WHERE status = 'playing' ORDER BY updated_at DESC LIMIT 1`)
    .get() as unknown as GameRow | undefined;

  return {
    playing: counts.get('playing') ?? 0,
    wishlist: counts.get('wishlist') ?? 0,
    completed: counts.get('completed') ?? 0,
    paused: counts.get('paused') ?? 0,
    totalMinutes: total.total,
    completedThisYear: completedThisYear.count,
    recentCompleted: recentRows.map(toGame),
    currentPlaying: currentRow ? toGame(currentRow) : null,
  };
}
