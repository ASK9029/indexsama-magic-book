import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyMultipart from '@fastify/multipart';
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
import { filesRoutes } from './routes/files';
import { checkinsRoutes } from './routes/checkins';
import { materialsRoutes } from './routes/materials';
import { exercisesRoutes } from './routes/exercises';
import { fitnessPlanRoutes } from './routes/fitnessPlan';
import { workoutsRoutes } from './routes/workouts';
import { upgradesRoutes } from './routes/upgrades';
import { fitnessStatsRoutes } from './routes/fitnessStats';
import { weightsRoutes } from './routes/weights';
import { foodsRoutes } from './routes/foods';
import { sendApiError } from './lib/http';
import { createDbManager, type DbManager } from './db/connection';
import { createFileService, type FileService } from './services/files';
import { seedExercises } from './db/seed/exercises';
import { seedFoods } from './db/seed/foods';
import { migrate } from './db/migrate';

declare module 'fastify' {
  interface FastifyInstance {
    dbManager: DbManager;
    fileService: FileService;
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
  seedExercises(dbManager.get());
  seedFoods(dbManager.get());
  app.decorate('dbManager', dbManager);
  const fileService = createFileService(
    dbManager.get(),
    path.join(options.dataDir, 'files'),
  );
  app.decorate('fileService', fileService);
  app.addHook('onClose', async () => {
    dbManager.close();
  });

  app.setErrorHandler((error, _request, reply) => sendApiError(reply, error));
  app.setNotFoundHandler(apiNotFound);

  await app.register(fastifyMultipart, {
    limits: { fileSize: 20 * 1024 * 1024, files: 20 },
  });

  await app.register(healthRoutes);
  await app.register(systemRoutes);
  await app.register(settingsRoutes);
  await app.register(memosRoutes);
  await app.register(tasksRoutes);
  await app.register(subjectsRoutes);
  await app.register(studyArrangementsRoutes);
  await app.register(studyTimerRoutes);
  await app.register(studySessionsRoutes);
  await app.register(filesRoutes);
  await app.register(checkinsRoutes);
  await app.register(materialsRoutes);
  await app.register(exercisesRoutes);
  await app.register(fitnessPlanRoutes);
  await app.register(workoutsRoutes);
  await app.register(upgradesRoutes);
  await app.register(fitnessStatsRoutes);
  await app.register(weightsRoutes);
  await app.register(foodsRoutes);

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
