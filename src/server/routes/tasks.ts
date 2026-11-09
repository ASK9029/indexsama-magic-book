import type { FastifyInstance } from 'fastify';
import { taskCreateSchema, taskUpdateSchema } from '@shared/schemas';
import { ApiError } from '../lib/errors';
import {
  carryOverTask,
  createTask,
  deleteTask,
  listTasks,
  updateTask,
} from '../repositories/tasks';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function requireDate(value: unknown): string {
  if (typeof value !== 'string' || !datePattern.test(value)) {
    throw new ApiError('VALIDATION_ERROR', '日期格式应为 YYYY-MM-DD', 400);
  }
  return value;
}

export async function tasksRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: { date?: string } }>('/api/tasks', async (request) => {
    const date = requireDate(request.query.date);
    return listTasks(app.dbManager.get(), date);
  });

  app.post('/api/tasks', async (request, reply) => {
    const parsed = taskCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: '参数不正确',
          details: parsed.error.flatten(),
        },
      });
    }

    const task = createTask(app.dbManager.get(), parsed.data);
    return reply.status(201).send(task);
  });

  app.patch<{ Params: { id: string } }>('/api/tasks/:id', async (request) => {
    const parsed = taskUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ApiError('VALIDATION_ERROR', '参数不正确', 400, parsed.error.flatten());
    }

    const task = updateTask(app.dbManager.get(), request.params.id, parsed.data);
    if (!task) throw new ApiError('TASK_NOT_FOUND', '事项不存在', 404);
    return task;
  });

  app.delete<{ Params: { id: string } }>('/api/tasks/:id', async (request) => {
    const deleted = deleteTask(app.dbManager.get(), request.params.id);
    if (!deleted) throw new ApiError('TASK_NOT_FOUND', '事项不存在', 404);
    return { ok: true };
  });

  app.post<{ Params: { id: string } }>(
    '/api/tasks/:id/carry-over',
    async (request) => {
      const body = request.body as { targetDate?: unknown } | null;
      const targetDate = requireDate(body?.targetDate);
      const task = carryOverTask(
        app.dbManager.get(),
        request.params.id,
        targetDate,
      );
      if (!task) throw new ApiError('TASK_NOT_FOUND', '事项不存在', 404);
      return task;
    },
  );
}
