import { z } from 'zod';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD');
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, '时间格式应为 HH:mm');

export const taskCreateSchema = z.object({
  date: dateSchema,
  title: z.string().trim().min(1).max(200),
  category: z.enum(['work', 'life', 'other']),
  priority: z.enum(['high', 'medium', 'low']),
  time: timeSchema.optional().nullable(),
  note: z.string().max(2000).optional().default(''),
});

export const taskUpdateSchema = taskCreateSchema.partial().extend({
  done: z.boolean().optional(),
});

export const memoCreateSchema = z.object({
  text: z.string().trim().min(1).max(500),
  pinned: z.boolean().optional(),
});

export const memoUpdateSchema = z.object({
  text: z.string().trim().min(1).max(500).optional(),
  pinned: z.boolean().optional(),
});

export const settingsPatchSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  weekStart: z.union([z.literal(0), z.literal(1)]).optional(),
  weightUnit: z.enum(['kg', 'jin']).optional(),
  calorieTarget: z.number().nonnegative().nullable().optional(),
  proteinTarget: z.number().nonnegative().nullable().optional(),
  waterTarget: z.number().nonnegative().nullable().optional(),
});

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
