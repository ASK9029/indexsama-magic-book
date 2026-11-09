import type { ReactNode } from 'react';

export function TaskGroup({
  title,
  count,
  children,
  placeholder,
}: {
  title: string;
  count?: number;
  children?: ReactNode;
  placeholder?: string;
}) {
  return (
    <section className="rounded-card border border-line bg-surface">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-medium text-ink">{title}</h2>
        {typeof count === 'number' ? (
          <span className="text-xs text-muted">{count}</span>
        ) : null}
      </header>
      <div className="p-2">
        {placeholder ? (
          <p className="px-2 py-4 text-sm text-muted">{placeholder}</p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
