import type { FastifyInstance } from 'fastify';
import type { DatabaseSync } from 'node:sqlite';
import { settingsPatchSchema } from '@shared/schemas';
import type { Settings } from '@shared/types';
import { getAllSettings, setSetting } from '../repositories/settings';

function toSettings(db: DatabaseSync): Settings {
  const raw = getAllSettings(db);
  const parse = <T>(key: string, fallback: T): T => {
    const value = raw[key];
    if (value === undefined) return fallback;
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  };

  return {
    theme: parse<Settings['theme']>('theme', 'light'),
    weekStart: parse<Settings['weekStart']>('weekStart', 1),
    weightUnit: parse<Settings['weightUnit']>('weightUnit', 'kg'),
    calorieTarget: parse<Settings['calorieTarget']>('calorieTarget', null),
    proteinTarget: parse<Settings['proteinTarget']>('proteinTarget', null),
    waterTarget: parse<Settings['waterTarget']>('waterTarget', null),
    lastBackupAt: parse<Settings['lastBackupAt']>('lastBackupAt', null),
  };
}

export async function settingsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/settings', async () => toSettings(app.dbManager.get()));

  app.patch('/api/settings', async (request, reply) => {
    const parsed = settingsPatchSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: '参数不正确',
          details: parsed.error.flatten(),
        },
      });
    }

    const db = app.dbManager.get();
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) setSetting(db, key, value);
    }

    return toSettings(db);
  });
}
