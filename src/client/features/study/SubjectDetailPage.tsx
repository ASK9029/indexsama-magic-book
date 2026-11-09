import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@client/components/ui/Button';
import { EmptyState } from '@client/components/ui/EmptyState';
import { PageHeader } from '@client/components/ui/PageHeader';
import { Tabs } from '@client/components/ui/Tabs';
import { useSubjects } from '@client/hooks/useSubjects';
import { useStudyTimer } from '@client/hooks/useStudyTimer';
import { SubjectOverview } from './SubjectOverview';
import { SubjectSessions } from './SubjectSessions';
import { CheckinAlbum } from './CheckinAlbum';

export function SubjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const active = useSubjects(false);
  const archived = useSubjects(true);
  const { start } = useStudyTimer();
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
          <Button variant="secondary" onClick={() => start(subject.id)}>
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
          <div className="space-y-4">
            <SubjectOverview subject={subject} />
            <CheckinAlbum subjectId={subject.id} />
          </div>
        ) : tab === 'materials' ? (
          <EmptyState title="资料" description="学习资料将在 Task 13 接入。" />
        ) : (
          <SubjectSessions subjectId={subject.id} />
        )}
      </div>
    </div>
  );
}
