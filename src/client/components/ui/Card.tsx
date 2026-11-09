import type { HTMLAttributes } from 'react';
import { cn } from '@client/lib/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn('rounded-card border border-line bg-surface p-5 shadow-sm', className)}
      {...props}
    />
  );
}
