import type { FastifyInstance } from 'fastify';
import { toLocalDate } from '@shared/dates';
import { ApiError } from '../lib/errors';
import {
  addCheckin,
  deleteCheckin,
  getCheckin,
  listCheckins,
  nextSortOrder,
} from '../repositories/checkins';
import { getSubject } from '../repositories/subjects';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const imageMimes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function checkinsRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: { id: string } }>(
    '/api/subjects/:id/checkins',
    async (request) => {
      const db = app.dbManager.get();
      if (!getSubject(db, request.params.id)) {
        throw new ApiError('SUBJECT_NOT_FOUND', '科目不存在', 404);
      }
      return listCheckins(db, request.params.id);
    },
  );

  app.post<{ Params: { id: string } }>(
    '/api/subjects/:id/checkins',
    async (request, reply) => {
      const db = app.dbManager.get();
      const subjectId = request.params.id;
      if (!getSubject(db, subjectId)) {
        throw new ApiError('SUBJECT_NOT_FOUND', '科目不存在', 404);
      }

      let date: string | null = null;
      const files: { buffer: Buffer; filename: string; mimetype: string }[] = [];

      for await (const part of request.parts()) {
        if (part.type === 'file') {
          files.push({
            buffer: await part.toBuffer(),
            filename: part.filename,
            mimetype: part.mimetype,
          });
        } else if (part.fieldname === 'date') {
          date = String(part.value);
        }
      }

      if (!date || !datePattern.test(date)) {
        throw new ApiError('VALIDATION_ERROR', '日期格式应为 YYYY-MM-DD', 400);
      }
      if (date > toLocalDate(new Date())) {
        throw new ApiError('FUTURE_DATE', '不能给未来日期打卡', 400);
      }
      if (files.length === 0) {
        throw new ApiError('VALIDATION_ERROR', '至少上传一张照片', 400);
      }
      for (const file of files) {
        if (!imageMimes.has(file.mimetype)) {
          throw new ApiError('INVALID_FILE_TYPE', '只支持 JPG/PNG/WebP', 400);
        }
      }

      const created = [];
      let sortOrder = nextSortOrder(db, subjectId, date);

      for (const file of files) {
        const record = await app.fileService.save(
          file.buffer,
          file.filename,
          file.mimetype,
          'checkin',
          `checkins/${subjectId}/${date}`,
        );
        created.push(addCheckin(db, subjectId, date, record.id, sortOrder));
        sortOrder += 1;
      }

      return reply.status(201).send(created);
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/api/checkins/:id',
    async (request) => {
      const db = app.dbManager.get();
      const photo = getCheckin(db, request.params.id);
      if (!photo) throw new ApiError('CHECKIN_NOT_FOUND', '打卡照片不存在', 404);

      deleteCheckin(db, photo.id);
      await app.fileService.delete(photo.fileId);
      return { ok: true };
    },
  );
}
