import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { routes } from './router';
import { ToastProvider } from './components/ui/Toast';
import { ConfirmProvider } from './components/ui/Confirm';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ThemeSync } from './components/layout/ThemeSync';
import { QuickAddProvider } from './hooks/useQuickAdd';
import { StudyTimerProvider } from './hooks/useStudyTimer';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

const router = createBrowserRouter(routes);

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeSync />
        <ToastProvider>
          <ConfirmProvider>
            <QuickAddProvider>
              <StudyTimerProvider>
                <RouterProvider router={router} />
              </StudyTimerProvider>
            </QuickAddProvider>
          </ConfirmProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
