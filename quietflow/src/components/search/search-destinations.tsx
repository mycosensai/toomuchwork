'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useStore } from '@/store';
import {
  SearchResult,
  SearchFilters,
  DEFAULT_SEARCH_FILTERS,
  BUSINESS_CATEGORIES,
  CATEGORY_ICONS,
} from '@/types/features';
import { cn } from '@/lib/cn';

interface SearchDestinationsProps {
  className?: string;
  onClose?: () => void;
  compact?: boolean; // embedded in map header
}

export function SearchDestinations({ className, onClose, compact }: SearchDestinationsProps) {
  const { businesses, cameras, favoritePlaces, favoriteCameras, recentSearches, addRecentSearch, setSearchQuery } = useStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({ ...DEFAULT_SEARCH_FILTERS });
  const [noResults, setNoResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Compute user location for distance
  const userLocation = useStore((s) => s.userLocation);

  // Category selections for filter
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Build search index from all data sources
  const searchIndex = useMemo(() => {
    const index: SearchResult[] = [];

    // Businesses
    businesses.forEach((b) => {
      index.push({
        id: `biz-${b.id}`,
        name: b.name,
        lat: b.lat,
        lng: b.lng,
        kind: 'business',
        category: b.category,
        densityLevel: b.density?.densityLevel,
        isOpen: b.hours ? isBusinessOpen(b.hours) : true,
        distance: userLocation ? haversine(userLocation[1], userLocation[0], b.lat, b.lng) : undefined,
      });
    });

    // Cameras
    cameras.forEach((c) => {
      index.push({
        id: `cam-${c.id}`,
        name: c.name,
        lat: c.lat,
        lng: c.lng,
        kind: 'camera',
        category: `Camera · ${c.roadName}`,
        densityLevel: c.densityLevel,
        address: c.jurisdiction,
        isOpen: c.status === 'online',
        distance: userLocation ? haversine(userLocation[1], userLocation[0], c.lat, c.lng) : undefined,
      });
    });

    // Saved places (favorites)
    const favoritePlaceIds = new Set(favoritePlaces);
    businesses.filter((b) => favoritePlaceIds.has(b.id)).forEach((b) => {
      index.push({
        id: `fav-${b.id}`,
        name: `⭐ ${b.name}`,
        lat: b.lat,
        lng: b.lng,
        kind: 'saved_place',
        category: b.category,
        densityLevel: b.density?.densityLevel,
        isOpen: b.hours ? isBusinessOpen(b.hours) : true,
        distance: userLocation ? haversine(userLocation[1], userLocation[0], b.lat, b.lng) : undefined,
      });
    });

    return index;
  }, [businesses, cameras, favoritePlaces, userLocation]);

  // Perform search
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setResults([]);
      setNoResults(false);
      setSelectedIndex(-1);
      return;
    }

    let filtered = searchIndex.filter((r) => {
      // Text match
      if (!r.name.toLowerCase().includes(q) && !(r.category?.toLowerCase().includes(q))) return false;

      // Kind filter
      if (!filters.kinds.includes(r.kind)) return false;

      // Category filter
      if (selectedCategories.length > 0 && r.kind === 'business' && r.category && !selectedCategories.includes(r.category)) return false;

      // Distance filter
      if (filters.maxDistance > 0 && r.distance && r.distance > filters.maxDistance) return false;

      // Open filter
      if (filters.onlyOpen && !r.isOpen) return false;

      // Favorites filter
      if (filters.onlyFavorites && !r.id.startsWith('fav-')) return false;

      return true;
    });

    // Sort by relevance: exact name match first, then starts-with, then distance
    filtered.sort((a, b) => {
      const aExact = a.name.toLowerCase() === q ? -1 : 0;
      const bExact = b.name.toLowerCase() === q ? 1 : 0;
      if (aExact !== bExact) return aExact - bExact;
      const aStarts = a.name.toLowerCase().startsWith(q) ? -1 : 0;
      const bStarts = b.name.toLowerCase().startsWith(q) ? 1 : 0;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return (a.distance ?? Infinity) - (b.distance ?? Infinity);
    });

    filtered = filtered.slice(0, 12);
    setResults(filtered);
    setNoResults(filtered.length === 0);
    setSelectedIndex(-1);
  }, [query, searchIndex, filters, selectedCategories]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
      e.preventDefault();
      selectResult(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose?.();
    }
  }, [results, selectedIndex, onClose]);

  // Select a result — fly to it on map
  const selectResult = (r: SearchResult) => {
    addRecentSearch(query);
    setSearchQuery(query);
    
    // Fly to location via the store
    useStore.getState().setMapCenter([r.lng, r.lat]);
    useStore.getState().setMapZoom(15);

    // Select business or camera
    if (r.kind === 'business' || r.kind === 'saved_place') {
      const realId = r.id.replace(/^(biz-|fav-)/, '');
      const biz = businesses.find((b) => b.id === realId);
      if (biz) useStore.getState().selectBusiness(biz);
    } else if (r.kind === 'camera') {
      const realId = r.id.replace('cam-', '');
      const cam = cameras.find((c) => c.id === realId);
      if (cam) useStore.getState().selectCamera(cam);
    }

    onClose?.();
  };

  // Toggle a category filter
  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  // Recent searches
  const showRecent = query.trim() === '' && recentSearches.length > 0;

  return (
    <div className={cn(
      'flex flex-col bg-white dark:bg-zinc-950',
      compact ? '' : 'fixed inset-0 z-50 md:relative md:inset-auto',
      className,
    )}>
      {/* Search bar */}
      <div className={cn(
        'flex items-center gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800',
        compact && 'border-0 px-2 py-1',
      )}>
        <svg className="h-4 w-4 flex-shrink-0 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search businesses, cameras, saved places…"
          className="flex-1 bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
        />
        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'rounded p-1.5 text-xs transition-colors',
            showFilters || selectedCategories.length > 0
              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300',
          )}
          aria-label="Toggle filters"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L14 14.586V19a1 1 0 01-.553.894l-4 2A1 1 0 018 21v-6.414L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
        </button>
        {onClose && (
          <button onClick={onClose} className="rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300" aria-label="Close search">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
          {/* Kind filters */}
          <div className="mb-2">
            <label className="mb-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500">Type</label>
            <div className="flex flex-wrap gap-1.5">
              {(['business', 'camera', 'saved_place'] as const).map((kind) => (
                <button
                  key={kind}
                  onClick={() => setFilters((f) => ({
                    ...f,
                    kinds: f.kinds.includes(kind)
                      ? f.kinds.filter((k) => k !== kind)
                      : [...f.kinds, kind],
                  }))}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
                    filters.kinds.includes(kind)
                      ? 'bg-emerald-500 text-white'
                      : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700',
                  )}
                >
                  {kind === 'saved_place' ? '⭐ Saved' : kind.charAt(0).toUpperCase() + kind.slice(1)}s
                </button>
              ))}
            </div>
          </div>

          {/* Category filters */}
          <div className="mb-2">
            <label className="mb-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {BUSINESS_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
                    selectedCategories.includes(cat)
                      ? 'bg-emerald-500 text-white'
                      : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700',
                  )}
                >
                  {CATEGORY_ICONS[cat] || ''} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle filters */}
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
              <input
                type="checkbox"
                checked={filters.onlyOpen}
                onChange={(e) => setFilters((f) => ({ ...f, onlyOpen: e.target.checked }))}
                className="rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500"
              />
              Open now
            </label>
            <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
              <input
                type="checkbox"
                checked={filters.onlyFavorites}
                onChange={(e) => setFilters((f) => ({ ...f, onlyFavorites: e.target.checked }))}
                className="rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500"
              />
              Favorites only
            </label>
          </div>
        </div>
      )}

      {/* Recent searches (when query is empty) */}
      {showRecent && (
        <div className="px-4 py-2">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">Recent</p>
          <div className="flex flex-wrap gap-1.5">
            {recentSearches.slice(0, 8).map((s) => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {noResults && query.trim() !== '' && (
        <div className="flex flex-col items-center py-10 text-center">
          <span className="mb-2 text-3xl">🔍</span>
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">No results for &ldquo;{query}&rdquo;</p>
          <p className="mt-0.5 text-xs text-zinc-400">Try a different search or adjust filters</p>
        </div>
      )}

      {/* Results list */}
      {results.length > 0 && (
        <div ref={resultsRef} className="flex-1 divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-800">
          {results.map((r, i) => (
            <button
              key={r.id}
              onClick={() => selectResult(r)}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                selectedIndex === i
                  ? 'bg-emerald-50 dark:bg-emerald-900/20'
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50',
              )}
            >
              {/* Icon */}
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm dark:bg-zinc-800">
                {r.kind === 'camera' ? '📹' : r.kind === 'saved_place' ? '⭐' : (CATEGORY_ICONS[r.category || ''] || '📍')}
              </span>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">{r.name.replace(/^⭐ /, '')}</span>
                  {r.isOpen === false && (
                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">Closed</span>
                  )}
                  {r.kind === 'business' && r.densityLevel && (
                    <span className={cn(
                      'rounded px-1.5 py-0.5 text-[9px] font-medium',
                      r.densityLevel === 'green' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                      r.densityLevel === 'yellow' && 'bg-yellow-100 text-yellow-700',
                      r.densityLevel === 'orange' && 'bg-orange-100 text-orange-700',
                      r.densityLevel === 'red' && 'bg-red-100 text-red-700',
                      r.densityLevel === 'purple' && 'bg-purple-100 text-purple-700',
                    )}>
                      {r.densityLevel}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-400">
                  <span className="capitalize">{r.category || r.kind}</span>
                  {r.distance !== undefined && (
                    <>
                      <span>·</span>
                      <span>{formatDistance(r.distance)}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Action icon */}
              <svg className="h-4 w-4 flex-shrink-0 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      )}

      {/* Keyboard help */}
      {results.length > 0 && (
        <div className="border-t border-zinc-100 px-4 py-2 text-[10px] text-zinc-400 dark:border-zinc-800">
          ↑↓ Navigate · Enter Select · Esc Close
        </div>
      )}
    </div>
  );
}

// ─── Utility functions ───

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function isBusinessOpen(hours: { open: string; close: string }): boolean {
  try {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = hours.open.split(':').map(Number);
    const [closeH, closeM] = hours.close.split(':').map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    if (closeMinutes < openMinutes) {
      // Spans midnight
      return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
    }
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  } catch { return true; }
}
