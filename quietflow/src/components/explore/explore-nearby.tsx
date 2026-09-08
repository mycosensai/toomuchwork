'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useStore } from '@/store';
import {
  POICategory,
  POI_CATEGORIES,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  CATEGORY_GROUPS,
  NearbyResult,
  BusinessHours,
} from '@/types/geospatial';
import { BusinessLocation } from '@/types';
import { cn } from '@/lib/cn';

interface ExploreNearbyProps {
  lat: number;
  lng: number;
  onClose?: () => void;
}

const DISTANCE_OPTIONS = [
  { label: 'Nearby (0.5 km)', value: 500 },
  { label: 'Walking (1 km)', value: 1000 },
  { label: 'Driving (3 km)', value: 3000 },
  { label: 'City-wide (8 km)', value: 8000 },
];

export function ExploreNearby({ lat, lng, onClose }: ExploreNearbyProps) {
  const { businesses } = useStore();
  const [radius, setRadius] = useState(1000);
  const [selectedCat, setSelectedCat] = useState<POICategory | 'all'>('all');
  const [grouped, setGrouped] = useState(true);
  const [sortBy, setSortBy] = useState<'distance' | 'density' | 'rating'>('distance');

  // Find all businesses within radius of the tapped point
  const nearbyResults = useMemo(() => {
    const results: (NearbyResult & { business: BusinessLocation })[] = [];
    
    businesses.forEach((biz) => {
      const dist = haversine(lat, lng, biz.lat, biz.lng);
      if (dist > radius) return;
      
      const densityMap: Record<string, string> = { green: 'quiet', yellow: 'quiet', orange: 'moderate', red: 'busy', purple: 'very_busy' };
      
      results.push({
        locationId: biz.id,
        name: biz.name,
        category: (biz.category || 'other') as POICategory,
        lat: biz.lat,
        lng: biz.lng,
        distance: Math.round(dist),
        densityLevel: biz.density?.densityLevel,
        isOpen: biz.hours ? isBusinessOpen(biz.hours) : true,
        rating: biz.rating || 0,
        business: biz,
        crowdLevel: densityMap[biz.density?.densityLevel || 'green'] as any,
      });
    });

    // Sort
    results.sort((a, b) => {
      if (sortBy === 'distance') return a.distance - b.distance;
      if (sortBy === 'density') return (b.densityLevel ? levelValue(b.densityLevel) : 0) - (a.densityLevel ? levelValue(a.densityLevel) : 0);
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return 0;
    });

    return results;
  }, [businesses, lat, lng, radius, sortBy]);

  // Filter by selected category
  const filtered = useMemo(() => {
    if (selectedCat === 'all') return nearbyResults;
    return nearbyResults.filter(r => r.category === selectedCat);
  }, [nearbyResults, selectedCat]);

  // Group by category
  const groupedResults = useMemo(() => {
    if (!grouped) return null;
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach(r => {
      const cat = r.category || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(r);
    });
    // Sort groups by size
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [filtered, grouped]);

  const flyToLocation = (biz: BusinessLocation) => {
    useStore.getState().selectBusiness(biz);
    useStore.getState().setMapCenter([biz.lng, biz.lat]);
    useStore.getState().setMapZoom(16);
    onClose?.();
  };

  const selectCategory = (cat: POICategory | 'all') => {
    setSelectedCat(cat);
    if (cat !== 'all' && grouped) setGrouped(false);
  };

  return (
    <div className="flex flex-col bg-white dark:bg-zinc-950 fixed inset-0 z-50 md:absolute md:inset-auto md:right-4 md:top-16 md:w-96 md:max-h-[80vh] md:rounded-xl md:border md:border-zinc-200 md:shadow-xl dark:md:border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-lg">📍</span>
          <h2 className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">
            {filtered.length} spots nearby
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setGrouped(!grouped)}
            className={cn('rounded px-2 py-1 text-[10px] font-medium', grouped ? 'bg-emerald-100 text-emerald-700' : 'text-zinc-400 hover:text-zinc-600')}
          >
            Group
          </button>
          {onClose && (
            <button onClick={onClose} className="rounded p-1 text-zinc-400 hover:text-zinc-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Radius selector */}
      <div className="flex gap-1 border-b border-zinc-100 px-4 py-2 dark:border-zinc-800">
        {DISTANCE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setRadius(opt.value)}
            className={cn(
              'rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors',
              radius === opt.value
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-2 text-[10px] dark:border-zinc-800">
        <span className="text-zinc-400">Sort:</span>
        {(['distance', 'density', 'rating'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className={cn(
              'rounded px-2 py-0.5 font-medium',
              sortBy === s ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-zinc-500'
            )}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Category quick filter bar */}
      <div className="flex gap-1 overflow-x-auto border-b border-zinc-100 px-4 py-2 dark:border-zinc-800 scrollbar-none">
        <button
          onClick={() => selectCategory('all')}
          className={cn(
            'flex-shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-colors',
            selectedCat === 'all' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
          )}
        >
          All
        </button>
        {(['food', 'service', 'shop', 'fuel', 'fun'] as const).map(group => (
          <button
            key={group}
            onClick={() => {}}
            className="flex-shrink-0 rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
          >
            {group === 'food' ? '🍔 Food' : group === 'service' ? '🔧 Service' : group === 'shop' ? '🛍️ Shop' : group === 'fuel' ? '⛽ Fuel' : '🎉 Fun'}
          </button>
        ))}
      </div>

      {/* Results area */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <span className="mb-2 text-3xl">🔍</span>
            <p className="text-sm font-medium text-zinc-500">Nothing found nearby</p>
            <p className="mt-1 text-xs text-zinc-400">Try expanding the search radius</p>
          </div>
        ) : grouped && groupedResults ? (
          // Grouped view
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {groupedResults.map(([cat, items]) => (
              <div key={cat}>
                <div className="sticky top-0 bg-white/95 px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400 backdrop-blur-sm dark:bg-zinc-950/95">
                  {CATEGORY_ICONS[cat as POICategory] || '📍'} {CATEGORY_LABELS[cat as POICategory] || cat} · {items.length}
                </div>
                {items.slice(0, 5).map(r => (
                  <button
                    key={r.locationId}
                    onClick={() => flyToLocation(r.business)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  >
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm dark:bg-zinc-800">
                      {CATEGORY_ICONS[r.category] || '📍'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">{r.name}</span>
                        {r.isOpen === false && <span className="rounded bg-red-100 px-1.5 py-0.5 text-[9px] text-red-600 dark:bg-red-900/30 dark:text-red-400">Closed</span>}
                        {r.rating && r.rating > 0 && <span className="text-[10px] text-amber-500">⭐{r.rating.toFixed(1)}</span>}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                        <span>{r.distance}m</span>
                        {r.crowdLevel && (
                          <>
                            <span>·</span>
                            <span className={cn(
                              r.crowdLevel === 'quiet' && 'text-emerald-500',
                              r.crowdLevel === 'moderate' && 'text-yellow-500',
                              r.crowdLevel === 'busy' && 'text-orange-500',
                              r.crowdLevel === 'very_busy' && 'text-red-500',
                            )}>{r.crowdLevel}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                {items.length > 5 && (
                  <button
                    onClick={() => { selectCategory(cat as POICategory); }}
                    className="w-full px-4 py-1.5 text-[11px] font-medium text-emerald-600 hover:bg-zinc-50 dark:text-emerald-400 dark:hover:bg-zinc-900/50"
                  >
                    +{items.length - 5} more in {CATEGORY_LABELS[cat as POICategory] || cat}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          // Flat list view
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filtered.map(r => (
              <button
                key={r.locationId}
                onClick={() => flyToLocation(r.business)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-zinc-100 text-lg dark:bg-zinc-800">
                  {CATEGORY_ICONS[r.category] || '📍'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">{r.name}</span>
                    {r.isOpen === false && <span className="rounded bg-red-100 px-1.5 py-0.5 text-[9px] text-red-600">Closed</span>}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-400">
                    <span>{CATEGORY_LABELS[r.category] || r.category}</span>
                    <span>·</span>
                    <span>{r.distance}m</span>
                    {r.rating && r.rating > 0 && <><span>·</span><span className="text-amber-500">⭐{r.rating.toFixed(1)}</span></>}
                  </div>
                </div>
                <svg className="h-4 w-4 flex-shrink-0 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-200 px-4 py-2 text-[10px] text-zinc-400 dark:border-zinc-800">
        {filtered.length} results within {radius >= 1000 ? `${(radius / 1000).toFixed(1)}km` : `${radius}m`} of pinned point
      </div>
    </div>
  );
}

// ─── Utils ───

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function levelValue(level: string): number {
  return { green: 0, yellow: 1, orange: 2, red: 3, purple: 4 }[level] || 0;
}

function isBusinessOpen(hours: { open: string; close: string }): boolean {
  try {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = hours.open.split(':').map(Number);
    const [closeH, closeM] = hours.close.split(':').map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    if (closeMinutes < openMinutes) return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  } catch { return true; }
}
