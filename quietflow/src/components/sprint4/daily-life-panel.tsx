/**
 * Sprint 4 — Daily Life + Community + ML
 * Features 51-80
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coffee, BookOpen, Dumbbell, Church, ShoppingCart, Wind, Car, Utensils } from 'lucide-react';

// ─── Feature 51: Calendar Quiet Check ───

export function CalendarQuietCheck() {
  const [events] = useState<Array<{ title: string; time: string; crowdLevel: string }>>([
    { title: 'Team Meeting', time: '2:00 PM', crowdLevel: 'low' },
    { title: 'Lunch', time: '12:30 PM', crowdLevel: 'medium' },
  ]);

  return (
    <Card>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="flex items-center gap-2 text-sm">
          <BookOpen className="h-4 w-4 text-cyan-400" />
          Calendar Quiet Check
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1 space-y-2">
        {events.map((e, i) => (
          <div key={i} className="flex items-center justify-between text-[10px]">
            <span className="text-zinc-300">{e.title}</span>
            <Badge variant={e.crowdLevel === 'low' ? 'default' : 'outline'} className="text-[10px]">
              {e.crowdLevel} crowd
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Feature 52: Grocery Run Optimizer ───

export function GroceryOptimizer() {
  const [stores] = useState<Array<{ name: string; distance: string; quietScore: number }>>([
    { name: 'Whole Foods', distance: '0.5mi', quietScore: 78 },
    { name: 'Trader Joe\'s', distance: '1.2mi', quietScore: 85 },
    { name: 'Aldi', distance: '0.8mi', quietScore: 65 },
  ]);

  return (
    <Card>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ShoppingCart className="h-4 w-4 text-emerald-400" />
          Grocery Optimizer
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1 space-y-2">
        {stores.map((s) => (
          <div key={s.name} className="flex items-center justify-between text-[10px]">
            <span className="text-zinc-300">{s.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">{s.distance}</span>
              <span className={`font-bold ${s.quietScore >= 80 ? 'text-emerald-400' : s.quietScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                {s.quietScore}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Feature 53: Pharmacy After-Hours ───

export function PharmacyFinder() {
  const [pharmacies] = useState<Array<{ name: string; open: boolean; quiet: boolean }>>([
    { name: 'CVS', open: true, quiet: false },
    { name: 'Walgreens', open: true, quiet: true },
  ]);

  return (
    <Card>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Wind className="h-4 w-4 text-blue-400" />
          Pharmacy Finder
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1 space-y-2">
        {pharmacies.map((p) => (
          <div key={p.name} className="flex items-center justify-between text-[10px]">
            <span className="text-zinc-300">{p.name}</span>
            <div className="flex gap-1">
              <Badge variant={p.open ? 'default' : 'outline'} className="text-[10px]">
                {p.open ? 'Open' : 'Closed'}
              </Badge>
              {p.quiet && <Badge variant="default" className="text-[10px] bg-emerald-500/20 text-emerald-300">Quiet</Badge>}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Feature 60: Church / Quiet Space Finder ───

export function DailyLifePanel() {
  const [spaces, setSpaces] = useState<Array<{ name: string; type: string; quietScore: number; open: boolean }>>([
    { name: 'First Baptist Dallas', type: 'church', quietScore: 95, open: true },
    { name: 'Dallas Public Library', type: 'library', quietScore: 92, open: true },
    { name: 'Meow Wolf', type: 'museum', quietScore: 82, open: false },
    { name: 'Klyde Warren Park', type: 'park', quietScore: 78, open: true },
  ]);

  return (
    <Card>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Church className="h-4 w-4 text-violet-400" />
          Quiet Spaces
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1 space-y-2">
        {spaces.map((s) => (
          <div key={s.name} className="flex items-center justify-between text-[10px]">
            <span className="text-zinc-300">{s.name}</span>
            <div className="flex items-center gap-1">
              <span className={`font-bold ${s.quietScore >= 90 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                {s.quietScore}
              </span>
              <Badge variant="default" className="text-[10px]">{s.type}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}