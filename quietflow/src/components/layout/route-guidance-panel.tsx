'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigation, Volume2, VolumeX, MapPin, RefreshCw } from 'lucide-react';
import {
  formatRouteDistance,
  formatRouteDuration,
  getCurrentRouteStep,
  projectRouteProgress,
} from '@/lib/route-directions';

export function RouteGuidancePanel() {
  const {
    routeDirections,
    routeWaypoints,
    routeTarget,
    selectedBusiness,
    userLocation,
    settings,
    updateSettings,
  } = useStore();

  const lastSpokenKeyRef = useRef<string>('');

  const progress = useMemo(() => {
    if (!routeDirections || !userLocation) return null;
    return projectRouteProgress(routeDirections.geometry, userLocation);
  }, [routeDirections, userLocation]);

  const currentStepInfo = useMemo(() => {
    if (!routeDirections) return null;
    const traveled = progress?.traveledMeters ?? 0;
    return getCurrentRouteStep(routeDirections, traveled);
  }, [routeDirections, progress?.traveledMeters]);

  const routeDistance = routeDirections?.distanceMeters ?? 0;
  const routeProgressPct = progress && routeDistance > 0
    ? Math.min(100, Math.max(0, (progress.traveledMeters / routeDistance) * 100))
    : 0;
  const offRoute = !!progress && progress.distanceToRouteMeters > 120;
  const destinationLabel = selectedBusiness?.name || routeDirections?.routeName || 'Destination';
  const currentInstruction = currentStepInfo?.currentStep?.instruction;
  const nextInstruction = currentStepInfo?.nextStep?.instruction;

  useEffect(() => {
    if (!routeDirections || !currentStepInfo || !settings.routeVoiceGuidance || typeof window === 'undefined') return;

    const step = currentStepInfo.currentStep;
    const distanceKey = Math.max(0, Math.round(currentStepInfo.distanceToStepEndMeters / 25));
    const key = `${routeDirections.generatedAt}:${currentStepInfo.currentStepIndex}:${distanceKey}:${offRoute ? 'off' : 'on'}`;
    if (lastSpokenKeyRef.current === key) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const distanceLabel = currentStepInfo.distanceToStepEndMeters > 0
        ? `In ${formatRouteDistance(currentStepInfo.distanceToStepEndMeters)}, `
        : '';
      const announcement = offRoute
        ? `You are off route. Recalculating. ${step.instruction}`
        : `${distanceLabel}${step.instruction}`;
      const utterance = new SpeechSynthesisUtterance(announcement);
      utterance.rate = 1.02;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    }

    lastSpokenKeyRef.current = key;
  }, [currentStepInfo, offRoute, routeDirections, settings.routeVoiceGuidance]);

  if (!routeDirections || routeWaypoints.length < 2) return null;

  const currentStepIndex = Math.max(0, currentStepInfo?.currentStepIndex ?? 0);
  const upcomingSteps = routeDirections.steps.slice(currentStepIndex, currentStepIndex + 4);

  return (
    <div className="pointer-events-none absolute bottom-24 left-4 right-4 z-40 flex justify-center px-2 md:left-6 md:right-auto md:justify-start">
      <Card className="pointer-events-auto w-full max-w-xl border-blue-200 bg-white/95 shadow-xl backdrop-blur dark:border-blue-800 dark:bg-zinc-950/95">
        <CardHeader className="space-y-2 p-4 pb-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Navigation className="h-4 w-4 text-blue-500" />
                Route guidance
                {routeDirections.provider === 'mapbox' ? (
                  <Badge className="text-[10px] bg-blue-500">Mapbox</Badge>
                ) : (
                  <Badge className="text-[10px] bg-emerald-500">OSRM</Badge>
                )}
                {offRoute && <Badge className="text-[10px] bg-amber-500">Off route</Badge>}
              </CardTitle>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {destinationLabel}
                {routeTarget && (
                  <span className="ml-1 text-zinc-400">· {routeTarget[1].toFixed(4)}, {routeTarget[0].toFixed(4)}</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateSettings({ routeVoiceGuidance: !settings.routeVoiceGuidance })}
              >
                {settings.routeVoiceGuidance ? <Volume2 className="mr-1 h-4 w-4" /> : <VolumeX className="mr-1 h-4 w-4" />}
                {settings.routeVoiceGuidance ? 'Voice on' : 'Voice off'}
              </Button>
              {currentStepInfo && currentStepInfo.currentStepIndex >= 0 && (
                <Badge className="text-[10px] bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900">
                  Step {currentStepInfo.currentStepIndex + 1}/{routeDirections.steps.length}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-2">
          <div className="space-y-2 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/70">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-400">Next maneuver</div>
                <div className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {currentInstruction || 'Keep going'}
                </div>
                {nextInstruction && (
                  <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Then: {nextInstruction}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {currentStepInfo ? formatRouteDistance(currentStepInfo.distanceToStepEndMeters) : formatRouteDistance(routeDistance)}
                </div>
                <div className="text-[10px] text-zinc-400">to next turn</div>
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all"
                style={{ width: `${routeProgressPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
              <span>{formatRouteDistance(progress?.traveledMeters ?? 0)} traveled</span>
              <span>{formatRouteDistance(progress?.remainingMeters ?? routeDistance)} remaining</span>
              <span>{formatRouteDuration(routeDirections.durationSeconds)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
              <div className="text-[10px] uppercase tracking-wider text-zinc-400">Route</div>
              <div className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {formatRouteDistance(routeDirections.distanceMeters)}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
              <div className="text-[10px] uppercase tracking-wider text-zinc-400">ETA</div>
              <div className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {formatRouteDuration(routeDirections.durationSeconds)}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
              <div className="text-[10px] uppercase tracking-wider text-zinc-400">Distance to route</div>
              <div className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {progress ? formatRouteDistance(progress.distanceToRouteMeters) : '—'}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
              <div className="text-[10px] uppercase tracking-wider text-zinc-400">Status</div>
              <div className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {offRoute ? 'Re-routing' : 'On route'}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <MapPin className="h-3.5 w-3.5" /> Upcoming steps
            </div>
            <div className="space-y-2">
              {upcomingSteps.map((step) => {
                const isCurrent = step.index === currentStepInfo?.currentStepIndex;
                return (
                  <div
                    key={`${step.index}-${step.instruction}`}
                    className={`rounded-xl border px-3 py-2 text-sm ${isCurrent ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30' : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-zinc-900 dark:text-zinc-50">{step.instruction}</div>
                        <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                          {step.roadName ? `${step.roadName} · ` : ''}
                          {formatRouteDistance(step.distanceMeters)} · {formatRouteDuration(step.durationSeconds)}
                        </div>
                      </div>
                      <Badge className="text-[10px] bg-zinc-700 text-white dark:bg-zinc-200 dark:text-zinc-900">
                        {step.index + 1}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-dashed border-zinc-300 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            <span>Auto-updates as your location changes</span>
            <span className="inline-flex items-center gap-1"><RefreshCw className="h-3 w-3" /> Live</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
