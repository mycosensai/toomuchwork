'use client';

import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import { DensityLevel } from '@/types';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import {
  Sun, Moon, Monitor, Map, Thermometer, Bell,
  Eye, Type, Contrast, Activity, Navigation, Cpu, Gem,
} from 'lucide-react';

const densityOptions: { label: string; value: DensityLevel }[] = [
  { label: 'Very quiet', value: 'green' },
  { label: 'Comfortable', value: 'yellow' },
  { label: 'Getting busy', value: 'orange' },
  { label: 'Crowded', value: 'red' },
];

export function SettingsPanel() {
  const { activeView, settings, updateSettings, trafficSource, airQuality } = useStore();
  if (activeView !== 'settings') return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 cyber-heading">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">Customize QuietFlow to feel right for you.</p>
      </div>

      {/* Data provenance legend — always visible so users know what is real */}
      <Card className="mb-4 border-emerald-200 dark:border-emerald-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm"><Activity className="h-4 w-4" /> Data Sources</CardTitle>
          <CardDescription className="text-xs">What is real vs. modeled right now</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <LegendRow label="Weather & air quality (Open-Meteo)" real={!!airQuality} />
          <LegendRow label="Live traffic (TomTom/Mapbox key)" real={trafficSource === 'real'} />
          <LegendRow label="Camera locations (OpenStreetMap)" real={true} />
          <LegendRow label="Community busyness & corrections" real={true} />
          <LegendRow label="Parking vehicle counts / crowd" real={false} />
          <p className="pt-1 text-[10px] text-zinc-400">REAL = live observation or verified user report. PREVIEW = model/simulation until a real source is wired.</p>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm"><Sun className="h-4 w-4" /> Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-zinc-500">Theme</p>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {[
                { key: 'light' as const, icon: Sun, label: 'Light' },
                { key: 'dark' as const, icon: Moon, label: 'Dark' },
                { key: 'system' as const, icon: Monitor, label: 'System' },
                { key: 'cyberpunk' as const, icon: Cpu, label: 'Watch Dogs' },
                { key: 'zen' as const, icon: Gem, label: 'Zen' },
              ].map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => updateSettings({ theme: key })}
                  className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 sm:w-auto ${
                    settings.theme === key
                      ? key === 'cyberpunk'
                        ? 'bg-cyan-500/20 text-cyan-300 shadow-[0_0_18px_rgba(0,240,255,0.35)] ring-1 ring-cyan-400/40 dark:bg-cyan-500/20 dark:text-cyan-300'
                        : key === 'zen'
                        ? 'bg-amber-500/20 text-amber-300 shadow-[0_0_18px_rgba(255,215,0,0.35)] ring-1 ring-amber-400/40 dark:bg-amber-500/20 dark:text-amber-300'
                        : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-zinc-500">Temperature</p>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              {['f', 'c'].map((unit) => (
                <button
                  key={unit}
                  onClick={() => updateSettings({ temperatureUnit: unit as 'f' | 'c' })}
                  className={`min-h-10 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                    settings.temperatureUnit === unit
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  <Thermometer className="h-4 w-4" /> °{unit.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-500">Map Style</p>
            <div className="flex gap-2">
              {[
                { key: 'street' as const, icon: Map, label: 'Street' },
                { key: 'satellite' as const, icon: Map, label: 'Satellite' },
                { key: 'light' as const, icon: Map, label: 'Light' },
                { key: 'topo' as const, icon: Map, label: 'Topo' },
                { key: 'voyager' as const, icon: Map, label: 'Voyager' },
              ].map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => updateSettings({ mapStyle: key })}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    settings.mapStyle === key
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Density Threshold */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm"><Activity className="h-4 w-4" /> My Comfort Level</CardTitle>
          <CardDescription>What&apos;s the maximum crowd level you&apos;re comfortable with?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {densityOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateSettings({ maxAcceptableDensity: opt.value })}
                className={`flex-1 rounded-lg px-3 py-2 text-center text-xs font-medium transition-colors ${
                  settings.maxAcceptableDensity === opt.value
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm"><Bell className="h-4 w-4" /> Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Toggle
            label="Quiet notifications"
            description="Get notified when conditions are favorable near your saved places"
            enabled={settings.notificationEnabled}
            onChange={(v) => updateSettings({ notificationEnabled: v })}
          />
          {settings.notificationEnabled && (
            <div>
              <p className="mb-2 text-xs text-zinc-500">
                Notify me between {settings.notificationStartHour}:00 – {settings.notificationEndHour}:00
              </p>
              <Slider
                min={0} max={24} step={1}
                value={[settings.notificationStartHour, settings.notificationEndHour]}
                onChange={([s, e]) => updateSettings({ notificationStartHour: s, notificationEndHour: e })}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Anxiety-Friendly */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm"><Eye className="h-4 w-4" /> Accessibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Toggle label="Reduce animations" description="Disable non-essential motion" enabled={settings.reduceAnimations} onChange={(v) => updateSettings({ reduceAnimations: v })} />
          <Toggle label="Larger text" description="Increase text size throughout the app" enabled={settings.largeText} onChange={(v) => updateSettings({ largeText: v })} />
          <Toggle label="High contrast" description="Increase contrast for better readability" enabled={settings.highContrast} onChange={(v) => updateSettings({ highContrast: v })} />
        </CardContent>
      </Card>

      {/* Map layers */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm"><Map className="h-4 w-4" /> Map Layers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Toggle label="Show road density" description="Color-coded traffic density on roads" enabled={settings.showRoadDensity} onChange={(v) => updateSettings({ showRoadDensity: v })} />
          <Toggle label="Show business density" description="Density badges on business locations" enabled={settings.showBusinessDensity} onChange={(v) => updateSettings({ showBusinessDensity: v })} />
          <Toggle label="Show camera markers" description="Camera icons on the map" enabled={settings.showCameraMarkers} onChange={(v) => updateSettings({ showCameraMarkers: v })} />
          <Toggle label="Live traffic overlay" description="Traffic layer on the map" enabled={settings.showLiveTraffic} onChange={(v) => updateSettings({ showLiveTraffic: v })} />
          <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <p className="mb-1.5 text-xs font-medium text-zinc-500">Traffic source</p>
            <div className="grid grid-cols-3 gap-2 sm:flex">
              <button
                onClick={() => updateSettings({ trafficProvider: 'density' })}
                className={`min-h-11 flex-1 rounded-xl px-2 py-2.5 text-[11px] font-medium transition-colors ${settings.trafficProvider === 'density' ? 'bg-emerald-500 text-white' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'}`}
              >
                Density (no key)
              </button>
              <button
                onClick={() => updateSettings({ trafficProvider: 'tomtom' })}
                className={`min-h-10 flex-1 rounded-lg px-2 py-2 text-[11px] font-medium transition-colors ${settings.trafficProvider === 'tomtom' ? 'bg-blue-500 text-white' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'}`}
              >
                TomTom
              </button>
              <button
                onClick={() => updateSettings({ trafficProvider: 'mapbox' })}
                className={`min-h-10 flex-1 rounded-lg px-2 py-2 text-[11px] font-medium transition-colors ${settings.trafficProvider === 'mapbox' ? 'bg-blue-500 text-white' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'}`}
              >
                Mapbox
              </button>
            </div>
            {settings.trafficProvider === 'tomtom' && (
              <div className="mt-2">
                <Input
                  type="password"
                  placeholder="Paste TomTom API key"
                  value={settings.tomTomKey || ''}
                  onChange={(e) => updateSettings({ tomTomKey: e.target.value })}
                />
                <p className="mt-1 text-[10px] text-zinc-400">Stored on this device only (localStorage). Free tier: 2,500 req/day.</p>
              </div>
            )}
            {settings.trafficProvider === 'mapbox' && (
              <div className="mt-2">
                <Input
                  type="password"
                  placeholder="Paste Mapbox public token"
                  value={settings.mapboxKey || ''}
                  onChange={(e) => updateSettings({ mapboxKey: e.target.value })}
                />
                <p className="mt-1 text-[10px] text-zinc-400">Stored on this device only (localStorage). Free tier: 50k map loads/mo.</p>
              </div>
            )}
          </div>
          <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <p className="mb-1.5 text-xs font-medium text-zinc-500">Routing source</p>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <button
                onClick={() => updateSettings({ directionsProvider: 'osrm' })}
                className={`min-h-10 flex-1 rounded-lg px-2 py-2 text-[11px] font-medium transition-colors ${settings.directionsProvider === 'osrm' ? 'bg-emerald-500 text-white' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'}`}
              >
                OSRM (no key)
              </button>
              <button
                onClick={() => updateSettings({ directionsProvider: 'mapbox' })}
                className={`min-h-10 flex-1 rounded-lg px-2 py-2 text-[11px] font-medium transition-colors ${settings.directionsProvider === 'mapbox' ? 'bg-blue-500 text-white' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'}`}
              >
                Mapbox
              </button>
            </div>
            <Toggle label="Voice guidance" description="Speak next-turn instructions out loud when routing" enabled={settings.routeVoiceGuidance} onChange={(v) => updateSettings({ routeVoiceGuidance: v })} />
            <p className="mt-1 text-[10px] text-zinc-400">OSRM public demo router (no key). Mapbox uses the token you pasted above.</p>
          </div>
          <Toggle label="City Pulse" description="Pulsing heatmap of city-wide crowd density" enabled={settings.showHeatmap} onChange={(v) => updateSettings({ showHeatmap: v })} />
        </CardContent>
      </Card>
    </div>
  );
}

function LegendRow({ label, real }: { label: string; real: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-600 dark:text-zinc-300">{label}</span>
      <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold text-white ${real ? 'bg-emerald-500' : 'bg-zinc-400'}`}>
        {real ? 'REAL' : 'PREVIEW'}
      </span>
    </div>
  );
}
