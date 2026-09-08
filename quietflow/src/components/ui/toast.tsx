'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';

type ToastVariant = 'info' | 'success' | 'warning' | 'error';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

let toastId = 0;
const listeners = new Set<(toasts: Toast[]) => void>();
const activeToasts: Toast[] = [];

function notify(toast: Toast) {
  activeToasts.push(toast);
  listeners.forEach((fn) => fn([...activeToasts]));
  const remove = () => {
    const idx = activeToasts.indexOf(toast);
    if (idx !== -1) activeToasts.splice(idx, 1);
    listeners.forEach((fn) => fn([...activeToasts]));
  };
  setTimeout(remove, toast.duration ?? 3500);
}

export function showToast(message: string, variant?: ToastVariant, duration?: number) {
  notify({ id: `toast-${++toastId}`, message, variant: variant ?? 'info', duration });
}

export function ToastContainer() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.add(setCurrentToasts);
    return () => { listeners.delete(setCurrentToasts); };
  }, []);

  if (currentToasts.length === 0) return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {currentToasts.map((t) => {
        const colors: Record<ToastVariant, string> = {
          info: 'bg-blue-500 text-white',
          success: 'bg-emerald-500 text-white dark:bg-cyan-500',
          warning: 'bg-amber-500 text-white',
          error: 'bg-red-500 text-white',
        };
        return (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg transition-all',
              colors[t.variant],
            )}
          >
            {t.message}
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
