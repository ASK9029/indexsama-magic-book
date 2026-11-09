import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useToast } from '@client/components/ui/Toast';
import { MemoDrawer } from '@client/features/home/MemoDrawer';
import { QuickAddMenu } from '@client/features/home/QuickAddMenu';
import { QuickWaterModal } from '@client/features/home/QuickWaterModal';
import { TaskModal } from '@client/features/today/TaskModal';
import { ArrangementModal } from '@client/features/study/ArrangementModal';
import { WeightModal } from '@client/features/fitness/WeightModal';
import { todayLocal } from '@client/lib/clientDates';
import { useTasks, type TaskInput } from './useTasks';
import { useArrangements } from './useArrangements';
import { useSubjects } from './useSubjects';
import { useWeightMutations } from './useWeights';
import { useWaterMutations } from './useWater';

export type QuickAddKind = 'task' | 'study' | 'weight' | 'water' | 'memo';

interface QuickAddValue {
  openMenu: () => void;
  openQuickAdd: (kind: QuickAddKind) => void;
}

const QuickAddContext = createContext<QuickAddValue>({
  openMenu: () => undefined,
  openQuickAdd: () => undefined,
});

export function useQuickAdd(): QuickAddValue {
  return useContext(QuickAddContext);
}

export function QuickAddProvider({ children }: { children: ReactNode }) {
  const today = todayLocal();
  const { create } = useTasks(today);
  const study = useArrangements(today);
  const { subjects } = useSubjects(false);
  const weight = useWeightMutations();
  const water = useWaterMutations(today);
  const { toast } = useToast();

  const [menuOpen, setMenuOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [memoOpen, setMemoOpen] = useState(false);
  const [studyOpen, setStudyOpen] = useState(false);
  const [weightOpen, setWeightOpen] = useState(false);
  const [waterOpen, setWaterOpen] = useState(false);

  const openQuickAdd = useCallback(
    (kind: QuickAddKind) => {
      setMenuOpen(false);
      if (kind === 'task') return setTaskOpen(true);
      if (kind === 'memo') return setMemoOpen(true);
      if (kind === 'study') return setStudyOpen(true);
      if (kind === 'weight') return setWeightOpen(true);
      if (kind === 'water') return setWaterOpen(true);
    },
    [],
  );

  const value = useMemo(
    () => ({ openMenu: () => setMenuOpen(true), openQuickAdd }),
    [openQuickAdd],
  );

  const saveTask = (input: TaskInput) => {
    create.mutate(input, {
      onSuccess: () => toast('已添加任务', 'success'),
    });
    setTaskOpen(false);
  };

  return (
    <QuickAddContext.Provider value={value}>
      {children}
      <QuickAddMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSelect={openQuickAdd}
      />
      <TaskModal
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        date={today}
        onSave={saveTask}
      />
      <MemoDrawer open={memoOpen} onClose={() => setMemoOpen(false)} />
      <ArrangementModal
        open={studyOpen}
        onClose={() => setStudyOpen(false)}
        date={today}
        subjects={subjects}
        onSave={(input) => {
          study.create.mutate(input, {
            onSuccess: () => toast('已添加学习安排', 'success'),
          });
          setStudyOpen(false);
        }}
      />
      <WeightModal
        open={weightOpen}
        onClose={() => setWeightOpen(false)}
        onSave={(input) => {
          weight.create.mutate(input, {
            onSuccess: () => toast('已记录体重', 'success'),
          });
          setWeightOpen(false);
        }}
      />
      <QuickWaterModal
        open={waterOpen}
        onClose={() => setWaterOpen(false)}
        onAdd={(amountMl) => {
          water.add.mutate(amountMl, {
            onSuccess: () => {
              toast('已记录饮水', 'success');
              setWaterOpen(false);
            },
          });
        }}
      />
    </QuickAddContext.Provider>
  );
}
