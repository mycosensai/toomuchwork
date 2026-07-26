'use client';

import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DensityBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function CameraGrid() {
  const { cameras, activeView, selectCamera, selectedCamera } = useStore();
  const onlineCameras = cameras.filter((c) => c.status === 'online');
  const degradedCameras = cameras.filter((c) => c.status === 'degraded');

  if (activeView !== 'cameras') return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Live Cameras</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {onlineCameras.length} online · {degradedCameras.length} degraded ·{' '}
          {cameras.filter((c) => c.status === 'offline').length} offline
        </p>
      </div>

      {/* Selected camera cinema view */}
      {selectedCamera && (
        <Card className="mb-6 overflow-hidden">
          <div className="aspect-video w-full bg-zinc-900">
            <div className="flex h-full items-center justify-center">
              <div className="text-center text-zinc-500">
                <div className="mb-2 text-4xl">📹</div>
                <p className="text-lg font-medium text-zinc-300">{selectedCamera.name}</p>
                <p className="text-sm">{selectedCamera.roadName} · {selectedCamera.jurisdiction}</p>
                <p className="mt-1 text-xs">
                  {selectedCamera.status === 'online' ? '🔴 Live' : '⏸️ Offline'} · {selectedCamera.resolution} · {selectedCamera.protocol.toUpperCase()}
                </p>
              </div>
            </div>
          </div>
          <CardContent className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <DensityBadge level={selectedCamera.densityLevel || 'green'} />
              <span className="text-xs text-zinc-500">~{selectedCamera.vehicleCountEst ?? 0} vehicles visible</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => selectCamera(null)}>
              Close
            </Button>
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
            <div className="aspect-video w-full bg-zinc-100 dark:bg-zinc-800">
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  {cam.status === 'online' ? (
                    <span className="text-3xl">📷</span>
                  ) : cam.status === 'degraded' ? (
                    <span className="text-3xl">📸</span>
                  ) : (
                    <span className="text-3xl">🔌</span>
                  )}
                </div>
              </div>
            </div>
            <CardHeader className="p-3 pb-0">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm">{cam.name}</CardTitle>
                  <p className="mt-0.5 text-xs text-zinc-500">{cam.roadName}</p>
                </div>
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
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>{cam.jurisdiction}</span>
                <span>{cam.resolution}</span>
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
