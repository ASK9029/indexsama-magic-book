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

const tagsSchema = z.array(z.string().trim().min(1).max(30)).max(20);

export const materialLinkCreateSchema = z.object({
  url: z.string().trim().min(1).max(2000),
  title: z.string().trim().min(1).max(200),
  subjectId: z.string().nullable().optional(),
  tags: tagsSchema.optional().default([]),
  excerpt: z.string().max(2000).optional().default(''),
});

export const materialNoteCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().max(100000).optional().default(''),
  subjectId: z.string().nullable().optional(),
  tags: tagsSchema.optional().default([]),
});

export const materialUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  subjectId: z.string().nullable().optional(),
  tags: tagsSchema.optional(),
  status: z.enum(['not_started', 'learning', 'completed']).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  excerpt: z.string().max(2000).optional(),
  body: z.string().max(100000).optional(),
});

export const exerciseCreateSchema = z.object({
  name: z.string().trim().min(1).max(50),
  muscleGroup: z.enum(['胸', '背', '腿', '肩', '手臂', '核心', '全身']),
  equipment: z.enum(['杠铃', '哑铃', '器械', '绳索', '自重', '其他']),
  type: z.enum(['weight', 'bodyweight']),
  notes: z.string().max(500).optional().default(''),
});

export const exerciseUpdateSchema = exerciseCreateSchema.partial();

export const planExerciseSchema = z.object({
  exerciseId: z.string().min(1),
  targetSets: z.number().int().min(1).max(20),
  targetReps: z.string().trim().min(1).max(30),
  sortOrder: z.number().int().min(0).optional(),
});

export const planDaySchema = z.object({
  name: z.string().max(50).optional().default(''),
  isRest: z.boolean(),
  exercises: z.array(planExerciseSchema).max(30),
});

export const workoutStartSchema = z.object({
  date: dateSchema,
  name: z.string().trim().max(50).optional(),
  exercises: z.array(planExerciseSchema).optional(),
});

export const workoutSetCreateSchema = z.object({
  exerciseId: z.string().nullable().optional(),
  exerciseName: z.string().trim().min(1).max(50),
  weightKg: z.number().nonnegative().nullable().optional(),
  reps: z.number().int().min(1).max(1000),
  done: z.boolean().optional(),
});

export const workoutSetUpdateSchema = z.object({
  weightKg: z.number().nonnegative().nullable().optional(),
  reps: z.number().int().min(1).max(1000).optional(),
  done: z.boolean().optional(),
});

export const workoutSessionUpdateSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  note: z.string().max(2000).optional(),
  durationMinutes: z.number().int().min(1).max(1440).optional(),
  status: z.enum(['draft', 'completed']).optional(),
});

export const workoutFinishSchema = z.object({
  durationMinutes: z.number().int().min(1).max(1440),
  note: z.string().max(2000).optional().default(''),
  confirmEmpty: z.boolean().optional().default(false),
});

export const upgradeCreateSchema = z.object({
  exerciseId: z.string().min(1),
  date: dateSchema,
  fromWeightKg: z.number().positive().optional(),
  toWeightKg: z.number().positive(),
  note: z.string().max(500).optional().default(''),
});

export const upgradeUpdateSchema = upgradeCreateSchema.partial();

export const weightCreateSchema = z.object({
  date: dateSchema,
  weightKg: z.number().positive().max(1000),
});

export const weightUpdateSchema = weightCreateSchema.partial();

export const FOOD_CATEGORIES = [
  '主食',
  '肉蛋奶',
  '蔬菜',
  '水果',
  '豆类',
  '零食',
  '饮料',
  '家常菜',
] as const;

export const foodCreateSchema = z.object({
  name: z.string().trim().min(1).max(50),
  category: z.enum(FOOD_CATEGORIES),
  unit: z.enum(['g', 'ml']),
  per100Calories: z.number().nonnegative().max(10000),
  per100Protein: z.number().nonnegative().max(1000),
  servingName: z.string().max(30).nullable().optional(),
  servingAmount: z.number().positive().max(10000).nullable().optional(),
});

export const foodUpdateSchema = foodCreateSchema.partial();

export const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export const mealEntryCreateSchema = z.object({
  date: dateSchema,
  meal: z.enum(MEALS),
  kind: z.enum(['plan', 'actual']),
  foodId: z.string().min(1),
  amount: z.number().positive().max(10000),
  unit: z.enum(['g', 'ml']),
  servingLabel: z.string().max(30).nullable().optional(),
});

export const mealEntryUpdateSchema = z.object({
  amount: z.number().positive().max(10000).optional(),
  meal: z.enum(MEALS).optional(),
});

export const mealDoneSchema = z.object({
  date: dateSchema,
  done: z.boolean(),
});

export const mealCopyPlanSchema = z.object({
  date: dateSchema,
  mode: z.enum(['replace', 'append']),
});

export const mealClearSchema = z.object({
  date: dateSchema,
  kind: z.enum(['plan', 'actual']),
});

export const waterCreateSchema = z.object({
  date: dateSchema,
  amountMl: z.number().int().positive().max(5000),
});

export const waterUndoSchema = z.object({
  date: dateSchema,
});

export const GAME_STATUSES = [
  'wishlist',
  'playing',
  'completed',
  'paused',
] as const;

export const gameCreateSchema = z.object({
  title: z.string().trim().min(1).max(100),
  platform: z.string().trim().min(1).max(50),
  status: z.enum(GAME_STATUSES).optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  playtimeMinutes: z.number().int().nonnegative().max(1000000).optional(),
  startDate: dateSchema.nullable().optional(),
  finishDate: dateSchema.nullable().optional(),
  notes: z.string().max(5000).optional(),
});

export const gameUpdateSchema = gameCreateSchema.partial();

export const gamePlaytimeSchema = z.object({
  minutes: z.number().int().nonnegative().max(10000),
});

export const clearDataSchema = z.object({
  confirm: z.literal('清空'),
});
