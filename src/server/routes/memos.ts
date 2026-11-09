import type { FastifyInstance } from 'fastify';
import { memoCreateSchema, memoUpdateSchema } from '@shared/schemas';
import { ApiError } from '../lib/errors';
import { createMemo, deleteMemo, listMemos, updateMemo } from '../repositories/memos';

export async function memosRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/memos', async () => listMemos(app.dbManager.get()));

  app.post('/api/memos', async (request, reply) => {
    const parsed = memoCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: '参数不正确',
          details: parsed.error.flatten(),
        },
      });
    }

    const memo = createMemo(app.dbManager.get(), parsed.data);
    return reply.status(201).send(memo);
  });

  app.patch<{ Params: { id: string } }>('/api/memos/:id', async (request) => {
    const parsed = memoUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ApiError('VALIDATION_ERROR', '参数不正确', 400, parsed.error.flatten());
    }

    const memo = updateMemo(app.dbManager.get(), request.params.id, parsed.data);
    if (!memo) throw new ApiError('MEMO_NOT_FOUND', '备忘不存在', 404);
    return memo;
  });

  app.delete<{ Params: { id: string } }>('/api/memos/:id', async (request) => {
    const deleted = deleteMemo(app.dbManager.get(), request.params.id);
    if (!deleted) throw new ApiError('MEMO_NOT_FOUND', '备忘不存在', 404);
    return { ok: true };
  });
}
