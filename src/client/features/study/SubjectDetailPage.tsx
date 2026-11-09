import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@client/components/ui/Button';
import { Card } from '@client/components/ui/Card';
import { EmptyState } from '@client/components/ui/EmptyState';
import { PageHeader } from '@client/components/ui/PageHeader';
import { Tabs } from '@client/components/ui/Tabs';
import { useSubjects } from '@client/hooks/useSubjects';

export function SubjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const active = useSubjects(false);
  const archived = useSubjects(true);
  const [tab, setTab] = useState('overview');

  const subject = [...active.subjects, ...archived.subjects].find(
    (item) => item.id === id,
  );
  const isLoading = active.isLoading || archived.isLoading;

  if (isLoading) {
    return <p className="text-sm text-muted">正在加载…</p>;
  }

  if (!subject) {
    return (
      <div>
        <Link to="/study/subjects" className="text-sm text-accent">
          ← 返回科目
        </Link>
        <div className="mt-4">
          <EmptyState title="科目不存在" description="它可能已经被归档或链接有误。" />
        </div>
      </div>
    );
  }

  const weeklyHours = (subject.weeklyTargetMinutes / 60).toFixed(1);

  return (
    <div>
      <div className="mb-3">
        <Link to="/study/subjects" className="text-sm text-accent">
          ← 返回科目
        </Link>
      </div>

      <PageHeader
        title={subject.name}
        subtitle={subject.goal || '还没有写目标。'}
        action={
          <Button variant="secondary" disabled>
            开始学习
          </Button>
        }
      />

      <Tabs
        items={[
          { value: 'overview', label: '概览' },
          { value: 'materials', label: '资料' },
          { value: 'records', label: '记录' },
        ]}
        value={tab}
        onChange={setTab}
      />

      <div className="mt-5">
        {tab === 'overview' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <h2 className="text-base font-medium text-ink">概览</h2>
              <p className="mt-2 text-sm text-muted">每周目标：{weeklyHours} 小时</p>
              <p className="mt-1 text-sm text-muted">本周学习：0 分钟</p>
              <p className="mt-1 text-sm text-muted">累计学习：0 分钟</p>
              <p className="mt-2 text-xs text-muted">周统计将在 Task 11 接入。</p>
            </Card>
            <Card>
              <h2 className="text-base font-medium text-ink">最近记录</h2>
              <p className="mt-2 text-sm text-muted">学习记录将在 Task 11 接入。</p>
            </Card>
          </div>
        ) : tab === 'materials' ? (
          <EmptyState title="资料" description="学习资料将在 Task 13 接入。" />
        ) : (
          <EmptyState title="记录" description="学习记录将在 Task 11 接入。" />
        )}
      </div>
    </div>
  );
}
