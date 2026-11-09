import type { FastifyInstance } from 'fastify';
import { toLocalDate } from '@shared/dates';
import { getHome } from '../services/home';

export async function homeRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/home', async () =>
    getHome(app.dbManager.get(), toLocalDate(new Date())),
  );
}
