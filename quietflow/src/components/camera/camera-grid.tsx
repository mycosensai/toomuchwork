'use client';

import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DensityBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LiveCameraView } from './live-camera-view';
import { Star, Globe } from 'lucide-react';
import { CameraBrand } from '@/types';

const BRAND_COLORS: Record<CameraBrand, string> = {
  flock: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  axon: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  ring: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  cctv: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
  other: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
};

function BrandBadge({ brand, model }: { brand: CameraBrand; model?: string }) {
  if (brand === 'other') return null;
  const LABELS: Record<string, string> = { flock: 'FLOCK', axon: 'AXON', ring: 'RING', cctv: 'CCTV' };
  const label = LABELS[brand] || brand;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-semibold ${BRAND_COLORS[brand]}`}>
      {label}
      {model ? <span className="opacity-70"> {model}</span> : null}
    </span>
  );
}

export function CameraGrid() {
  const { cameras, activeView, selectCamera, selectedCamera, favoriteCameras, toggleFavoriteCamera } = useStore();
  const onlineCameras = cameras.filter((c) => c.status === 'online');
  const degradedCameras = cameras.filter((c) => c.status === 'degraded');
  const offlineCameras = cameras.filter((c) => c.status === 'offline');

  if (activeView !== 'cameras') return null;

  return (
    <div className="hud-frame mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Live Cameras</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {onlineCameras.length} online · {degradedCameras.length} degraded ·{' '}
          {offlineCameras.length} offline · verified live
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          Public traffic/webcam feeds. Some routes show a live demo visualization where a direct stream isn't available.
        </p>
      </div>

      {/* Selected camera cinema view */}
      {selectedCamera && (
        <Card className="mb-6 overflow-hidden">
          <div className="aspect-video w-full">
            <LiveCameraView camera={selectedCamera} />
          </div>
          <CardContent className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <DensityBadge level={selectedCamera.densityLevel || 'green'} />
              <span className="text-xs text-zinc-500">
                ~{selectedCamera.vehicleCountEst ?? 0} vehicles · {selectedCamera.resolution}
              </span>
              {selectedCamera.isPublic && (
                <Badge variant="info" size="sm">
                  <Globe className="mr-1 h-3 w-3" /> Public
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFavoriteCamera(selectedCamera.id)}
              >
                <Star
                  className={`mr-1 h-3 w-3 ${favoriteCameras.includes(selectedCamera.id) ? 'fill-amber-400 text-amber-400' : ''}`}
                />
                {favoriteCameras.includes(selectedCamera.id) ? 'Saved' : 'Save'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => selectCamera(null)}>
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Camera grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cameras.map((cam) => (
          <Card
            key={cam.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedCamera?.id === cam.id ? 'ring-2 ring-zinc-400' : ''
            }`}
            onClick={() => selectCamera(cam)}
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-900 sm:aspect-video">
              {selectedCamera?.id === cam.id ? (
                <LiveCameraView camera={cam} />
              ) : (
                cam.protocol === 'synthetic' || !cam.streamUrl ? (
                  <div className="flex h-full w-full items-center justify-center bg-zinc-900">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500/80">Demo feed</span>
                  </div>
                ) : (
                  <img
                    src={cam.thumbnailUrl || cam.streamUrl}
                    alt={cam.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                )
              )}
            </div>
            <CardHeader className="p-3 pb-0">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm">{cam.name}</CardTitle>
                  <p className="mt-0.5 text-xs text-zinc-500">{cam.roadName}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge
                    variant={
                      cam.status === 'online'
                        ? 'success'
                        : cam.status === 'degraded'
                          ? 'warning'
                          : 'default'
                    }
                    size="sm"
                  >
                    {cam.status}
                  </Badge>
                  {cam.isPublic && (
                    <span className="flex items-center gap-0.5 text-[10px] text-blue-500">
                      <Globe className="h-3 w-3" /> public
                    </span>
                  )}
                  <BrandBadge brand={cam.brand || 'other'} model={cam.model} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>{cam.jurisdiction}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavoriteCamera(cam.id);
                  }}
                  className="flex items-center gap-1 hover:text-amber-500"
                >
                  <Star className={`h-3.5 w-3.5 ${favoriteCameras.includes(cam.id) ? 'fill-amber-400 text-amber-400' : ''}`} />
                </button>
              </div>
              {cam.healthScore > 0 && (
                <div className="mt-1.5">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${cam.healthScore * 100}%` }}
                    />
                  </div>
                  <div className="mt-0.5 text-right text-[10px] text-zinc-400">
                    Health: {Math.round(cam.healthScore * 100)}%
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
