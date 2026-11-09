import path from 'node:path';
import type { FastifyInstance } from 'fastify';
import { getDataInfo } from '../services/dataInfo';

export async function dataInfoRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/data/info', async () => {
    const dbPath = app.dbManager.path;
    return getDataInfo(app.dbManager.get(), path.dirname(dbPath), dbPath);
  });
}
