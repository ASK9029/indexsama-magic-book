import { execFile } from 'node:child_process';
import type { FastifyInstance } from 'fastify';
import { resolveDataDir } from '../config';

export async function systemRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/system/open-data-folder', async (_request, reply) => {
    execFile('explorer.exe', [resolveDataDir()], () => undefined);
    return reply.send({ ok: true });
  });

  app.post('/api/system/shutdown', async (_request, reply) => {
    await reply.send({ ok: true });
    setTimeout(() => process.exit(0), 100);
  });
}
