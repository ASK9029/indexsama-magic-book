import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@client/api/client';
import { queryKeys } from '@client/api/queryKeys';

export interface StudyWeekStats {
  days: { date: string; minutes: number }[];
  totalMinutes: number;
  bySubject: { subjectId: string; minutes: number }[];
}

export function useStudyStats(week: string) {
  return useQuery({
    queryKey: queryKeys.studyStats(week),
    queryFn: () =>
      apiGet<StudyWeekStats>(
        `/api/study/stats?week=${encodeURIComponent(week)}`,
      ),
  });
}
