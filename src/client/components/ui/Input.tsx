import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@client/lib/cn';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'h-10 w-full rounded-[10px] border border-line bg-surface px-3 text-sm text-ink outline-none placeholder:text-muted focus:border-accent',
          className,
        )}
        {...props}
      />
    );
  },
);
