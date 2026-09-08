'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BearingDirection, CameraSource, DensityLevel, Camera } from '@/types';
import { Search, MapPin, Navigation, Compass, Layers, RefreshCw, X, ChevronDown, ChevronUp } from 'lucide-react';
import { showToast } from '@/components/ui/toast';

const DIRECTIONS: { label: string; value: BearingDirection | '' }[] = [
  { label: 'Any direction', value: '' },
  { label: '↑ N', value: 'N' },
  { label: '↗ NE', value: 'NE' },
  { label: '→ E', value: 'E' },
  { label: '↘ SE', value: 'SE' },
  { label: '↓ S', value: 'S' },
  { label: '↙ SW', value: 'SW' },
  { label: '← W', value: 'W' },
  { label: '↖ NW', value: 'NW' },
];

const SOURCES: { label: string; value: CameraSource }[] = [
  { label: 'All sources', value: 'all' },
  { label: 'OpenStreetMap', value: 'osm' },
  { label: 'TomTom Traffic', value: 'tomtom' },
  { label: '511 TX DOT', value: '511_tx' },
  { label: 'TxDOT CCTV', value: 'cctv' },
  { label: '511 NY DOT', value: '511_ny' },
  { label: 'NYC Open Data', value: 'nyc_opendata' },
  { label: 'Ring Doorbells', value: 'ring' },
  { label: 'Doorbell Cameras', value: 'doorbell' },
  { label: 'Manual', value: 'manual' },
];

