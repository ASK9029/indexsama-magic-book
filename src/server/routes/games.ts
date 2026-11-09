import type { FastifyInstance } from 'fastify';
import {
  gameCreateSchema,
  gamePlaytimeSchema,
  gameUpdateSchema,
} from '@shared/schemas';
import { ApiError } from '../lib/errors';
import {
  addPlaytime,
  createGame,
  deleteGame,
  getGame,
  gameStats,
  listGames,
  setCover,
  updateGame,
} from '../repositories/games';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function coverUrl(coverFileId: string | null): string | null {
  return coverFileId ? `/api/files/${coverFileId}` : null;
}

export async function gamesRoutes(app: FastifyInstance): Promise<void> {
  app.get<{
    Querystring: { status?: string; platform?: string; q?: string; sort?: string };
  }>('/api/games', async (request) =>
    listGames(app.dbManager.get(), {
      status: request.query.status,
      platform: request.query.platform,
      q: request.query.q,
      sort: request.query.sort,
    }),
  );

  app.get('/api/games/stats', async () =>
    gameStats(app.dbManager.get()),
  );

  app.get<{ Params: { id: string } }>(
    '/api/games/:id',
    async (request) => {
      const game = getGame(app.dbManager.get(), request.params.id);
      if (!game) throw new ApiError('GAME_NOT_FOUND', '游戏不存在', 404);
      return { ...game, coverUrl: coverUrl(game.coverFileId) };
    },
  );

  app.post('/api/games', async (request, reply) => {
    const parsed = gameCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: '参数不正确',
          details: parsed.error.flatten(),
        },
      });
    }

    return reply.status(201).send(createGame(app.dbManager.get(), parsed.data));
  });

  app.patch<{ Params: { id: string } }>(
    '/api/games/:id',
    async (request) => {
      const parsed = gameUpdateSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ApiError(
          'VALIDATION_ERROR',
          '参数不正确',
          400,
          parsed.error.flatten(),
        );
      }

      const game = updateGame(
        app.dbManager.get(),
        request.params.id,
        parsed.data,
      );
      if (!game) throw new ApiError('GAME_NOT_FOUND', '游戏不存在', 404);
      return game;
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/api/games/:id',
    async (request) => {
      const db = app.dbManager.get();
      const game = getGame(db, request.params.id);
      if (!game) throw new ApiError('GAME_NOT_FOUND', '游戏不存在', 404);

      if (game.coverFileId) {
        await app.fileService.delete(game.coverFileId);
      }
      deleteGame(db, game.id);
      return { ok: true };
    },
  );

  app.post<{ Params: { id: string } }>(
    '/api/games/:id/playtime',
    async (request) => {
      const parsed = gamePlaytimeSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ApiError(
          'VALIDATION_ERROR',
          '参数不正确',
          400,
          parsed.error.flatten(),
        );
      }

      const game = addPlaytime(
        app.dbManager.get(),
        request.params.id,
        parsed.data.minutes,
      );
      if (!game) throw new ApiError('GAME_NOT_FOUND', '游戏不存在', 404);
      return game;
    },
  );

  app.post<{ Params: { id: string } }>(
    '/api/games/:id/cover',
    async (request) => {
      const db = app.dbManager.get();
      const current = getGame(db, request.params.id);
      if (!current) throw new ApiError('GAME_NOT_FOUND', '游戏不存在', 404);

      const part = await request.file();
      if (!part) {
        throw new ApiError('VALIDATION_ERROR', '请选择图片', 400);
      }
      if (!IMAGE_TYPES.includes(part.mimetype)) {
        throw new ApiError('INVALID_IMAGE', '只支持 JPG/PNG/WebP 图片', 400);
      }

      let buffer: Buffer;
      try {
        buffer = await part.toBuffer();
      } catch {
        throw new ApiError('FILE_TOO_LARGE', '图片过大', 400);
      }

      const record = await app.fileService.save(
        buffer,
        part.filename,
        part.mimetype,
        'cover',
        'covers',
      );

      if (current.coverFileId) {
        await app.fileService.delete(current.coverFileId);
      }

      const game = setCover(db, current.id, record.id)!;
      return { ...game, coverUrl: coverUrl(record.id) };
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/api/games/:id/cover',
    async (request) => {
      const db = app.dbManager.get();
      const current = getGame(db, request.params.id);
      if (!current) throw new ApiError('GAME_NOT_FOUND', '游戏不存在', 404);

      if (current.coverFileId) {
        await app.fileService.delete(current.coverFileId);
      }
      const game = setCover(db, current.id, null)!;
      return { ...game, coverUrl: null };
    },
  );
}
