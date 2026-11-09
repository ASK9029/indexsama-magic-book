import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { Material, StudyMaterialType, StudyStatus } from '@shared/types';

interface MaterialRow {
  id: string;
  type: string;
  title: string;
  subject_id: string | null;
  url: string | null;
  file_id: string | null;
  status: string;
  progress: number;
  tags: string;
  excerpt: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface MaterialFilters {
  q?: string;
  subjectId?: string;
  type?: StudyMaterialType;
  status?: StudyStatus;
  sort?: 'updated' | 'created' | 'title';
}

export interface MaterialInput {
  type: StudyMaterialType;
  title: string;
  subjectId?: string | null;
  url?: string | null;
  fileId?: string | null;
  status?: StudyStatus;
  progress?: number;
  tags?: string[];
  excerpt?: string;
  body?: string;
}

export type MaterialPatch = Partial<
  Pick<
    Material,
    | 'title'
    | 'subjectId'
    | 'tags'
    | 'status'
    | 'progress'
    | 'excerpt'
    | 'body'
  >
>;

const SELECT =
  'SELECT id, type, title, subject_id, url, file_id, status, progress, tags, excerpt, body, created_at, updated_at FROM materials';

function parseTags(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

function toMaterial(row: MaterialRow): Material {
  return {
    id: row.id,
    type: row.type as StudyMaterialType,
    title: row.title,
    subjectId: row.subject_id,
    url: row.url,
    fileId: row.file_id,
    status: row.status as StudyStatus,
    progress: row.progress,
    tags: parseTags(row.tags),
    excerpt: row.excerpt,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listMaterials(
  db: DatabaseSync,
  filters: MaterialFilters = {},
): Material[] {
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (filters.q) {
    const like = `%${filters.q}%`;
    clauses.push('(title LIKE ? OR body LIKE ? OR excerpt LIKE ? OR tags LIKE ?)');
    params.push(like, like, like, like);
  }
  if (filters.subjectId) {
    clauses.push('subject_id = ?');
    params.push(filters.subjectId);
  }
  if (filters.type) {
    clauses.push('type = ?');
    params.push(filters.type);
  }
  if (filters.status) {
    clauses.push('status = ?');
    params.push(filters.status);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  const order =
    filters.sort === 'title'
      ? 'title COLLATE NOCASE ASC'
      : filters.sort === 'created'
        ? 'created_at DESC'
        : 'updated_at DESC';

  const rows = db
    .prepare(`${SELECT} ${where} ORDER BY ${order}`)
    .all(...params) as unknown as MaterialRow[];

  return rows.map(toMaterial);
}

export function getMaterial(db: DatabaseSync, id: string): Material | null {
  const row = db.prepare(`${SELECT} WHERE id = ?`).get(id) as unknown as
    | MaterialRow
    | undefined;
  return row ? toMaterial(row) : null;
}

export function createMaterial(
  db: DatabaseSync,
  input: MaterialInput,
): Material {
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO materials(id, type, title, subject_id, url, file_id, status, progress, tags, excerpt, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(
    id,
    input.type,
    input.title,
    input.subjectId ?? null,
    input.url ?? null,
    input.fileId ?? null,
    input.status ?? 'not_started',
    input.progress ?? 0,
    JSON.stringify(input.tags ?? []),
    input.excerpt ?? '',
    input.body ?? '',
    now,
    now,
  );

  return getMaterial(db, id)!;
}

export function updateMaterial(
  db: DatabaseSync,
  id: string,
  patch: MaterialPatch,
): Material | null {
  const current = getMaterial(db, id);
  if (!current) return null;

  db.prepare(
    'UPDATE materials SET title = ?, subject_id = ?, tags = ?, status = ?, progress = ?, excerpt = ?, body = ?, updated_at = ? WHERE id = ?',
  ).run(
    patch.title ?? current.title,
    patch.subjectId === undefined ? current.subjectId : patch.subjectId,
    JSON.stringify(patch.tags ?? current.tags),
    patch.status ?? current.status,
    patch.progress ?? current.progress,
    patch.excerpt ?? current.excerpt,
    patch.body ?? current.body,
    new Date().toISOString(),
    id,
  );

  return getMaterial(db, id);
}

export function deleteMaterial(db: DatabaseSync, id: string): boolean {
  const result = db.prepare('DELETE FROM materials WHERE id = ?').run(id);
  return Number(result.changes) > 0;
}

export function materialStudyMinutes(db: DatabaseSync, id: string): number {
  const row = db
    .prepare(
      'SELECT COALESCE(SUM(duration_minutes), 0) AS total FROM study_sessions WHERE material_id = ?',
    )
    .get(id) as unknown as { total: number };
  return row.total;
}
