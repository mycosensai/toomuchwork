'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotifications } from '@/lib/notifications';
import {
  MapPin, RefreshCw, AlertTriangle, CheckCircle2, Radar,
} from 'lucide-react';
import { scanLocation, ALL_INTEL_CATEGORIES, CATEGORY_ICONS, type LocationIntel, type IntelCategoryData } from '@/lib/location-intel';
import { levelColor, levelFromScore } from '@/lib/synthetic-feed';

export function GodView() {
  const {
    activeView, businesses, cameras, roadSegments, incidents,
    selectBusiness, selectedBusiness, setActiveView, godViewOverlay, computeGodViewOverlay,
  } = useStore();
  const { notifications } = useNotifications();

  // Selected location for intel scan
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [intel, setIntel] = useState<LocationIntel | null>(null);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | 'overview'>('overview');
  const [autoScan, setAutoScan] = useState(true);

  // The location being intel-scanned
  const selectedLocation = selectedId ? businesses.find((b) => b.id === selectedId) ?? null : null;

  // Total tracked stats
  const totalBusinesses = businesses.length;
  const totalCameras = cameras.length;
  const onlineCameras = cameras.filter((c) => c.status === 'online').length;
  const activeIncidents = incidents.filter((i) => i.priority === 'high' || i.priority === 'emergency').length;
  const flockCount = cameras.filter((c) => c.brand === 'flock').length;
  const axonCount = cameras.filter((c) => c.brand === 'axon').length;
  const unread = notifications.filter((n) => !n.read).length;

  // Search locations
  const filteredBusinesses = businesses
    .filter((b) => b.name.toLowerCase().includes(query.toLowerCase()) || b.category.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 20);

  // Run a scan on the selected location
  const runScan = useCallback((bizId: string) => {
    const biz = businesses.find((b) => b.id === bizId);
    if (!biz) return;
    setScanning(true);
    setSelectedId(bizId);
    selectBusiness(biz);
    // Slight delay to simulate scanning
    setTimeout(() => {
      const result = scanLocation(biz, cameras, roadSegments, incidents, biz.lat, biz.lng);
      setIntel(result);
      setLastScan(new Date());
      setScanning(false);
      setActiveCategory('overview');
    }, 400);
  }, [businesses, cameras, roadSegments, incidents, selectBusiness]);

  // Auto-scan first business on mount
  useEffect(() => {
    if (activeView !== 'god-view') return;
    if (businesses.length > 0 && !intel) {
      runScan(selectedId || businesses[0].id);
    }
  }, [activeView, businesses.length]); // eslint-disable-line

  // Auto re-scan periodically
  useEffect(() => {
    if (!autoScan || !selectedId) return;
    const timer = setInterval(() => {
      if (selectedId) runScan(selectedId);
    }, 30000);
    return () => clearInterval(timer);
  }, [autoScan, selectedId, runScan]);

  // Keep the aggregated density overlay current while God View is open.
  useEffect(() => {
    if (activeView !== 'god-view') return;
    computeGodViewOverlay();
    const t = setInterval(() => computeGodViewOverlay(), 30000);
    return () => clearInterval(t);
  }, [activeView, computeGodViewOverlay]);

  if (activeView !== 'god-view') return null;

  const scoreBg = (v: number) => v >= 80 ? 'bg-emerald-500' : v >= 60 ? 'bg-green-500' : v >= 40 ? 'bg-amber-500' : v >= 25 ? 'bg-orange-500' : 'bg-red-500';

  return (
    <div className="h-full overflow-y-auto bg-zinc-50 dark:bg-zinc-900">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 px-6 py-4 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white">
            <Radar className="h-5 w-5" />
          </div>
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-zinc-50">
              GOD VIEW
              <Badge variant="default" className="bg-emerald-500 text-[10px]">Command Center</Badge>
            </h1>
            <p className="text-xs text-zinc-500">Full-spectrum location intelligence · every trackable category monitored</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setAutoScan(!autoScan)} className={autoScan ? 'text-emerald-600' : 'text-zinc-400'}>
              <Radar className="h-3 w-3 mr-1" /> {autoScan ? 'Auto-Scan On' : 'Auto-Scan Off'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => selectedId && runScan(selectedId)} disabled={scanning}>
              <RefreshCw className={`h-3 w-3 mr-1 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'Scanning...' : 'Re-Scan'}
            </Button>
          </div>
        </div>

        {/* Global stats strip */}
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {[
            { label: 'Locations Tracked', value: totalBusinesses, icon: '🏪' },
            { label: 'Cameras Online', value: `${onlineCameras}/${totalCameras}`, icon: '📹' },
            { label: 'FLOCK Cameras', value: flockCount, icon: '🔵' },
            { label: 'AXON Cameras', value: axonCount, icon: '🔴' },
            { label: 'Active Incidents', value: activeIncidents, icon: '🚨' },
            { label: 'Intel Categories', value: ALL_INTEL_CATEGORIES.length, icon: '🧠' },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-zinc-200 bg-white p-2 text-center dark:border-zinc-800 dark:bg-zinc-950">
              <div className="text-sm">{s.icon}</div>
              <div className="text-lg font-bold text-zinc-800 dark:text-zinc-100">{s.value}</div>
              <div className="text-[10px] text-zinc-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Aggregated density overlay (real consented cameras + synthetic fill) */}
      {godViewOverlay && (
        <div className="mx-6 -mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <OverlayStat
            label="Density Source"
            value={godViewOverlay.source === 'mixed' ? 'Live + Synthetic' : 'Synthetic'}
          />
          <OverlayStat
            label="Mean Density"
            value={`${Math.round(godViewOverlay.meanScore * 100)}%`}
            color={levelColor(levelFromScore(godViewOverlay.meanScore))}
          />
          <OverlayStat
            label="Worst Pocket"
            value={godViewOverlay.worstLevel.toUpperCase()}
            color={levelColor(godViewOverlay.worstLevel)}
          />
          <OverlayStat label="Coverage Tiles" value={godViewOverlay.tiles.length} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 p-6 lg:grid-cols-[300px_1fr]">
        {/* ── Location picker ── */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="p-3 pb-1">
              <CardTitle className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-emerald-500" />
                Tracked Locations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <Input
                placeholder="Search locations..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="mb-2"
              />
              <div className="max-h-[50vh] space-y-1 overflow-y-auto">
                {filteredBusinesses.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => runScan(b.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                      selectedId === b.id
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span className="text-sm">{CATEGORY_ICONS[b.category as keyof typeof CATEGORY_ICONS] || '🏪'}</span>
                    <span className="flex-1 truncate">{b.name}</span>
                    <span className="text-[9px] uppercase text-zinc-400">{b.category}</span>
                  </button>
                ))}
                {filteredBusinesses.length === 0 && (
                  <p className="py-4 text-center text-xs text-zinc-400">No locations match</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Intel display ── */}
        <div className="space-y-4">
          {!selectedLocation && (
            <Card>
              <CardContent className="p-8 text-center">
                <Radar className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
                <p className="text-sm text-zinc-500">Select a location to begin full-spectrum intel scan</p>
              </CardContent>
            </Card>
          )}

          {selectedLocation && intel && (
            <>
              {/* Overall score hero */}
              <Card className="border-emerald-200 bg-gradient-to-br dark:border-emerald-800">
                <CardContent className="flex items-center gap-5 p-6">
                  <div className={`relative flex h-24 w-24 flex-col items-center justify-center rounded-full ${scoreBg(intel.overallScore)} text-white`}>
                    <span className="text-3xl font-bold">{intel.overallScore}</span>
                    <span className="text-[9px] uppercase opacity-80">Intel Score</span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{selectedLocation.name}</h2>
                    <p className="text-xs text-zinc-500">{selectedLocation.category} · tracked location</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {intel.flags.length === 0 && (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" /> No critical flags
                        </span>
                      )}
                      {intel.flags.map((f, i) => (
                        <span key={i} className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${
                          f.severity === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          : f.severity === 'warning' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>
                          <AlertTriangle className="h-2.5 w-2.5" /> {f.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-zinc-400">
                    <div>Scanned {intel.lastFullScan ? new Date(intel.lastFullScan).toLocaleTimeString() : '—'}</div>
                    <div>Sources: {intel.categories.filter((c) => c.confidence > 0.5).length}/{intel.categories.length} verified</div>
                  </div>
                </CardContent>
              </Card>

              {/* Category tabs */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setActiveCategory('overview')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeCategory === 'overview' ? 'bg-emerald-500 text-white' : 'bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  Overview
                </button>
                {intel.categories.map((c) => (
                  <button
                    key={c.category}
                    onClick={() => setActiveCategory(c.category)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      activeCategory === c.category ? 'bg-emerald-500 text-white' : 'bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>

              {/* Overview grid: all categories */}
              {activeCategory === 'overview' ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {intel.categories.map((c) => (
                    <CategoryCard key={c.category} data={c} onSelect={() => setActiveCategory(c.category)} />
                  ))}
                </div>
              ) : (
                <SelectedCategoryDetail
                  data={intel.categories.find((c) => c.category === activeCategory)}
                  locationName={selectedLocation.name}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryCard({ data, onSelect }: { data: IntelCategoryData; onSelect: () => void }) {
  return (
    <button onClick={onSelect} className="rounded-xl border border-zinc-200 bg-white p-3 text-left transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between">
        <span className="text-xl">{data.icon}</span>
        <span className={`text-sm font-bold ${data.score.value >= 60 ? 'text-emerald-500' : data.score.value >= 40 ? 'text-amber-500' : data.score.value >= 25 ? 'text-orange-500' : 'text-red-500'}`}>
          {data.score.value}
        </span>
      </div>
      <div className="mt-1 text-xs font-medium text-zinc-700 dark:text-zinc-200">{data.label}</div>
      <div className="mt-1 text-[10px] text-zinc-400">{data.score.detail}</div>
      {/* mini bar */}
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div className={`h-full rounded-full ${data.score.value >= 80 ? 'bg-emerald-500' : data.score.value >= 60 ? 'bg-green-500' : data.score.value >= 40 ? 'bg-amber-500' : data.score.value >= 25 ? 'bg-orange-500' : 'bg-red-500'}`} style={{ width: `${data.score.value}%` }} />
      </div>
    </button>
  );
}

function SelectedCategoryDetail({ data, locationName }: { data?: IntelCategoryData; locationName: string }) {

  if (!data) return <Card><CardContent className="p-6 text-center text-sm text-zinc-400">Select a category</CardContent></Card>;
  const rows = Object.entries(data.data || {});
  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <span className="text-xl">{data.icon}</span>
          {data.label} — {locationName}
          <span className="text-xs font-normal text-zinc-400">
            ({data.source} · confidence {(data.confidence * 100).toFixed(0)}%)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-1">
        {/* Big score */}
        <div className="mb-4 flex items-center gap-4 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
          <div className={`flex h-16 w-16 flex-col items-center justify-center rounded-full ${data.score.value >= 80 ? 'bg-emerald-500' : data.score.value >= 60 ? 'bg-green-500' : data.score.value >= 40 ? 'bg-amber-500' : data.score.value >= 25 ? 'bg-orange-500' : 'bg-red-500'} text-white`}>
            <span className="text-xl font-bold">{data.score.value}</span>
            <span className="text-[8px] uppercase opacity-80">{data.score.level}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm text-zinc-700 dark:text-zinc-200">{data.score.detail}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {(data.flags || []).map((f, i) => (
                <span key={i} className={`rounded-full px-2 py-0.5 text-[10px] ${
                  f.severity === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30'
                  : f.severity === 'warning' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30'
                }`}>{f.label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Raw data rows */}
        {rows.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {rows.map(([k, v]) => (
              <div key={k} className="rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
                <div className="text-[9px] uppercase text-zinc-400">{k.replace(/_/g, ' ')}</div>
                <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{String(v)}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OverlayStat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-2 text-center dark:border-zinc-800 dark:bg-zinc-950">
      <div className="text-lg font-bold" style={color ? { color } : undefined}>{value}</div>
      <div className="text-[10px] text-zinc-400">{label}</div>
    </div>
  );
}
