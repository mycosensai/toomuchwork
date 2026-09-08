'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store';

/**
 * ctOS-style boot sequence overlay (Watch Dogs theme). Shows a brief
 * terminal boot readout on first app launch, then fades out. Client-only:
 * it mounts after hydration, so there is no SSR mismatch. Only appears in
 * the cyberpunk ("Watch Dogs") theme.
 */
const BOOT_LINES = [
  'CTOS://QUIETFLOW v4.2.1',
  'INITIALIZING KERNEL ......... OK',
  'MOUNTING SENSOR GRID ....... OK',
  'LINKING CAMERA NODES ....... OK',
  'LOADING DENSITY MATRICES ... OK',
  'ENCRYPTING LOCAL CHANNELS .. OK',
  'WELCOME, OPERATOR',
];

export function BootScreen() {
  const theme = useStore((s) => s.settings.theme);
  const [phase, setPhase] = useState<'boot' | 'fade' | 'gone'>('boot');
  const [lineIdx, setLineIdx] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    // Reveal one line every ~140ms; fade after the last line.
    let idx = 0;
    const lineTimer = setInterval(() => {
      idx += 1;
      setLineIdx(idx);
      if (idx >= BOOT_LINES.length) {
        clearInterval(lineTimer);
        setTimeout(() => setPhase('fade'), 350);
        setTimeout(() => setPhase('gone'), 950);
      }
    }, 140);
    return () => clearInterval(lineTimer);
  }, []);

  if (theme !== 'cyberpunk' || phase === 'gone') return null;

  return (
    <div
      className="boot-screen"
      style={{
        opacity: phase === 'fade' ? 0 : 1,
        transition: 'opacity 600ms ease-out',
      }}
      aria-hidden="true"
    >
      <div className="boot-lines">
        {BOOT_LINES.slice(0, lineIdx).map((line) => (
          <div key={line} className="boot-line">
            <span className="boot-prompt">▮</span> {line}
          </div>
        ))}
        <div className="boot-cursor" />
      </div>
    </div>
  );
}
