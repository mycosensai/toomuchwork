'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useStore } from '@/store';
import { Camera, VehicleDetection, VehicleType } from '@/types';
import { generateVehicleDetection, detectionToDensityLevel } from '@/lib/density-utils';
import { cn } from '@/lib/cn';
import Hls from 'hls.js';

const VEHICLE_COLORS: Record<VehicleType | 'default', string> = {
  car: '#3b82f6',
  suv: '#8b5cf6',
  truck: '#f97316',
  bus: '#ef4444',
  motorcycle: '#22c55e',
  bicycle: '#14b8a6',
  pedestrian: '#eab308',
  default: '#6b7280',
};

const VEHICLE_ICONS: Record<VehicleType, string> = {
  car: '🚗', suv: '🚙', truck: '🚚', bus: '🚌',
  motorcycle: '🏍️', bicycle: '🚲', pedestrian: '🚶',
};

interface LiveCameraViewProps {
  camera: Camera;
  className?: string;
}

function VehicleDetectionOverlay({ detection }: { detection: VehicleDetection }) {
  const boxes = useMemo(() => {
    const seed = detection.cameraId.length + detection.count;
    const result: Array<{ x: number; y: number; w: number; h: number; type: VehicleType }> = [];
    const types = Object.entries(detection.types) as [VehicleType, number][];
    let boxIdx = 0;
    for (const [type, count] of types) {
      if (!count || count <= 0) continue;
      const maxBoxes = Math.min(count, type === 'pedestrian' ? 4 : type === 'bicycle' ? 2 : 8);
      for (let j = 0; j < maxBoxes; j++) {
        const r = ((seed * (j + 1) * (boxIdx + 1)) % 100) / 100;
        const x = 0.02 + r * 0.76;
        const y = 0.1 + ((seed * (j + 3) * (boxIdx + 1)) % 100) / 100 * 0.5;
        result.push({
          x: Math.round(x * 100) / 100,
          y: Math.round(y * 100) / 100,
          w: 0.04 + (seed % 5) / 100,
          h: 0.06 + (seed * j) % 5 / 100,
          type,
        });
        boxIdx++;
      }
    }
    return result;
  }, [detection]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {boxes.map((box, i) => (
        <div
          key={i}
          className="absolute border-[1.5px] animate-pulse"
          style={{
            left: `${box.x * 100}%`, top: `${box.y * 100}%`,
            width: `${box.w * 100}%`, height: `${box.h * 100}%`,
            borderColor: VEHICLE_COLORS[box.type] || VEHICLE_COLORS.default,
            backgroundColor: `${VEHICLE_COLORS[box.type] || VEHICLE_COLORS.default}22`,
            animationDuration: `${1.5 + (i % 3) * 0.5}s`,
            transition: 'all 0.5s ease',
          }}
        >
          <span className="absolute -top-3.5 left-0 text-[8px] leading-none" style={{ color: VEHICLE_COLORS[box.type] || VEHICLE_COLORS.default }}>
            {VEHICLE_ICONS[box.type] || '⬤'}
          </span>
        </div>
      ))}
      <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-white">
        <span>AI {Math.round(detection.confidence * 100)}%</span>
        <span className="text-zinc-500">·</span>
        <span>{detection.count} detections</span>
      </div>
    </div>
  );
}

