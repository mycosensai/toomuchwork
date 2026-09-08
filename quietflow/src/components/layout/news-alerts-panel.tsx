'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Radio, AlertTriangle, MapPin, Clock, Zap, Filter,
  ExternalLink, RefreshCw, Bell, BellOff, X,
} from 'lucide-react';
import type { NewsAlert, NewsCategory, NewsSeverity } from '@/lib/news-alerts';

interface NewsAlertsPanelProps {
  compact?: boolean;
  maxItems?: number;
}

const categoryIcons: Record<NewsCategory, string> = {
  crime: '🚨', accident: '🚗', police: '👮', fire: '🔥',
  traffic: '🚧', weather: '🌩️', community: '📢', emergency: '🚑', construction: '🏗️',
};

const severityStyles: Record<NewsSeverity, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  high:     { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  medium:   { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  low:      { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
};

const categoryFilterOptions: { value: NewsCategory; label: string }[] = [
  { value: 'crime', label: 'Crime' },
  { value: 'accident', label: 'Accident' },
  { value: 'police', label: 'Police' },
  { value: 'fire', label: 'Fire' },
  { value: 'traffic', label: 'Traffic' },
  { value: 'weather', label: 'Weather' },
  { value: 'community', label: 'Community' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'construction', label: 'Construction' },
];

export function NewsAlertsPanel({ compact = false, maxItems = 50 }: NewsAlertsPanelProps) {
  const { activeView, setActiveView, newsAlerts, addNewsAlert, dismissNewsAlert, markNewsRead, newsAlertPrefs, updateNewsPrefs } = useStore();
  const [showFilters, setShowFilters] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch / simulate real-time news alerts
  const fetchAlerts = useCallback(() => {
    if (isPaused) return;
    const { generateNewsAlerts } = require('@/lib/news-alerts');
    const center = useStore.getState().userLocation || [32.795, -96.796] as [number, number];
    const alerts = generateNewsAlerts(center, 8);
    alerts.forEach((a: NewsAlert) => addNewsAlert(a));
  }, [isPaused, addNewsAlert]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!autoRefresh || activeView !== 'news') return;
    fetchAlerts(); // initial
    intervalRef.current = setInterval(fetchAlerts, 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, activeView, fetchAlerts]);

  // Also refresh on mount if already on news view
  useEffect(() => {
    if (activeView === 'news') fetchAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = newsAlerts
    .filter((a) => newsAlertPrefs.categories.length === 0 || newsAlertPrefs.categories.includes(a.category))
    .filter((a) => !newsAlertPrefs.hideRead || !a.read)
    .slice(0, maxItems);

  const unreadCount = newsAlerts.filter((a) => !a.read).length;
  const criticalCount = newsAlerts.filter((a) => a.severity === 'critical' && !a.read).length;

  if (activeView !== 'news') return null;

  return (
    <div className={compact ? 'space-y-2' : 'h-full overflow-y-auto bg-[var(--cyber-bg-deepest)] p-4'}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-red-400 animate-pulse" />
          <CardTitle className="text-lg font-bold text-cyan-400">NEWS ALERTS</CardTitle>
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-[10px] text-white">{unreadCount} new</Badge>
          )}
          {criticalCount > 0 && (
            <Badge className="bg-red-600 text-[10px] animate-pulse">{criticalCount} CRITICAL</Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost" size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`h-8 w-8 p-0 ${autoRefresh ? 'text-cyan-400' : 'text-zinc-500'}`}
            aria-label={autoRefresh ? 'Pause auto-refresh' : 'Resume auto-refresh'}
          >
            {autoRefresh ? <Zap className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={fetchAlerts} className="h-8 w-8 p-0 text-cyan-400">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost" size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`h-8 w-8 p-0 ${showFilters ? 'text-cyan-400' : 'text-zinc-500'}`}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="mb-3 border-cyan-500/20 bg-cyber-bg-card">
          <CardContent className="p-3">
            <div className="mb-2 text-xs font-mono text-cyan-400">CATEGORIES</div>
            <div className="flex flex-wrap gap-1.5">
              {categoryFilterOptions.map((c) => (
                <button
                  key={c.value}
                  onClick={() => {
                    const cats = newsAlertPrefs.categories.includes(c.value)
                      ? newsAlertPrefs.categories.filter((x) => x !== c.value)
                      : [...newsAlertPrefs.categories, c.value];
                    updateNewsPrefs({ categories: cats });
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                    newsAlertPrefs.categories.includes(c.value)
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700'
                  }`}
                >
                  {categoryIcons[c.value]} {c.label}
                </button>
              ))}
            </div>
            <label className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={newsAlertPrefs.hideRead}
                onChange={(e) => updateNewsPrefs({ hideRead: e.target.checked })}
                className="rounded border-zinc-600"
              />
              Hide read alerts
            </label>
          </CardContent>
        </Card>
      )}

      {/* Alert list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-zinc-500">
            <Bell className="mx-auto mb-2 h-8 w-8 opacity-30" />
            No alerts matching filters
          </div>
        )}
        {filtered.map((alert) => {
          const style = severityStyles[alert.severity];
          return (
            <div
              key={alert.id}
              onClick={() => markNewsRead(alert.id)}
              className={`rounded-xl border p-3 transition-all cursor-pointer hover:brightness-110 ${style.bg} ${style.border} ${!alert.read ? 'ring-1 ring-cyan-500/30' : 'opacity-70'}`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg leading-none">{categoryIcons[alert.category]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${style.text}`}>{alert.title}</span>
                    <Badge className={`text-[9px] ${style.bg} ${style.text} border ${style.border}`}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    {!alert.read && <span className="h-2 w-2 rounded-full bg-cyan-400" />}
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-300">{alert.description}</p>
                  <div className="mt-1.5 flex items-center gap-3 text-[10px] text-zinc-400">
                    <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {alert.locationName}</span>
                    <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {alert.timeAgo}</span>
                    {alert.distanceKm !== undefined && <span>{alert.distanceKm.toFixed(1)}mi</span>}
                  </div>
                  {alert.actionText && (
                    <div className="mt-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300">
                        {alert.actionText} <ExternalLink className="h-2.5 w-2.5" />
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); dismissNewsAlert(alert.id); }}
                  className="text-zinc-500 hover:text-zinc-300"
                  aria-label="Dismiss alert"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 border-t border-cyan-500/10 pt-3 text-center text-[10px] text-zinc-500">
        Auto-refresh {autoRefresh ? 'ON' : 'PAUSED'} · Updates every 30s · {newsAlerts.length} total alerts
      </div>
    </div>
  );
}