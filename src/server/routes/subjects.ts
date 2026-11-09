import type { FastifyInstance } from 'fastify';
import { subjectCreateSchema, subjectUpdateSchema } from '@shared/schemas';
import { ApiError } from '../lib/errors';
import {
  createSubject,
  listSubjects,
  setSubjectArchived,
  updateSubject,
} from '../repositories/subjects';

export async function subjectsRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: { archived?: string } }>('/api/subjects', async (request) =>
    listSubjects(app.dbManager.get(), request.query.archived === '1'),
  );

  app.post('/api/subjects', async (request, reply) => {
    const parsed = subjectCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: '参数不正确',
          details: parsed.error.flatten(),
        },
      });
    }

    const subject = createSubject(app.dbManager.get(), parsed.data);
    return reply.status(201).send(subject);
  });

  app.patch<{ Params: { id: string } }>('/api/subjects/:id', async (request) => {
    const parsed = subjectUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ApiError('VALIDATION_ERROR', '参数不正确', 400, parsed.error.flatten());
    }

    const subject = updateSubject(app.dbManager.get(), request.params.id, parsed.data);
    if (!subject) throw new ApiError('SUBJECT_NOT_FOUND', '科目不存在', 404);
    return subject;
  });

  app.delete<{ Params: { id: string } }>('/api/subjects/:id', async (request) => {
    const subject = setSubjectArchived(app.dbManager.get(), request.params.id, true);
    if (!subject) throw new ApiError('SUBJECT_NOT_FOUND', '科目不存在', 404);
    return { ok: true };
  });

  app.post<{ Params: { id: string } }>('/api/subjects/:id/archive', async (request) => {
    const subject = setSubjectArchived(app.dbManager.get(), request.params.id, true);
    if (!subject) throw new ApiError('SUBJECT_NOT_FOUND', '科目不存在', 404);
    return subject;
  });

  app.post<{ Params: { id: string } }>('/api/subjects/:id/restore', async (request) => {
    const subject = setSubjectArchived(app.dbManager.get(), request.params.id, false);
    if (!subject) throw new ApiError('SUBJECT_NOT_FOUND', '科目不存在', 404);
    return subject;
  });
}
