import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import type { WeightLog } from '@shared/types';
import { weightCreateSchema, weightUpdateSchema } from '@shared/schemas';
import { ApiError } from '../lib/errors';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

interface WeightRow {
  id: string;
  date: string;
  weight_kg: number;
  created_at: string;
}

function toWeight(row: WeightRow): WeightLog {
  return {
    id: row.id,
    date: row.date,
    weightKg: row.weight_kg,
    createdAt: row.created_at,
  };
}

function optionalDate(value: unknown): string | undefined {
  if (value === undefined || value === '') return undefined;
  if (typeof value !== 'string' || !datePattern.test(value)) {
    throw new ApiError('VALIDATION_ERROR', '日期格式应为 YYYY-MM-DD', 400);
  }
  return value;
}

export async function weightsRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: { from?: string; to?: string } }>(
    '/api/weights',
    async (request) => {
      const from = optionalDate(request.query.from);
      const to = optionalDate(request.query.to);
      const clauses: string[] = [];
      const params: string[] = [];

      if (from) {
        clauses.push('date >= ?');
        params.push(from);
      }
      if (to) {
        clauses.push('date <= ?');
        params.push(to);
      }

      const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
      const rows = app.dbManager
        .get()
        .prepare(
          `SELECT id, date, weight_kg, created_at FROM weight_logs ${where} ORDER BY date ASC, created_at ASC`,
        )
        .all(...params) as unknown as WeightRow[];

      return rows.map(toWeight);
    },
  );

  app.post('/api/weights', async (request, reply) => {
    const parsed = weightCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: '参数不正确',
          details: parsed.error.flatten(),
        },
      });
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    app.dbManager
      .get()
      .prepare(
        'INSERT INTO weight_logs(id, date, weight_kg, created_at) VALUES (?, ?, ?, ?)',
      )
      .run(id, parsed.data.date, parsed.data.weightKg, now);

    return reply.status(201).send({
      id,
      date: parsed.data.date,
      weightKg: parsed.data.weightKg,
      createdAt: now,
    });
  });

  app.patch<{ Params: { id: string } }>(
    '/api/weights/:id',
    async (request) => {
      const parsed = weightUpdateSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ApiError(
          'VALIDATION_ERROR',
          '参数不正确',
          400,
          parsed.error.flatten(),
        );
      }

      const db = app.dbManager.get();
      const current = db
        .prepare('SELECT id, date, weight_kg, created_at FROM weight_logs WHERE id = ?')
        .get(request.params.id) as unknown as WeightRow | undefined;
      if (!current) throw new ApiError('WEIGHT_NOT_FOUND', '体重记录不存在', 404);

      db.prepare('UPDATE weight_logs SET date = ?, weight_kg = ? WHERE id = ?').run(
        parsed.data.date ?? current.date,
        parsed.data.weightKg ?? current.weight_kg,
        current.id,
      );

      const updated = db
        .prepare('SELECT id, date, weight_kg, created_at FROM weight_logs WHERE id = ?')
        .get(current.id) as unknown as WeightRow;
      return toWeight(updated);
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/api/weights/:id',
    async (request) => {
      const result = app.dbManager
        .get()
        .prepare('DELETE FROM weight_logs WHERE id = ?')
        .run(request.params.id);
      if (Number(result.changes) === 0) {
        throw new ApiError('WEIGHT_NOT_FOUND', '体重记录不存在', 404);
      }
      return { ok: true };
    },
  );
}
