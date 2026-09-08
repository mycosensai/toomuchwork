'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { cn } from '@/lib/cn';
import { Bell, Search, Zap } from 'lucide-react';
import { useNotifications } from '@/lib/notifications';
import { SearchDestinations } from '@/components/search/search-destinations';

/**
 * Decluttered cyberpunk header. Minimal ctOS strip — no QI logo block.
 * Just: launcher trigger | system status | quick actions.
 */
export function Header() {
  const { setActiveView, setShowAppLauncher } = useStore();
  const { unreadCount } = useNotifications();
  const [showSearch, setShowSearch] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className={cn(
      'header-shell flex h-12 shrink-0 items-center justify-between gap-2 border-b px-3 backdrop-blur-sm',
      'border-cyan-500/10 bg-cyber-bg-deepest/80',
    )}>
      {/* Left: Launcher trigger */}
      <button
        onClick={() => { setShowAppLauncher(true); setActiveView('hud'); }}
        className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
        title="Launcher"
      >
        <Zap className="h-3.5 w-3.5" />
        <span>LAUNCH</span>
      </button>

      {/* Center: minimal system status */}
      <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
        <span className="hidden sm:inline text-cyan-400">CTOS://QUIETFLOW</span>
        <span className="hidden sm:inline">LINK</span>
        <span className="text-cyan-400">●</span>
        <span className="hidden sm:inline">LIVE</span>
      </div>

      {/* Right: quick actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setShowSearch(true)}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400',
            'hover:bg-cyan-500/5 hover:text-cyan-400 transition-colors',
          )}
          aria-label="Search"
        >
          <Search className="h-3.5 w-3.5" />
        </button>
        <button
          className={cn(
            'relative flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400',
            'hover:bg-cyan-500/5 hover:text-cyan-400 transition-colors',
          )}
          aria-label="Notifications"
        >
          <Bell className="h-3.5 w-3.5" />
          {mounted && unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-3 min-w-[12px] items-center justify-center rounded-full bg-cyan-400 px-1 text-[8px] font-bold text-cyber-bg-deepest">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Search overlay */}
      {showSearch && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-cyan-500/20 bg-cyber-bg-card shadow-[0_0_40px_rgba(0,240,255,0.15)]">
            <div className="border-b border-cyan-500/10 p-2">
              <span className="text-xs font-mono text-cyan-400">SEARCH</span>
            </div>
            <div className="p-2">
              <SearchDestinations compact onClose={() => setShowSearch(false)} />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
