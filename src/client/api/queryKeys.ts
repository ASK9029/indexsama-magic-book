export const queryKeys = {
  settings: ['settings'] as const,
  memos: ['memos'] as const,
  tasks: (date: string) => ['tasks', date] as const,
  day: (date: string) => ['day', date] as const,
  home: ['home'] as const,
  subjects: ['subjects'] as const,
  archivedSubjects: ['subjects', 'archived'] as const,
  subject: (id: string) => ['subject', id] as const,
  arrangements: (date: string) => ['arrangements', date] as const,
  studyTimer: ['studyTimer'] as const,
  studySessions: (subjectId?: string) =>
    ['studySessions', subjectId ?? 'all'] as const,
  studyStats: (week: string) => ['studyStats', week] as const,
  checkins: (subjectId: string) => ['checkins', subjectId] as const,
  materials: (filters: Record<string, string | undefined>) =>
    ['materials', filters] as const,
  material: (id: string) => ['material', id] as const,
  fitnessPlan: ['fitness', 'plan'] as const,
  exercises: (filters: Record<string, string | undefined>) =>
    ['exercises', filters] as const,
  currentWeights: ['currentWeights'] as const,
  upgrades: (exerciseId?: string) => ['upgrades', exerciseId ?? 'all'] as const,
  workoutSession: (id: string) => ['fitness', 'session', id] as const,
  dietDay: (date: string) => ['dietDay', date] as const,
  water: (date: string) => ['water', date] as const,
  games: (filters: Record<string, string | undefined>) => ['games', filters] as const,
  game: (id: string) => ['game', id] as const,
  gameStats: ['gameStats'] as const,
  fitnessStats: (view: string, anchor: string, exerciseId?: string) =>
    ['stats', 'fitness', view, anchor, exerciseId ?? ''] as const,
  dietStats: (view: string, anchor: string) => ['stats', 'diet', view, anchor] as const,
  weights: (from?: string, to?: string) =>
    ['weights', from ?? '', to ?? ''] as const,
  foods: (filters: Record<string, string | undefined>) =>
    ['foods', filters] as const,
  recentFoods: ['foods', 'recent'] as const,
  frequentFoods: ['foods', 'frequent'] as const,
};
