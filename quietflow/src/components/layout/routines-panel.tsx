'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CalendarClock, Plus, Trash2, Sparkles, Bell, Clock,
} from 'lucide-react';
import { recommendDeparture } from '@/lib/traffic-engine';

interface RoutineTrip {
  id: string;
  name: string;
  stopIds: string[];
  preferredDepartureHour: number;
  remindMinutesBefore: number;
  daysOfWeek: number[]; // 0-6
  enabled: boolean;
}

const DEFAULT_DAYS = [1, 2, 3, 4, 5]; // weekdays

export function RoutinesPanel() {
  const { activeView, businesses, liveTraffic, roadSegments } = useStore();
  const [routines, setRoutines] = useState<RoutineTrip[]>([]);
  const [name, setName] = useState('');
  const [selectedStop, setSelectedStop] = useState('');
  const [stops, setStops] = useState<string[]>([]);
  const [preferredHour, setPreferredHour] = useState(8);
  const [remindMin, setRemindMin] = useState(15);
  const [days, setDays] = useState<number[]>([...DEFAULT_DAYS]);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('quietflow-routines');
      if (raw) setRoutines(JSON.parse(raw));
    } catch {}
  }, []);

  // Departure recommendation based on live traffic (F5)
  const avgCongestion = liveTraffic.length ? liveTraffic.reduce((s, t) => s + t.congestionIndex, 0) / liveTraffic.length : 0;
  const bestHour = recommendDeparture(
    Array.from({ length: 24 }, (_, h) => 50 + Math.max(0, Math.sin((h - 8) / 24 * Math.PI * 2)) * 45 + (h === 8 ? -30 : 0)),
  );

  if (activeView !== 'routines') return null;

  const persist = (next: RoutineTrip[]) => {
    setRoutines(next);
    try { localStorage.setItem('quietflow-routines', JSON.stringify(next)); } catch {}
  };

  const saveRoutine = () => {
    if (stops.length === 0) return;
    const newRoutine: RoutineTrip = {
      id: `routine-${Date.now()}`,
      name: name || `Routine ${routines.length + 1}`,
      stopIds: [...stops],
      preferredDepartureHour: preferredHour,
      remindMinutesBefore: remindMin,
      daysOfWeek: [...days],
      enabled: true,
    };
    persist([...routines, newRoutine]);
    setName(''); setStops([]); setSelectedStop('');
  };

  const toggleDay = (d: number) => setDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);

  // Current time check for reminders
  const now = new Date();
  const nowHour = now.getHours();
  const nowMin = now.getMinutes();

  return (
    <div className="h-full overflow-y-auto bg-zinc-50 p-6 dark:bg-zinc-900">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 text-white">
          <CalendarClock className="h-5 w-5" />
        </div>
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Routine Trips
            <Sparkles className="h-4 w-4 text-violet-500" />
          </h1>
          <p className="text-xs text-zinc-500">Saved commutes with departure reminders & best-time-to-leave intel</p>
        </div>
      </div>

      {/* Best time-to-leave card (F5) */}
      <Card className="mb-6 border-violet-200 dark:border-violet-800">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
            <span className="text-lg font-bold">{bestHour.label}</span>
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Best Time to Leave</div>
            <div className="text-xs text-zinc-500">
              {avgCongestion < 0.3 ? 'Traffic is currently light' : avgCongestion < 0.6 ? 'Traffic is moderate' : 'Traffic is heavy'} — departure around {bestHour.label} usually avoids peak congestion
            </div>
          </div>
          <div className="text-center">
            <div className={`text-xl font-bold ${avgCongestion < 0.3 ? 'text-emerald-500' : avgCongestion < 0.6 ? 'text-amber-500' : 'text-red-500'}`}>
              {(avgCongestion * 100).toFixed(0)}%
            </div>
            <div className="text-[10px] text-zinc-400">current congestion</div>
          </div>
        </CardContent>
      </Card>

      {/* Build routine */}
      <Card className="mb-6">
        <CardHeader className="p-3 pb-1">
          <CardTitle className="flex items-center gap-2 text-sm"><Plus className="h-4 w-4 text-violet-500" /> Add Routine</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-3 pt-1">
          <Input placeholder="Routine name (e.g. Work commute, School run)" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex gap-2">
            <select
              value={selectedStop}
              onChange={(e) => {
                setSelectedStop(e.target.value);
                if (e.target.value) {
                  setStops((prev) => [...prev, e.target.value]);
                  setSelectedStop('');
                }
              }}
              className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="">Add a stop...</option>
              {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          {stops.length > 0 && (
            <div className="space-y-1">
              {stops.map((id, i) => {
                const b = businesses.find((x) => x.id === id);
                return (
                  <div key={id} className="flex items-center gap-2 rounded-lg bg-zinc-50 px-2 py-1 text-xs dark:bg-zinc-800/50">
                    <span className="text-zinc-400">{i + 1}.</span>
                    <span className="flex-1 text-zinc-700 dark:text-zinc-200">{b?.name || id}</span>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setStops(stops.filter((s) => s !== id))}>
                      <Trash2 className="h-3 w-3 text-zinc-400" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <Clock className="h-3 w-3" /> Depart
              <input type="number" min={0} max={23} value={preferredHour} onChange={(e) => setPreferredHour(Number(e.target.value))} className="w-14 rounded border border-zinc-200 px-1 py-0.5 text-center dark:border-zinc-700 dark:bg-zinc-800" />
              :00
            </div>
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <Bell className="h-3 w-3" /> Remind
              <input type="number" min={5} max={120} value={remindMin} onChange={(e) => setRemindMin(Number(e.target.value))} className="w-14 rounded border border-zinc-200 px-1 py-0.5 text-center dark:border-zinc-700 dark:bg-zinc-800" />
              min before
            </div>
          </div>
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3, 4, 5, 6].map((d) => (
              <button key={d} onClick={() => toggleDay(d)} className={`h-7 w-7 rounded-full text-xs font-medium ${days.includes(d) ? 'bg-violet-500 text-white' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'}`}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'][d]}
              </button>
            ))}
          </div>
          <Button onClick={saveRoutine} className="w-full" disabled={stops.length === 0}>Save Routine</Button>
        </CardContent>
      </Card>

      {/* Saved routines */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Your Routines ({routines.length})</h2>
        {routines.length === 0 && <p className="text-center text-xs text-zinc-400 py-4">No routines saved yet</p>}
        {routines.map((r) => {
          const stopNames = r.stopIds.map((id) => businesses.find((b) => b.id === id)?.name || id).filter(Boolean);
          const isToday = r.daysOfWeek.includes(now.getDay());
          const isDueSoon = isToday && nowHour === r.preferredDepartureHour && nowMin >= Math.max(0, r.remindMinutesBefore) && nowMin < r.remindMinutesBefore + 15;
          return (
            <Card key={r.id} className={isDueSoon ? 'border-violet-400 bg-violet-50 dark:border-violet-600 dark:bg-violet-900/20' : ''}>
              <CardContent className="flex items-center gap-3 p-3">
                <button
                  onClick={() => persist(routines.map((x) => x.id === r.id ? { ...x, enabled: !x.enabled } : x))}
                  className={`h-5 w-5 rounded-full border-2 ${r.enabled ? 'border-violet-500 bg-violet-500' : 'border-zinc-300'}`}
                />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{r.name}</div>
                  <div className="text-xs text-zinc-400">{stopNames.join(' → ')}</div>
                  <div className="mt-0.5 text-[10px] text-zinc-400">
                    Depart {r.preferredDepartureHour || 12 % 12}:00 · {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].filter((_, i) => r.daysOfWeek.includes(i)).join(', ')}
                  </div>
                </div>
                <div className="text-right">
                  {isDueSoon && (
                    <div className="mb-1 flex items-center gap-1 text-[10px] font-medium text-violet-600 dark:text-violet-400">
                      <Bell className="h-3 w-3" /> Leave soon!
                    </div>
                  )}
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-red-400" onClick={() => persist(routines.filter((x) => x.id !== r.id))}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
