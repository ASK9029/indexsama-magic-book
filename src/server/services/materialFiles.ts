import type { StudyStatus } from '@shared/types';
import { ApiError } from '../lib/errors';

export function normalizeMaterialUrl(value: string): string {
  const trimmed = value.trim();
  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(withScheme);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('invalid protocol');
    }
    return url.toString();
  } catch {
    throw new ApiError('INVALID_URL', '链接格式不正确', 400);
  }
}

export function parseTagsField(value: string | undefined): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  } catch {
    // Fall through to comma-separated parsing.
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseStatusField(value: string | undefined): StudyStatus {
  if (value === 'learning' || value === 'completed') return value;
  return 'not_started';
}

export function materialFileSubdir(subjectId: string | null): string {
  return `materials/${subjectId ?? 'unsorted'}`;
}
