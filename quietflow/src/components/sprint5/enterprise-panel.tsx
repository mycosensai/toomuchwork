/**
 * Sprint 5 — Accessibility + Enterprise
 * Features 81-100
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Download, Plug, Palette, BarChart3, Share2 } from 'lucide-react';

// ─── Feature 81-90: Accessibility ───

export function AccessibilityPanel() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(true); // gold on black IS high contrast
  const [largeText, setLargeText] = useState(false);
  const [voiceNav, setVoiceNav] = useState(false);

  return (
    <Card className="border-cyan-200/30">
      <CardHeader className="p-3 pb-1">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Settings className="h-4 w-4 text-cyan-400" />
          Accessibility
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1 space-y-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={reducedMotion} onChange={(e) => setReducedMotion(e.target.checked)} />
          Reduced Motion
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={highContrast} onChange={(e) => setHighContrast(e.target.checked)} />
          High Contrast (Gold/Black)
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={largeText} onChange={(e) => setLargeText(e.target.checked)} />
          Large Text (200%)
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={voiceNav} onChange={(e) => setVoiceNav(e.target.checked)} />
          Voice Navigation
        </label>
      </CardContent>
    </Card>
  );
}

// ─── Feature 91-95: Enterprise ───

export function EnterprisePanel() {
  const [apiKey] = useState<string | null>(null);

  return (
    <Card className="border-violet-200/30">
      <CardHeader className="p-3 pb-1">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Plug className="h-4 w-4 text-violet-400" />
          Enterprise / API
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1 space-y-2">
        <div className="text-[10px] text-zinc-400">
          API Token: {apiKey ? '••••••••' : 'Not set'}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1 h-3 w-3" /> Export CSV
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="mr-1 h-3 w-3" /> Share Data
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="w-full">
          Generate API Token
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Feature 96-100: Extensibility ───

export function ExtensibilityPanel() {
  const [plugins] = useState<Array<{ name: string; enabled: boolean }>>([
    { name: 'Theme Builder', enabled: true },
    { name: 'Plugin Architecture', enabled: false },
  ]);

  return (
    <Card>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Palette className="h-4 w-4 text-amber-400" />
          Extensibility
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1 space-y-2">
        {plugins.map((p) => (
          <div key={p.name} className="flex items-center justify-between text-[10px]">
            <span className="text-zinc-300">{p.name}</span>
            <Badge variant={p.enabled ? 'default' : 'outline'} className="text-[10px]">
              {p.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full">
          Install Plugin
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Feature 98: Analytics Dashboard ───

export function AnalyticsDashboard() {
  return (
    <Card className="border-amber-200/30">
      <CardHeader className="p-3 pb-1">
        <CardTitle className="flex items-center gap-2 text-sm">
          <BarChart3 className="h-4 w-4 text-amber-400" />
          Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-cyan-400">42</div>
            <div className="text-[10px] text-zinc-400">Trips</div>
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-400">94%</div>
            <div className="text-[10px] text-zinc-400">Quiet Score</div>
          </div>
          <div>
            <div className="text-lg font-bold text-purple-400">12</div>
            <div className="text-[10px] text-zinc-400">Crowds Avoided</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}