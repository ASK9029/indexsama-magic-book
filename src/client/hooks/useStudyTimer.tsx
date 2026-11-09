import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@client/api/client';
import { queryKeys } from '@client/api/queryKeys';
import { Button } from '@client/components/ui/Button';
import { Modal } from '@client/components/ui/Modal';
import { useToast } from '@client/components/ui/Toast';
import type { StudySession, StudyTimer } from '@shared/types';

interface StudyTimerValue {
  timer: StudyTimer | null;
  elapsedSeconds: number;
  isLoading: boolean;
  start: (subjectId: string, materialId?: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

const StudyTimerContext = createContext<StudyTimerValue>({
  timer: null,
  elapsedSeconds: 0,
  isLoading: false,
  start: () => undefined,
  pause: () => undefined,
  resume: () => undefined,
  stop: () => undefined,
});

export function useStudyTimer(): StudyTimerValue {
  return useContext(StudyTimerContext);
}

export function StudyTimerProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const query = useQuery({
    queryKey: queryKeys.studyTimer,
    queryFn: () => apiGet<StudyTimer>('/api/study/timer'),
  });

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const timer = query.data ?? null;
  const elapsedSeconds = timer
    ? timer.accumulatedSeconds +
      (timer.status === 'running' && timer.startedAt
        ? Math.max(
            0,
            Math.floor((now - new Date(timer.startedAt).getTime()) / 1000),
          )
        : 0)
    : 0;

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['studyTimer'] });
    void queryClient.invalidateQueries({ queryKey: ['studySessions'] });
    void queryClient.invalidateQueries({ queryKey: ['studyStats'] });
    void queryClient.invalidateQueries({ queryKey: ['subjects'] });
  };

  const onError = (error: unknown) => {
    toast(error instanceof Error ? error.message : '操作失败', 'error');
  };

  const start = useMutation({
    mutationFn: (input: { subjectId: string; materialId?: string }) =>
      apiPost<StudyTimer>('/api/study/timer/start', input),
    onSuccess: refresh,
    onError,
  });

  const pause = useMutation({
    mutationFn: () => apiPost<StudyTimer>('/api/study/timer/pause'),
    onSuccess: refresh,
    onError,
  });

  const resume = useMutation({
    mutationFn: () => apiPost<StudyTimer>('/api/study/timer/resume'),
    onSuccess: refresh,
    onError,
  });

  const stop = useMutation({
    mutationFn: () =>
      apiPost<{ session: StudySession | null }>('/api/study/timer/stop', {}),
    onSuccess: (data) => {
      refresh();
      toast(
        data.session ? '学习记录已保存' : '不足 1 分钟，未记录',
        data.session ? 'success' : 'info',
      );
    },
    onError,
  });

  const [promptOpen, setPromptOpen] = useState(false);
  const prompted = useRef(false);

  useEffect(() => {
    if (!query.isSuccess || prompted.current) return;
    prompted.current = true;
    if (query.data && query.data.status !== 'idle') setPromptOpen(true);
  }, [query.isSuccess, query.data]);

  const value = useMemo(
    () => ({
      timer,
      elapsedSeconds,
      isLoading: query.isLoading,
      start: (subjectId: string, materialId?: string) =>
        start.mutate({ subjectId, materialId }),
      pause: () => pause.mutate(),
      resume: () => resume.mutate(),
      stop: () => stop.mutate(),
    }),
    [timer, elapsedSeconds, query.isLoading, start, pause, resume, stop],
  );

  return (
    <StudyTimerContext.Provider value={value}>
      {children}
      <Modal
        open={promptOpen}
        onClose={() => setPromptOpen(false)}
        title="继续上次学习？"
      >
        <p className="mb-5 text-sm text-muted">
          检测到未结束的学习计时。可以继续，或结束并保存这次记录。
        </p>
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setPromptOpen(false);
              stop.mutate();
            }}
          >
            结束并保存
          </Button>
          <Button onClick={() => setPromptOpen(false)}>继续计时</Button>
        </div>
      </Modal>
    </StudyTimerContext.Provider>
  );
}
