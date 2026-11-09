import type { FastifyInstance } from 'fastify';
import { toLocalDate } from '@shared/dates';
import type { StatsView } from '../lib/statsRange';
import { ApiError } from '../lib/errors';
import { getFitnessStats } from '../services/fitnessStats';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export async function fitnessStatsRoutes(app: FastifyInstance): Promise<void> {
  app.get<{
    Querystring: { view?: string; anchor?: string; exerciseId?: string };
  }>('/api/stats/fitness', async (request) => {
    const view: StatsView =
      request.query.view === 'month' || request.query.view === 'year'
        ? request.query.view
        : 'week';
    const anchor = request.query.anchor ?? toLocalDate(new Date());

    if (!datePattern.test(anchor)) {
      throw new ApiError('VALIDATION_ERROR', '日期格式应为 YYYY-MM-DD', 400);
    }

    return getFitnessStats(
      app.dbManager.get(),
      view,
      anchor,
      request.query.exerciseId,
    );
  });
}
