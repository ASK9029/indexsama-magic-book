import type { ReactNode } from 'react';
import { Card } from '@client/components/ui/Card';

export function ChartCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  );
}
