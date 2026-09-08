'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RouteCameraCounter } from '@/components/camera/route-camera-counter';
import {
  RefreshCw, MapPin, Camera, Shield, Eye, Navigation,
  Clock, TrendingUp, AlertTriangle, CheckCircle2,
  Radio, Zap,
} from 'lucide-react';
import { generateQuietRoute, refreshQuietRoute, hasSecurityOpening, getViewableCameras, type QuietRouteResult } from '@/lib/quiet-route';
import { buildIncidentAvoidRoute, mergeThreats, type ThreatSegment } from '@/lib/route-incidents';

export function QuietRoutePanel() {
  const {
    routeWaypoints, cameras, businesses, roadSegments, routeCameraPlan,
    activeView, setActiveView, selectCamera,
    settings,
  } = useStore();

  const [routeResult, setRouteResult] = useState<QuietRouteResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [showAllCameras, setShowAllCameras] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [incidentRoute, setIncidentRoute] = useState<ReturnType<typeof buildIncidentAvoidRoute> | null>(null);
  const [threats, setThreats] = useState<ThreatSegment[]>([]);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const generationRef = useRef<AbortController | null>(null);

  // Generate route when waypoints change
  useEffect(() => {
    if (routeWaypoints.length < 2) {
      setRouteResult(null);
      setIncidentRoute(null);
      setThreats([]);
      return;
    }

    const start: [number, number] = [routeWaypoints[0][0], routeWaypoints[0][1]];
    const end: [number, number] = [routeWaypoints[routeWaypoints.length - 1][0], routeWaypoints[routeWaypoints.length - 1][1]];

    // 1) Generate traditional quiet route
    setIsGenerating(true);
    try {
      const result = generateQuietRoute(start, end, cameras, businesses, roadSegments, {
        cameraAvoidanceRadiusKm: 0.5,
        pedestrianAvoidanceRadiusKm: 0.3,
        avoidDensityLevels: ['red', 'purple'],
        refreshIntervalMs: 30000,
      });
      setRouteResult(result);
      setRefreshCount(0);
    } finally {
      setIsGenerating(false);
    }

    // 2) Generate incident-avoiding route
    const incidents = useStore.getState().incidents;
    const merged = mergeThreats(incidents, useStore.getState().newsAlerts);
    const threatScore = buildIncidentAvoidRoute(start, end, roadSegments, merged, cameras);
    setIncidentRoute(threatScore);
    setThreats(threatScore.threatSegments);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeWaypoints, cameras, businesses, roadSegments]);

  // Recursive refresh with abort support
  useEffect(() => {
    if (!autoRefresh || !routeResult || routeWaypoints.length < 2) return;

    refreshTimerRef.current = setInterval(() => {
      if (!routeResult) return;
      setIsRefreshing(true);
      try {
        const start: [number, number] = [routeWaypoints[0][0], routeWaypoints[0][1]];
        const end: [number, number] = [routeWaypoints[routeWaypoints.length - 1][0], routeWaypoints[routeWaypoints.length - 1][1]];
        const refreshed = refreshQuietRoute(routeResult, cameras, businesses, roadSegments);
        setRouteResult(refreshed);
        setRefreshCount((prev) => prev + 1);
      } finally {
        setIsRefreshing(false);
      }
    }, routeResult.refreshIntervalMs);

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [autoRefresh, routeResult, routeWaypoints, cameras, businesses, roadSegments]);

  // Manual refresh
  const handleManualRefresh = useCallback(() => {
    if (!routeResult || routeWaypoints.length < 2) return;
    setIsRefreshing(true);
    try {
      const start: [number, number] = [routeWaypoints[0][0], routeWaypoints[0][1]];
      const end: [number, number] = [routeWaypoints[routeWaypoints.length - 1][0], routeWaypoints[routeWaypoints.length - 1][1]];
      const refreshed = refreshQuietRoute(routeResult, cameras, businesses, roadSegments);
      setRouteResult(refreshed);
      setRefreshCount((prev) => prev + 1);
    } finally {
      setIsRefreshing(false);
    }
  }, [routeResult, routeWaypoints, cameras, businesses, roadSegments]);

  // Toggle camera viewing mode
  const toggleCameraViewing = useCallback(() => {
    setShowAllCameras((prev) => !prev);
  }, []);

  // Get viewable cameras based on security openings
  const viewableCameras = routeResult
    ? (showAllCameras ? routeResult.camerasOnRoute : getViewableCameras(routeResult.camerasOnRoute))
    : [];

  const securityOpen = routeResult ? hasSecurityOpening(routeResult.camerasOnRoute) : false;

  if (routeWaypoints.length < 2) {
    return (
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardContent className="p-6 text-center">
          <Navigation className="mx-auto mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Set a route on the map to generate a QuietRoute
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            The route will automatically avoid cameras, people, and busy areas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <Card className="border-emerald-200 dark:border-emerald-800">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Navigation className="h-4 w-4 text-emerald-500" />
            QuietRoute
            {isGenerating && <span className="text-xs font-normal text-zinc-400">Generating...</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-3">
          {/* Route stats */}
          {routeResult && (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {routeResult.totalDistanceKm.toFixed(1)}km
                  </div>
                  <div className="text-[10px] text-zinc-400">Distance</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-zinc-700 dark:text-zinc-300">
                    {routeResult.cameraCount}
                  </div>
                  <div className="text-[10px] text-zinc-400">Cameras</div>
                </div>
                <div>
                  <div className={`text-lg font-bold ${routeResult.totalAvoidanceScore > 0.5 ? 'text-emerald-600' : 'text-amber-500'}`}>
                    {Math.round(routeResult.totalAvoidanceScore * 100)}%
                  </div>
                  <div className="text-[10px] text-zinc-400">Quiet Score</div>
                </div>
              </div>

              {/* Brand breakdown */}
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-blue-600 dark:text-blue-400 font-medium">{routeResult.flockCameras} FLOCK</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-red-600 dark:text-red-400 font-medium">{routeResult.axonCameras} AXON</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-zinc-400" />
                  <span className="text-zinc-500 font-medium">{routeResult.otherCameras} other</span>
                </span>
              </div>

              {/* Security opening indicator */}
              {securityOpen && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Security opening detected — all cameras viewable</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="flex-1"
                >
                  <RefreshCw className={`mr-1 h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button
                  variant={showAllCameras ? 'primary' : 'outline'}
                  size="sm"
                  onClick={toggleCameraViewing}
                  className="flex-1"
                >
                  <Eye className="mr-1 h-3 w-3" />
                  {showAllCameras ? 'All Cameras' : 'Viewable Only'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAutoRefresh((prev) => !prev)}
                  className={autoRefresh ? 'text-emerald-600' : 'text-zinc-400'}
                >
                  <Clock className="h-3 w-3" />
                  {autoRefresh ? 'Auto' : 'Off'}
                </Button>
              </div>

              {/* Refresh info */}
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <span>Refreshed {refreshCount}x · {new Date(routeResult.lastRefreshed).toLocaleTimeString()}</span>
                <span>Every {routeResult.refreshIntervalMs / 1000}s</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Camera list */}
      {viewableCameras.length > 0 && (
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Camera className="h-4 w-4 text-zinc-500" />
              Route Cameras
              {showAllCameras && securityOpen && (
                <Badge variant="default" className="text-[10px]">All Viewable</Badge>
              )}
              {!showAllCameras && !securityOpen && (
                <Badge variant="default" className="text-[10px]">Public Only</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-1">
            {viewableCameras.map((cam) => (
              <div
                key={cam.id}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                onClick={() => {
                  const camera = cameras.find((c) => c.id === cam.id);
                  if (camera) selectCamera(camera);
                }}
              >
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${
                    cam.brand === 'flock' ? 'bg-blue-500' :
                    cam.brand === 'axon' ? 'bg-red-500' :
                    'bg-zinc-400'
                  }`} />
                  <span className="text-zinc-700 dark:text-zinc-200">{cam.name}</span>
                  {cam.densityLevel && (
                    <Badge variant="default" size="sm" className="text-[10px]">
                  {cam.densityLevel}
                </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {cam.streamVerified && (
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  )}
                  {cam.isPublic && (
                    <Eye className="h-3 w-3 text-blue-500" />
                  )}
                  <span className="text-[10px] text-zinc-400">
                    {cam.brand === 'flock' ? 'FLOCK' : cam.brand === 'axon' ? 'AXON' : 'OTHER'}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Route camera counter */}
      <RouteCameraCounter />

      {/* Directional watch cameras (heading filter over discovered cameras) */}
      {routeCameraPlan && (routeCameraPlan.towardFacingCameras.length > 0 || routeCameraPlan.awayFacingCameras.length > 0) && (
        <Card className="border-indigo-200 dark:border-indigo-800">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Navigation className="h-4 w-4 text-indigo-500" />
              Directional Watch
              <Badge variant="default" size="sm" className="text-[10px]">
                ±{routeCameraPlan.towardFacingCameras.length} toward
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-1">
            {routeCameraPlan.usedFallback && (
              <div className="mb-1 flex items-center gap-2 rounded-lg bg-amber-50 px-2 py-1 text-[11px] text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                <AlertTriangle className="h-3 w-3" />
                <span>No toward-facing camera on this route — showing away-facing as fallback so coverage stays continuous.</span>
              </div>
            )}
            {routeCameraPlan.selectedCameras.slice(0, 12).map((cam) => {
              const toward = routeCameraPlan.towardFacingCameras.some((c) => c.id === cam.id);
              return (
                <div
                  key={cam.id}
                  className="flex items-center justify-between rounded-lg px-3 py-1.5 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <span className="text-zinc-700 dark:text-zinc-200 truncate">{cam.name}</span>
                  <span className={`text-[10px] ${toward ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`}>
                    {toward ? 'toward' : 'away'}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* ─── Incident-Avoidance Overlay ─── */}
      {incidentRoute && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Radio className="h-4 w-4 text-red-500 animate-pulse" />
              Incident-Avoid Route
              {incidentRoute.emergencyAvoided > 0 && (
                <Badge className="bg-red-500 text-[10px] animate-pulse">{incidentRoute.emergencyAvoided} EMERGENCIES</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-2">
            {/* Threat summary */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-cyan-400">{incidentRoute.incidentsAvoided}</div>
                <div className="text-[10px] text-zinc-400">Threats Avoided</div>
              </div>
              <div>
                <div className="text-lg font-bold text-emerald-400">{incidentRoute.emergencyAvoided}</div>
                <div className="text-[10px] text-zinc-400">Emergencies</div>
              </div>
              <div>
                <div className={`text-lg font-bold ${incidentRoute.delayFromIncidents > 600 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  +{Math.round(incidentRoute.delayFromIncidents / 60)}m
                </div>
                <div className="text-[10px] text-zinc-400">Delay (avoid)</div>
              </div>
            </div>

            {/* Threat segments */}
            {threats.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {threats
                  .filter((t) => t.threatLevel !== 'low')
                  .map((t) => (
                    <div key={t.segmentIndex} className="flex items-center justify-between rounded-lg bg-zinc-900/50 px-2 py-1 text-[10px]">
                      <span className="text-zinc-400">Seg #{t.segmentIndex}</span>
                      <span className={`font-medium ${
                        t.threatLevel === 'critical' ? 'text-red-400' :
                        t.threatLevel === 'high' ? 'text-orange-400' :
                        t.threatLevel === 'medium' ? 'text-yellow-400' : 'text-zinc-400'
                      }`}>
                        {t.threatLevel.toUpperCase()} ({t.incidentCount} incidents)
                      </span>
                    </div>
                  ))}
              </div>
            )}

            {/* Auto-reroute suggestion */}
            {incidentRoute.emergencyAvoided > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2">
                <Zap className="h-4 w-4 text-red-400" />
                <div className="flex-1 text-xs">
                  <span className="text-red-300 font-medium">Auto-reroute active</span>
                  <span className="text-zinc-400"> — routing around {incidentRoute.emergencyAvoided} emergency area(s)</span>
                </div>
                <Badge className="bg-red-500 text-[10px] text-white">LIVE</Badge>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Navigation className="mr-1 h-3 w-3" /> Follow Safe Route
              </Button>
              <Button variant="ghost" size="sm" className="flex-1" onClick={() => setIncidentRoute(null)}>
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}