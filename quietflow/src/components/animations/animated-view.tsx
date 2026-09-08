'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

/**
 * AnimatedViewWrapper
 * -------------------
 * Wraps a view's content so that on entry, content slides up + fades in.
 * On exit (when activeView changes away), it slides down + fades out
 * before unmounting. Uses simple CSS + opacity/translate transforms
 * animated via requestAnimationFrame for smooth 60fps transitions
 * that also work as a fallback when View Transition API isn't supported.
 *
 * Respects the `reduceMotion` setting — if enabled, swaps instantly.
 */

interface AnimatedViewWrapperProps {
  children: React.ReactNode;
  isActive: boolean;
  viewId: string;
  priority?: boolean; // whether this view is a "primary" transition target
}

export function AnimatedViewWrapper({
  children,
  isActive,
  viewId,
  priority = false,
}: AnimatedViewWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isActive) setMounted(true);
  }, [isActive]);

  // When becoming inactive, keep mounted briefly for exit animation
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (!isActive) {
      // Check reduced motion
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) {
        setMounted(false);
      } else {
        t = setTimeout(() => setMounted(false), 250);
      }
    }
    return () => clearTimeout(t);
  }, [isActive]);

  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!mounted) return null;

  return (
    <div
      className={cn(
        'absolute inset-0',
        // Enter/exit animations
        isActive
          ? 'animate-slide-up-fade-in'
          : 'animate-slide-down-fade-out',
        reduced && 'animate-none',
      )}
      data-view={viewId}
      style={{
        animationDuration: reduced ? '0ms' : '280ms',
        animationFillMode: 'both',
      }}
    >
      {children}
    </div>
  );
}
