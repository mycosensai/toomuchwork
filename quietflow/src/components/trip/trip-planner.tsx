'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DensityBadge } from '@/components/ui/badge';
import { TripStop, TripPlan } from '@/types';
import { getDensityColor } from '@/lib/density-utils';
import { Route, Plus, MapPin, Trash2, Clock, ArrowRight, Navigation } from 'lucide-react';

export function TripPlanner() {
  const { activeView, businesses, tripPlans, currentTrip, setCurrentTrip, addTripPlan, removeTripPlan } = useStore();
  const [stops, setStops] = useState<TripStop[]>([]);
  const [tripName, setTripName] = useState('');

  if (activeView !== 'trip-planner') return null;

  const addStop = (bizId: string) => {
    const biz = businesses.find((b) => b.id === bizId);
    if (!biz || stops.some((s) => s.locationId === bizId)) return;
    setStops([...stops, {
      locationId: biz.id, name: biz.name, category: biz.category,
      lat: biz.lat, lng: biz.lng,
      estimatedDensityAtArrival: biz.density?.densityLevel,
    }]);
  };

  const removeStop = (idx: number) => setStops(stops.filter((_, i) => i !== idx));

  const saveTrip = () => {
    if (stops.length === 0) return;
    const plan: TripPlan = {
      id: `trip-${Date.now()}`,
      name: tripName || `Trip ${tripPlans.length + 1}`,
      stops: [...stops],
      totalEstimatedDuration: stops.length * 20,
      bestTimeToLeave: new Date(Date.now() + 3600000).toISOString(),
      overallDensityScore: Math.max(0, 100 - stops.reduce((s, st) => {
        const lv: Record<string, number> = { green: 0, yellow: 1, orange: 2, red: 3, purple: 4 };
        return s + (lv[st.estimatedDensityAtArrival || 'green'] || 0) * 20;
      }, 0)),
    };
    addTripPlan(plan);
    setStops([]);
    setTripName('');
  };

  const scoreColor = (score: number) =>
    score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-red-500';

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          <Navigation className="h-6 w-6" /> Trip Planner
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Plan a multi-stop trip with density-aware routing.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Build trip */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Build Your Trip</CardTitle>
            <CardDescription>Add stops from monitored locations</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Trip name (optional)"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              className="mb-3"
            />
            <div className="mb-3 max-h-48 space-y-1 overflow-y-auto">
              {businesses.map((biz) => (
                <button
                  key={biz.id}
                  onClick={() => addStop(biz.id)}
                  disabled={stops.some((s) => s.locationId === biz.id)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-50 disabled:opacity-40 dark:hover:bg-zinc-800"
                >
                  <div>
                    <span className="font-medium">{biz.name}</span>
                    <span className="ml-2 text-xs text-zinc-400 capitalize">{biz.category}</span>
                  </div>
                  <Plus className="h-3.5 w-3.5 text-zinc-400" />
                </button>
              ))}
            </div>

            {/* Current stops */}
            {stops.length > 0 && (
              <div className="mb-3 space-y-2">
                <p className="text-xs font-medium text-zinc-500">Stops ({stops.length})</p>
                {stops.map((stop, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-zinc-100 p-2 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium">{stop.name}</p>
                        <p className="text-xs text-zinc-400 capitalize">{stop.category}</p>
                      </div>
                    </div>
                    <button onClick={() => removeStop(i)} className="text-zinc-400 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Button onClick={saveTrip} disabled={stops.length === 0} className="w-full">
              <Route className="mr-1.5 h-4 w-4" /> Save Trip ({stops.length} stops)
            </Button>
          </CardContent>
        </Card>

        {/* Saved trips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Saved Trips</CardTitle>
            <CardDescription>Previously planned routes</CardDescription>
          </CardHeader>
          <CardContent>
            {tripPlans.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-400">
                <MapPin className="mx-auto mb-2 h-8 w-8 text-zinc-300" />
                <p>No trips planned yet</p>
                <p className="text-xs">Add stops and save your first trip</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tripPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`cursor-pointer rounded-xl border p-3 transition-all hover:shadow-sm ${
                      currentTrip?.id === plan.id ? 'border-emerald-300 ring-1 ring-emerald-300' : 'border-zinc-200 dark:border-zinc-700'
                    }`}
                    onClick={() => setCurrentTrip(plan)}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-semibold text-sm">{plan.name}</h3>
                      <span className={`text-xs font-bold ${scoreColor(plan.overallDensityScore)}`}>
                        Score: {plan.overallDensityScore}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {plan.stops.map((stop, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-zinc-500">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-100 text-[9px] dark:bg-zinc-800">{i + 1}</span>
                          {stop.name}
                          {stop.estimatedDensityAtArrival && (
                            <span className="ml-auto flex items-center gap-1">
                              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: getDensityColor(stop.estimatedDensityAtArrival) }} />
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-400">
                      <span>~{plan.totalEstimatedDuration} min total</span>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); removeTripPlan(plan.id); }}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active trip detail */}
      {currentTrip && (
        <Card className="mt-4 border-emerald-200 dark:border-emerald-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Navigation className="h-4 w-4 text-emerald-500" />
              Active: {currentTrip.name}
            </CardTitle>
            <CardDescription>
              Best time to leave: {new Date(currentTrip.bestTimeToLeave).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              {' · '}Overall density score: <span className={`font-semibold ${scoreColor(currentTrip.overallDensityScore)}`}>{currentTrip.overallDensityScore}/100</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {currentTrip.stops.map((stop, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="whitespace-nowrap rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-800">
                    <p className="font-medium">{stop.name}</p>
                    <div className="flex items-center gap-1 text-xs text-zinc-400">
                      <Clock className="h-3 w-3" />
                      ~20 min
                      {stop.estimatedDensityAtArrival && (
                        <DensityBadge level={stop.estimatedDensityAtArrival} size="sm" />
                      )}
                    </div>
                  </div>
                  {i < currentTrip.stops.length - 1 && <ArrowRight className="h-4 w-4 shrink-0 text-zinc-300" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
