// ─── Local Camera Sources (Module 1, no-cloud wiring) ──
//
// FIX for the one mistake: the previous version only let Ring/Nest/Arlo/Wyze
// feed the God-View through a vendor CLOUD OAuth login (which most of your own
// LAN cameras don't use and which you don't need). This module ingests YOUR
// cameras over the local network via RTSP / ONVIF — no cloud OAuth, no vendor
// account, no third-party access.
//
// AUTHORIZATION MODEL:
//   • These must be cameras YOU own / are authorized to view (your LAN, your
//     NVR, your ONVIF devices). Pointing this at cameras you don't own is
//     unauthorized access.
//   • A camera still on a factory default (admin/admin, 12345/12345,
//     root/root …) is REFUSED and flagged — change it first. We do not stream
//     from a device still on defaults. Use the auditor to find them.
//   • RTSP/ONVIF URLs are constructed locally from values you provide; this
//     module never probes the internet or scans outside your stated hosts.

import type { DiscoveredCamera, Camera, CameraBrand } from '@/types';
import type { StoredLocalCamera } from '@/store';
import { matchesKnownDefault } from './credential-defaults.ts';

/**
 * The local security bridge that owns RTSP→HLS transcoding. A static web app
 * cannot open an RTSP socket, so the bridge does it and exposes each camera as
 * an HLS playlist at /hls/<id>/index.m3u8. The bridge must be told the camera's
 * RTSP URL + credentials out-of-band (e.g. POST to its /register endpoint); the
 * app only ever consumes the resulting HLS stream.
 *
 * Port 8790: 127.0.0.1:8788 is already used by the LAN security bridge
 * (scripts/serve.js, the admin/admin camera scanner), so the RTSP camera
 * bridge lives on 8790 to avoid clashing.
 */
// Runtime-configurable via ?cameraBridge= query param (Android shell), so the
// app can point at a bridge on the user's LAN instead of the phone's own
// loopback. Defaults to the local dev bridge.
export const CAMERA_BRIDGE_BASE =
  typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('cameraBridge') || 'http://127.0.0.1:8790'
    : 'http://127.0.0.1:8790';

/** HLS playlist the bridge serves for a registered local camera id. */
export function localCameraHlsUrl(id: string): string {
  return `${CAMERA_BRIDGE_BASE}/hls/${id}/index.m3u8`;
}

/**
 * Map the user-facing brand hint to the app's CameraBrand vocabulary.
 * The app only models flock / axon / ring / cctv / other. Nest / Arlo / Wyze are
 * private non-FLOCK/AXON cameras, so they collapse to 'other' — they still
 * register and stream, they just don't get a FLOCK/AXON label in the UI.
 */
function toCameraBrand(b: LocalCameraSpec['brand']): CameraBrand {
  // Unspecified brand defaults to 'cctv' (a generic private camera), not 'other'.
  if (b == null) return 'cctv';
  return b === 'ring' || b === 'cctv' ? (b as CameraBrand) : 'other';
}

export interface LocalCameraSpec {
  id: string;
  name: string;
  /** Camera IP or hostname on your LAN (e.g. 192.168.1.42). */
  host: string;
  lat: number;
  lng: number;
  /** Facing bearing in degrees (0=N, 90=E). Optional; used by heading filter. */
  camera_bearing?: number;
  // ── Credentials you control (NOT a vendor cloud login) ──
  user: string;
  /** WARNING: do not commit real secrets. Prefer reading from env / a vault. */
  pass: string;
  // ── Stream config ──
  /** RTSP port (default 554). */
  rtspPort?: number;
  /** ONVIF channel/path. Default constructs a common Hikvision/Dahua path. */
  rtspPath?: string;
  /** Brand hint for labelling (cctv | ring | other …). */
  brand?: 'cctv' | 'ring' | 'nest' | 'arlo' | 'wyze' | 'other';
}

export interface LocalCameraResult {
  camera: DiscoveredCamera;
  /** RTSP URL (with credentials) for your own player/NVR. */
  rtspUrl: string;
  /** True when the credential is still a known factory default → must be changed. */
  onDefaultCredential: boolean;
  /** True when the camera was accepted into the God-View. */
  accepted: boolean;
  warning?: string;
}

/**
 * Build a God-View-ready camera entry from a camera you own, over local RTSP.
 * No cloud/OAuth. Refuses devices still on factory-default credentials.
 */
