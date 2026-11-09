import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { CheckinPhoto, CheckinSummary } from '@shared/types';

interface CheckinRow {
  id: string;
  subject_id: string;
  date: string;
  file_id: string;
  sort_order: number;
  created_at: string;
}

const SELECT =
  'SELECT id, subject_id, date, file_id, sort_order, created_at FROM checkin_photos';

function toPhoto(row: CheckinRow): CheckinPhoto {
  return {
    id: row.id,
    subjectId: row.subject_id,
    date: row.date,
    fileId: row.file_id,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export function listCheckins(
  db: DatabaseSync,
  subjectId: string,
): CheckinSummary {
  const rows = db
    .prepare(
      `${SELECT} WHERE subject_id = ? ORDER BY date DESC, sort_order ASC, created_at ASC`,
    )
    .all(subjectId) as unknown as CheckinRow[];

  const photos = rows.map(toPhoto);
  const days = new Set(photos.map((photo) => photo.date)).size;

  return { photos, days, totalPhotos: photos.length };
}

export function getCheckin(
  db: DatabaseSync,
  id: string,
): CheckinPhoto | null {
  const row = db.prepare(`${SELECT} WHERE id = ?`).get(id) as unknown as
    | CheckinRow
    | undefined;
  return row ? toPhoto(row) : null;
}

export function nextSortOrder(
  db: DatabaseSync,
  subjectId: string,
  date: string,
): number {
  const row = db
    .prepare(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM checkin_photos WHERE subject_id = ? AND date = ?',
    )
    .get(subjectId, date) as unknown as { next: number };
  return row.next;
}

export function addCheckin(
  db: DatabaseSync,
  subjectId: string,
  date: string,
  fileId: string,
  sortOrder: number,
): CheckinPhoto {
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO checkin_photos(id, subject_id, date, file_id, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(id, subjectId, date, fileId, sortOrder, now);

  return getCheckin(db, id)!;
}

export function deleteCheckin(db: DatabaseSync, id: string): boolean {
  const result = db.prepare('DELETE FROM checkin_photos WHERE id = ?').run(id);
  return Number(result.changes) > 0;
}
