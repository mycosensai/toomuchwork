'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const variantClasses: Record<string, string> = {
  default: 'bg-[var(--badge-bg)] text-[var(--badge-text)]',
  success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
  warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
  danger: 'bg-red-500/10 text-red-400 border border-red-500/30',
  info: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
  purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export function Badge({ className, variant = 'default', size = 'md', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-medium transition-colors',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
}

interface DensityBadgeProps {
  level: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const densityVariantMap: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'> = {
  green: 'success',
  yellow: 'warning',
  orange: 'warning',
  red: 'danger',
  purple: 'purple',
};

const densityLabels: Record<string, string> = {
  green: 'Very quiet',
  yellow: 'Comfortable',
  orange: 'Getting busy',
  red: 'Crowded',
  purple: 'Very crowded',
};

export function DensityBadge({ level, showLabel = true, size = 'md' }: DensityBadgeProps) {
  return (
    <Badge variant={densityVariantMap[level] || 'default'} size={size}>
      <span
        className="mr-1.5 inline-block h-2 w-2 rounded-full"
        style={{
          backgroundColor:
            level === 'green'
              ? '#22c55e'
              : level === 'yellow'
                ? '#eab308'
                : level === 'orange'
                  ? '#f97316'
                  : level === 'red'
                    ? '#ef4444'
                    : '#a855f7',
        }}
      />
      {showLabel ? densityLabels[level] || level : level}
    </Badge>
  );
}
