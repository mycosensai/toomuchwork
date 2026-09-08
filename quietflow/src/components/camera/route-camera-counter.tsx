'use client';

import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Route, Camera } from 'lucide-react';

export function RouteCameraCounter() {
  const { routeWaypoints, routeCameraCounts } = useStore();

  if (routeWaypoints.length < 2) return null;

  const counts = routeCameraCounts;
  if (!counts) return null;

  return (
    <Card className="mb-4 border-emerald-200 dark:border-emerald-800">
      <CardHeader className="p-3 pb-1">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Route className="h-4 w-4 text-emerald-500" />
          Route Camera Count
          <span className="text-xs font-normal text-zinc-400">
            ({counts.totalCameras} cameras within 0.5 km)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        <div className="flex items-center gap-4">
          {/* Total */}
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-zinc-400" />
            <span className="text-sm font-semibold">{counts.totalCameras}</span>
            <span className="text-xs text-zinc-400">total</span>
          </div>

          {/* FLOCK */}
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              {counts.flockCameras}
            </span>
            <span className="text-xs text-zinc-400">FLOCK</span>
          </div>

          {/* AXON */}
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
            <span className="text-sm font-semibold text-red-600 dark:text-red-400">
              {counts.axonCameras}
            </span>
            <span className="text-xs text-zinc-400">AXON</span>
          </div>

          {/* Other */}
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-zinc-400" />
            <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
              {counts.otherCameras}
            </span>
            <span className="text-xs text-zinc-400">other</span>
          </div>
        </div>

        {/* Camera list */}
        {counts.cameras.length > 0 && (
          <div className="mt-2 space-y-1">
            {counts.cameras.map((cam) => (
              <div
                key={cam.id}
                className="flex items-center justify-between rounded px-2 py-1 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${
                    cam.brand === 'flock' ? 'bg-blue-500' :
                    cam.brand === 'axon' ? 'bg-red-500' :
                    'bg-zinc-400'
                  }`} />
                  <span className="text-zinc-700 dark:text-zinc-200">{cam.name}</span>
                </div>
                <Badge variant="default" size="sm" className="text-[10px]">
                  {cam.brand.toUpperCase()}
                  {cam.model ? ` (${cam.model})` : ''}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}