export function registerLocalCamera(spec: LocalCameraSpec): LocalCameraResult {
  const port = spec.rtspPort ?? 554;
  const path = spec.rtspPath ?? 'cam/realmonitor?channel=1&subtype=0';
  const rtspUrl = `rtsp://${encodeURIComponent(spec.user)}:${encodeURIComponent(spec.pass)}@${spec.host}:${port}/${path}`;

  const defaultBrand = matchesKnownDefault(spec.user, spec.pass);
  const onDefaultCredential = defaultBrand !== null;

  const camera: DiscoveredCamera = {
    id: `local-${spec.id}`,
    name: spec.name,
    lat: spec.lat,
    lng: spec.lng,
    camera_bearing: spec.camera_bearing,
    confidence: 0.95, // you own it → high confidence it's real & authorized
    source: 'local',
    streamUrl: rtspUrl,
    protocol: 'rtsp',
    streamVerified: false,
    brand: toCameraBrand(spec.brand),
    operator: 'local',
  };

  if (onDefaultCredential) {
    return {
      camera,
      rtspUrl,
      onDefaultCredential: true,
      accepted: false,
      warning: `Refused: credential "${spec.user}/${spec.pass || '(empty)'}" is a known factory default (${defaultBrand}). Change it on the device, then re-register.`,
    };
  }

  return { camera, rtspUrl, onDefaultCredential: false, accepted: true };
}

/**
 * Register many local cameras at once; returns accepted ones (God-View ready)
 * plus refusals (still on defaults / not yours). Never throws on a bad cred.
 */
export function registerLocalCameras(specs: LocalCameraSpec[]): {
  accepted: DiscoveredCamera[];
  rejected: Array<{ id: string; reason: string }>;
} {
  const accepted: DiscoveredCamera[] = [];
  const rejected: Array<{ id: string; reason: string }> = [];
  for (const s of specs) {
    const r = registerLocalCamera(s);
    if (r.accepted) accepted.push(r.camera);
    else rejected.push({ id: s.id, reason: r.warning ?? 'rejected' });
  }
  return { accepted, rejected };
}

/**
 * Convert a successfully-registered local camera into the app's `Camera` type
 * for rendering in the map/camera-grid. `hlsUrl` comes from the ffmpeg bridge
 * (e.g. /hls/local-<id>/index.m3u8). The UI's LiveCameraView plays HLS natively.
 */
export function toAppCamera(spec: LocalCameraSpec, hlsUrl: string): Camera {
  const reg = registerLocalCamera(spec);
  if (!reg.accepted) {
    throw new Error(reg.warning ?? 'Camera refused (likely still on a factory-default credential).');
  }
  const bearing = spec.camera_bearing;
  const orientation = bearing == null ? 'un' : bearingToCardinal8(bearing);
  return {
    id: `local-${spec.id}`,
    name: spec.name,
    lat: spec.lat,
    lng: spec.lng,
    roadName: spec.host,
    orientation,
    streamUrl: hlsUrl,
    protocol: 'hls',
    jurisdiction: 'local',
    privacyMasks: [],
    status: 'online',
    lastFrameAt: null,
    healthScore: 0.95,
    resolution: '1280x720',
    updateFrequency: 2,
    densityLevel: 'green',
    isPublic: false,
    is_live: false,
    brand: toCameraBrand(spec.brand),
    model: spec.brand ?? 'local',
    // The raw RTSP URL (with credentials) is available via the bridge; the app
    // UI only consumes the HLS stream, so we don't carry the RTSP url here.
  };
}

function bearingToCardinal8(b: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(b / 45) % 8];
}

/**
 * Map a *saved* local camera (StoredLocalCamera — password intentionally NOT
 * persisted) to a renderable app Camera. The stream URL points at the local
 * bridge's HLS playlist for this camera id; the bridge itself holds the RTSP
 * URL + credentials and does the transcode. If the bridge isn't running,
 * LiveCameraView gracefully reports the camera as offline / synthetic.
 */
export function localCameraToAppCamera(stored: StoredLocalCamera): Camera {
  const bearing = stored.camera_bearing;
  const orientation = bearing == null ? 'un' : bearingToCardinal8(bearing);
  const brandMap: Record<string, CameraBrand> = {
    cctv: 'cctv', ring: 'ring', nest: 'other', arlo: 'other', wyze: 'other', other: 'other',
  };
  return {
    id: `local-${stored.id}`,
    name: stored.name,
    lat: stored.lat,
    lng: stored.lng,
    roadName: stored.host,
    orientation,
    streamUrl: localCameraHlsUrl(stored.id),
    protocol: 'hls',
    jurisdiction: 'local',
    privacyMasks: [],
    status: 'online',
    lastFrameAt: null,
    healthScore: 0.95,
    resolution: '1280x720',
    updateFrequency: 2,
    densityLevel: 'green',
    isPublic: false,
    is_live: false,
    brand: brandMap[stored.brand ?? 'cctv'] ?? 'other',
    model: stored.brand ?? 'local',
  };
}
