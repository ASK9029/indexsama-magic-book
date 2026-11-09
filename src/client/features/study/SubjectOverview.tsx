import { Card } from '@client/components/ui/Card';
import { useStudySessions } from '@client/hooks/useStudySessions';
import { useStudyStats } from '@client/hooks/useStudyStats';
import { todayLocal } from '@client/lib/clientDates';
import { formatMinutes } from '@shared/format';
import type { Subject } from '@shared/types';

export function SubjectOverview({ subject }: { subject: Subject }) {
  const { sessions } = useStudySessions(subject.id);
  const { data: stats } = useStudyStats(todayLocal());

  const totalMinutes = sessions.reduce(
    (sum, session) => sum + session.durationMinutes,
    0,
  );
  const weekMinutes =
    stats?.bySubject.find((item) => item.subjectId === subject.id)?.minutes ?? 0;
  const weeklyHours = (subject.weeklyTargetMinutes / 60).toFixed(1);

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-base font-medium text-ink">概览</h2>
        <div className="mt-3 grid gap-2 text-sm text-muted sm:grid-cols-2">
          <p>每周目标：{weeklyHours} 小时</p>
          <p>本周学习：{formatMinutes(weekMinutes)}</p>
          <p>累计学习：{formatMinutes(totalMinutes)}</p>
          <p>学习记录：{sessions.length} 条</p>
          <p>资料：0 份</p>
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-medium text-ink">最近记录</h2>
        {sessions.length === 0 ? (
          <p className="mt-2 text-sm text-muted">还没有学习记录。</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {sessions.slice(0, 3).map((session) => (
              <li key={session.id} className="flex justify-between text-sm">
                <span className="text-muted">{session.date}</span>
                <span className="text-ink">
                  {formatMinutes(session.durationMinutes)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
