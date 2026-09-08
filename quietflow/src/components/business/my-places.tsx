'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DensityBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getDensityColor } from '@/lib/density-utils';
import { Heart, Home, Star, Clock, Plus, MapPin, Trash2 } from 'lucide-react';
import { showToast } from '@/components/ui/toast';

export function MyPlaces() {
  const {
    activeView, businesses, favoritePlaces, toggleFavoritePlace, addFavoritePlace,
    homeLocation, setHomeLocation, completedOutings, selectBusiness, setActiveView, settings,
  } = useStore();

  const [editingHome, setEditingHome] = useState(false);
  const [homeName, setHomeName] = useState('');

  if (activeView !== 'my-places') return null;

  const savedPlaces = businesses.filter((b) => favoritePlaces.includes(b.id));
  const available = businesses.filter((b) => !favoritePlaces.includes(b.id));

  const saveHome = () => {
    const home = businesses.find((b) => b.name.toLowerCase().includes(homeName.toLowerCase())) || savedPlaces[0];
    if (home) {
      setHomeLocation({ lat: home.lat, lng: home.lng });
      showToast(`Home set near ${home.name}`, 'success');
    } else {
      showToast('Add a saved place first to set home', 'warning');
    }
    setEditingHome(false);
    setHomeName('');
  };

  const comfortText =
    settings.maxAcceptableDensity === 'green'
      ? 'You prefer very quiet outings'
      : settings.maxAcceptableDensity === 'yellow'
        ? 'Comfortable with moderate bustle'
        : 'Less sensitive to crowds';

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">My Places</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Your saved locations with personalized density insights.
        </p>
      </div>

      {/* Home location */}
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                <Home className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
              </div>
              <div>
                <CardTitle>Home</CardTitle>
                <p className="text-xs text-zinc-500">
                  {homeLocation
                    ? `Set · ${homeLocation.lat.toFixed(3)}, ${homeLocation.lng.toFixed(3)}`
                    : comfortText}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setEditingHome((v) => !v)}>
              {editingHome ? 'Cancel' : 'Edit'}
            </Button>
          </div>
        </CardHeader>
        {editingHome && (
          <CardContent className="pt-0">
            <div className="flex gap-2">
              <Input
                placeholder="Name a nearby place to use as home (e.g. Library)"
                value={homeName}
                onChange={(e) => setHomeName(e.target.value)}
              />
              <Button onClick={saveHome}>Set</Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Saved places */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
            Saved Places ({savedPlaces.length})
          </h2>
        </div>
        {savedPlaces.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-zinc-400">
              <Heart className="mx-auto mb-2 h-8 w-8 text-zinc-300" />
              <p>No saved places yet.</p>
              <p className="text-xs">Tap the star on any location (map, finder, or below) to save it.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {savedPlaces.map((biz) => (
              <Card key={biz.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <button
                    className="flex flex-1 items-center gap-3 text-left"
                    onClick={() => { selectBusiness(biz); setActiveView('map'); }}
                  >
                    <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{biz.name}</p>
                      <p className="text-xs capitalize text-zinc-500">{biz.category}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-3">
                    {biz.density && (
                      <div className="text-right">
                        <DensityBadge level={biz.density.densityLevel} size="sm" />
                        <div className="mt-0.5 text-[10px] text-zinc-400">~{biz.density.vehicleCountEst} vehicles</div>
                      </div>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => toggleFavoritePlace(biz.id)}>
                      <Trash2 className="h-4 w-4 text-zinc-400" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add place */}
      {available.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400">Add a place</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {available.map((biz) => (
              <button
                key={biz.id}
                onClick={() => { addFavoritePlace(biz.id); showToast(`Saved ${biz.name}`, 'info'); }}
                className="flex items-center justify-between rounded-lg border border-zinc-100 p-3 text-left transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
              >
                <div>
                  <p className="text-sm font-medium">{biz.name}</p>
                  <p className="text-xs capitalize text-zinc-400">{biz.category}</p>
                </div>
                <Plus className="h-4 w-4 text-zinc-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent outings */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> Recent Outings ({completedOutings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completedOutings.length === 0 ? (
            <div className="text-center text-sm text-zinc-500">
              <Heart className="mx-auto mb-2 h-8 w-8 text-zinc-300" />
              <p>No outings logged yet.</p>
              <p className="text-xs">Open a place and tap &ldquo;Log outing&rdquo; after a trip to build your profile.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {completedOutings.slice(0, 8).map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-lg border border-zinc-100 p-3 dark:border-zinc-800">
                  <div>
                    <p className="text-sm font-medium">{o.locationName}</p>
                    <p className="text-xs text-zinc-400">
                      {new Date(o.timestamp).toLocaleDateString()} {new Date(o.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: getDensityColor(o.densityAtTime) }} />
                    <span className="text-sm font-semibold">{'⭐'.repeat(o.calmnessRating)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nearby today */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4" /> Nearby Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {businesses.slice(0, 4).map((biz) => (
              <button
                key={biz.id}
                onClick={() => { selectBusiness(biz); setActiveView('map'); }}
                className="rounded-lg bg-zinc-50 p-3 text-left transition-colors hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{biz.name}</span>
                  {biz.density && <DensityBadge level={biz.density.densityLevel} size="sm" />}
                </div>
                <div className="mt-1 text-[10px] text-zinc-400 capitalize">{biz.category}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
