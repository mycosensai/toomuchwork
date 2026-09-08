/**
 * Obsidian Theme React Components
 * GoldSkeleton, ObsidianLogo, ObsidianCard, ObsidianButton, ObsidianBadge, ObsidianHeading
 */

import { ReactNode } from 'react';

interface GoldSkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function GoldSkeleton({ width = '100%', height = 20, className = '' }: GoldSkeletonProps) {
  return (
    <div
      className={`bg-[var(--obsidian-card)] rounded ${className}`}
      style={{ width: typeof width === 'number' ? `${width}px` : width, height: typeof height === 'number' ? `${height}px` : height }}
    >
      <div className="h-full rounded obsidian-shimmer" style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

export function ObsidianLogo() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="36" height="36" rx="6" stroke="#D4AF37" strokeWidth="2" />
      <path d="M20 6L34 14V26L20 34L6 26V14L20 6Z" stroke="#D4AF37" strokeWidth="1.5" fill="rgba(212,175,55,0.08)" />
      <path d="M20 12L28 16V24L20 28L12 24V16L20 12Z" fill="#D4AF37" opacity="0.8" />
      <text x="20" y="38" textAnchor="middle" fill="#D4AF37" fontSize="6" fontFamily="Nordix">QF</text>
    </svg>
  );
}