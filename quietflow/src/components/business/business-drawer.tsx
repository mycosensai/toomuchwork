'use client';

import { useStore } from '@/store';
import { Card } from '@/components/ui/card';
import { Badge, DensityBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getDensityColor, getRecommendation } from '@/lib/density-utils';
import { X, MapPin, Star, Clock, Heart, Navigation, Share2 } from 'lucide-react';
import { showToast } from '@/components/ui/toast';

export function BusinessDrawer() {
  const {
    selectedBusiness, selectBusiness, favoritePlaces, toggleFavoritePlace,
    userLocation, routeProfile, setRouteProfile, setActiveView,
  } = useStore();
  const located = !!userLocation;

  if (!selectedBusiness) return null;
  const biz = selectedBusiness;
  const isFav = favoritePlaces.includes(biz.id);
  const density = biz.density;

  const handleLogOuting = () => {
    const rating = (density?.densityLevel === 'green' ? 5 : density?.densityLevel === 'yellow' ? 4 : density?.densityLevel === 'orange' ? 3 : 2) as 1 | 2 | 3 | 4 | 5;
    useStore.getState().logOuting({
      id: `outing-${Date.now()}`,
      locationId: biz.id,
      locationName: biz.name,
      timestamp: new Date().toISOString(),
      calmnessRating: rating,
      densityAtTime: density?.densityLevel || 'green',
    });
    showToast(`Outing logged at ${biz.name} — rated ${rating}/5 calm. Nicely done.`, 'success');
  };

  const handleShare = async () => {
    const uri = 'https://quietflow.pages.dev';
    const deep = `${uri}?place=${encodeURIComponent(biz.name)}&id=${biz.id}`;
    const text = `QuietFlow: ${biz.name} is currently ${density?.densityLevel || 'unknown'} (vehicles ~${density?.vehicleCountEst ?? '?'}). Check quiet windows: ${deep}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: biz.name, text, url: deep });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        showToast('Place details copied to clipboard', 'info');
      } else {
        showToast('Sharing not supported on this device', 'info');
      }
    } catch {
      /* user cancelled — ignore */
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="absolute inset-0 z-20 bg-black/30"
        onClick={() => selectBusiness(null)}
      />
      {/* Drawer */}
      <div className="absolute right-0 top-0 z-30 flex h-full w-full max-w-md flex-col bg-white shadow-2xl dark:bg-zinc-950">
        <div className="flex items-start justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-emerald-500" />
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{biz.name}</h2>
              <p className="text-xs capitalize text-zinc-500">{biz.category} · {biz.lat.toFixed(4)}, {biz.lng.toFixed(4)}</p>
            </div>
          </div>
          <button onClick={() => selectBusiness(null)} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {density && (
            <Card>
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <DensityBadge level={density.densityLevel} size="lg" />
                  <span className="text-xs text-zinc-400">updated {new Date(density.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                </div>
                <p className="mb-3 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300">
                  {getRecommendation(density.densityLevel, biz.quietWindows[0] || null)}
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-zinc-500">Vehicles:</span> <span className="font-semibold">~{density.vehicleCountEst}</span></div>
                  <div><span className="text-zinc-500">People:</span> <span className="font-semibold">~{density.pedestrianEst}</span></div>
                  <div><span className="text-zinc-500">Confidence:</span> <span className="font-semibold">{Math.round(density.confidence * 100)}%</span></div>
                  <div><span className="text-zinc-500">Source:</span> <span className="font-semibold capitalize">{density.source}</span></div>
                </div>
              </div>
            </Card>
          )}

          {/* Quiet windows */}
          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              <Clock className="h-4 w-4" /> Predicted quiet windows
            </h3>
            {biz.quietWindows.length === 0 ? (
              <p className="text-sm text-zinc-400">No quiet windows predicted right now.</p>
            ) : (
              <div className="space-y-2">
                {biz.quietWindows.map((w, i) => {
                  const start = new Date(w.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                  const end = new Date(w.endTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                  return (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-zinc-100 p-3 dark:border-zinc-800">
                      <div className="flex items-center gap-3">
                        <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: getDensityColor(w.expectedLevel) }} />
                        <span className="text-sm font-medium">{start} – {end}</span>
                        <span className="text-xs text-zinc-400">{Math.round(w.confidence * 100)}% conf.</span>
                      </div>
                      <Badge variant="success" size="sm">{w.expectedLevel === 'green' ? 'Quiet' : w.expectedLevel}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Authorized cameras */}
          {biz.authorizedCameraIds.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Linked cameras</h3>
              <div className="flex flex-wrap gap-2">
                {biz.authorizedCameraIds.map((cid) => {
                  const cam = useStore.getState().cameras.find((c) => c.id === cid);
                  return (
                    <button
                      key={cid}
                      onClick={() => { if (cam) { useStore.getState().selectCamera(cam); setActiveView('cameras'); } }}
                      className="rounded-full bg-zinc-100 px-3 py-1 text-xs dark:bg-zinc-800"
                    >
                      {cam?.name || cid}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-t border-zinc-200 p-4 dark:border-zinc-800">
          <Button
            variant={isFav ? 'secondary' : 'outline'}
            className="flex-1"
            onClick={() => { toggleFavoritePlace(biz.id); showToast(isFav ? `Removed ${biz.name} from saved places` : `Saved ${biz.name}`, 'info'); }}
          >
            <Star className={`mr-1 h-4 w-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
            {isFav ? 'Saved' : 'Save'}
          </Button>
          <Button variant="outline" className="flex-1" onClick={handleShare}>
            <Share2 className="mr-1 h-4 w-4" /> Share
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => { setActiveView('map'); }}>
            <Navigation className="mr-1 h-4 w-4" /> Map
          </Button>
          {located && (
            <Button
              className="flex-1"
              onClick={() => { setActiveView('map'); showToast(`Routing ${routeProfile} from your location to ${biz.name}…`, 'info'); }}
            >
              <Navigation className="mr-1 h-4 w-4" /> Directions
            </Button>
          )}
          {located && (
            <div className="flex w-full gap-1">
              <button
                onClick={() => setRouteProfile('walking')}
                className={`flex-1 rounded px-2 py-1 text-xs font-medium ${routeProfile === 'walking' ? 'bg-emerald-500 text-white' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800'}`}
              >Walk</button>
              <button
                onClick={() => setRouteProfile('driving')}
                className={`flex-1 rounded px-2 py-1 text-xs font-medium ${routeProfile === 'driving' ? 'bg-emerald-500 text-white' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800'}`}
              >Drive</button>
            </div>
          )}
          {!located && (
            <p className="w-full text-center text-[11px] text-zinc-400">Tap “Locate me” on the map to get directions.</p>
          )}
          <Button className="flex-1" onClick={handleLogOuting}>
            <Heart className="mr-1 h-4 w-4" /> Log outing
          </Button>
        </div>
      </div>
    </>
  );
}
