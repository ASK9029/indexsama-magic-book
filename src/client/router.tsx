import type { RouteObject } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { EmptyState } from './components/ui/EmptyState';
import { PageHeader } from './components/ui/PageHeader';
import { SettingsPage } from './features/settings/SettingsPage';
import { HomePage } from './features/home/HomePage';
import { TodayPage } from './features/today/TodayPage';
import { SubjectsPage } from './features/study/SubjectsPage';
import { SubjectDetailPage } from './features/study/SubjectDetailPage';
import { MaterialsPage } from './features/study/MaterialsPage';
import { MaterialDetailPage } from './features/study/MaterialDetailPage';
import { FitnessPage } from './features/fitness/FitnessPage';

function Placeholder({ title }: { title: string }) {
  return (
    <div>
      <PageHeader title={title} subtitle="页面建设中" />
      <EmptyState
        title="这里还在搭建"
        description="按开发计划，下一步接入这个模块。"
      />
    </div>
  );
}

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'today', element: <TodayPage /> },
      { path: 'study/subjects', element: <SubjectsPage /> },
      { path: 'study/subjects/:id', element: <SubjectDetailPage /> },
      { path: 'study/materials', element: <MaterialsPage /> },
      { path: 'study/materials/:id', element: <MaterialDetailPage /> },
      { path: 'fitness', element: <FitnessPage /> },
      { path: 'diet', element: <Placeholder title="饮食计划" /> },
      { path: 'games', element: <Placeholder title="游戏娱乐" /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
];
