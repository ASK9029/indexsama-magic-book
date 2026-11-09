import type { FastifyInstance } from 'fastify';
import { APP_VERSION } from '../config';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/health', async () => ({ ok: true, version: APP_VERSION }));
}
