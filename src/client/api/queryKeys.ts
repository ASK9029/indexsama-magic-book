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
  materials: (filters: Record<string, string | undefined>) => ['materials', filters] as const,
  fitnessPlan: ['fitness', 'plan'] as const,
  workoutSession: (id: string) => ['fitness', 'session', id] as const,
  dietDay: (date: string) => ['diet', 'day', date] as const,
  games: (filters: Record<string, string | undefined>) => ['games', filters] as const,
  fitnessStats: (view: string, anchor: string) =>
    ['stats', 'fitness', view, anchor] as const,
  dietStats: (view: string, anchor: string) => ['stats', 'diet', view, anchor] as const,
};
