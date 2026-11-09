import { describe, it, expect, vi, afterEach } from 'vitest';
import { apiGet } from '../../src/client/api/client';

afterEach(() => vi.unstubAllGlobals());

describe('api client', () => {
  it('throws ApiError on 4xx with server message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: '没有' } }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    await expect(apiGet('/api/nope')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: '没有',
    });
  });
});
