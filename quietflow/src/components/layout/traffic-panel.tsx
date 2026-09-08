'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity, RefreshCw, Clock, AlertTriangle, TrendingUp,
  Gauge, Route, CalendarClock, ShieldAlert,
} from 'lucide-react';
import { TRAFFIC_STATE_LABEL, stateColor, recommendDeparture, type TrafficState } from '@/lib/traffic-engine';

export function TrafficPanel() {
  const {
    activeView, liveTraffic, trafficIncidents, routeETA, trafficAlertList,
    trafficLastUpdated, refreshLiveTraffic, computeRouteETA, roadSegments,
    routeWaypoints, setActiveView, weather, airQuality, settings, trafficSource,
  } = useStore();
  const [filter, setFilter] = useState<TrafficState | 'all'>('all');
  const [routeAware, setRouteAware] = useState(true);

  // Refresh on mount + periodic
  useEffect(() => {
    if (activeView !== 'traffic') return;
    refreshLiveTraffic();
    const timer = setInterval(() => { refreshLiveTraffic(); computeRouteETA(); }, 20000);
    return () => clearInterval(timer);
  }, [activeView, refreshLiveTraffic, computeRouteETA]);

  if (activeView !== 'traffic') return null;

  const shown = filter === 'all' ? liveTraffic : liveTraffic.filter((t) => t.trafficState === filter);
  const heavyCount = liveTraffic.filter((t) => t.trafficState === 'heavy' || t.trafficState === 'severe').length;
  const avgSpeed = liveTraffic.length ? Math.round(liveTraffic.reduce((s, t) => s + t.speedKph, 0) / liveTraffic.length) : 0;
  const totalDelay = Math.round(liveTraffic.reduce((s, t) => s + t.delayMin, 0));
  const criticalIncidents = trafficIncidents.filter((i) => i.active && (i.severity === 'major' || i.severity === 'critical'));

  // Best time to leave — build hourly congestion counts
  const hourly: number[] = Array.from({ length: 24 }, (_, h) => 50 + Math.sin((h - 8) / 24 * Math.PI * 2) * 40 + Math.max(0, Math.sin((h - 8) / 12 * Math.PI)) * (h === 8 || h === 17 ? 10 : 0));
  const departure = recommendDeparture(hourly);

  return (
    <div className="h-full overflow-y-auto bg-zinc-50 p-6 dark:bg-zinc-900">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Dynamic Traffic Tracking
            <Badge className="bg-blue-500 text-[10px]">LIVE</Badge>
          </h1>
          <p className="text-xs text-zinc-500">Real-time speed, congestion, ETAs & route intelligence</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { refreshLiveTraffic(); computeRouteETA(); }}>
            <RefreshCw className="h-3 w-3 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* Global traffic stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Roads Tracked', value: liveTraffic.length, icon: '🛣️', color: 'text-blue-500' },
          { label: 'Avg Speed', value: `${avgSpeed} km/h`, icon: '🚗', color: avgSpeed > 60 ? 'text-emerald-500' : 'text-amber-500' },
          { label: 'Total Delay', value: `${totalDelay} min`, icon: '⏱️', color: totalDelay > 60 ? 'text-red-500' : 'text-emerald-500' },
          { label: 'Congested Roads', value: heavyCount, icon: '🚨', color: heavyCount > 5 ? 'text-red-500' : 'text-emerald-500' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-zinc-200 bg-white p-3 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-lg">{s.icon}</div>
            <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-zinc-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Weather impact (F4) */}
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 p-3 dark:border-sky-800 dark:bg-sky-900/20">
        <span className="text-2xl">{weather?.icon || '☀️'}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            {weather?.condition ? weather.condition.charAt(0).toUpperCase() + weather.condition.slice(1) : 'Clear'} · {Math.round(weather?.temperature || 0)}°
 {settings?.temperatureUnit ? settings.temperatureUnit.toUpperCase() : 'F'}
            {weather?.source === 'real' ? (
              <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white">REAL</span>
            ) : (
              <span className="rounded bg-zinc-400 px-1.5 py-0.5 text-[9px] font-bold text-white">PREVIEW</span>
            )}
          </div>
          <div className="text-xs text-zinc-500">
            {weather?.precipitation && weather.precipitation > 30
              ? `Precipitation ${Math.round(weather.precipitation)}% — expect slower speeds and reduced visibility`
              : weather?.windSpeed && weather.windSpeed > 18
              ? `Wind ${Math.round(weather.windSpeed)} mph — could affect high-speed corridors`
              : 'Weather favorable — minimal impact on traffic flow'}
          </div>
          {airQuality ? (
            <div className="mt-1 flex items-center gap-1.5 text-xs">
              <span className="font-medium text-zinc-600 dark:text-zinc-300">Air:</span>
              <span className="font-semibold" style={{ color: (function () { const l = (airQuality.usAqi <= 50 ? 'good' : airQuality.usAqi <= 100 ? 'mod' : airQuality.usAqi <= 150 ? 'unh' : 'bad'); return ({ good: '#22c55e', mod: '#eab308', unh: '#f97316', bad: '#ef4444' } as Record<string, string>)[l]; })() }}>
                AQI {Math.round(airQuality.usAqi)}
              </span>
              <span className="text-zinc-400">· PM2.5 {Math.round(airQuality.pm2_5)}</span>
              {airQuality.source === 'real' && (
                <span className="rounded bg-emerald-500 px-1 py-0.5 text-[9px] font-bold text-white">REAL</span>
              )}
            </div>
          ) : null}
        </div>
        <div className={`rounded-lg px-2 py-1 text-xs font-medium ${(weather?.precipitation || 0) > 30 ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
          {(weather?.precipitation || 0) > 30 ? 'Impact: High' : 'Impact: Low'}
        </div>
      </div>

      {/* Route ETA + best time to leave */}
      <div className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {routeETA && routeWaypoints.length >= 2 ? (
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Route className="h-4 w-4 text-blue-500" /> Route ETA
                <span className="text-xs font-normal text-zinc-400">recalculated {routeETA.recalculatedAt ? new Date(routeETA.recalculatedAt).toLocaleTimeString() : '—'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                    {Math.floor(routeETA.totalMinutes)}<span className="text-lg"> min</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <Badge className="text-[10px]" style={{ backgroundColor: stateColor(routeETA.status) }}>{TRAFFIC_STATE_LABEL[routeETA.status]}</Badge>
                    <span className="text-zinc-400">Arrive {new Date(routeETA.estimatedArrival).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {routeETA.freeFlowMinutes} min free-flow · {routeETA.delayMinutes} min delay
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${routeETA.delayMinutes > 10 ? 'text-red-500' : routeETA.delayMinutes > 5 ? 'text-amber-500' : 'text-emerald-500'}`}>+{routeETA.delayMinutes}</div>
                  <div className="text-[10px] text-zinc-400">delay min</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4 text-center text-xs text-zinc-400">
              <Route className="mx-auto mb-1 h-5 w-5" /> Set a route to see live ETA
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CalendarClock className="h-4 w-4 text-emerald-500" /> Best Time to Leave
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="text-2xl font-bold text-emerald-500">{departure.label}</div>
                <div className="text-xs text-zinc-400">usually least congested departure window</div>
              </div>
              {/* Hourly mini-bars */}
              <div className="flex h-10 items-end gap-0.5">
                {hourly.map((v, i) => (
                  <div key={i} className={`w-1.5 rounded-t ${i === departure.hour ? 'bg-emerald-500' : v < 45 ? 'bg-emerald-200' : v < 60 ? 'bg-yellow-200' : v < 75 ? 'bg-orange-200' : 'bg-red-300'}`} style={{ height: `${Math.min(100, v)}%` }} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auto-reroute suggestion (F3) */}
      {routeETA && routeETA.congestionIndex > 0.5 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-3 dark:border-emerald-700 dark:bg-emerald-900/20">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Route className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Route Delayed — Auto Reroute Available</div>
            <div className="text-xs text-zinc-500">
              Current route is {routeETA.congestionIndex * 100 > 60 ? 'severely' : 'heavily'} congested (+{Math.round(routeETA.delayMinutes)} min delay). Consider an alternate route.
            </div>
          </div>
          <button
            onClick={() => setRouteAware((s) => !s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${routeAware ? 'bg-emerald-500 text-white' : 'bg-white text-emerald-600 dark:bg-zinc-800'}`}
          >
            {routeAware ? 'Reroute On' : 'Reroute Off'}
          </button>
        </div>
      )}

      {/* Traffic alerts */}
      {trafficAlertList.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            <ShieldAlert className="h-4 w-4 text-red-500" /> Active Traffic Alerts ({trafficAlertList.length})
            {trafficSource === 'real' ? (
              <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white">REAL</span>
            ) : (
              <span className="rounded bg-zinc-400 px-1.5 py-0.5 text-[9px] font-bold text-white">PREVIEW</span>
            )}
          </h2>
          <div className="space-y-2">
            {trafficAlertList.map((a) => (
              <div key={a.id} className={`rounded-lg border p-3 text-xs ${
                a.severity === 'critical' ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                : a.severity === 'warning' ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
                : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
              }`}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-3.5 w-3.5 ${a.severity === 'critical' ? 'text-red-500' : a.severity === 'warning' ? 'text-amber-500' : 'text-blue-500'}`} />
                  <span className="font-medium text-zinc-800 dark:text-zinc-100">{a.title}</span>
                  <span className="ml-auto text-[10px] text-zinc-400">{new Date(a.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="mt-0.5 text-zinc-500 dark:text-zinc-300">{a.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-segment live traffic */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        <button onClick={() => setFilter('all')} className={`rounded-lg px-2.5 py-1 text-xs font-medium ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-white text-zinc-500 dark:bg-zinc-800'}`}>All</button>
        {(['free', 'light', 'moderate', 'heavy', 'severe'] as TrafficState[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(filter === s ? 'all' : s)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium ${filter === s ? 'bg-blue-500 text-white' : 'bg-white text-zinc-500 dark:bg-zinc-800'}`}
            style={{ borderLeft: `3px solid ${stateColor(s)}` }}
          >
            {TRAFFIC_STATE_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {shown.length === 0 && <p className="text-center text-sm text-zinc-400 py-4">No segments matching filter</p>}
        {shown.map((seg) => (
          <div key={seg.segmentId} className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950" style={{ borderLeft: `4px solid ${stateColor(seg.trafficState)}` }}>
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{seg.name}</span>
              <Badge className="text-[10px]" style={{ backgroundColor: stateColor(seg.trafficState) }}>{TRAFFIC_STATE_LABEL[seg.trafficState]}</Badge>
              {seg.incident && <Badge className="bg-red-500 text-[9px]">Incident</Badge>}
              {seg.construction && <Badge className="bg-amber-500 text-[9px]">Construction</Badge>}
              <div className="ml-auto text-right">
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{seg.speedKph} <span className="text-[10px] font-normal text-zinc-400">km/h</span></span>
              </div>
            </div>
            <div className="mt-1 flex items-center gap-4 text-xs text-zinc-400">
              <span>Free flow {seg.freeFlowSpeedKph} km/h</span>
              <span>· delay +{seg.delayMin} min</span>
              <span>· congestion {(seg.congestionIndex * 100).toFixed(0)}%</span>
              <span className="ml-auto flex items-center gap-1"><Clock className="h-3 w-3" /> {seg.travelTimeMin} min</span>
            </div>
          </div>
        ))}
      </div>

      {/* Critical incidents list */}
      {criticalIncidents.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            <TrendingUp className="h-4 w-4 text-orange-500" /> Major Incidents ({criticalIncidents.length})
          </h2>
          <div className="space-y-2">
            {criticalIncidents.map((inc) => (
              <div key={inc.id} className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-xs dark:border-orange-800 dark:bg-orange-900/20">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-800 dark:text-zinc-100">{inc.name}</span>
                  <Badge className={`text-[9px] ${inc.severity === 'critical' ? 'bg-red-500' : 'bg-orange-500'}`}>{inc.severity}</Badge>
                  <span className="ml-auto text-zinc-400">+{inc.delayAddedMin} min</span>
                </div>
                <p className="mt-0.5 text-zinc-500">{inc.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Incident timeline (F6) */}
      {trafficIncidents.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            <Clock className="h-4 w-4 text-blue-500" /> Incident Timeline ({trafficIncidents.length})
          </h2>
          <div className="relative space-y-3 pl-5 before:absolute before:left-1.5 before:top-1 before:bottom-1 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-700">
            {[...trafficIncidents]
              .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
              .map((inc) => (
                <div key={inc.id} className="relative">
                  <span className={`absolute -left-[18px] top-1 h-3 w-3 rounded-full border-2 border-white ${
                    inc.severity === 'critical' ? 'bg-red-500' : inc.severity === 'major' ? 'bg-orange-500' : inc.severity === 'moderate' ? 'bg-amber-500' : 'bg-yellow-400'
                  }`} />
                  <div className={`rounded-lg border p-2 text-xs ${inc.active ? 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950' : 'border-zinc-100 bg-zinc-50 opacity-50 dark:border-zinc-800 dark:bg-zinc-900'}`}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-800 dark:text-zinc-100">{inc.name}</span>
                      <Badge className={`text-[9px] ${inc.severity === 'critical' ? 'bg-red-500' : inc.severity === 'major' ? 'bg-orange-500' : inc.severity === 'moderate' ? 'bg-amber-500' : 'bg-yellow-400'}`}>{inc.severity}</Badge>
                      {!inc.active && <Badge className="bg-zinc-400 text-[9px]">cleared</Badge>}
                      <span className="ml-auto text-[10px] text-zinc-400">{new Date(inc.startedAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="mt-0.5 text-zinc-500">{inc.description} · <span className="text-orange-500">+{inc.delayAddedMin} min</span></p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Quick link to camera grid for live feeds */}
      <div className="mt-6 text-center">
        <Button variant="ghost" size="sm" onClick={() => setActiveView('cameras')}>View Live Cameras →</Button>
      </div>
    </div>
  );
}
