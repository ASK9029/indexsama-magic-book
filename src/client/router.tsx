import type { RouteObject } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { EmptyState } from './components/ui/EmptyState';
import { PageHeader } from './components/ui/PageHeader';

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
      { index: true, element: <Placeholder title="首页" /> },
      { path: 'today', element: <Placeholder title="今日计划" /> },
      { path: 'study/subjects', element: <Placeholder title="学习科目" /> },
      { path: 'study/materials', element: <Placeholder title="学习资料" /> },
      { path: 'fitness', element: <Placeholder title="健身计划" /> },
      { path: 'diet', element: <Placeholder title="饮食计划" /> },
      { path: 'games', element: <Placeholder title="游戏娱乐" /> },
      { path: 'settings', element: <Placeholder title="数据与设置" /> },
    ],
  },
];
