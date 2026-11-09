import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import fastifyStatic from '@fastify/static';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { healthRoutes } from './routes/health';
import { systemRoutes } from './routes/system';
import { sendApiError } from './lib/http';

export interface BuildAppOptions {
  dataDir: string;
  dbPath?: string;
  logger?: boolean;
}

function apiNotFound(request: FastifyRequest, reply: FastifyReply): FastifyReply {
  if (request.url.startsWith('/api/')) {
    return reply.status(404).send({
      error: { code: 'NOT_FOUND', message: '接口不存在' },
    });
  }
  return reply.status(404).send({
    error: { code: 'NOT_FOUND', message: '页面不存在' },
  });
}

export async function buildApp(options: BuildAppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? false });
  await mkdir(options.dataDir, { recursive: true });

  app.setErrorHandler((error, _request, reply) => sendApiError(reply, error));
  app.setNotFoundHandler(apiNotFound);

  await app.register(healthRoutes);
  await app.register(systemRoutes);

  const clientDir = path.resolve(process.cwd(), 'dist/client');
  if (existsSync(clientDir)) {
    await app.register(fastifyStatic, { root: clientDir });
    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/api/')) {
        return reply.status(404).send({
          error: { code: 'NOT_FOUND', message: '接口不存在' },
        });
      }
      return reply.sendFile('index.html');
    });
  }

  return app;
}
