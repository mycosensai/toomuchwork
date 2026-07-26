'use client';

import { useEffect } from 'react';
import { useStore } from '@/store';
import { cn } from '@/lib/cn';
import { DensityLevel } from '@/types';

export function DataSimulator({ children }: { children: React.ReactNode }) {
  const activeView = useStore((s) => s.activeView);
  useEffect(() => {
    const liveViews = new Set(['map', 'cameras', 'quiet-finder', 'my-places', 'insights', 'trip-planner', 'community']);
    const isLiveView = liveViews.has(activeView);

    const run = () => {
      if (!isLiveView) return;
      // Read fresh camera/business state each tick — no stale closures
      const { cameras, businesses } = useStore.getState();

      const updatedCameras = cameras.map((cam) => {
        if (cam.status === 'offline') return cam;
        const baseCount = cam.vehicleCountEst ?? 10;
        const variation = Math.floor(Math.random() * 15) - 7;
        const newCount = Math.max(0, baseCount + variation);
        return {
          ...cam,
          vehicleCountEst: newCount,
          lastFrameAt: new Date().toISOString(),
          healthScore: Math.max(0.1, Math.min(1, cam.healthScore + (Math.random() - 0.5) * 0.1)),
          densityLevel: (
            newCount <= 5 ? 'green' :
            newCount <= 15 ? 'yellow' :
            newCount <= 30 ? 'orange' :
            newCount <= 50 ? 'red' : 'purple'
          ) as DensityLevel,
        };
      });

      const updatedBiz = businesses.map((biz) => {
        const baseV = biz.density?.vehicleCountEst ?? 10;
        const variation = Math.floor(Math.random() * 10) - 4;
        const newV = Math.max(0, baseV + variation);
        return {
          ...biz,
          density: {
            ...biz.density!,
            vehicleCountEst: newV,
            pedestrianEst: Math.max(0, (biz.density?.pedestrianEst ?? 5) + Math.floor(Math.random() * 6) - 3),
            timestamp: new Date().toISOString(),
            densityLevel: (
              newV <= 5 ? 'green' :
              newV <= 15 ? 'yellow' :
              newV <= 30 ? 'orange' :
              newV <= 50 ? 'red' : 'purple'
            ) as DensityLevel,
          },
        };
      });

      useStore.setState({ cameras: updatedCameras, businesses: updatedBiz });
      useStore.getState().loadDensityData();
    };

    // Initial load
    run();

    // Simulate data updates every 8 seconds
    const interval = setInterval(run, 8000);

    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
}
