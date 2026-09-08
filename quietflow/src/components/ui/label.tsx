'use client';

import { cn } from '@/lib/cn';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  disabled?: boolean;
}

export function Label({ className, children, disabled, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-disabled',
        disabled && 'opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </label>
  );
}
