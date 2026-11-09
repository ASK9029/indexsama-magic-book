import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import fastifyStatic from '@fastify/static';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { healthRoutes } from './routes/health';
import { systemRoutes } from './routes/system';
import { settingsRoutes } from './routes/settings';
import { memosRoutes } from './routes/memos';
import { tasksRoutes } from './routes/tasks';
import { subjectsRoutes } from './routes/subjects';
import { studyArrangementsRoutes } from './routes/studyArrangements';
import { studyTimerRoutes } from './routes/studyTimer';
import { studySessionsRoutes } from './routes/studySessions';
import { sendApiError } from './lib/http';
import { createDbManager, type DbManager } from './db/connection';
import { migrate } from './db/migrate';

declare module 'fastify' {
  interface FastifyInstance {
    dbManager: DbManager;
  }
}

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

  const dbPath = options.dbPath ?? path.join(options.dataDir, 'app.db');
  const dbManager = createDbManager(dbPath);
  migrate(dbManager.get());
  app.decorate('dbManager', dbManager);
  app.addHook('onClose', async () => {
    dbManager.close();
  });

  app.setErrorHandler((error, _request, reply) => sendApiError(reply, error));
  app.setNotFoundHandler(apiNotFound);

  await app.register(healthRoutes);
  await app.register(systemRoutes);
  await app.register(settingsRoutes);
  await app.register(memosRoutes);
  await app.register(tasksRoutes);
  await app.register(subjectsRoutes);
  await app.register(studyArrangementsRoutes);
  await app.register(studyTimerRoutes);
  await app.register(studySessionsRoutes);

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
