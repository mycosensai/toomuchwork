'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { cn } from '@/lib/cn';
import {
  Map, Camera, Search, Heart, BarChart3,
  Settings, Route, MessageSquare, HelpCircle,
  Radar, Activity, CalendarClock, Video, Shield, Compass,
} from 'lucide-react';

/**
 * Elegant cyberpunk app launcher. A single-page grid of all QuietFlow apps,
 * with an "Open All / Close All" master toggle. Minimal, elegant, no clutter.
 */

const apps = [
  { id: 'map' as const, label: 'Map', icon: Map, accent: 'cyan' },
  { id: 'cameras' as const, label: 'Cameras', icon: Camera, accent: 'cyan' },
  { id: 'my-cameras' as const, label: 'My Cameras', icon: Video, accent: 'blue' },
  { id: 'quiet-route' as const, label: 'QuietRoute', icon: Shield, accent: 'green' },
  { id: 'god-view' as const, label: 'God View', icon: Radar, accent: 'magenta' },
  { id: 'traffic' as const, label: 'Traffic', icon: Activity, accent: 'amber' },
  { id: 'routines' as const, label: 'Routines', icon: CalendarClock, accent: 'purple' },
  { id: 'quiet-finder' as const, label: 'Quiet Finder', icon: Search, accent: 'cyan' },
  { id: 'my-places' as const, label: 'My Places', icon: Heart, accent: 'pink' },
  { id: 'trip-planner' as const, label: 'Trip Planner', icon: Route, accent: 'blue' },
  { id: 'community' as const, label: 'Community', icon: MessageSquare, accent: 'green' },
  { id: 'insights' as const, label: 'Insights', icon: BarChart3, accent: 'amber' },
  { id: 'camera-discovery' as const, label: 'Discover', icon: Compass, accent: 'cyan' },
  { id: 'security' as const, label: 'LAN Security', icon: Shield, accent: 'red' },
  { id: 'settings' as const, label: 'Settings', icon: Settings, accent: 'dim' },
  { id: 'help' as const, label: 'Help', icon: HelpCircle, accent: 'dim' },
];

const accentGlow: Record<string, string> = {
  cyan: '0 0 15px rgba(0, 229, 240, 0.25)',
  blue: '0 0 15px rgba(0, 184, 240, 0.25)',
  magenta: '0 0 15px rgba(232, 0, 138, 0.25)',
  green: '0 0 15px rgba(0, 232, 120, 0.25)',
  amber: '0 0 15px rgba(240, 152, 0, 0.25)',
  purple: '0 0 15px rgba(176, 96, 232, 0.25)',
  pink: '0 0 15px rgba(255, 174, 211, 0.25)',
  red: '0 0 15px rgba(232, 64, 96, 0.25)',
  dim: '0 0 10px rgba(240, 200, 0, 0.1)',
};

const accentBorder: Record<string, string> = {
  cyan: 'border-cyan-500/50',
  blue: 'border-blue-400/50',
  magenta: 'border-pink-500/50',
  green: 'border-emerald-500/50',
  amber: 'border-amber-400/50',
  purple: 'border-purple-400/50',
  pink: 'border-pink-400/50',
  red: 'border-red-400/50',
  dim: 'border-zinc-600/50',
};

export function AppLauncher() {
  const { activeView, setActiveView, showAppLauncher, setShowAppLauncher } = useStore();
  const [openApps, setOpenApps] = useState<Set<string>>(new Set());

  const toggleApp = (id: string) => {
    const next = new Set(openApps);
    if (next.has(id)) next.delete(id); else next.add(id);
    setOpenApps(next);
    if (next.has(id)) setActiveView(id as typeof activeView);
  };

  const openAll = () => {
    setOpenApps(new Set(apps.map(a => a.id)));
  };

  const closeAll = () => {
    setOpenApps(new Set());
    setActiveView('hud');
  };

  if (activeView !== 'hud') return null;

  return (
    <div className={cn(
      'fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-md',
      'transition-opacity duration-300', showAppLauncher ? 'opacity-100' : 'opacity-0 pointer-events-none'
    )}>
      <div className="relative w-full max-w-2xl mx-4">
        {/* Elegant cyberpunk card */}
        <div className="relative rounded-2xl border border-cyan-500/20 bg-cyber-bg-card/90 backdrop-blur-xl p-6 shadow-[0_0_60px_rgba(0,229,240,0.12)]">
          {/* Decorative corner brackets */}
          <div className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-cyan-500/50 rounded-tl-lg"></div>
          <div className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-cyan-500/50 rounded-tr-lg"></div>
          <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-cyan-500/50 rounded-bl-lg"></div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-cyan-500/50 rounded-br-lg"></div>

          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-cyan-400 font-mono text-xs tracking-[0.2em] uppercase neon-cyan">CTOS: QUIETFLOW // FLEET LAUNCHER</h2>
          </div>

          {/* App grid */}
          <div className="grid grid-cols-4 sm:grid-cols-4 gap-3 mb-6">
            {apps.map((app) => {
              const Icon = app.icon;
              const isOpen = openApps.has(app.id);
              const isActive = activeView === app.id as typeof activeView;
              return (
                <button
                  key={app.id}
                  onClick={() => toggleApp(app.id)}
                  className={cn(
                    'group relative flex flex-col items-center justify-center gap-1.5 rounded-xl p-3',
                    'border transition-all duration-200',
                    'bg-cyber-bg-elevated/60',
                    isOpen
                      ? cn(accentBorder[app.accent])
                      : 'border-cyan-500/10 hover:border-cyan-500/30 hover:bg-cyan-500/5',
                  )}
                  style={isOpen ? { boxShadow: accentGlow[app.accent] } : undefined}
                >
                  <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    'bg-cyber-bg-deepest border',
                    isOpen ? accentBorder[app.accent] : 'border-zinc-700',
                    'group-hover:scale-105 transition-transform',
                  )}>
                    <Icon className={cn(
                      'h-5 w-5 transition-colors',
                      isOpen ? 'text-cyan-400' : 'text-zinc-500 group-hover:text-cyan-500',
                    )} />
                  </div>
                  <span className={cn(
                    'text-xs font-medium font-mono',
                    'truncate w-full',
                    isOpen ? 'text-cyan-300' : 'text-zinc-500 group-hover:text-cyan-400',
                  )}>{app.label}</span>
                  {isOpen && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(0,229,240,0.8)] animate-pulse"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Open/Close All buttons */}
          <div className="flex gap-3">
            <button
              onClick={openAll}
              className="flex-1 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-xs font-mono font-medium text-cyan-300 hover:bg-cyan-500/20 transition-colors"
            >
              OPEN ALL
            </button>
            <button
              onClick={closeAll}
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800/30 px-4 py-2.5 text-xs font-mono font-medium text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-300 transition-colors"
            >
              CLOSE ALL
            </button>
          </div>

          {/* Close X */}
          <button
            onClick={() => setShowAppLauncher(false)}
            className="absolute top-3 right-3 text-zinc-500 hover:text-cyan-400 transition-colors"
            aria-label="Close launcher"
          >
            <span className="text-lg">×</span>
          </button>
        </div>
      </div>
    </div>
  );
}
