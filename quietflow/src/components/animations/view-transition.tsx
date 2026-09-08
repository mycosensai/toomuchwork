'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import { useStore } from '@/store';

/**
 * ViewTransition context
 *
 * Provides a `navigateView(view)` function that wraps the store's
 * `setActiveView` with the View Transition API so pages animate
 * smoothly when switching. Honors `prefers-reduced-motion`.
 */

// Mirror of AppState['activeView'] — keeps the transition wrapper
// type-safe without needing to export AppState from the store.
export type ViewKey =
  | 'map'
  | 'cameras'
  | 'quiet-finder'
  | 'my-places'
  | 'insights'
  | 'settings'
  | 'trip-planner'
  | 'community'
  | 'help'
  | 'camera-discovery'
  | 'quiet-route'
  | 'god-view'
  | 'traffic'
  | 'routines'
  | 'security'
  | 'my-cameras'
  | 'hud'
  | 'news';

interface VTContext {
  navigateView: (view: ViewKey, direction?: 'forward' | 'backward') => void;
}

const ViewTransitionContext = createContext<VTContext | null>(null);

export function useViewTransition() {
  const ctx = useContext(ViewTransitionContext);
  if (!ctx) throw new Error('useViewTransition must be used within ViewTransitionProvider');
  return ctx;
}

export function ViewTransitionProvider({ children }: { children: React.ReactNode }) {
  const originalSetActiveViewRef = useRef<((view: ViewKey) => void) | null>(null);
  const patchedRef = useRef<((view: ViewKey) => void) | null>(null);

  // Patch the store's setActiveView once with a view-transition-aware wrapper
  useEffect(() => {
    if (originalSetActiveViewRef.current) return;

    const original = useStore.getState().setActiveView;
    originalSetActiveViewRef.current = original;

    const patched = (view: ViewKey) => {
      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReduced || typeof window === 'undefined' || !('startViewTransition' in window)) {
        original(view);
        return;
      }

      // Determine navigation direction from view ordering
      const viewOrder = [
        'map', 'cameras', 'quiet-route', 'god-view', 'traffic', 'routines',
        'quiet-finder', 'my-places', 'trip-planner', 'community',
        'insights', 'camera-discovery', 'security', 'settings', 'help',
      ];
      const cur = useStore.getState().activeView;
      const curIdx = viewOrder.indexOf(cur);
      const newIdx = viewOrder.indexOf(view);
      const direction = newIdx > curIdx ? 'forward' : newIdx < curIdx ? 'backward' : 'forward';
      document.body.setAttribute('data-transition-dir', direction);

      (window as any).startViewTransition(() => {
        original(view);
      });
    };

    patchedRef.current = patched;
    useStore.setState({ setActiveView: patched });

    return () => {
      useStore.setState({ setActiveView: original });
    };
  }, []);

  const navigateView = (view: ViewKey, direction: 'forward' | 'backward' = 'forward') => {
    if (patchedRef.current) {
      document.body.setAttribute('data-transition-dir', direction);
      patchedRef.current(view);
    } else {
      useStore.getState().setActiveView(view);
    }
  };

  const value = { navigateView };

  return (
    <ViewTransitionContext.Provider value={value}>
      {children}
    </ViewTransitionContext.Provider>
  );
}
