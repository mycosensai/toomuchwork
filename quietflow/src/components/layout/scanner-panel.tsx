'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  RefreshCw, Filter, Wifi, AlertTriangle, Radio, Clock, MapPin,
} from 'lucide-react';
import { typeIcon, priorityColor, formatIncidentTime } from '@/lib/scanner';

export function ScannerPanel() {
  const { activeView, incidents, incidentsLoading, lastIncidentFetch, fetchIncidents } = useStore();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    types: ['police', 'fire', 'ems'] as Array<'police' | 'fire' | 'ems'>,
    priorities: ['normal', 'high', 'emergency'] as Array<'low' | 'normal' | 'high' | 'emergency'>,
    autoRefresh: true,
  });
  // Derive last-updated time from store (avoids synchronous setState in effect)
  const lastUpdated = lastIncidentFetch ? new Date(lastIncidentFetch) : null;

  // Fetch incidents on mount
  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Auto-refresh incidents every 60s
  useEffect(() => {
    if (!filters.autoRefresh) return;
    const timer = setInterval(() => {
      fetchIncidents();
    }, 60000);
    return () => clearInterval(timer);
  }, [filters.autoRefresh, fetchIncidents]);

  const filteredIncidents = incidents.filter((inc) => {
    if (!filters.types.includes(inc.type)) return false;
    if (!filters.priorities.includes(inc.priority)) return false;
    return true;
  }).sort((a, b) => {
    const priorityOrder = { emergency: 0, high: 1, normal: 2, low: 3 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  const incidentCount = incidents.length;
  const emergencyCount = incidents.filter((i) => i.priority === 'emergency').length;
  const highCount = incidents.filter((i) => i.priority === 'high').length;

  if (activeView !== 'map') return null;

  return (
    <Card className="absolute bottom-16 right-4 z-20 w-80 max-w-sm border-red-200 dark:border-red-800">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Radio className="h-4 w-4 text-red-500" />
          Police/Fire Scanner
          <span className="text-xs font-normal text-zinc-400">
            ({filteredIncidents.length} active)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {/* Summary dots */}
        <div className="mb-3 flex items-center gap-3 text-xs">
          {emergencyCount > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
              <span className="text-red-600 dark:text-red-400 font-medium">{emergencyCount} EMERGENCY</span>
            </span>
          )}
          {highCount > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
              <span className="text-orange-600 dark:text-orange-400 font-medium">{highCount} HIGH</span>
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
            <span className="text-zinc-600 dark:text-zinc-300">{incidentCount - emergencyCount - highCount} NORMAL</span>
          </span>
        </div>

        {/* Controls */}
        <div className="mb-3 flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="h-6 px-2 text-xs"
          >
            <Filter className="h-3 w-3 mr-1" />
            Filter
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { fetchIncidents(); }}
            className="h-6 px-2 text-xs"
            disabled={incidentsLoading}
          >
            <RefreshCw className={`h-3 w-3 ${incidentsLoading ? 'animate-spin' : ''}`} />
          </Button>
          {lastUpdated && (
            <span className="text-[10px] text-zinc-400">
              Updated {formatIncidentTime(lastUpdated.toISOString())}
            </span>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mb-3 space-y-2 rounded-lg bg-zinc-50 p-2 dark:bg-zinc-800/50 text-xs">
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Types:</span>
              <div className="mt-1 flex gap-1">
                {(['police', 'fire', 'ems'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilters((f) => ({
                      ...f,
                      types: f.types.includes(t)
                        ? f.types.filter((x) => x !== t)
                        : [...f.types, t],
                    }))}
                    className={`rounded px-3 py-2 text-xs ${
                      filters.types.includes(t)
                        ? 'bg-emerald-500 text-white'
                        : 'text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Priority:</span>
              <div className="mt-1 flex gap-1">
                {(['emergency', 'high', 'normal', 'low'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setFilters((f) => ({
                      ...f,
                      priorities: f.priorities.includes(p)
                        ? f.priorities.filter((x) => x !== p)
                        : [...f.priorities, p],
                    }))}
                    className={`rounded px-3 py-2 text-xs ${
                      filters.priorities.includes(p)
                        ? 'bg-red-500 text-white'
                        : 'text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Incident list */}
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {filteredIncidents.length === 0 ? (
            <div className="text-center py-2 text-xs text-zinc-400">
              No active incidents matching filters
            </div>
          ) : (
            filteredIncidents.map((inc) => {
              const { bg, text } = priorityColor(inc.priority);
              return (
                <div
                  key={inc.id}
                  className="rounded-lg border border-zinc-200 p-2 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-sm">{typeIcon(inc.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-xs text-zinc-800 dark:text-zinc-200">{inc.title}</span>
                        <Badge className={`text-[9px] px-1 py-0 ${bg} ${text}`}>
                          {inc.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                        {inc.description}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {formatIncidentTime(inc.timestamp)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5" />
                          {inc.lat.toFixed(3)}, {inc.lng.toFixed(3)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Wifi className="h-2.5 w-2.5" />
                          {inc.source}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Summary footer */}
        {emergencyCount > 0 && (
          <div className="mt-2 rounded-lg bg-red-50 p-2 text-center dark:bg-red-900/20">
            <AlertTriangle className="mx-auto mb-1 h-3 w-3 text-red-500" />
            <span className="text-[10px] font-medium text-red-700 dark:text-red-300">
              {emergencyCount} emergency incident(s) — consider alternate routes
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
