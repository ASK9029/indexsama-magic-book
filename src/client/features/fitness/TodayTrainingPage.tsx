import { Button } from '@client/components/ui/Button';
import { Card } from '@client/components/ui/Card';
import { useTodayWorkout, useWorkoutMutations } from '@client/hooks/useWorkout';
import { todayLocal } from '@client/lib/clientDates';
import { useNavigate } from 'react-router-dom';

export function TodayTrainingPage() {
  const date = todayLocal();
  const navigate = useNavigate();
  const { data, isLoading } = useTodayWorkout(date);
  const { start } = useWorkoutMutations();

  const plan = data?.plan;
  const session = data?.session ?? null;

  const startTraining = () => {
    start.mutate(
      {
        date,
        name: plan?.isRest ? '临时训练' : plan?.name || '训练',
      },
      {
        onSuccess: (created) => navigate(`/fitness/session/${created.id}`),
      },
    );
  };

  return (
    <Card>
      <h2 className="text-base font-medium text-ink">今天 · {date}</h2>
      {isLoading ? (
        <p className="mt-3 text-sm text-muted">正在加载…</p>
      ) : (
        <>
          <p className="mt-3 text-lg font-medium text-ink">
            {plan?.isRest ? '休息日' : plan?.name || '未安排训练'}
          </p>
          {!plan?.isRest && plan ? (
            <p className="mt-1 text-sm text-muted">
              {plan.exercises.length} 个动作 ·{' '}
              {plan.exercises.reduce((sum, item) => sum + item.targetSets, 0)} 组
            </p>
          ) : null}

          {session ? (
            <div className="mt-4 flex items-center gap-2">
              <span className="rounded bg-canvas px-2 py-0.5 text-xs text-muted">
                {session.status === 'completed' ? '已完成' : '训练中'}
              </span>
              <Button
                onClick={() => navigate(`/fitness/session/${session.id}`)}
              >
                {session.status === 'completed' ? '查看记录' : '继续训练'}
              </Button>
            </div>
          ) : (
            <Button className="mt-4" onClick={startTraining}>
              {plan?.isRest ? '临时练一次' : '开始训练'}
            </Button>
          )}

          <p className="mt-3 text-xs text-muted">
            健身不显示勾选框；状态由训练会话决定。
          </p>
        </>
      )}
    </Card>
  );
}
