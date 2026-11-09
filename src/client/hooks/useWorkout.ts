import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from '@client/api/client';
import type { PlanDay, WorkoutSession } from '@shared/types';

export interface TodayWorkout {
  plan: PlanDay;
  session: WorkoutSession | null;
}

export function useTodayWorkout(date: string) {
  return useQuery({
    queryKey: ['fitnessToday', date],
    queryFn: () =>
      apiGet<TodayWorkout>(`/api/fitness/today?date=${encodeURIComponent(date)}`),
  });
}

export function useWorkoutSession(id: string) {
  return useQuery({
    queryKey: ['workout', id],
    queryFn: () => apiGet<WorkoutSession>(`/api/fitness/sessions/${id}`),
  });
}

export function useWorkoutHistory() {
  return useQuery({
    queryKey: ['workoutHistory'],
    queryFn: () => apiGet<WorkoutSession[]>('/api/fitness/sessions'),
  });
}

export function useWorkoutMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['workout'] });
    void queryClient.invalidateQueries({ queryKey: ['fitnessToday'] });
    void queryClient.invalidateQueries({ queryKey: ['workoutHistory'] });
  };

  const start = useMutation({
    mutationFn: (input: { date: string; name?: string }) =>
      apiPost<WorkoutSession>('/api/fitness/sessions', input),
    onSuccess: invalidate,
  });

  const updateSession = useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<WorkoutSession>;
    }) => apiPatch<WorkoutSession>(`/api/fitness/sessions/${id}`, patch),
    onSuccess: invalidate,
  });

  const deleteSession = useMutation({
    mutationFn: (id: string) =>
      apiDelete<{ ok: true }>(`/api/fitness/sessions/${id}`),
    onSuccess: invalidate,
  });

  const addSet = useMutation({
    mutationFn: ({
      sessionId,
      input,
    }: {
      sessionId: string;
      input: {
        exerciseId?: string | null;
        exerciseName: string;
        weightKg?: number | null;
        reps: number;
        done?: boolean;
      };
    }) => apiPost(`/api/fitness/sessions/${sessionId}/sets`, input),
    onSuccess: invalidate,
  });

  const updateSet = useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: { weightKg?: number | null; reps?: number; done?: boolean };
    }) => apiPatch(`/api/fitness/sets/${id}`, patch),
    onSuccess: invalidate,
  });

  const deleteSet = useMutation({
    mutationFn: (id: string) =>
      apiDelete<{ ok: true }>(`/api/fitness/sets/${id}`),
    onSuccess: invalidate,
  });

  const finish = useMutation({
    mutationFn: ({
      id,
      durationMinutes,
      note,
      confirmEmpty,
    }: {
      id: string;
      durationMinutes: number;
      note?: string;
      confirmEmpty?: boolean;
    }) =>
      apiPost<WorkoutSession>(`/api/fitness/sessions/${id}/finish`, {
        durationMinutes,
        note,
        confirmEmpty,
      }),
    onSuccess: invalidate,
  });

  return {
    start,
    updateSession,
    deleteSession,
    addSet,
    updateSet,
    deleteSet,
    finish,
  };
}
