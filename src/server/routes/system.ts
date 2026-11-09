import type { FastifyInstance } from 'fastify';

export async function systemRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/system/shutdown', async (_request, reply) => {
    await reply.send({ ok: true });
    setTimeout(() => process.exit(0), 100);
  });
}
