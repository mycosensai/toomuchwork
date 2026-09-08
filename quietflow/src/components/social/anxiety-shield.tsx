/**
 * Social Anxiety React Components — Sprint 1 UI
 * Features 1-10: AnxietyShield, InvisibleMode, PreTripScore,
 * EscapeRoutes, NoHumanUI, AnxietyDashboard, SafeZones,
 * CrowdAutoNav, DNDSchedule, MoodLog
 */

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Moon, MapPin, Navigation, AlertTriangle, Smile, TrendingUp, Clock, Zap, Eye, Lock } from 'lucide-react';
import { generateAnonymizedDensity } from '@/lib/social-anxiety/anonymized-density';
import { invisibleMode } from '@/lib/social-anxiety/invisible-mode';
import { scoreDestination } from '@/lib/social-anxiety/pre-trip-score';
import { generateEscapeRoutes } from '@/lib/social-anxiety/escape-route';
import { getAnxietyMetrics, addAnxietyMetric, computeAnxietyStats } from '@/lib/social-anxiety/anxiety-dashboard';
import type { AnxietyMetric } from '@/lib/social-anxiety/anxiety-dashboard';
import { findNearbySafeZones } from '@/lib/social-anxiety/safe-zone-map';
import { checkAutoReroute, startCrowdMonitor } from '@/lib/social-anxiety/crowd-auto-nav';
import { dndSchedule } from '@/lib/social-anxiety/dn-d-schedule';
import { addMoodEntry, getMoodLog, computeMoodSummary, type MoodEmoji } from '@/lib/social-anxiety/anxiety-mood-log';

// Patch: make dndSchedule.getState() result local for TS

// ─── Anxiety Shield (Feature 1 + 6 + 10 combined) ───

