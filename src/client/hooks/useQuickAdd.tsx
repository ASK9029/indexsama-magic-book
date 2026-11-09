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
import { TaskModal } from '@client/features/today/TaskModal';
import { todayLocal } from '@client/lib/clientDates';
import { useTasks, type TaskInput } from './useTasks';

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
  const { create } = useTasks(todayLocal());
  const { toast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [memoOpen, setMemoOpen] = useState(false);

  const openQuickAdd = useCallback(
    (kind: QuickAddKind) => {
      setMenuOpen(false);
      if (kind === 'task') {
        setTaskOpen(true);
        return;
      }
      if (kind === 'memo') {
        setMemoOpen(true);
        return;
      }
      toast('模块接入后开放', 'info');
    },
    [toast],
  );

  const value = useMemo(
    () => ({ openMenu: () => setMenuOpen(true), openQuickAdd }),
    [openQuickAdd],
  );

  const save = (input: TaskInput) => {
    create.mutate(input);
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
        date={todayLocal()}
        onSave={save}
      />
      <MemoDrawer open={memoOpen} onClose={() => setMemoOpen(false)} />
    </QuickAddContext.Provider>
  );
}
