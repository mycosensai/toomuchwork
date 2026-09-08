/**
 * Feature 11-20 UI Components: Obsidian Theme system
 * Nordix typeface, Gold/Black theme, shimmer, metallic,
 * gold borders, reduced cyberpunk, gold logo, gold scrollbar,
 * loading shimmers
 */

import { create } from 'zustand';

// ─── Nordix Font Import ───
if (typeof document !== 'undefined') {
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Nordix:wght@400;600;700;900&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}

// ─── Obsidian Theme Store ───

export interface ObsidianThemeState {
  theme: 'obsidian' | 'cyberpunk' | 'lapis' | 'ruthium';
  shimmerEnabled: boolean;
  metallicTexture: boolean;
  goldBorders: boolean;
  reducedCyberpunk: boolean;
  goldScrollbar: boolean;
  loadingShimmers: boolean;
  accentColor: '#D4AF37' | '#1E3A5F';
  setTheme: (theme: ObsidianThemeState['theme']) => void;
  setAccentColor: (color: '#D4AF37' | '#1E3A5F') => void;
  toggleShimmer: () => void;
  toggleMetallic: () => void;
  toggleGoldBorders: () => void;
  toggleReducedCyberpunk: () => void;
  toggleGoldScrollbar: () => void;
  toggleLoadingShimmers: () => void;
}

export const useObsidianTheme = create<ObsidianThemeState>((set) => ({
  theme: 'obsidian',
  shimmerEnabled: true,
  metallicTexture: true,
  goldBorders: true,
  reducedCyberpunk: false,
  goldScrollbar: true,
  loadingShimmers: true,
  accentColor: '#D4AF37',
  setTheme: (theme) => set({ theme }),
  setAccentColor: (color) => set({ accentColor: color }),
  toggleShimmer: () => set((s) => ({ shimmerEnabled: !s.shimmerEnabled })),
  toggleMetallic: () => set((s) => ({ metallicTexture: !s.metallicTexture })),
  toggleGoldBorders: () => set((s) => ({ goldBorders: !s.goldBorders })),
  toggleReducedCyberpunk: () => set((s) => ({ reducedCyberpunk: !s.reducedCyberpunk })),
  toggleGoldScrollbar: () => set((s) => ({ goldScrollbar: !s.goldScrollbar })),
  toggleLoadingShimmers: () => set((s) => ({ loadingShimmers: !s.loadingShimmers })),
}));

// ─── CSS Variables ───

export const OBSIDIAN_VARS: Record<string, string> = {
  '--obsidian-bg': '#0A0910',
  '--obsidian-bg-elevated': '#12101A',
  '--obsidian-card': '#1A1728',
  '--obsidian-card-hover': '#221E30',
  '--obsidian-gold': '#D4AF37',
  '--obsidian-gold-dim': '#B8941E',
  '--obsidian-gold-bright': '#FFD700',
  '--obsidian-glow': 'rgba(212, 175, 55, 0.3)',
  '--obsidian-border': 'rgba(212, 175, 55, 0.2)',
  '--obsidian-text': '#E8E0D0',
  '--obsidian-text-muted': '#8A8272',
  '--obsidian-font-display': "'Nordix', sans-serif",
  '--obsidian-font-mono': "'JetBrains Mono', monospace",
};

export function applyObsidianTheme(): void {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(OBSIDIAN_VARS)) {
    root.style.setProperty(key, value);
  }
  document.body.classList.add('obsidian-root');
  if (useObsidianTheme.getState().reducedCyberpunk) {
    document.body.classList.add('obsidian-reduced-cyberpunk');
  }
}

export function removeObsidianTheme(): void {
  const root = document.documentElement;
  for (const key of Object.keys(OBSIDIAN_VARS)) {
    root.style.removeProperty(key);
  }
  document.body.classList.remove('obsidian-root', 'obsidian-reduced-cyberpunk');
}

export function nordixClass(): string {
  return 'font-heading';
}

export function shimmerClass(enabled: boolean): string {
  return enabled ? 'obsidian-shimmer' : '';
}