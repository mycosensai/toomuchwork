'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

export function Input({ className = '', label, icon, ...props }: InputProps) {
  return (
    <div className="relative">
      {label && (
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}
      {icon && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
          {icon}
        </div>
      )}
      <input
        className={cn(
          'flex h-10 w-full rounded-lg border bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 border-[var(--color-border)]',
          icon && 'pl-10',
          className
        )}
        {...props}
      />
    </div>
  );
}
