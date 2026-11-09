import type { FastifyInstance, FastifyReply } from 'fastify';
import type { DatabaseSync } from 'node:sqlite';
import {
  materialLinkCreateSchema,
  materialNoteCreateSchema,
  materialUpdateSchema,
} from '@shared/schemas';
import type { StudyMaterialType, StudyStatus } from '@shared/types';
import { ApiError } from '../lib/errors';
import {
  createMaterial,
  deleteMaterial,
  getMaterial,
  listMaterials,
  materialStudyMinutes,
  updateMaterial,
  type MaterialFilters,
  type MaterialPatch,
} from '../repositories/materials';
import { getSubject } from '../repositories/subjects';
import {
  materialFileSubdir,
  normalizeMaterialUrl,
  parseStatusField,
  parseTagsField,
} from '../services/materialFiles';

function assertSubject(
  db: DatabaseSync,
  subjectId: string | null | undefined,
): void {
  if (subjectId && !getSubject(db, subjectId)) {
    throw new ApiError('SUBJECT_NOT_FOUND', '科目不存在', 404);
  }
}

function validationError(reply: FastifyReply, details: unknown) {
  return reply.status(400).send({
    error: { code: 'VALIDATION_ERROR', message: '参数不正确', details },
  });
}

export async function materialsRoutes(app: FastifyInstance): Promise<void> {
  app.get<{
    Querystring: {
      q?: string;
      subjectId?: string;
      type?: string;
      status?: string;
      sort?: string;
    };
  }>('/api/materials', async (request) => {
    const filters: MaterialFilters = {
      q: request.query.q,
      subjectId: request.query.subjectId,
      type: request.query.type as StudyMaterialType | undefined,
      status: request.query.status as StudyStatus | undefined,
      sort:
        request.query.sort === 'created' || request.query.sort === 'title'
          ? request.query.sort
          : 'updated',
    };
    return listMaterials(app.dbManager.get(), filters);
  });

  app.get<{ Params: { id: string } }>(
    '/api/materials/:id',
    async (request) => {
      const db = app.dbManager.get();
      const material = getMaterial(db, request.params.id);
      if (!material) throw new ApiError('MATERIAL_NOT_FOUND', '资料不存在', 404);

      return {
        ...material,
        totalStudyMinutes: materialStudyMinutes(db, material.id),
        fileMissing: material.fileId
          ? !app.fileService.exists(material.fileId)
          : false,
      };
    },
  );

  app.post('/api/materials/link', async (request, reply) => {
    const parsed = materialLinkCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      return validationError(reply, parsed.error.flatten());
    }

    const db = app.dbManager.get();
    assertSubject(db, parsed.data.subjectId);

    const material = createMaterial(db, {
      type: 'link',
      title: parsed.data.title,
      subjectId: parsed.data.subjectId ?? null,
      url: normalizeMaterialUrl(parsed.data.url),
      tags: parsed.data.tags,
      excerpt: parsed.data.excerpt,
    });

    return reply.status(201).send(material);
  });

  app.post('/api/materials/note', async (request, reply) => {
    const parsed = materialNoteCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      return validationError(reply, parsed.error.flatten());
    }

    const db = app.dbManager.get();
    assertSubject(db, parsed.data.subjectId);

    const material = createMaterial(db, {
      type: 'note',
      title: parsed.data.title,
      subjectId: parsed.data.subjectId ?? null,
      body: parsed.data.body,
      tags: parsed.data.tags,
    });

    return reply.status(201).send(material);
  });

  app.post('/api/materials/files', async (request, reply) => {
    const db = app.dbManager.get();
    const fields: Record<string, string> = {};
    const created = [];

    for await (const part of request.parts({
      limits: { fileSize: 100 * 1024 * 1024, files: 20 },
    })) {
      if (part.type === 'file') {
        const subjectId = fields.subjectId || null;
        assertSubject(db, subjectId);

        const record = await app.fileService.saveStream(
          part.file,
          part.filename,
          part.mimetype,
          'material',
          materialFileSubdir(subjectId),
        );

        try {
          created.push(
            createMaterial(db, {
              type: 'file',
              title: part.filename,
              subjectId,
              fileId: record.id,
              status: parseStatusField(fields.status),
              tags: parseTagsField(fields.tags),
            }),
          );
        } catch (error) {
          await app.fileService.delete(record.id);
          throw error;
        }
      } else {
        fields[part.fieldname] = String(part.value);
      }
    }

    if (created.length === 0) {
      throw new ApiError('VALIDATION_ERROR', '至少上传一个文件', 400);
    }

    return reply.status(201).send(created);
  });

  app.patch<{ Params: { id: string } }>(
    '/api/materials/:id',
    async (request) => {
      const parsed = materialUpdateSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ApiError(
          'VALIDATION_ERROR',
          '参数不正确',
          400,
          parsed.error.flatten(),
        );
      }

      const db = app.dbManager.get();
      const current = getMaterial(db, request.params.id);
      if (!current) throw new ApiError('MATERIAL_NOT_FOUND', '资料不存在', 404);
      if (parsed.data.subjectId) assertSubject(db, parsed.data.subjectId);

      const patch: MaterialPatch = { ...parsed.data };

      if (current.type === 'note') {
        delete patch.status;
        delete patch.progress;
      } else {
        let status = parsed.data.status ?? current.status;
        let progress = parsed.data.progress ?? current.progress;

        if (parsed.data.progress === 100) status = 'completed';
        else if (parsed.data.status === 'completed') progress = 100;
        else if (
          parsed.data.progress !== undefined &&
          parsed.data.progress > 0 &&
          status === 'not_started'
        ) {
          status = 'learning';
        }

        patch.status = status;
        patch.progress = progress;
      }

      return updateMaterial(db, current.id, patch);
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/api/materials/:id',
    async (request) => {
      const db = app.dbManager.get();
      const material = getMaterial(db, request.params.id);
      if (!material) throw new ApiError('MATERIAL_NOT_FOUND', '资料不存在', 404);

      if (material.fileId) await app.fileService.delete(material.fileId);
      deleteMaterial(db, material.id);
      return { ok: true };
    },
  );
}
