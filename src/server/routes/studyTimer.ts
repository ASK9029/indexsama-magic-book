import type { FastifyInstance } from 'fastify';
import { timerStartSchema, timerStopSchema } from '@shared/schemas';
import { ApiError } from '../lib/errors';
import { getSubject } from '../repositories/subjects';
import {
  getTimer,
  pauseTimer,
  resumeTimer,
  startTimer,
  stopTimer,
} from '../repositories/studyTimer';

export async function studyTimerRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/study/timer', async () => getTimer(app.dbManager.get()));

  app.post('/api/study/timer/start', async (request) => {
    const parsed = timerStartSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ApiError('VALIDATION_ERROR', '参数不正确', 400, parsed.error.flatten());
    }

    const db = app.dbManager.get();
    if (!getSubject(db, parsed.data.subjectId)) {
      throw new ApiError('SUBJECT_NOT_FOUND', '科目不存在', 404);
    }

    const timer = startTimer(db, parsed.data);
    if (!timer) {
      throw new ApiError(
        'TIMER_RUNNING',
        '已有计时在进行，请先结束或继续',
        409,
      );
    }
    return timer;
  });

  app.post('/api/study/timer/pause', async () => {
    const timer = pauseTimer(app.dbManager.get());
    if (!timer) throw new ApiError('TIMER_NOT_RUNNING', '当前没有运行中的计时', 409);
    return timer;
  });

  app.post('/api/study/timer/resume', async () => {
    const timer = resumeTimer(app.dbManager.get());
    if (!timer) throw new ApiError('TIMER_NOT_PAUSED', '当前没有暂停中的计时', 409);
    return timer;
  });

  app.post('/api/study/timer/stop', async (request) => {
    const parsed = timerStopSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      throw new ApiError('VALIDATION_ERROR', '参数不正确', 400, parsed.error.flatten());
    }

    const session = stopTimer(app.dbManager.get(), parsed.data.note);
    return { session };
  });
}
