/**
 * Feature 11-20 UI Components (split from too-large file)
 * ObsidianCard, ObsidianButton, ObsidianBadge, ObsidianHeading
 */

import { ReactNode } from 'react';

interface ObsidianCardProps {
  children: ReactNode;
  className?: string;
  shimmer?: boolean;
  metallic?: boolean;
  goldBorder?: boolean;
}

export function ObsidianCard({ children, className = '', shimmer = false, metallic = false, goldBorder = true }: ObsidianCardProps) {
  const classes = [
    'bg-[var(--obsidian-card)]',
    goldBorder ? 'border border-[var(--obsidian-border)]' : '',
    shimmer ? 'obsidian-shimmer' : '',
    metallic ? 'obsidian-metallic' : '',
    className,
  ].filter(Boolean).join(' ');

  return <div className={classes}>{children}</div>;
}

interface ObsidianButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'outline';
  className?: string;
}

export function ObsidianButton({ children, onClick, variant = 'primary', className = '' }: ObsidianButtonProps) {
  const baseClasses = {
    primary: 'bg-gradient-to-r from-[var(--obsidian-gold-dim)] to-[var(--obsidian-gold)] text-[var(--obsidian-bg)] font-heading font-bold hover:shadow-lg hover:shadow-[var(--obsidian-gold)]/20',
    ghost: 'text-[var(--obsidian-gold)] hover:bg-[var(--obsidian-card-hover)]',
    outline: 'border border-[var(--obsidian-border)] text-[var(--obsidian-gold)] hover:border-[var(--obsidian-gold)]',
  };

  return (
    <button
      className={`px-4 py-2 rounded-lg font-heading text-sm transition-all duration-200 ${baseClasses[variant]} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

interface ObsidianBadgeProps {
  children: ReactNode;
  variant?: 'gold' | 'dim' | 'bright';
}

export function ObsidianBadge({ children, variant = 'gold' }: ObsidianBadgeProps) {
  const classes = {
    gold: 'bg-[var(--obsidian-gold)]/20 text-[var(--obsidian-gold)] border border-[var(--obsidian-gold)]/30',
    dim: 'bg-[var(--obsidian-card-hover)] text-[var(--obsidian-text-muted)] border border-[var(--obsidian-border)]',
    bright: 'bg-[var(--obsidian-gold-bright)]/20 text-[var(--obsidian-gold-bright)] border border-[var(--obsidian-gold-bright)]/30',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-heading uppercase tracking-wider ${classes[variant]}`}>
      {children}
    </span>
  );
}

interface ObsidianHeadingProps {
  children: ReactNode;
  level?: 1 | 2 | 3 | 4;
  className?: string;
}

export function ObsidianHeading({ children, level = 2, className = '' }: ObsidianHeadingProps) {
  const Tag = `h${level}` as keyof HTMLElementTagNameMap;
  const sizeClasses = { 1: 'text-2xl', 2: 'text-xl', 3: 'text-lg', 4: 'text-base' };

  return (
    <Tag className={`obsidian-heading ${sizeClasses[level]} ${className}`}>
      {children}
    </Tag>
  );
}