'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store';

/**
 * Minimal ctOS HUD status strip. A thin mono readout bar — no QI logos.
 * Only visible in the cyberpunk (Watch Dogs / ctOS) theme.
 */
export function HudStatusBar() {
  const cameras = useStore((s) => s.cameras);
  const theme = useStore((s) => s.settings.theme);
  const [now, setNow] = useState<string>('--:--:--');
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const id = setInterval(() => {
      setNow(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setUptime(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  if (theme !== 'cyberpunk') return null;

  const online = cameras.filter((c) => c.status === 'online').length;
  const mins = Math.floor(uptime / 60);
  const secs = uptime % 60;

  return (
    <div className="hud-statusbar hidden sm:flex items-center justify-between border-b border-cyan-500/10 px-3 py-1 font-mono text-xs text-zinc-600">
      <span>CTOS://QUIETFLOW</span>
      <div className="flex items-center gap-4">
        <span>CAMERAS {online}/{cameras.length}</span>
        <span>UPTIME {mins}:{String(secs).padStart(2, '0')}</span>
        <span>LINK ● ACTIVE</span>
        <span className="text-cyan-400">{now}</span>
      </div>
    </div>
  );
}