export function AnxietyShield() {
  const { settings, mapCenter, incidents, cameras, roadSegments, businesses } = useStore();
  const [density, setDensity] = useState<ReturnType<typeof generateAnonymizedDensity> | null>(null);
  const [stats, setStats] = useState(computeAnxietyStats());

  useEffect(() => {
    if (!mapCenter) return;
    const d = generateAnonymizedDensity(businesses, cameras, mapCenter, 5);
    setDensity(d);
  }, [mapCenter, cameras.length, businesses]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(computeAnxietyStats());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="border-cyan-500/20 bg-[var(--cyber-bg-card)]">
      <CardHeader className="p-3 pb-1">
        <CardTitle className="flex items-center gap-2 text-sm font-heading">
          <Shield className="h-4 w-4 text-cyan-400" />
          Anxiety Shield
          {settings.anxietyFriendlyUI && (
            <Badge className="bg-cyan-500/20 text-cyan-300 text-[10px]">ACTIVE</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1 space-y-3">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-sm font-bold text-cyan-400">{stats.totalCrowdsAvoided}</div>
            <div className="text-[10px] text-zinc-400">Crowds Avoided</div>
          </div>
          <div>
            <div className="text-sm font-bold text-emerald-400">{stats.totalQuietRoutes}</div>
            <div className="text-[10px] text-zinc-400">Quiet Routes</div>
          </div>
          <div>
            <div className="text-sm font-bold text-amber-400">{stats.streakDays}d</div>
            <div className="text-[10px] text-zinc-400">Streak</div>
          </div>
          <div>
            <div className="text-sm font-bold text-purple-400">{stats.avgQuietScore}</div>
            <div className="text-[10px] text-zinc-400">Avg Score</div>
          </div>
        </div>

        {density && (
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {density.cells.slice(0, 10).map((cell, i) => (
              <div key={i} className="flex items-center justify-between rounded bg-zinc-900/40 px-2 py-1 text-[10px]">
                <span className="text-zinc-400">Cell {i + 1}</span>
                <span className={`font-medium ${
                  cell.densityLevel === 'green' ? 'text-emerald-400' :
                  cell.densityLevel === 'yellow' ? 'text-yellow-400' :
                  cell.densityLevel === 'orange' ? 'text-orange-400' :
                  cell.densityLevel === 'red' ? 'text-red-400' : 'text-purple-400'
                }`}>
                  {cell.densityLevel.toUpperCase()} ({cell.countEstimate})
                </span>
              </div>
            ))}
          </div>
        )}

        <MoodQuickLog />
      </CardContent>
    </Card>
  );
}

// ─── Feature 10: Anxiety Mood Log ───

function MoodQuickLog() {
  const [mood, setMood] = useState<MoodEmoji>('😐');
  const summary = computeMoodSummary();

  const handleLogMood = () => {
    addMoodEntry({ moodBefore: mood, moodAfter: null, trigger: 'none', tripId: null, note: '' });
  };

  return (
    <div className="rounded-lg bg-zinc-900/50 p-2 space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <Smile className="h-3 w-3 text-cyan-400" />
        <span className="text-[10px] text-zinc-400">How do you feel?</span>
      </div>
      <div className="flex gap-1 flex-wrap">
        {(['😌', '😐', '😰', '😢', '😤', '😊', '🙂', '😔', '😨', '🤢'] as MoodEmoji[]).map((e) => (
          <button
            key={e}
            className={`text-lg p-1 rounded ${mood === e ? 'bg-cyan-500/30 ring-1 ring-cyan-400' : 'hover:bg-zinc-800'}`}
            onClick={() => setMood(e)}
          >
            {e}
          </button>
        ))}
        <Button variant="ghost" size="sm" className="text-[10px] ml-auto" onClick={handleLogMood}>
          Log
        </Button>
      </div>
      {summary.totalEntries > 0 && (
        <div className="mt-2 text-[10px] text-zinc-400">
          Entries: {summary.totalEntries} · Trend: {summary.trendDirection} · Best after: {summary.bestMoodAfter || '—'}
        </div>
      )}
    </div>
  );
}

// ─── Invisible Mode Toggle (Feature 2) ───

export function InvisibleModeToggle() {
  const [state, setState] = useState(invisibleMode.getState());

  useEffect(() => {
    return invisibleMode.subscribe(setState);
  }, []);

  return (
    <Card className={`border ${state.enabled ? 'border-cyan-500/40 bg-cyan-900/10' : 'border-zinc-700/50'}`}>
      <CardContent className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Moon className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-medium">Invisible Mode</span>
        </div>
        <button
          className={`w-12 h-6 rounded-full transition-colors ${state.enabled ? 'bg-cyan-500' : 'bg-zinc-700'}`}
          onClick={() => invisibleMode.toggle()}
          role="switch"
          aria-checked={state.enabled}
        >
          <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${state.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </CardContent>
      {state.enabled && (
        <CardContent className="pt-0 space-y-1">
          <div className="text-[10px] text-zinc-400 flex items-center gap-1">
            <Lock className="h-3 w-3" /> Location sharing OFF
          </div>
          <div className="text-[10px] text-zinc-400 flex items-center gap-1">
            <Lock className="h-3 w-3" /> Community reports OFF
          </div>
          <div className="text-[10px] text-zinc-400 flex items-center gap-1">
            <Lock className="h-3 w-3" /> Camera tracking OFF
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ─── Pre-Trip Social Score (Feature 3) ───

export function PreTripScore() {
  const businesses = useStore((s) => s.businesses);
  const [scores, setScores] = useState<ReturnType<typeof scoreDestination>[]>([]);

  useEffect(() => {
    const now = new Date();
    const result = businesses.slice(0, 10).map((b) => scoreDestination(b, now));
    result.sort((a, b) => a.overallScore - b.overallScore);
    setScores(result);
  }, [businesses]);

  return (
    <Card className="border-emerald-200/30">
      <CardHeader className="p-3 pb-1">
        <CardTitle className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-emerald-400" />
          Pre-Trip Social Score
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1 space-y-2">
        {scores.slice(0, 5).map((s) => (
          <div key={s.locationId} className="flex items-center justify-between rounded-lg bg-zinc-900/40 px-3 py-2">
            <div>
              <div className="text-sm">{s.locationName}</div>
              <div className="text-[10px] text-zinc-400">
                Peak: {s.peakHours.join(', ')} · Best: {s.bestWindow ? `${s.bestWindow.start}-${s.bestWindow.end}` : 'N/A'}
              </div>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold ${
                s.overallScore >= 70 ? 'text-emerald-400' :
                s.overallScore >= 40 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {s.overallScore}
              </div>
              <Badge variant="default" size="sm" className="text-[10px]">
                {s.crowdEstimate}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Escape Routes (Feature 4) ───

export function EscapeRoutes() {
  const { mapCenter, incidents, cameras, roadSegments } = useStore();
  const [routes, setRoutes] = useState<ReturnType<typeof generateEscapeRoutes> | null>(null);

  const handleGenerate = useCallback(() => {
    if (!mapCenter) return;
    const r = generateEscapeRoutes(mapCenter, roadSegments, incidents, cameras);
    setRoutes(r);
  }, [mapCenter, roadSegments, incidents, cameras]);

  return (
    <Card className="border-red-200/30">
      <CardHeader className="p-3 pb-1">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Navigation className="h-4 w-4 text-red-400" />
          Escape Routes
          <Badge className="bg-red-500/20 text-red-300 text-[10px]">One-tap</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1 space-y-2">
        <Button variant="outline" size="sm" className="w-full" onClick={handleGenerate}>
          <AlertTriangle className="mr-2 h-3 w-3" /> Generate Escape Routes
        </Button>
        {routes?.map((r, i) => (
          <div key={r.routeId} className="rounded-lg bg-zinc-900/40 px-3 py-2 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">#{i + 1} {r.destination}</span>
              <Badge variant="default" size="sm" className="text-[10px]">
                {r.crowdAvoidanceScore}% safe
              </Badge>
            </div>
            <div className="text-[10px] text-zinc-400">
              {r.distanceMeters}m · {Math.round(r.durationSeconds / 60)}min · {r.threatsAvoided} threats avoided
            </div>
            <div className="text-[10px] text-zinc-500">Type: {r.safeDestinationType}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── No-Human-Interaction Mode (Feature 5) ───

export function NoHumanInteractionToggle() {
  const [config, setConfig] = useState({ enabled: false, keyboardOnly: true, voiceCommands: true, gestureMode: true, hideSocialElements: true, skipCommunityFeed: false, soloNavigation: true });

  return (
    <Card className="border-violet-200/30">
      <CardHeader className="p-3 pb-1">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Eye className="h-4 w-4 text-violet-400" />
          No-Human-Interaction Mode
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1 space-y-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" defaultChecked /> Enable
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" defaultChecked /> Keyboard only navigation
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" defaultChecked /> Voice commands
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" defaultChecked /> Hide social elements
        </label>
      </CardContent>
    </Card>
  );
}

// ─── Anxiety Dashboard (Feature 6) ───

export function AnxietyDashboard() {
  const [stats, setStats] = useState(computeAnxietyStats());
  const [metrics, setMetrics] = useState<AnxietyMetric[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(computeAnxietyStats());
      setMetrics(getAnxietyMetrics());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="border-amber-200/30">
      <CardHeader className="p-3 pb-1">
        <CardTitle className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-amber-400" />
          Anxiety Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1 space-y-2">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-cyan-400">{stats.totalTrips}</div>
            <div className="text-[10px] text-zinc-400">Trips</div>
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-400">{stats.streakDays}</div>
            <div className="text-[10px] text-zinc-400">Day Streak</div>
          </div>
          <div>
            <div className="text-lg font-bold text-purple-400 capitalize">{stats.weeklyTrend}</div>
            <div className="text-[10px] text-zinc-400">Trend</div>
          </div>
        </div>
        {metrics.slice(-5).reverse().map((m, idx) => (
          <div key={`${m.moodBefore}-${idx}`} className="flex items-center gap-2 rounded bg-zinc-900/40 px-2 py-1 text-[10px]">
            <span>{m.moodBefore}</span>
            {m.moodAfter && <span>→ {m.moodAfter}</span>}
            <span className="text-zinc-500">{(m as AnxietyMetric).trigger ?? ''}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Safe Zone Map (Feature 7) ───

export function SafeZoneMap() {
  const mapCenter = useStore((s) => s.mapCenter);
  const [zones, setZones] = useState<ReturnType<typeof findNearbySafeZones>>([]);

  useEffect(() => {
    if (!mapCenter) return;
    setZones(findNearbySafeZones(mapCenter, 10, 60));
  }, [mapCenter]);

  return (
    <Card className="border-emerald-200/30">
      <CardHeader className="p-3 pb-1">
        <CardTitle className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-emerald-400" />
          Safe Zones
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1 space-y-2">
        {zones.map((z) => (
          <div key={z.id} className="flex items-center justify-between rounded-lg bg-zinc-900/40 px-3 py-2">
            <div>
              <div className="text-sm">{z.name}</div>
              <div className="text-[10px] text-zinc-400">{z.type} · {z.socialPressure} pressure</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-emerald-400">{z.quietScore}</div>
              <Badge variant="default" size="sm" className="text-[10px]">{z.hours}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Crowd Auto-Nav (Feature 8) ───

export function CrowdAutoNav() {
  const { roadSegments, incidents, cameras, routeTarget } = useStore();
  const [lastReroute, setLastReroute] = useState<ReturnType<typeof checkAutoReroute> | null>(null);

  useEffect(() => {
    if (!routeTarget) return;
    const stop = startCrowdMonitor(
      () => routeTarget ? { origin: [32.795, -96.796], destination: routeTarget, geometry: [] } : null,
      roadSegments.map((s) => ({ ...s, currentDensity: s.currentDensity || null })),
      incidents,
      cameras,
      30,
      setLastReroute,
    );
    return stop;
  }, [routeTarget, roadSegments, incidents, cameras]);

  return (
    <Card className={`border ${lastReroute ? 'border-red-500/40' : 'border-zinc-700/50'}`}>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Zap className="h-4 w-4 text-amber-400" />
          Crowd Auto-Nav
          {lastReroute && <Badge variant="default" className="text-[10px] animate-pulse">REROUTED</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1 space-y-2">
        {lastReroute ? (
          <>
            <div className="text-[10px] text-zinc-400">Triggers: {lastReroute.triggers.join(', ')}</div>
            <div className="text-[10px] text-zinc-400">Avoided: ~{lastReroute.crowdDensityAvoided} people</div>
            <div className="text-[10px] text-zinc-400">Detour: +{Math.round(lastReroute.detourTimeMin)}min</div>
          </>
        ) : (
          <div className="text-[10px] text-zinc-400">Monitoring... No reroute needed</div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── DnD Schedule (Feature 9) ───

export function DNDSchedulePanel() {
  const [state, setState] = useState(dndSchedule.getState());

  useEffect(() => {
    return dndSchedule.subscribe(setState);
  }, []);

  const dndState = dndSchedule.getState();
  const dndActive = dndState.enabled && (() => {
    const now = new Date();
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
    const today = dayNames[now.getDay()];
    if (!dndState.days.includes(today as any)) return false;
    const hour = now.getHours();
    const { startHour, endHour } = dndState;
    if (startHour < endHour) return hour >= startHour && hour < endHour;
    return hour >= startHour || hour < endHour;
  })();
  const active = dndActive;

  return (
    <Card className="border-indigo-200/30">
      <CardHeader className="p-3 pb-1">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-indigo-400" />
          DnD Schedule
          {state.enabled && <Badge variant="default" className="text-[10px]">ACTIVE</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1 space-y-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={state.enabled} onChange={(e) => dndSchedule.setEnabled(e.target.checked)} />
          Enable DnD
        </label>
        <div className="flex gap-2 text-[10px]">
          <span className="text-zinc-400">{state.startHour}:00 → {state.endHour}:00</span>
          <span className="text-zinc-500">{state.days.join(', ')}</span>
        </div>
        {state.autoRespond && (
          <div className="text-[10px] text-zinc-400">Auto-reply: "{state.autoReplyText}"</div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-[10px]">Status:</span>
          <Badge variant={active ? 'default' : 'outline'} className="text-[10px]">
            {active ? 'Active Now' : 'Inactive'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}