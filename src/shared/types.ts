export type LocalDate = string;
export type Theme = 'light' | 'dark' | 'system';
export type WeightUnit = 'kg' | 'jin';
export type TaskCategory = 'work' | 'life' | 'other';
export type TaskPriority = 'high' | 'medium' | 'low';
export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type MealKind = 'plan' | 'actual';
export type StudyMaterialType = 'link' | 'note' | 'file';
export type StudyStatus = 'not_started' | 'learning' | 'completed';
export type ExerciseType = 'weight' | 'bodyweight';
export type GameStatus = 'wishlist' | 'playing' | 'completed' | 'paused';
export type StatsView = 'week' | 'month' | 'year';

export interface Memo {
  id: string;
  text: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  date: LocalDate;
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  time: string | null;
  note: string;
  done: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  goal: string;
  weeklyTargetMinutes: number;
  archived: boolean;
  createdAt: string;
}

export interface StudyArrangement {
  id: string;
  subjectId: string;
  date: LocalDate;
  content: string;
  plannedMinutes: number;
  done: boolean;
  createdAt: string;
}

export interface StudySession {
  id: string;
  subjectId: string;
  materialId: string | null;
  arrangementId: string | null;
  date: LocalDate;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  note: string;
}

export interface StudyTimer {
  status: 'idle' | 'running' | 'paused';
  subjectId: string | null;
  materialId: string | null;
  arrangementId: string | null;
  startedAt: string | null;
  accumulatedSeconds: number;
}

export interface FileRecord {
  id: string;
  originalName: string;
  mime: string;
  size: number;
  kind: 'material' | 'checkin' | 'cover';
  createdAt: string;
}

export interface Material {
  id: string;
  type: StudyMaterialType;
  title: string;
  subjectId: string | null;
  url: string | null;
  fileId: string | null;
  status: StudyStatus;
  progress: number;
  tags: string[];
  excerpt: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckinPhoto {
  id: string;
  subjectId: string;
  date: LocalDate;
  fileId: string;
  sortOrder: number;
  createdAt: string;
}

export interface CheckinSummary {
  photos: CheckinPhoto[];
  days: number;
  totalPhotos: number;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  type: ExerciseType;
  notes: string;
  builtIn: boolean;
}

export interface PlanExercise {
  exerciseId: string;
  targetSets: number;
  targetReps: string;
  sortOrder: number;
}

export interface PlanDay {
  weekday: number;
  name: string;
  isRest: boolean;
  exercises: PlanExercise[];
}

export interface WorkoutSet {
  id: string;
  sessionId: string;
  exerciseId: string | null;
  exerciseName: string;
  setNo: number;
  weightKg: number | null;
  reps: number;
  done: boolean;
}

export interface WorkoutSession {
  id: string;
  date: LocalDate;
  name: string;
  status: 'draft' | 'completed';
  startAt: string;
  endAt: string | null;
  durationMinutes: number | null;
  note: string;
  sets: WorkoutSet[];
}

export interface ExerciseUpgrade {
  id: string;
  exerciseId: string | null;
  exerciseName: string;
  date: LocalDate;
  fromWeightKg: number;
  toWeightKg: number;
  note: string;
  createdAt: string;
}

export interface WeightLog {
  id: string;
  date: LocalDate;
  weightKg: number;
  createdAt: string;
}

export interface Food {
  id: string;
  name: string;
  category: string;
  unit: 'g' | 'ml';
  per100Calories: number;
  per100Protein: number;
  servingName: string | null;
  servingAmount: number | null;
  builtIn: boolean;
}

export interface MealEntry {
  id: string;
  date: LocalDate;
  meal: Meal;
  kind: MealKind;
  foodId: string | null;
  foodName: string;
  amount: number;
  unit: 'g' | 'ml';
  servingLabel: string | null;
  per100Calories: number;
  per100Protein: number;
  calories: number;
  protein: number;
  createdAt: string;
}

export interface MealState {
  date: LocalDate;
  meal: Meal;
  done: boolean;
}

export interface MealBucket {
  meal: Meal;
  plannedEntries: MealEntry[];
  actualEntries: MealEntry[];
  plannedCalories: number;
  plannedProtein: number;
  actualCalories: number;
  actualProtein: number;
  done: boolean;
}

export interface DietDay {
  date: LocalDate;
  meals: MealBucket[];
  summary: {
    calories: number;
    protein: number;
    waterMl: number;
    waterTarget: number | null;
    weightKg: number | null;
    weightLoggedAt: string | null;
  };
  targets: {
    calorieTarget: number | null;
    proteinTarget: number | null;
    waterTarget: number | null;
  };
}

export interface WaterLog {
  id: string;
  date: LocalDate;
  amountMl: number;
  createdAt: string;
}

export interface Game {
  id: string;
  title: string;
  platform: string;
  status: GameStatus;
  rating: number | null;
  playtimeMinutes: number;
  startDate: LocalDate | null;
  finishDate: LocalDate | null;
  coverFileId: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type GameWithCover = Game & { coverUrl: string | null };

export interface GameStats {
  playing: number;
  wishlist: number;
  completed: number;
  paused: number;
  totalMinutes: number;
  completedThisYear: number;
  recentCompleted: Game[];
  currentPlaying: Game | null;
}

export interface DataInfo {
  dataDir: string;
  counts: {
    tasks: number;
    memos: number;
    subjects: number;
    materials: number;
    checkins: number;
    sessions: number;
    workouts: number;
    meals: number;
    games: number;
  };
  storage: {
    dbBytes: number;
    filesBytes: number;
    totalBytes: number;
  };
  lastBackupAt: string | null;
  version: string;
}

export interface Settings {
  theme: Theme;
  weekStart: 0 | 1;
  weightUnit: WeightUnit;
  calorieTarget: number | null;
  proteinTarget: number | null;
  waterTarget: number | null;
  lastBackupAt: string | null;
}

export interface SeriesPoint {
  label: string;
  date: string;
  value: number | null;
}
