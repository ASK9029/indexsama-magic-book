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

export const subjectCreateSchema = z.object({
  name: z.string().trim().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, '颜色格式应为 #RRGGBB'),
  goal: z.string().max(200).optional().default(''),
  weeklyTargetMinutes: z.number().int().min(0).max(10080).optional().default(0),
});

export const subjectUpdateSchema = subjectCreateSchema.partial();

export const arrangementCreateSchema = z.object({
  subjectId: z.string().min(1),
  date: dateSchema,
  content: z.string().trim().min(1).max(500),
  plannedMinutes: z.number().int().min(1).max(600),
});

export const arrangementUpdateSchema = arrangementCreateSchema
  .partial()
  .extend({ done: z.boolean().optional() });

export const timerStartSchema = z.object({
  subjectId: z.string().min(1),
  materialId: z.string().nullable().optional(),
  arrangementId: z.string().nullable().optional(),
});

export const timerStopSchema = z.object({
  note: z.string().max(500).optional().default(''),
});

export const sessionCreateSchema = z.object({
  subjectId: z.string().min(1),
  materialId: z.string().nullable().optional(),
  arrangementId: z.string().nullable().optional(),
  date: dateSchema,
  startAt: z.string().min(1),
  endAt: z.string().min(1),
  durationMinutes: z.number().int().min(1).max(1440),
  note: z.string().max(500).optional().default(''),
});

export const sessionUpdateSchema = sessionCreateSchema.partial();