function VehicleAnalytics({ detection }: { detection: VehicleDetection }) {
  const level = detectionToDensityLevel(detection);
  const types = Object.entries(detection.types) as [VehicleType, number][];

  return (
    <div className="pointer-events-none absolute right-2 top-2 z-10 max-w-[180px] rounded-md bg-black/70 px-2 py-1.5 text-[10px] text-white">
      <div className="mb-1 flex items-center justify-between border-b border-white/10 pb-1">
        <span className="font-semibold">Flow</span>
        <span className="text-emerald-400">{detection.flowRate}/min</span>
      </div>
      <div className="space-y-0.5">
        {types.filter(([_, c]) => c > 0).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([type, count]) => (
          <div key={type} className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1">
              <span>{VEHICLE_ICONS[type] || ''}</span>
              <span className="capitalize">{type}</span>
            </div>
            <span className="font-mono text-zinc-300">{count}</span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex items-center justify-between border-t border-white/10 pt-1">
        <span className="text-zinc-400">Speed</span>
        <span className="font-mono">{detection.averageSpeed} km/h</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-zinc-400">Congestion</span>
        <span className="font-mono" style={{ color: detection.congestionIndex > 0.6 ? '#ef4444' : detection.congestionIndex > 0.3 ? '#f97316' : '#22c55e' }}>
          {Math.round(detection.congestionIndex * 100)}%
        </span>
      </div>
    </div>
  );
}

/** Synthetic live-feed camera view — shown when real HLS/JPEG feed is unavailable.
 *  Continuously animates with vehicle detections, road grid, and live timestamp. */
function SyntheticFeed({ camera, detection }: { camera: Camera; detection: VehicleDetection | null }) {
  const [liveTime, setLiveTime] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setLiveTime(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const [dotKey, setDotKey] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDotKey((k) => k + 1), 3000);
    return () => clearInterval(t);
  }, []);

  const densityLabel: Record<string, string> = {
    green: 'Not busy', yellow: 'Light traffic', orange: 'Moderate',
    red: 'Heavy traffic', purple: 'Very congested',
  };

  const densityColors: Record<string, string> = {
    green: '#22c55e', yellow: '#eab308', orange: '#f97316', red: '#ef4444', purple: '#a855f7',
  };

  const numV = detection?.count || camera.vehicleCountEst || 0;
  const lvl = numV <= 5 ? 'green' : numV <= 15 ? 'yellow' : numV <= 30 ? 'orange' : numV <= 50 ? 'red' : 'purple';

  return (
    <div className="relative h-full w-full bg-zinc-950 overflow-hidden">
      {/* Road grid background */}
      <div className="absolute inset-0 opacity-30">
        <svg viewBox="0 0 400 300" className="h-full w-full">
          <defs>
            <pattern id={`roadGrid-${camera.id}`} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="40" height="40" fill="none" />
              <line x1="0" y1="20" x2="40" y2="20" stroke="#334155" strokeWidth="0.3" />
              <line x1="20" y1="0" x2="20" y2="40" stroke="#334155" strokeWidth="0.3" />
              <rect x="18" y="8" width="4" height="4" fill="#4a5568" opacity="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#roadGrid-${camera.id})`} />
          {/* Main road diagonal */}
          <line x1="0" y1="80" x2="400" y2="280" stroke="#475569" strokeWidth="6" opacity="0.4" />
          <line x1="0" y1="84" x2="400" y2="284" stroke="#eab308" strokeWidth="1.5" strokeDasharray="6,8" opacity="0.3" />
          {/* Cross road */}
          <line x1="120" y1="0" x2="320" y2="300" stroke="#475569" strokeWidth="4" opacity="0.3" />
        </svg>
      </div>

      {/* Detection overlay */}
      {detection && <VehicleDetectionOverlay detection={detection} key={`det-${dotKey}`} />}
      {detection && <VehicleAnalytics detection={detection} key={`da-${dotKey}`} />}

      {/* LIVE badge + timestamp */}
      <div className="pointer-events-none absolute left-2 top-2 z-10 flex items-center gap-2">
        <div className="flex items-center gap-1 rounded bg-amber-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-lg">
          <span className="inline-block h-2 w-2 rounded-full bg-white" style={{ animationDuration: '1s' }} />
          DEMO FEED
        </div>
        <div className="rounded bg-black/50 px-1.5 py-0.5 text-[9px] font-mono text-emerald-300">
          {new Date(liveTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>

      {/* Road name + orientation pin */}
      <div className="pointer-events-none absolute left-2 bottom-2 z-10 flex items-center gap-2">
        <div className="rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-zinc-300">
          {camera.roadName} · {camera.orientation}bound
        </div>
        {camera.jurisdiction && camera.jurisdiction !== 'local' && (
          <div className="rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-zinc-400">
            {camera.jurisdiction}
          </div>
        )}
      </div>

      {/* Bottom-right: density level badge */}
      <div className="pointer-events-none absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-white">
        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: densityColors[lvl] }} />
        {densityLabel[lvl]}
      </div>

      {/* Animated car dots — always animate, no motion-safe guard */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => {
          const vt: VehicleType = (['car', 'suv', 'truck', 'car', 'suv', 'car'] as VehicleType[])[i];
          return (
            <div
              key={`${i}-${dotKey}`}
              className="absolute h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor: VEHICLE_COLORS[vt],
                left: `${10 + (i * 17 + dotKey * 0.3) % 80}%`,
                top: `${15 + (i * 13 + dotKey * 0.2) % 70}%`,
                animationDuration: `${2 + (i % 3) * 0.5}s`,
                animationDelay: `${i * 0.3}s`,
                opacity: 0.6,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export function LiveCameraView({ camera, className }: LiveCameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<'loading' | 'hls' | 'mjpeg' | 'jpeg' | 'synthetic'>('loading');
  const [imgKey, setImgKey] = useState(0);

  // Update camera's live status in store
  const updateCameraLiveStatus = (id: string, live: boolean, frameTime?: string) => {
    const { cameras } = useStore.getState();
    const idx = cameras.findIndex((c) => c.id === id);
    if (idx !== -1) {
      const updated = [...cameras];
      updated[idx] = { ...updated[idx], is_live: live, last_frame_timestamp: frameTime };
      useStore.setState({ cameras: updated });
    }
  };

  // Vehicle detection state — refreshes every 4s regardless of mode
  const [detection, setDetection] = useState<VehicleDetection | null>(null);
  const [detKey, setDetKey] = useState(0);
  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    const isWeekend = [0, 6].includes(now.getDay());
    const roadType: 'highway' | 'arterial' | 'local' =
      camera.roadName.startsWith('I-') ? 'highway' :
      ['US-75', 'Loop 12', 'NW Hwy'].some(p => camera.roadName.includes(p)) ? 'arterial' : 'local';
    const genDet = () => setDetection(generateVehicleDetection(camera.id, hour, roadType, camera.vehicleCountEst || 10, isWeekend));
    genDet();
    const detInterval = setInterval(genDet, 4000);
    return () => clearInterval(detInterval);
  }, [camera.id]);

  // Force re-render detection overlay every 4s so vehicle boxes animate
  useEffect(() => {
    const t = setInterval(() => setDetKey((k) => k + 1), 4000);
    return () => clearInterval(t);
  }, []);

  // Stream timeout — if mode hasn't left 'loading' after 12s, mark degraded + try fallback
  useEffect(() => {
    if (camera.status === 'offline') return;
    const t = setTimeout(() => {
      if (mode === 'loading') {
        const { cameras } = useStore.getState();
        const idx = cameras.findIndex((c) => c.id === camera.id);
        if (idx !== -1 && cameras[idx].status === 'online') {
          const updated = [...cameras];
          updated[idx] = { ...updated[idx], status: 'degraded', healthScore: Math.max(0.2, updated[idx].healthScore * 0.5) };
          useStore.setState({ cameras: updated });
        }
        // Try JPEG snapshot fallback
        tryJpegFallback();
      }
    }, 12000);
    return () => clearTimeout(t);
  }, [camera.id, camera.status, mode]);

  // JPEG snapshot fallback — poll a static image using camera's refresh_interval (default 3s)
  const jpegUrlRef = useRef<string>('');
  const jpegIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tryJpegFallback = () => {
    const base = camera.thumbnailUrl || camera.streamUrl;
    if (!base) { setMode('synthetic'); return; }
    const jpegUrl = base
      .replace(/\/hls\//, '/snap/')
      .replace(/\.m3u8.*$/, '.jpg')
      .replace(/\/playlist\.smil.*/, '/snapshot.jpg');
    jpegUrlRef.current = `${jpegUrl}${jpegUrl.includes('?') ? '&' : '?'}_ts=${Date.now()}`;
    setMode('jpeg');
    if (jpegIntervalRef.current) clearInterval(jpegIntervalRef.current);
    const intervalMs = camera.refresh_interval ? camera.refresh_interval * 1000 : 3000;
    jpegIntervalRef.current = setInterval(() => setImgKey((k) => k + 1), intervalMs);
  };
  // Clean up JPEG interval on unmount
  useEffect(() => () => { if (jpegIntervalRef.current) clearInterval(jpegIntervalRef.current); }, []);

  // Try HLS for real feeds; MJPEG for streamable JPEG; JPEG refresh as fallback; otherwise synthetic
  useEffect(() => {
    // Synthetic protocol = no external stream exists (decommissioned hosts);
    // render the built-in demo live feed immediately — never probe dead URLs.
    if (camera.protocol === 'synthetic') { setMode('synthetic'); return; }
    if (camera.status === 'offline') { setMode('synthetic'); return; }
    if (camera.protocol === 'mjpeg' || (camera.protocol === 'jpeg' && camera.streamUrl?.includes('.mjpg'))) {
      setMode('mjpeg');
      updateCameraLiveStatus(camera.id, true, new Date().toISOString());
      return;
    }
    const video = videoRef.current;
    const streamUrl = camera.streamUrl || '';
    const isHls = camera.protocol === 'hls' && (streamUrl.endsWith('.m3u8') || streamUrl.includes('.m3u8'));
    if (isHls && video) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
        video.addEventListener('loadedmetadata', () => setMode('hls'));
        video.addEventListener('error', () => tryJpegFallback());
        video.addEventListener('playing', () => updateCameraLiveStatus(camera.id, true, new Date().toISOString()));
        video.play().catch(() => { updateCameraLiveStatus(camera.id, false); tryJpegFallback(); });
        return () => { video.removeAttribute('src'); };
      } else if (Hls.isSupported()) {
        const hls = new Hls({ lowLatencyMode: true, enableWorker: true, maxBufferLength: 8 });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setMode('hls');
          updateCameraLiveStatus(camera.id, true, new Date().toISOString());
          video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) { hls.destroy(); updateCameraLiveStatus(camera.id, false); tryJpegFallback(); }
        });
        return () => hls.destroy();
      } else {
        tryJpegFallback();
      }
    } else if (camera.protocol === 'jpeg') {
      // Direct JPEG snapshot — poll every 3s
      jpegUrlRef.current = `${streamUrl}${streamUrl?.includes('?') ? '&' : '?'}_ts=${Date.now()}`;
      setMode('jpeg');
      if (jpegIntervalRef.current) clearInterval(jpegIntervalRef.current);
      jpegIntervalRef.current = setInterval(() => setImgKey((k) => k + 1), 3000);
      return;
    } else {
      tryJpegFallback();
    }
  }, [camera.id, camera.streamUrl, camera.protocol, camera.status, camera.thumbnailUrl]);

  return (
    <div className={cn('relative overflow-hidden bg-zinc-950', className)}>
      {mode === 'hls' && camera.status !== 'offline' && (
        <>
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline autoPlay />
          {detection && <VehicleDetectionOverlay detection={detection} />}
          {detection && <VehicleAnalytics detection={detection} />}
        </>
      )}

      {/* MJPEG live stream — browser handles it natively via <img> */}
      {mode === 'mjpeg' && camera.status !== 'offline' && (
        <>
          <img
            src={camera.streamUrl}
            alt={camera.name}
            className="h-full w-full object-cover"
            onError={() => { updateCameraLiveStatus(camera.id, false); tryJpegFallback(); }}
            onLoad={() => updateCameraLiveStatus(camera.id, true, new Date().toISOString())}
          />
          <span className="pointer-events-none absolute left-2 top-2 z-10 flex items-center gap-1 rounded bg-red-600/80 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-lg">
            <span className="inline-block h-2 w-2 rounded-full bg-white" style={{ animationDuration: '1s' }} />
            MJPEG
          </span>
          {detection && <VehicleDetectionOverlay detection={detection} />}
          {detection && <VehicleAnalytics detection={detection} />}
        </>
      )}

      {/* JPEG snapshot refresh — polls every 3 seconds */}
      {mode === 'jpeg' && camera.status !== 'offline' && (
        <>
          <img
            key={`jpeg-${imgKey}`}
            src={jpegUrlRef.current || `${camera.streamUrl}${camera.streamUrl?.includes('?') ? '&' : '?'}_=${imgKey}`}
            alt={camera.name}
            className="h-full w-full object-cover"
            onError={() => setMode('synthetic')}
            onLoad={() => updateCameraLiveStatus(camera.id, true, new Date().toISOString())}
          />
          <span className="pointer-events-none absolute left-2 top-2 z-10 flex items-center gap-1 rounded bg-amber-600/80 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-lg">
            <span className="inline-block h-2 w-2 rounded-full bg-white" style={{ animationDuration: '1.5s' }} />
            JPEG
          </span>
          {detection && <VehicleDetectionOverlay detection={detection} />}
          {detection && <VehicleAnalytics detection={detection} />}
        </>
      )}

      {/* Show synthetic live feed for cases where nothing else works */}
      {(mode !== 'hls' && mode !== 'mjpeg' && mode !== 'jpeg' || camera.status === 'offline') && (
        <SyntheticFeed camera={camera} detection={detection} />
      )}

      {mode === 'loading' && camera.status !== 'offline' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-950/60">
          <div className="flex items-center gap-2 text-[10px] text-emerald-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-emerald-500" />
            Connecting…
          </div>
        </div>
      )}
    </div>
  );
}
