'use client';

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store';
import { cn } from '@/lib/cn';
import { timeOfDayMultiplier, vehicleCountToDensity } from '@/lib/density-utils';
import { addNotification } from '@/lib/notifications';
import { BusinessLocation, ParkingLotOccupancy } from '@/types';
import { ParkingLotDetector } from '@/lib/parking-detector';
import { Wifi, MapPin } from 'lucide-react';

export function DataSimulator({ children }: { children: React.ReactNode }) {
  const activeView = useStore((s) => s.activeView);
  const isBackground = activeView !== 'map' && activeView !== 'cameras';
  const [isVisible, setIsVisible] = useState(() => (typeof document !== 'undefined' ? !document.hidden : true));
  // Hydration-safe clock: '' until mounted so server and first client render match.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onVisibility = () => setIsVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // When hidden/backgrounded, slow the update interval to conserve mobile battery
  const tickInterval = !isVisible ? 60000 : (isBackground ? 15000 : 6000);
  const parkingIntervalMs = !isVisible ? 120000 : (isBackground ? 30000 : 6000);

  useEffect(() => {
    // Stable baselines — captured once from initial mock data, never compounded
    const cameraBaselines = new Map<string, number>();
    const bizBaselines = new Map<string, number>();
    const roadBaselines = new Map<string, number>();
    const prevBizLevels = new Map<string, string>();
    const prevCamStatus = new Map<string, string>();

    useStore.getState().verifyStreams();

    const run = () => {
      try {
        const now = new Date();
        const hour = now.getHours();
        const isWeekend = [0, 6].includes(now.getDay());
        const state = useStore.getState();
        const { cameras, businesses, roadSegments, settings } = state;
        const notificationsEnabled = settings.notificationEnabled;

        // ── Cameras: vehicle detection + density simulation ──
        const updatedCameras = cameras.map((cam) => {
          if (cam.status === 'offline') return cam;
          if (!cameraBaselines.has(cam.id)) cameraBaselines.set(cam.id, cam.vehicleCountEst ?? 10);
          const baseline = cameraBaselines.get(cam.id)!;

          const roadType: 'highway' | 'arterial' | 'local' =
            cam.roadName?.startsWith('I-') ? 'highway' :
            ['US-75', 'Loop 12', 'NW Hwy'].some(p => cam.roadName?.includes(p)) ? 'arterial' : 'local';
          const maxCount = roadType === 'highway' ? 65 : roadType === 'arterial' ? 40 : 25;
          const envMult = timeOfDayMultiplier(hour, undefined, isWeekend);
          const newCount = Math.min(maxCount, Math.max(1, Math.round(baseline * envMult * (0.8 + Math.random() * 0.4))));

          // Check for status changes (notifications)
          if (notificationsEnabled) {
            const prevStatus = prevCamStatus.get(cam.id);
            if (prevStatus && prevStatus !== 'offline' && cam.status === 'online' && prevStatus !== cam.status && Math.random() < 0.02) {
              // Simulate occasional connectivity blips
            }
            prevCamStatus.set(cam.id, cam.status);
          }

          return {
            ...cam,
            vehicleCountEst: newCount,
            lastFrameAt: new Date().toISOString(),
            healthScore: Math.max(0.15, Math.min(1, cam.healthScore + (Math.random() - 0.5) * 0.08)),
            densityLevel: vehicleCountToDensity(newCount),
          };
        });

        // ── Businesses: category-specific density simulation ──
        const updatedBiz = businesses.map((biz) => {
          if (!bizBaselines.has(biz.id)) bizBaselines.set(biz.id, biz.density?.vehicleCountEst ?? 10);
          const baseline = bizBaselines.get(biz.id)!;
          const catMult = timeOfDayMultiplier(hour, biz.category, isWeekend);
          const newV = Math.min(60, Math.max(1, Math.round(baseline * catMult * (0.8 + Math.random() * 0.4))));
          const newLevel = vehicleCountToDensity(newV);

          // Detect density changes for notifications
          if (notificationsEnabled) {
            const prevLevel = prevBizLevels.get(biz.id);
            if (prevLevel && prevLevel !== newLevel && biz.density?.densityLevel) {
              addNotification({
                type: 'density_alert',
                title: `${biz.name} is now ${newLevel}`,
                message: `${biz.name} busy-ness changed from ${prevLevel} to ${newLevel}.`,
                actionable: true,
                actionLabel: 'View',
                locationId: biz.id,
                lat: biz.lat,
                lng: biz.lng,
              });
            }
            prevBizLevels.set(biz.id, newLevel);
          }

          return {
            ...biz,
            density: {
              ...biz.density!,
              vehicleCountEst: newV,
              pedestrianEst: Math.max(0, Math.round(newV * (0.3 + Math.random() * 0.7))),
              timestamp: new Date().toISOString(),
              confidence: 0.65 + Math.random() * 0.3,
              densityLevel: newLevel,
            },
          } as BusinessLocation;
        });

        // ── Road segments: propagation-aware traffic simulation ──
        const updatedRoads = roadSegments.map((rs) => {
          if (!roadBaselines.has(rs.id)) roadBaselines.set(rs.id, rs.currentDensity?.vehicleCountEst ?? 5);
          const baseline = roadBaselines.get(rs.id)!;
          const envMult = timeOfDayMultiplier(hour, undefined, [0, 6].includes(new Date().getDay()));
          const newV = Math.min(80, Math.max(1, Math.round(baseline * envMult * (0.8 + Math.random() * 0.4))));
          return {
            ...rs,
            currentDensity: rs.currentDensity ? {
              ...rs.currentDensity,
              vehicleCountEst: newV,
              vehicleCountUncertainty: 0.1 + Math.random() * 0.2,
              pedestrianEst: Math.max(0, Math.round(newV * 0.3)),
              timestamp: new Date().toISOString(),
              confidence: 0.7 + Math.random() * 0.25,
              densityLevel: vehicleCountToDensity(newV),
            } : rs.currentDensity,
          };
        });

        useStore.setState({
          cameras: updatedCameras,
          businesses: updatedBiz,
          roadSegments: updatedRoads,
        });
        useStore.getState().loadDensityData();
      } catch (err) {
        console.error('DataSimulator run error:', err);
      }
    };

    // Initial density pass
    run();

    // Update parking lot occupancies
    const parkingInterval: ReturnType<typeof setInterval> = setInterval(async () => {
      try {
        const { businesses } = useStore.getState();

        for (const biz of businesses) {
          if (biz.parkingLot) {
            try {
              const detection = await ParkingLotDetector.getInstance().detectOccupancy(biz.parkingLot);
              useStore.setState((state) => {
                if (!state.businesses) return state;
                const updated = state.businesses.map((b) => {
                  if (b.id === biz.id && b.parkingLot) {
                    return {
                      ...b,
                      parkingLot: {
                        ...b.parkingLot!,
                        currentOccupancy: {
                          timestamp: new Date().toISOString(),
                          occupiedSpaces: detection.occupiedSpaces,
                          totalSpaces: detection.totalSpaces,
                          occupancyRate: detection.occupancyRate,
                          vehiclesByType: detection.vehiclesByType,
                          avgDwellMinutes: detection.avgDwellMinutes,
                          entryRate: detection.entryRate,
                          exitRate: detection.exitRate,
                          source: detection.source as ParkingLotOccupancy['source'],
                          confidence: detection.confidence,
                          lastUpdated: new Date().toISOString()
                        } as ParkingLotOccupancy
                      }
                    } as BusinessLocation;
                  }
                  return b;
                });
                return { businesses: updated };
              });
            } catch {
              // Parking detection failed for this lot — skip gracefully
            }
          }
        }
      } catch {
        // Parking interval error — don't crash the whole app
      }
    }, parkingIntervalMs);

    // Simulate data updates
    const interval = setInterval(run, tickInterval);
    // Re-verify real stream reachability every 60s
    const verifyInterval = setInterval(() => {
      try { useStore.getState().verifyStreams(); } catch { /* ignore */ }
    }, 60000);

    // Dynamic traffic refresh
    const trafficRefresh = () => {
      try { useStore.getState().refreshLiveTraffic(); } catch { /* ignore */ }
    };
    // Refresh traffic immediately + every 20s (foreground) / 60s (background)
    const trafficIntervalMs = isBackground ? 60000 : 20000;
    trafficRefresh();
    const trafficInterval = setInterval(trafficRefresh, trafficIntervalMs);
    // Recompute ETA after traffic refresh
    const etaInterval = setInterval(() => {
      try { useStore.getState().computeRouteETA(); } catch { /* ignore */ }
    }, trafficIntervalMs);
    // Refresh REAL environmental data (Open-Meteo) immediately + every 10 min
    const envRefresh = () => {
      try { useStore.getState().refreshRealEnv(); } catch { /* ignore */ }
    };
    envRefresh();
    const envInterval = setInterval(envRefresh, 600000);

    // Cleanup intervals
    return () => {
      clearInterval(interval);
      clearInterval(verifyInterval);
      clearInterval(parkingInterval);
      clearInterval(trafficInterval);
      clearInterval(etaInterval);
      clearInterval(envInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickInterval, parkingIntervalMs]);

  const onlineCameras = useStore((s) => s.cameras.filter((c) => c.status === 'online').length);
  const totalCameras = useStore((s) => s.cameras.length);
  const quietCount = useStore((s) => s.businesses.filter((b) => b.density?.densityLevel === 'green' || b.density?.densityLevel === 'yellow').length);
  const avgCongestion = useStore((s) => {
    try {
      const levels = s.businesses.map((b) => {
        const lv: Record<string, number> = { green: 0, yellow: 1, orange: 2, red: 3, purple: 4 };
        return lv[b.density?.densityLevel || 'green'] || 0;
      });
      return levels.length ? (levels.reduce((a, b) => a + b, 0) / levels.length) : 0;
    } catch { return 0; }
  });

  // Hydration guard: density-derived counts can differ between the prebuilt
  // static HTML and the client runtime, so render stable placeholders until
  // mounted, then the true values. Server + client-first paint will match.
  const onlineCamerasShown = mounted ? onlineCameras : 0;
  const quietCountShown = mounted ? quietCount : 0;
  const avgCongestionShown = mounted ? avgCongestion : 0;

  const showBanner = activeView === 'map';

  return (
    <>
      {children}
      {showBanner && (
        <div className="fixed bottom-16 left-4 z-30 flex flex-col gap-1.5">
          <div className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-xs shadow-sm backdrop-blur-sm',
            'bg-white/90 text-zinc-500 dark:bg-zinc-950/90'
          )}>
            <Wifi className="h-3.5 w-3.5 text-emerald-500" />
            <span>{onlineCamerasShown}/{totalCameras} cams</span>
            <span className="mx-0.5 text-zinc-300">·</span>
            <MapPin className="h-3.5 w-3.5 text-blue-500" />
            <span>{quietCountShown} quiet</span>
            <span className="mx-0.5 text-zinc-300">·</span>
            <span className={cn(
              avgCongestionShown < 1 ? 'text-emerald-500' : avgCongestionShown < 2 ? 'text-yellow-500' : avgCongestionShown < 3 ? 'text-orange-500' : 'text-red-500'
            )}>
              {avgCongestionShown < 1 ? 'Low' : avgCongestionShown < 2 ? 'Moderate' : avgCongestionShown < 3 ? 'Busy' : 'Heavy'}
            </span>
          </div>
          <div className="px-3 text-[10px] text-zinc-400">
            {mounted ? `${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · ${[0, 6].includes(new Date().getDay()) ? 'Weekend' : 'Weekday'} pattern` : ''}
          </div>
        </div>
      )}
    </>
  );
}