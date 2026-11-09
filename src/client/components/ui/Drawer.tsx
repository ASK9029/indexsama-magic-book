import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@client/lib/cn';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Drawer({ open, onClose, title, children, className }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/20"
      onMouseDown={onClose}
    >
      <aside
        role="dialog"
        aria-modal="true"
        className={cn(
          'h-full w-full max-w-md overflow-y-auto border-l border-line bg-surface p-6 shadow-xl',
          className,
        )}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {title ? <h2 className="mb-4 text-lg font-semibold text-ink">{title}</h2> : null}
        {children}
      </aside>
    </div>,
    document.body,
  );
}
