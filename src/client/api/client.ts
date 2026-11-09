export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function notify(type: 'online' | 'offline'): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(`api:${type}`));
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    notify('offline');
    throw new ApiError('NETWORK_ERROR', '无法连接本地服务', 0);
  }

  const text = await response.text();
  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const payload = data as ApiErrorBody | null;
    throw new ApiError(
      payload?.error?.code ?? 'HTTP_ERROR',
      payload?.error?.message ?? '请求失败',
      response.status,
      payload?.error?.details,
    );
  }

  notify('online');
  return data as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>('GET', path);
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('POST', path, body);
}

export function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('PUT', path, body);
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('PATCH', path, body);
}

export function apiDelete<T>(path: string): Promise<T> {
  return request<T>('DELETE', path);
}

export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, { method: 'POST', body: form });
  } catch {
    notify('offline');
    throw new ApiError('NETWORK_ERROR', '无法连接本地服务', 0);
  }

  const text = await response.text();
  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const payload = data as ApiErrorBody | null;
    throw new ApiError(
      payload?.error?.code ?? 'HTTP_ERROR',
      payload?.error?.message ?? '请求失败',
      response.status,
      payload?.error?.details,
    );
  }

  notify('online');
  return data as T;
}
