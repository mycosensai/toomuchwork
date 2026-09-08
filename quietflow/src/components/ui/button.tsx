'use client';

import * as React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  className = '',
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-ring-cyan-400/50 disabled:pointer-events-none disabled:opacity-50';
  const variants: Record<string, string> = {
    primary: 'bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:bg-[var(--button-primary-hover)] shadow-[0_0_12px_rgba(0,240,255,0.2)]',
    secondary: 'bg-[var(--button-secondary-bg)] text-[var(--button-secondary-text)] hover:bg-[var(--button-secondary-hover)] border border-cyan-500/20',
    ghost: 'text-[var(--button-ghost-text)] hover:bg-[var(--button-ghost-hover)]',
    outline: 'border border-cyan-500/30 bg-transparent text-cyan-400 hover:bg-cyan-500/10',
  };
  const sizes: Record<string, string> = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