export function CameraDiscovery() {
  const { activeView, discoverCameras, discoveredCameras, discoveryResult, discoveryLoading, clearDiscovery } = useStore();
  const [location, setLocation] = useState('Dallas, TX');
  const [direction, setDirection] = useState<BearingDirection | ''>('');
  const [radius, setRadius] = useState(2);
  const [source, setSource] = useState<CameraSource>('all');
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (activeView !== 'camera-discovery') return null;

  const handleSearch = () => {
    discoverCameras({
      location: location.trim() || 'Dallas, TX',
      direction: direction || undefined,
      radiusMiles: radius,
      source,
    });
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) { showToast('Geolocation not available', 'info'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        showToast('Location set to current GPS', 'success');
      },
      () => showToast('Could not get location', 'info'),
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Camera Discovery</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Discover real traffic cameras from OSM OpenStreetMap + TomTom near any location.
        </p>
      </div>

      {/* Search form */}
      <Card className="mb-6">
        <CardContent className="p-4 space-y-3">
          {/* Location input */}
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Location</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Address, city, or 'lat, lng'"
                  className="pl-7"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleUseCurrentLocation} title="Use GPS location">
                📍
              </Button>
            </div>
          </div>

          {/* Quick direction + radius */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-zinc-500">Direction</label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as BearingDirection | '')}
                className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
              >
                {DIRECTIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <label className="mb-1 block text-xs font-medium text-zinc-500">Radius</label>
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
              >
                {[0.5, 1, 2, 3, 5, 10].map((r) => (
                  <option key={r} value={r}>{r} mi</option>
                ))}
              </select>
            </div>
          </div>

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-600"
          >
            {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showAdvanced ? 'Less' : 'More'} options
          </button>

          {showAdvanced && (
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Source</label>
              <div className="flex gap-1">
                {SOURCES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSource(s.value)}
                    className={`flex-1 rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                      source === s.value
                        ? 'bg-amber-500 text-white'
                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button onClick={handleSearch} disabled={discoveryLoading} className="w-full">
            {discoveryLoading ? (
              <><RefreshCw className="mr-1 h-4 w-4 animate-spin" /> Discovering…</>
            ) : (
              <><Search className="mr-1 h-4 w-4" /> Discover Cameras</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {discoveryResult && (
        <Card className="mb-4">
          <CardContent className="flex items-center justify-between p-3">
            <div className="text-xs text-zinc-500">
              <span className="font-semibold text-zinc-800 dark:text-zinc-100">{discoveryResult.count}</span> cameras found via{' '}
              <span className="font-semibold">{discoveryResult.source}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleSearch}><RefreshCw className="mr-1 h-3 w-3" /> Refresh</Button>
              <Button variant="ghost" size="sm" onClick={() => { clearDiscovery(); showToast('Discovery results cleared', 'info'); }}>
                <X className="mr-1 h-3 w-3" /> Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Camera list */}
      {discoveredCameras.length > 0 && (
        <div className="space-y-2">
          {discoveredCameras.map((cam) => (
            <Card key={cam.id} className="cursor-pointer transition-all hover:shadow-md" onClick={() => {
              useStore.getState().setMapCenter([cam.lng, cam.lat]);
              useStore.getState().setActiveView('map');
            }}>
              <CardContent className="flex items-center justify-between p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                    <span className="text-sm font-medium text-zinc-900 truncate dark:text-zinc-100">{cam.name}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-[10px] text-zinc-400">
                    {cam.roadName && <span>{cam.roadName}</span>}
                    {cam.operator && <span>· {cam.operator}</span>}
                    {cam.direction !== undefined && <span>· {cam.direction}°</span>}
                    {cam.directionSource && (
                      <span className={`px-1 rounded ${
                        cam.directionSource === 'inferred' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                        cam.directionSource === 'unknown' ? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' :
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      }`}>
                        {cam.directionSource === 'inferred' ? 'inferred' : cam.directionSource === 'unknown' ? 'unknown' : 'known'}
                      </span>
                    )}
                    <span>· {(Math.abs(cam.lat).toFixed(4))}, {(Math.abs(cam.lng).toFixed(4))}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {cam.streamUrl && (
                    <button
                      title={cam.streamVerified === false ? 'Stream unverified — may not load' : 'Add to live cameras'}
                      onClick={(e) => {
                        e.stopPropagation();
                        const { cameras, selectCamera, setActiveView } = useStore.getState();
                        const exists = cameras.some((c) => c.id === cam.id);
                        if (exists) { selectCamera(cam as unknown as Camera); setActiveView('cameras'); return; }
                        const newCam = {
                          id: cam.id,
                          name: cam.name,
                          lat: cam.lat, lng: cam.lng,
                          roadName: cam.roadName || 'unknown',
                          orientation: cam.direction !== undefined ? `${cam.direction}°` : 'N',
                          streamUrl: cam.streamUrl || '',
                          protocol: cam.protocol || 'jpeg' as const,
                          jurisdiction: cam.operator || 'Discovered',
                          privacyMasks: [],
                          status: 'online' as const,
                          lastFrameAt: new Date().toISOString(),
                          healthScore: 0.7,
                          resolution: '1280x720',
                          updateFrequency: 5,
                          refresh_interval: cam.refresh_interval,
                          isPublic: true,
                          publicNote: `Discovered via ${cam.source}`,
                          vehicleCountEst: Math.floor(Math.random() * 30) + 5,
                          densityLevel: 'green' as DensityLevel,
                        };
                        useStore.setState({ cameras: [...cameras, newCam] });
                        selectCamera(newCam);
                        setActiveView('cameras');
                      }}
                      className="flex items-center gap-1 rounded bg-emerald-500 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-emerald-600"
                    >
                      + Add
                    </button>
                  )}
                  <span className={`text-[10px] font-medium ${
                    cam.confidence > 0.7 ? 'text-emerald-500' : cam.confidence > 0.4 ? 'text-amber-500' : 'text-zinc-400'
                  }`}>
                    {Math.round(cam.confidence * 100)}%
                  </span>
                  <Navigation className="h-3 w-3 text-zinc-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {discoveryResult && discoveredCameras.length === 0 && !discoveryLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-zinc-500">
            <Layers className="mb-2 h-8 w-8" />
            <p className="text-sm">No cameras found in this area.</p>
            <p className="text-xs mt-1">Try a larger radius or different location.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
