export const APP_NAME = '我的生活';
export const APP_VERSION = '1.0.0';

export const DEFAULT_SETTINGS = {
  theme: 'light',
  weekStart: 1,
  weightUnit: 'kg',
  calorieTarget: null,
  proteinTarget: null,
  waterTarget: null,
  lastBackupAt: null,
} as const;

export const MEAL_LABELS = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
} as const;

export const SUBJECT_COLORS = [
  '#4C6FA5',
  '#3F7D5C',
  '#C07A45',
  '#7A5FA6',
  '#B45A4A',
  '#3F7D7D',
  '#B56A8A',
  '#77726A',
];
