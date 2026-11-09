import type { FastifyInstance } from 'fastify';
import { ApiError } from '../lib/errors';

export async function filesRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: { id: string }; Querystring: { mode?: string } }>(
    '/api/files/:id',
    async (request, reply) => {
      const file = app.fileService.get(request.params.id);
      if (!file) throw new ApiError('FILE_NOT_FOUND', '文件不存在', 404);
      if (!app.fileService.exists(file.id)) {
        throw new ApiError('FILE_MISSING', '文件丢失', 404);
      }

      const mode =
        request.query.mode === 'attachment' ? 'attachment' : 'inline';

      return reply
        .type(file.mime)
        .header(
          'Content-Disposition',
          `${mode}; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
        )
        .send(app.fileService.stream(file.id));
    },
  );
}
