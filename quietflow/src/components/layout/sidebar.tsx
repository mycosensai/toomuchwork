'use client';

import { useStore } from '@/store';
import { cn } from '@/lib/cn';
import {
  Map, Camera, Search, Heart, BarChart3,
  Settings, Route, MessageSquare, HelpCircle,
  Moon, Sun, Zap,
  Radar, Activity, CalendarClock, Video, Shield, Compass, Sparkles,
} from 'lucide-react';

/**
 * Decluttered luxury cyberpunk sidebar.
 * Icon-only navigation — no QI text logos. A single "LAUNCHER" button
 * toggles the app grid overlay. Clean, minimal, ctOS aesthetic.
 */
const navItems = [
  { id: 'hud' as const, label: 'Launcher', icon: Zap },
  { id: 'map' as const, label: 'Map', icon: Map },
  { id: 'cameras' as const, label: 'Cameras', icon: Camera },
  { id: 'my-cameras' as const, label: 'My Cameras', icon: Video },
  { id: 'quiet-route' as const, label: 'QuietRoute', icon: Shield },
  { id: 'god-view' as const, label: 'God View', icon: Radar },
  { id: 'traffic' as const, label: 'Traffic', icon: Activity },
  { id: 'routines' as const, label: 'Routines', icon: CalendarClock },
  { id: 'quiet-finder' as const, label: 'Quiet Finder', icon: Search },
  { id: 'my-places' as const, label: 'My Places', icon: Heart },
  { id: 'trip-planner' as const, label: 'Trip Planner', icon: Route },
  { id: 'community' as const, label: 'Community', icon: MessageSquare },
  { id: 'insights' as const, label: 'Insights', icon: BarChart3 },
  { id: 'camera-discovery' as const, label: 'Discover', icon: Compass },
  { id: 'security' as const, label: 'LAN Security', icon: Shield },
  { id: 'wellness' as const, label: 'Wellness Tools', icon: Sparkles },
];

const bottomItems = [
  { id: 'settings' as const, label: 'Settings', icon: Settings },
  { id: 'help' as const, label: 'Help', icon: HelpCircle },
];

export function Sidebar() {
  const { activeView, setActiveView, settings, toggleAnxietyMode, toggleQuietMode, setShowAppLauncher } = useStore();

  return (
    <nav className="sidebar-shell flex h-full flex-col border-r border-cyan-500/10 bg-cyber-bg-deepest/80 backdrop-blur-sm">
      {/* Minimal logo — just a glyph, no text */}
      <div className="flex items-center justify-center border-b border-cyan-500/10 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30">
          <span className="text-xs font-bold text-cyan-400">◉</span>
        </div>
      </div>

      {/* Nav items — icon only */}
      <div className="flex-1 space-y-1.5 p-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveView(item.id);
                if (item.id === 'hud') setShowAppLauncher(true);
              }}
              className={cn(
                'flex w-full items-center justify-center rounded-lg p-2.5 transition-all',
                'text-zinc-500 hover:bg-cyan-500/5 hover:text-cyan-400',
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                  : '',
              )}
              title={item.label}
            >
              <Icon className="h-5 w-5" />
            </button>
          );
        })}
      </div>

      {/* Quick toggles + bottom items */}
      <div className="border-t border-cyan-500/10 p-2">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                'flex w-full items-center justify-center rounded-lg p-2.5 transition-all',
                'text-zinc-500 hover:bg-cyan-500/5 hover:text-cyan-400',
                isActive ? 'bg-cyan-500/10 text-cyan-400' : '',
              )}
              title={item.label}
            >
              <Icon className="h-5 w-5" />
            </button>
          );
        })}
        <div className="border-t border-cyan-500/10 my-2"></div>
        {/* Theme toggle */}
        <button
          onClick={toggleAnxietyMode}
          className={cn(
            'flex w-full items-center justify-center rounded-lg p-2.5 transition-all',
            settings.anxietyFriendlyUI
              ? 'bg-violet-500/10 text-violet-400'
              : 'text-zinc-500 hover:bg-cyan-500/5 hover:text-cyan-400',
          )}
          title={settings.anxietyFriendlyUI ? 'Calm mode on' : 'Calm mode'}
        >
          {settings.anxietyFriendlyUI ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>
      </div>
    </nav>
  );
}
