import type { RouteObject } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { SettingsPage } from './features/settings/SettingsPage';
import { HomePage } from './features/home/HomePage';
import { TodayPage } from './features/today/TodayPage';
import { SubjectsPage } from './features/study/SubjectsPage';
import { SubjectDetailPage } from './features/study/SubjectDetailPage';
import { MaterialsPage } from './features/study/MaterialsPage';
import { MaterialDetailPage } from './features/study/MaterialDetailPage';
import { FitnessPage } from './features/fitness/FitnessPage';
import { SessionPage } from './features/fitness/SessionPage';
import { DietPage } from './features/diet/DietPage';
import { GamesPage } from './features/games/GamesPage';
import { GameDetailPage } from './features/games/GameDetailPage';

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
      { path: 'diet', element: <DietPage /> },
      { path: 'games', element: <GamesPage /> },
      { path: 'games/:id', element: <GameDetailPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  {
    path: '/fitness/session/:id',
    element: <SessionPage />,
  },
];
