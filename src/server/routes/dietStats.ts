import type { FastifyInstance } from 'fastify';
import { toLocalDate } from '@shared/dates';
import type { StatsView } from '../lib/statsRange';
import { ApiError } from '../lib/errors';
import { getDietStats } from '../services/dietStats';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export async function dietStatsRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: { view?: string; anchor?: string } }>(
    '/api/stats/diet',
    async (request) => {
      const view: StatsView =
        request.query.view === 'month' || request.query.view === 'year'
          ? request.query.view
          : 'week';
      const anchor = request.query.anchor ?? toLocalDate(new Date());

      if (!datePattern.test(anchor)) {
        throw new ApiError('VALIDATION_ERROR', '日期格式应为 YYYY-MM-DD', 400);
      }

      return getDietStats(app.dbManager.get(), view, anchor);
    },
  );

  app.post('/api/settings/protein-reference', async () => {
    const row = app.dbManager
      .get()
      .prepare(
        'SELECT weight_kg FROM weight_logs ORDER BY date DESC, created_at DESC, rowid DESC LIMIT 1',
      )
      .get() as unknown as { weight_kg: number } | undefined;

    if (!row) {
      throw new ApiError(
        'NO_WEIGHT',
        '还没有体重记录，无法生成蛋白质参考值',
        400,
      );
    }

    return { proteinTarget: Math.round(row.weight_kg * 1.6) };
  });
}
