'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
  Tooltip,
} from 'recharts';
import { Brain, Sparkles, BookOpen, TrendingDown, Heart } from 'lucide-react';
import { generateTypicalProfile, getDensityColor } from '@/lib/density-utils';

const hourlyProfile = generateTypicalProfile();

function hourLabel(i: number) {
  const h = i % 12 || 12;
  return `${h}${i < 12 ? 'a' : 'p'}`;
}

function levelForScore(v: number): 'green' | 'yellow' | 'orange' | 'red' | 'purple' {
  if (v <= 12) return 'green';
  if (v <= 30) return 'yellow';
  if (v <= 50) return 'orange';
  if (v <= 70) return 'red';
  return 'purple';
}

export function Insights() {
  const { activeView, completedOutings, businesses } = useStore();
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  if (activeView !== 'insights') return null;

  const outingCount = completedOutings.length;
  const avgCalmness = outingCount
    ? (completedOutings.reduce((s, o) => s + o.calmnessRating, 0) / outingCount).toFixed(1)
    : '—';
  const lowStress = completedOutings.filter((o) => o.calmnessRating >= 4).length;

  // Live business density snapshot
  const liveLevels = businesses.map((b) => b.density?.densityLevel || 'green');
  const greenNow = liveLevels.filter((l) => l === 'green' || l === 'yellow').length;

  const profileData = hourlyProfile.map((v, i) => ({
    hour: i,
    label: hourLabel(i),
    density: Math.round(v),
    level: levelForScore(v),
  }));

  const selected = selectedHour != null ? profileData[selectedHour] : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 text-[var(--color-text-primary)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading tracking-wide uppercase text-[var(--cyber-cyan)]">Insights</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Learn the quiet patterns of your neighborhood and build confidence in your outings.
        </p>
      </div>

      {/* Personal stats — now driven by real logged outings */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { label: 'Outings logged', value: String(outingCount), color: 'text-[var(--cyber-green)]' },
          { label: 'Low-stress outings', value: String(lowStress), color: 'text-[var(--cyber-green)]' },
          { label: 'Avg. calmness', value: outingCount ? `${avgCalmness}/5` : '—', color: 'text-[var(--cyber-gold)]' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Live snapshot */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingDown className="h-4 w-4 text-[var(--cyber-green)]" /> Right now
          </CardTitle>
          <CardDescription>{greenNow} of {businesses.length} monitored places are quiet or comfortable</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {businesses.map((b) => (
              <span
                key={b.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/10 bg-cyan-500/5 px-3 py-1 text-xs"
              >
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: getDensityColor(b.density?.densityLevel || 'green') }} />
                {b.name}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Interactive density profile */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm">Typical Daily Density</CardTitle>
          <CardDescription>Tap a bar to see what that hour usually looks like</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={profileData}
                onClick={(e: any) => { if (e?.activePayload?.[0]) setSelectedHour(e.activePayload[0].payload.hour); }}
              >
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={2} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  formatter={(v: any) => [`${v}/100`, 'Typical density']}
                  labelFormatter={(l: any) => `Around ${l}`}
                />
                <Area
                  type="monotone"
                  dataKey="density"
                  stroke="var(--cyber-cyan)"
                  fill="var(--cyber-cyan)"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3">
            {selected ? (
              <div className="flex items-center gap-3 rounded-lg border border-cyan-500/10 bg-cyan-500/5 p-3 text-sm">
                <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: getDensityColor(selected.level) }} />
                <span className="font-medium">Around {selected.label}</span>
                <span className="text-[var(--color-text-secondary)]">
                  is typically{' '}
                  <span className="font-semibold capitalize">
                    {selected.level === 'green' ? 'very quiet' : selected.level === 'yellow' ? 'comfortable' : selected.level === 'orange' ? 'getting busy' : selected.level === 'red' ? 'crowded' : 'very crowded'}
                  </span>{' '}
                  — a {selected.level === 'green' || selected.level === 'yellow' ? 'good' : 'busy'} window.
                </span>
              </div>
            ) : (
              <p className="text-xs text-[var(--color-text-muted)]">Select an hour above to inspect its typical density.</p>
            )}
          </div>

          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-[var(--color-text-secondary)]">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-[var(--cyber-green)]" /> Quietest: 2AM–5AM
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-[var(--cyber-red)]" /> Busiest: 5PM–7PM
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Weekly outings bar (real or empty state) */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm">Your Outing History</CardTitle>
          <CardDescription>Calmness ratings from places you&apos;ve visited</CardDescription>
        </CardHeader>
        <CardContent>
          {outingCount === 0 ? (
            <div className="py-6 text-center text-sm text-[var(--color-text-muted)]">
              <Heart className="mx-auto mb-2 h-8 w-8 text-zinc-600" />
              <p>No outings logged yet. Visit My Places → open a location → &ldquo;Log outing&rdquo;.</p>
            </div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={completedOutings.slice(0, 10).map((o, i) => ({ name: `#${i + 1}`, calm: o.calmnessRating }))}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                  <Bar dataKey="calm" radius={[4, 4, 0, 0]}>
                    {completedOutings.slice(0, 10).map((o, i) => (
                      <Cell key={i} fill={o.calmnessRating >= 4 ? 'var(--cyber-green)' : o.calmnessRating >= 3 ? 'var(--cyber-gold)' : 'var(--cyber-red)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Density trend timeline — live snapshot of all monitored places */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm">Live Density Timeline</CardTitle>
          <CardDescription>Real-time density levels across all monitored locations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {businesses.map((b) => {
              const lvl = b.density?.densityLevel || 'green';
              const color = getDensityColor(lvl);
              const pct = lvl === 'green' ? 25 : lvl === 'yellow' ? 50 : lvl === 'orange' ? 70 : lvl === 'red' ? 90 : 100;
              return (
                <div key={b.id} className="flex items-center gap-3 text-xs">
                  <span className="w-28 truncate text-[var(--color-text-secondary)]">{b.name}</span>
                  <div className="flex-1 h-3 rounded-full bg-[var(--cyber-bg-elevated)] overflow-hidden border border-cyan-500/10">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                  <span className="w-20 text-right capitalize text-[var(--color-text-muted)]">{lvl}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-4 text-[10px] text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-[var(--cyber-green)]" /> Quiet</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-[var(--cyber-gold)]" /> Comfortable</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-[var(--cyber-amber)]" /> Busy</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-[var(--cyber-red)]" /> Crowded</span>
          </div>
        </CardContent>
      </Card>

      {/* Educational content */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-[var(--cyber-purple)]" />
              <CardTitle className="text-sm">Why mornings work</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-[var(--color-text-secondary)]">
            <p>Most stores restock overnight and open quiet. The first hour after opening consistently has 60% fewer customers than peak afternoon hours.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[var(--cyber-gold)]" />
              <CardTitle className="text-sm">Every outing builds confidence</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-[var(--color-text-secondary)]">
            <p>Your brain learns that going out during quiet windows is safe and predictable. You&apos;re building a new habit, one calm trip at a time.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[var(--cyber-blue)]" />
              <CardTitle className="text-sm">School schedules matter</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-[var(--color-text-secondary)]">
            <p>Traffic drops 30–40% during school hours (9AM–2PM) on weekdays. One of the most reliable quiet windows for errands near schools.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[var(--cyber-green)]" />
              <CardTitle className="text-sm">Tips for first outings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-[var(--color-text-secondary)]">
            <p>Start with a 5-minute walk near home during a green window. Short, successful trips build momentum. Use Quiet Finder to pick your best window.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
