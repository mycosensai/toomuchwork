'use client';

import * as React from 'react';

export function Toggle({
  label,
  enabled,
  onChange,
  description,
}: {
  label: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 ${
          enabled ? 'bg-emerald-500 dark:bg-cyan-500' : 'bg-zinc-200 dark:bg-zinc-700'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
      <div>
        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</div>
        {description && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400">{description}</div>
        )}
      </div>
    </label>
  );
}
