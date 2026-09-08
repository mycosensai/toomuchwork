'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DensityBadge } from '@/components/ui/badge';
import { getDensityColor, getRecommendation } from '@/lib/density-utils';
import { Search, MapPin, Clock, ArrowRight, Bell } from 'lucide-react';
import { showToast } from '@/components/ui/toast';
import { BusinessLocation } from '@/types';

export function QuietFinder() {
  const { activeView, searchQuietFinder, quietFinderResults, businesses, settings, userLocation } = useStore();
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [nearMe, setNearMe] = useState(false);

  const haversine = (a: [number, number], b: [number, number]) => {
    const R = 6371; // km
    const dLat = ((b[1] - a[1]) * Math.PI) / 180;
    const dLng = ((b[0] - a[0]) * Math.PI) / 180;
    const la1 = (a[1] * Math.PI) / 180;
    const la2 = (b[1] * Math.PI) / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };

  const sortedResults = (() => {
    if (!nearMe || !userLocation) return quietFinderResults;
    return [...quietFinderResults].sort((x, y) => {
      const dx = haversine(userLocation, [x.location.lng, x.location.lat]);
      const dy = haversine(userLocation, [y.location.lng, y.location.lat]);
      return dx - dy;
    });
  })();

  if (activeView !== 'quiet-finder') return null;

  const handleSearch = () => {
    searchQuietFinder(query);
    setSearched(true);
  };

  const handleLeaveNow = (locationName: string, windowStart: string, biz?: BusinessLocation) => {
    if (biz) {
      useStore.getState().selectBusiness(biz);
      useStore.getState().setActiveView('map');
    }
    showToast(`${locationName} — Leave now for a quiet window starting around ${windowStart}`, 'success');
  };

  // Check notifications
  const { notificationEnabled, notificationStartHour, notificationEndHour } = settings;
  useEffect(() => {
    if (!notificationEnabled) return;
    const now = new Date();
    const hour = now.getHours();
    if (hour < notificationStartHour || hour > notificationEndHour) return;

    const nearGreen = businesses.filter(b => {
      const has = b.quietWindows.some(w => {
        const d = new Date(w.startTime).getTime() - Date.now();
        return d > 0 && d < 3600000 && w.expectedLevel === 'green';
      });
      return has;
    });

    if (nearGreen.length > 0) {
      showToast(`${nearGreen.length} quiet location${nearGreen.length > 1 ? 's' : ''} nearby — check Quiet Finder`, 'info', 5000);
    }
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Quiet Finder</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Find the best time to visit any place — when it&apos;s quietest and most comfortable.
        </p>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search for a grocery, pharmacy, coffee shop..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch}>Find quiet windows</Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {searched && quietFinderResults.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center text-zinc-500">
              <MapPin className="mx-auto mb-2 h-8 w-8" />
              <p>No matching locations found.</p>
              <p className="text-xs">Try a different search term.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {searched && quietFinderResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              Found {sortedResults.length} location{sortedResults.length > 1 ? 's' : ''}
            </p>
            {userLocation && (
              <button
                onClick={() => setNearMe((v) => !v)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${nearMe ? 'bg-emerald-500 text-white' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'}`}
              >
                Near me
              </button>
            )}
          </div>
          {sortedResults.map((result) => (
            <Card
              key={result.location.id}
              className="cursor-pointer transition-all hover:shadow-md"
              onClick={() => { useStore.getState().selectBusiness(result.location); useStore.getState().setActiveView('map'); }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{result.location.name}</CardTitle>
                    <CardDescription className="capitalize">{result.location.category}</CardDescription>
                  </div>
                  <div className="text-right">
                    <DensityBadge level={result.currentLevel} size="lg" />
                    <div className="mt-1 text-xs text-zinc-400">
                      Leave now score: {result.leaveNowScore}/100
                    </div>
                    {nearMe && userLocation && (
                      <div className="mt-0.5 text-xs text-emerald-600">
                        {haversine(userLocation, [result.location.lng, result.location.lat]).toFixed(1)} km away
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Recommendation */}
                <div className="mb-4 rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-800/50">
                  <p className="text-zinc-700 dark:text-zinc-300">
                    {getRecommendation(result.currentLevel, result.windows[0] || null)}
                  </p>
                </div>

                {/* Current density */}
                {result.location.density && (
                  <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-zinc-500">Vehicles nearby:</span>
                      <span className="ml-2 font-semibold">~{result.location.density.vehicleCountEst}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">People nearby:</span>
                      <span className="ml-2 font-semibold">~{result.location.density.pedestrianEst}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Confidence:</span>
                      <span className="ml-2 font-semibold">{Math.round(result.location.density.confidence * 100)}%</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Source:</span>
                      <span className="ml-2 font-semibold capitalize">{result.location.density.source}</span>
                    </div>
                  </div>
                )}

                {/* Quiet windows */}
                {result.windows.length > 0 && (
                  <div>
                    <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      <Clock className="h-4 w-4" />
                      Predicted quiet windows
                    </h4>
                    <div className="space-y-2">
                      {result.windows.map((window, i) => {
                        const start = new Date(window.startTime);
                        const end = new Date(window.endTime);
                        const startStr = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                        const endStr = end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                        return (
                          <div
                            key={i}
                            className="flex items-center justify-between rounded-lg border border-zinc-100 p-3 dark:border-zinc-800"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className="inline-block h-3 w-3 rounded-full"
                                style={{ backgroundColor: getDensityColor(window.expectedLevel) }}
                              />
                              <div>
                                <span className="text-sm font-medium">
                                  {startStr} – {endStr}
                                </span>
                                <span className="ml-2 text-xs text-zinc-400">
                                  Expected: {window.expectedLevel === 'green' ? 'Very quiet' :
                                    window.expectedLevel === 'yellow' ? 'Comfortable' :
                                    window.expectedLevel === 'orange' ? 'Getting busy' : 'Crowded'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-zinc-400">
                                {Math.round(window.confidence * 100)}% confidence
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleLeaveNow(result.location.name, startStr, result.location)}
                              >
                                <Bell className="mr-1 h-3 w-3" />Go then <ArrowRight className="ml-1 h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Default: show all locations */}
      {!searched && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            Or browse all monitored locations
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.map((biz) => (
              <Card
                key={biz.id}
                className="cursor-pointer transition-all hover:shadow-md"
                onClick={() => {
                  setQuery(biz.name);
                  searchQuietFinder(biz.name);
                  setSearched(true);
                  useStore.getState().selectBusiness(biz);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{biz.name}</p>
                      <p className="text-xs capitalize text-zinc-500">{biz.category}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {biz.density && <DensityBadge level={biz.density.densityLevel} size="sm" />}
                      {biz.densitySource === 'user' && (
                        <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white" title="Based on community reports">REAL</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
