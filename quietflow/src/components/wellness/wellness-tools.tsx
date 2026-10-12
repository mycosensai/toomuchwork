'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import FeatureBatch2 from '@/components/social/anxiety-features-200';
import FeatureBatch3 from '@/components/social/anxiety-features-300';
import FeatureBatch4 from '@/components/social/anxiety-features-400';
import FeatureBatch5 from '@/components/social/anxiety-features-500';

const TABS = [
  { id: 'batch2', label: 'Calm Kit (101–200)' },
  { id: 'batch3', label: 'Regulation (201–300)' },
  { id: 'batch4', label: 'Places (301–400)' },
  { id: 'batch5', label: 'Focus (401–500)' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function WellnessTools() {
  const { activeView } = useStore();
  const [tab, setTab] = useState<TabId>('batch2');

  if (activeView !== 'wellness') return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Sparkles className="h-6 w-6" /> Wellness Tools
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          400 pocket tools for calm, quiet routes, and gentle days. Pick a kit below.
        </p>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button
            key={t.id}
            size="sm"
            variant={tab === t.id ? 'primary' : 'outline'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>
      {tab === 'batch2' && <FeatureBatch2 />}
      {tab === 'batch3' && <FeatureBatch3 />}
      {tab === 'batch4' && <FeatureBatch4 />}
      {tab === 'batch5' && <FeatureBatch5 />}
    </div>
  );
}
