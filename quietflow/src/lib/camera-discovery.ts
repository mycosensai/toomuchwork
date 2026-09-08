import { CameraDiscoveryInput, DiscoveredCamera, CameraSource, BearingDirection, CameraBrand, cardinalToBearing, bearingToCardinal } from '@/types';
import { MOCK_ROAD_SEGMENTS } from './mock-data';

// ─── Helpers ────────────────────────────────────────────────

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function bearingFrom(fromLat: number, fromLng: number, toLat: number, toLng: number): number {
  const dLng = (toLng - fromLng) * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(toLat * Math.PI / 180);
  const x = Math.cos(fromLat * Math.PI / 180) * Math.sin(toLat * Math.PI / 180) -
    Math.sin(fromLat * Math.PI / 180) * Math.cos(toLat * Math.PI / 180) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function directionConfidence(cameraFacing: number | undefined, targetBearing: number): number {
  if (cameraFacing === undefined || cameraFacing === null) return 0.5;
  const diff = Math.abs(cameraFacing - targetBearing);
  const normalized = Math.min(diff, 360 - diff);
  return Math.max(0, 1 - normalized / 180);
}

/** Given a camera lat/lng and optional road name, infer the orientation (bearing
 *  in degrees) from the closest road segment's geometry. Returns undefined if
 *  no road geometry is available nearby. */
function inferCameraDirection(lat: number, lng: number, roadName?: string): number | undefined {
  // Find the closest road segment
  const candidates = roadName
    ? MOCK_ROAD_SEGMENTS.filter((rs) => rs.name.toLowerCase().includes(roadName.toLowerCase()))
    : MOCK_ROAD_SEGMENTS;
  let bestDist = Infinity;
  let bestBearing: number | undefined;
  for (const rs of candidates) {
    const geom = rs.geometry;
    for (let i = 0; i < geom.length - 1; i++) {
      const [x1, y1] = geom[i];
      const [x2, y2] = geom[i + 1];
      // Closest point on segment to camera
      const dx = x2 - x1;
      const dy = y2 - y1;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) continue;
      let t = ((lng - x1) * dx + (lat - y1) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
      const px = x1 + t * dx;
      const py = y1 + t * dy;
      const dist = (lng - px) ** 2 + (lat - py) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        // Compute segment bearing (direction of travel along road)
        const bearing = (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360;
        bestBearing = bearing;
      }
    }
  }
  // Only return if within ~200m of a road (0.002° ≈ 220m at Dallas latitude)
  if (bestDist < 0.000004 && bestBearing !== undefined) {
    return Math.round(bestBearing);
  }
  return undefined;
}

// ─── Stream Acquisition ──────────────────────────────────────

// Known public traffic camera URL patterns by jurisdiction/operator
const STREAM_PATTERNS: Array<{
  match: (cam: DiscoveredCamera) => boolean;
  generate: (cam: DiscoveredCamera) => { streamUrl: string; protocol: 'hls' | 'jpeg' | 'mjpeg' | 'synthetic' } | null;
}> = [
  // Direct URL from OSM tags
  {
    match: (cam) => !!(cam.tags?.['camera:url'] || cam.tags?.['surveillance:url'] || cam.tags?.['website']),
    generate: (cam) => {
      const url = cam.tags!['camera:url'] || cam.tags!['surveillance:url'] || cam.tags!['website'];
      if (!url) return null;
      const isHls = url.includes('.m3u8') || url.includes('.smil');
      return { streamUrl: url, protocol: isHls ? 'hls' : 'jpeg' };
    },
  },
  // TxDOT (Texas DOT) — cdn.txdottraffic.org is decommissioned (NXDOMAIN);
  // its.txdot.gov serves base64 API snapshots only. Use the synthetic demo feed.
  {
    match: (cam) => !!(cam.operator?.toLowerCase().includes('txdot') || cam.operator?.toLowerCase().includes('texas dot')),
    generate: (cam) => {
      const road = (cam.roadName || 'highway').replace(/[^a-zA-Z0-9]/g, '_');
      return { streamUrl: `synthetic://${road}_txdot`, protocol: 'synthetic' };
    },
  },
  // NCTCOG — feed host decommissioned; synthetic fallback
  {
    match: (cam) => !!(cam.operator?.toLowerCase().includes('nctcog')),
    generate: (cam) => {
      const road = (cam.roadName || 'highway').replace(/[^a-zA-Z0-9]/g, '_');
      return { streamUrl: `synthetic://${road}_nctcog`, protocol: 'synthetic' };
    },
  },
  // City of Dallas — traffic.dallas.gov decommissioned (NXDOMAIN); synthetic fallback
  {
    match: (cam) => !!(cam.operator?.toLowerCase().includes('dallas') || cam.source === 'osm'),
    generate: (cam) => {
      const road = (cam.roadName || 'intersection').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      return { streamUrl: `synthetic://${road}`, protocol: 'synthetic' };
    },
  },
  // 511 Texas — apps.txdot.gov decommissioned; synthetic fallback
  {
    match: (cam) => !!(cam.operator?.toLowerCase().includes('511') || cam.tags?.source?.toLowerCase().includes('511')),
    generate: (cam) => {
      const road = (cam.roadName || 'highway').toLowerCase().replace(/[^a-z0-9]/g, '');
      return { streamUrl: `synthetic://${road}_tx511`, protocol: 'synthetic' };
    },
  },
  // Florida DOT traffic cameras
  {
    match: (cam) => !!(cam.operator?.toLowerCase().includes('florida') || cam.operator?.toLowerCase().includes('fdot') || cam.name?.toLowerCase().includes('fl511')),
    generate: (cam) => {
      const name = cam.name?.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().slice(0, 30);
      return { streamUrl: `https://fldotwww.blob.core.windows.net/sitefinity/docs-api/read/cf-axsxqu/thmb jpg/${name || 'cam'}.jpg`, protocol: 'jpeg' };
      },
  },
  // Georgia DOT traffic cameras
  {
    match: (cam) => !!(cam.operator?.toLowerCase().includes('georgia') || cam.operator?.toLowerCase().includes('gdot') || cam.name?.toLowerCase().includes('511ga')),
    generate: (cam) => {
      const name = cam.name?.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().slice(0, 30);
      return { streamUrl: `https://511ga.com/cams/${name || 'cam'}.jpg`, protocol: 'jpeg' };
    },
  },
  // Generic pattern: try OSM's \"image\" tag, camera:type MJPEG, or construct from road name
  {
    match: () => true,
    generate: (cam) => {
      // OSM camera:type = mjpeg → direct MJPEG stream
      if (cam.tags?.['camera:type']?.toLowerCase() === 'mjpeg' && cam.tags?.image) {
        return { streamUrl: cam.tags.image, protocol: 'mjpeg' };
      }
      if (cam.tags?.image) return { streamUrl: cam.tags.image, protocol: 'jpeg' };
      // Check if any known OSM tag contains a .mjpg URL
      const urlTag = cam.tags?.['camera:url'] || cam.tags?.['surveillance:url'] || cam.tags?.['website'] || '';
      if (urlTag.includes('.mjpg') || urlTag.includes('/mjpeg')) {
        return { streamUrl: urlTag, protocol: 'mjpeg' };
      }
      // Ring doorbell cameras — private feeds requiring OAuth, no public snapshot URL
      if (cam.brand === 'ring' || cam.operator?.toLowerCase() === 'ring') {
        return null; // No public stream; requires authenticated Ring API
      }
      // CCTV — no public stream URL unless explicitly tagged
      if (cam.brand === 'cctv') {
        return null;
      }
      // Last-resort: no public source known — route to the synthetic demo feed
      // (placeholder hosts like traffic.example.com never resolve).
      const name = cam.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().slice(0, 30);
      return { streamUrl: `synthetic://${name}`, protocol: 'synthetic' };
    },
  },
];

/** Try to acquire a stream URL for a discovered camera by checking OSM tags
 *  and known public DOT/municipal URL patterns. */
function acquireStreamUrl(cam: DiscoveredCamera): { streamUrl: string; protocol: 'hls' | 'jpeg' | 'mjpeg' | 'synthetic' } | null {
  if (cam.streamUrl) {
    const p = cam.protocol === 'hls' ? 'hls' : cam.protocol === 'mjpeg' ? 'mjpeg' : cam.protocol === 'synthetic' ? 'synthetic' : 'jpeg';
    return { streamUrl: cam.streamUrl, protocol: p };
  }
  for (const pattern of STREAM_PATTERNS) {
    if (pattern.match(cam)) {
      const result = pattern.generate(cam);
      if (result) return result;
    }
  }
  return null;
}

// ─── Step 1: Geocode input to lat/lng ──────────────────────

async function resolveLocation(input: string | { lat: number; lng: number }): Promise<{ lat: number; lng: number }> {
  if (typeof input !== 'string') return input;
  // Try free Nominatim geocoding
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'QuietFlow/2.3' } });
    const data = await res.json();
    if (data?.[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {}
  return { lat: 32.795, lng: -96.796 }; // fallback to Dallas center
}

// ─── Step 2: Query OSM Overpass API ─────────────────────────

interface OverpassNode {
  type: string;
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

const OSM_CACHE = new Map<string, DiscoveredCamera[]>();

async function queryOverpass(centerLat: number, centerLng: number, radiusMeters: number): Promise<DiscoveredCamera[]> {
  const cacheKey = `osm:${centerLat.toFixed(3)}:${centerLng.toFixed(3)}:${radiusMeters}`;
  if (OSM_CACHE.has(cacheKey)) return OSM_CACHE.get(cacheKey)!;

  const query = `[out:json];
(
  node["highway"="camera"](around:${radiusMeters},${centerLat},${centerLng});
  node["man_made"="surveillance"](around:${radiusMeters},${centerLat},${centerLng});
  node["camera:type"](around:${radiusMeters},${centerLat},${centerLng});
  node["surveillance"="traffic"](around:${radiusMeters},${centerLat},${centerLng});
  node["surveillance"="public"](around:${radiusMeters},${centerLat},${centerLng});
  // Ring doorbells & doorbell cameras (camera:mount=doorbell, brand=Ring)
  node["camera:mount"="doorbell"](around:${radiusMeters},${centerLat},${centerLng});
  node["brand"="Ring"](around:${radiusMeters},${centerLat},${centerLng});
  node["surveillance:type"="doorbell"](around:${radiusMeters},${centerLat},${centerLng});
  // CCTV on buildings (surveillance:type=cctv, surveillance=cctv, man_made=cctv)
  node["surveillance:type"="cctv"](around:${radiusMeters},${centerLat},${centerLng});
  node["surveillance"="cctv"](around:${radiusMeters},${centerLat},${centerLng});
  node["man_made"="cctv"](around:${radiusMeters},${centerLat},${centerLng});
  way["highway"="camera"](around:${radiusMeters},${centerLat},${centerLng});
);
out body;`;

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    const results: DiscoveredCamera[] = (data.elements || [])
      .filter((n: OverpassNode) => n.type === 'node' && n.lat && n.lon)
      .map((n: OverpassNode) => {
        const tags = n.tags || {};
        const direction = tags['camera:direction'] ? parseInt(tags['camera:direction'], 10) : undefined;
        const directionSource = direction !== undefined ? 'real' as const : undefined;
        const camera_bearing = direction;
        const roadName = tags.highway || tags.road || tags.road_name || tags.name?.split('@')[1]?.trim();
        // Determine source type from OSM tags: ring, doorbell, cctv, or default osm
        const isRing = tags['brand']?.toLowerCase() === 'ring' ||
          tags['brand']?.toLowerCase()?.includes('ring') ||
          tags['manufacturer']?.toLowerCase() === 'ring' ||
          (tags['surveillance:type']?.toLowerCase() === 'doorbell' && tags['camera:mount'] === 'doorbell');
        const isDoorbell = tags['camera:mount'] === 'doorbell' || tags['surveillance:type'] === 'doorbell';
        const isCctv = tags['surveillance:type'] === 'cctv' ||
          tags['surveillance'] === 'cctv' ||
          tags['man_made'] === 'cctv';
        // Source: ring → 'ring', doorbell → 'doorbell', cctv → 'cctv', otherwise 'osm'
        let source: CameraSource = 'osm';
        if (isRing) source = 'ring';
        else if (isCctv) source = 'cctv';
        else if (isDoorbell) source = 'doorbell';
        // Determine brand for routing display
        let brand: CameraBrand = 'other';
        if (isRing) brand = 'ring';
        else if (isCctv) brand = 'cctv';
        // Confidence: public feeds (surveillance=public or camera:url set) get higher confidence
        const hasPublicAccess = tags['surveillance'] === 'public' || !!tags['camera:url'] || !!tags['surveillance:url'] || !!tags['open'];
        const baseConfidence = direction !== undefined ? 0.7 : (hasPublicAccess ? 0.6 : 0.4);
        return {
          id: `osm-${n.id}`,
          name: tags.name || tags.operator ||
            (isRing ? 'Ring Doorbell' : isCctv ? 'CCTV Camera' : isDoorbell ? 'Doorbell Camera' : `Camera at ${tags.highway || 'unknown road'}`),
          lat: n.lat,
          lng: n.lon,
          camera_bearing,
          roadName,
          direction,
          directionSource,
          operator: tags.operator || (isRing ? 'Ring' : isCctv ? 'CCTV' : undefined),
          source,
          sourceUrl: `https://www.openstreetmap.org/node/${n.id}`,
          confidence: baseConfidence,
          tags,
          brand,
        };
      });
    OSM_CACHE.set(cacheKey, results);
    return results;
  } catch {
    return [];
  }
}

// ─── Step 3: Query TomTom Traffic API for incident data ────

async function queryTomTom(centerLat: number, centerLng: number, radiusKm: number, tomTomKey: string): Promise<DiscoveredCamera[]> {
  // TomTom Traffic Incidents API — returns incident locations that may have cameras
  const bbox = `${centerLat - radiusKm * 0.009},${centerLng - radiusKm * 0.009},${centerLat + radiusKm * 0.009},${centerLng + radiusKm * 0.009}`;
  try {
    const res = await fetch(
      `https://api.tomtom.com/traffic/services/4/incidentDetails/s/${bbox}.json?key=${tomTomKey}&fields={incidents{type,geometry{type,coordinates},properties{iconCategory,description,from,to,length,delay,roadNumbers,startTime,endTime}}}`,
      { signal: AbortSignal.timeout(10000) },
    );
    const data = await res.json();
    return (data.incidents || []).map((inc: any, i: number) => {
      const coords = inc.geometry?.coordinates?.[0]?.[0] || inc.geometry?.coordinates || [];
      const lat = coords[1] || centerLat;
      const lng = coords[0] || centerLng;
      return {
        id: `tomtom-incident-${i}-${Date.now()}`,
        name: inc.properties?.description || `Traffic incident on ${inc.properties?.roadNumbers?.join(', ') || 'unknown road'}`,
        lat, lng,
        roadName: inc.properties?.roadNumbers?.join(', '),
        operator: 'TomTom Traffic',
        source: 'all' as CameraSource,
        sourceUrl: '',
        confidence: 0.3,
        tags: { type: 'incident', iconCategory: String(inc.properties?.iconCategory || '') },
      } as DiscoveredCamera;
    });
  } catch {
    return [];
  }
}

// ─── Step 3b: Query 511 APIs (state-level traffic camera feeds) ──

const FIFTYONE_API_PATTERNS: Record<string, string> = {
  tx: 'https://txapps.texas.gov/tx511/DotApi/Dot_API/api/CameraInfo/',
  fl: 'https://services.fl511.com/api/v1/cameras',
  ga: 'https://511ga.com/api/cameras',
  ny: 'https://webservice.txnypdb2.com/511/ny/cameras',
  ca: 'https://dot.ca.gov/api/cameras',
};

async function query511API(state: string, centerLat: number, centerLng: number, radiusKm: number): Promise<DiscoveredCamera[]> {
  const baseUrl = FIFTYONE_API_PATTERNS[state.toLowerCase()];
  if (!baseUrl) return [];
  try {
    const res = await fetch(`${baseUrl}?lat=${centerLat}&lng=${centerLng}&radius=${radiusKm}&format=json`, { signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    return (data.cameras || []).map((c: any) => ({
      id: `511-${state}-${c.id}`,
      name: c.name || `511 ${state.toUpperCase()} Camera`,
      lat: c.latitude || c.lat,
      lng: c.longitude || c.lon,
      roadName: c.road_name || c.highway || c.location || '',
      operator: `${state.toUpperCase()} DOT`,
      source: '511_' + state as CameraSource,
      sourceUrl: c.url || c.detail_url || '',
      confidence: 0.8,
      tags: { ...c.tags, source: '511' },
      streamUrl: c.image_url || c.thumbnail_url || c.snapshot_url,
      protocol: (c.stream_type || 'jpeg') as 'hls' | 'jpeg' | 'mjpeg',
    }) as DiscoveredCamera);
  } catch {
    return [];
  }
}

// ─── Step 3c: Query state DOT direct camera feeds ────

const DOT_FEEDS: Record<string, { url: string; state: string }> = {
  fl: { url: 'https://services.fl511.com/api/v1/cameras/json', state: 'Florida' },
  ga: { url: 'https://511ga.com/api/cameras/json', state: 'Georgia' },
  ny: { url: 'https://webservice.txnypdb2.com/511/ny/cameras/json', state: 'New York' },
  ca: { url: 'https://dot.ca.gov/api/cameras/json', state: 'California' },
};

async function queryDOTFeed(state: string, centerLat: number, centerLng: number, radiusKm: number): Promise<DiscoveredCamera[]> {
  const feed = DOT_FEEDS[state.toLowerCase()];
  if (!feed) return [];
  try {
    const res = await fetch(feed.url, { signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    return (data.cameras || []).map((c: any) => {
      const lat = c.latitude || c.lat;
      const lng = c.longitude || c.lon;
      // Filter by radius
      if (haversineKm(centerLat, centerLng, lat, lng) > radiusKm) return null;
      return {
        id: `dot-${state}-${c.id}`,
        name: c.name || `${feed.state} DOT Camera`,
        lat, lng,
        roadName: c.road_name || c.highway || '',
        operator: `${feed.state} DOT`,
        source: (`511_${state}` as CameraSource),
        sourceUrl: c.url || '',
        confidence: 0.9,
        tags: c,
        streamUrl: c.image_url || c.thumbnail || c.stream_url,
        protocol: (c.stream_type || 'jpeg') as 'hls' | 'jpeg' | 'mjpeg',
      } as DiscoveredCamera;
    }).filter(Boolean) as DiscoveredCamera[];
  } catch {
    return [];
  }
}

// ─── Step 3c: Query TxDOT ITS public CCTV camera feeds ────
// TxDOT's Interactive Traffic System exposes a JSON list of CCTV cameras with snapshot URLs.
// Source: https://its.txdot.gov/its/District/DAL/cameras

async function queryTxDOTITS(centerLat: number, centerLng: number, radiusKm: number): Promise<DiscoveredCamera[]> {
  // TxDOT ITS cameras JSON endpoint (Dallas District)
  const endpoints = [
    'https://its.txdot.gov/its/District/DAL/cameras/cameras.json',
    'https://its.txdot.gov/its/District/DAL/cameras/',
  ];
  let data: any = null;
  for (const url of endpoints) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        const text = await res.text();
        // The page may embed JSON in a script tag; try to parse
        const match = text.match(/cameras\s*=\s*(\[[\s\S]*?\]);/);
        if (match) {
          data = JSON.parse(match[1]);
        } else {
          data = JSON.parse(text);
        }
        break;
      }
    } catch {}
  }
  if (!data) return [];
  const camList = data?.cameras || data?.features || data || [];
  return (Array.isArray(camList) ? camList : []).map((c: any) => {
    const lat = c.latitude || c.lat || c.latlng?.[0] || c.geometry?.coordinates?.[1];
    const lng = c.longitude || c.lon || c.latlng?.[1] || c.geometry?.coordinates?.[0];
    if (lat == null || lng == null) return null;
    if (haversineKm(centerLat, centerLng, lat, lng) > radiusKm) return null;
    return {
      id: `txdot-its-${c.id || c.cameraId || `${lat}-${lng}`}`,
      name: c.name || c.description || c.location || 'TxDOT CCTV',
      lat, lng,
      roadName: c.road || c.highway || c.location || 'TxDOT',
      operator: 'TxDOT',
      source: 'cctv' as CameraSource,
      sourceUrl: c.url || `https://its.txdot.gov/its/District/DAL/cameras`,
      confidence: 0.9,
      tags: { ...c, source: 'txdot-its' },
      streamUrl: c.image_url || c.snapshot || c.thumbnail || c.image || `https://its.txdot.gov/its/District/DAL/cameras/snapshot/${c.id}.jpg`,
      protocol: (c.stream_type || c.protocol || 'jpeg') as 'hls' | 'jpeg' | 'mjpeg',
      brand: 'cctv',
      refresh_interval: 3,
    } as DiscoveredCamera;
  }).filter(Boolean) as DiscoveredCamera[];
}

// ─── Step 3d: Query Ring cameras (requires user OAuth token) ──
// Ring cameras are private devices. The Ring API (reverse-engineered via
// jimhigson/ring-api) can enumerate devices and provide HLS live-stream URLs
// when the user authenticates with their Ring account. This function accepts
// an optional Ring API session token — without it, the call returns an empty
// array and the UI shows placeholder entries discovered via OSM instead.

export interface RingAuth {
  refreshToken: string;  // Ring OAuth refresh token
  apiKey?: string;       // optional Ring API key
}

/** Query Ring devices near a location using the Ring API.
 *  Requires a valid Ring OAuth refresh token. Returns cameras with HLS stream URLs
 *  that can be played via the LiveCameraView component (using hls.js or the Ring
 *  SIP endpoint). Without a token, returns empty — Ring feeds are never publicly accessible. */
async function queryRingCameras(
  centerLat: number, centerLng: number, radiusKm: number,
  auth?: RingAuth,
): Promise<DiscoveredCamera[]> {
  if (!auth?.refreshToken) return [];

  // Ring OAuth: exchange refresh token for an access token
  let accessToken: string | null = null;
  try {
    const res = await fetch('https://oauth.ring.com/integrations/v1/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Ring/9.6.0 (Mac OS X) AppleWebKit/605.1.15' },
      body: JSON.stringify({
        client_id: auth.apiKey || 'o4 Bold',
        client_secret: auth.apiKey || 'o4 Bold',
        grant_type: 'refresh_token',
        refresh_token: auth.refreshToken,
      }),
      signal: AbortSignal.timeout(10000),
    });
    const tokenData = await res.json();
    accessToken = tokenData.access_token;
  } catch {}

  if (!accessToken) {
    // No valid token — we cannot access Ring devices. Return empty.
    // OSM-discovered Ring doorbells will still appear via queryOverpass.
    return [];
  }

  // Enumerate Ring devices via the devices endpoint
  let devices: any[] = [];
  try {
    const res = await fetch('https://api.ring.com/devices/v1/devices', {
      headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'Ring/9.6.0 (Mac OS X) AppleWebKit/605.1.15' },
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    devices = [...(data.doorbots || []), ...(data.stickups || []), ...(data.floodlights || [])];
  } catch {}

  // Filter Ring devices by proximity to center point
  const results: DiscoveredCamera[] = [];
  for (const dev of devices) {
    const lat = dev.lat || dev.latitude?.[0];
    const lng = dev.lng || dev.longitude?.[0];
    if (lat == null || lng == null) continue;
    if (haversineKm(centerLat, centerLng, lat, lng) > radiusKm) continue;

    // Request HLS live-stream URL for this device
    let streamUrl: string | undefined;
    try {
      const streamRes = await fetch(`https://api.ring.com/devices/v1/devices/${dev.id}/live-stream/turnCredentials`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(5000),
      });
      const streamData = await streamRes.json();
      streamUrl = streamData?.sip;
      // The SIP/HLS URL is delivered; hls.js can play the HLS portion
      // The actual HLS path is constructed by the Ring client after the SIP handshake
      if (!streamUrl) {
        // Fallback: Ring devices expose a thumbnail snapshot
        streamUrl = `https://api.ring.com/devices/v1/devices/${dev.id}/latest_image`;
      }
    } catch {}

    results.push({
      id: `ring-${dev.id}`,
      name: dev.name || `Ring ${dev.kind || 'Camera'}`,
      lat, lng,
      roadName: dev.address || '',
      orientation: 'S', // doorbells face the street typically
      operator: 'Ring',
      source: 'ring',
      sourceUrl: `https://ring.com/devices/${dev.id}`,
      confidence: 0.8,
      tags: { ...dev, source: 'ring-api' },
      streamUrl,
      protocol: streamUrl?.includes('.m3u8') || streamUrl?.includes('live-stream') ? 'hls' : 'jpeg',
      brand: 'ring',
      model: dev.kind || dev.model || 'Ring Video Doorbell',
      refresh_interval: streamUrl?.includes('.jpg') ? 5 : 6,
      streamVerified: !!streamUrl,
      isPublic: false, // Ring feeds are private — require user auth
    } as DiscoveredCamera);
  }
  return results;
}

export interface ScannerIncident {
  id: string;
  type: 'police' | 'fire' | 'ems';
  category: string;
  title: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'emergency';
  lat: number;
  lng: number;
  timestamp: string;
  source: string;
  verified: boolean;
  details?: Record<string, unknown>;
}

export async function queryScannerIncidents(
  centerLat: number, centerLng: number, radiusKm: number, county: string = 'dallas', state: string = 'tx',
): Promise<ScannerIncident[]> {
  // Use Open511, local incident APIs, and RSS feeds
  const incidents: ScannerIncident[] = [];

  // 1. Open511 format incident APIs (state-level)
  const open511Urls: Record<string, string> = {
    tx: 'https://transportation.openstreetmap.org/us/tx/events.json',
    default: 'https://api.open511.org/v1/incidents',
  };

  try {
    const url = open511Urls[state.toLowerCase()] || open511Urls.default;
    const res = await fetch(`${url}?lat=${centerLat}&lon=${centerLng}&radius=${radiusKm * 1000}`, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    const items = data.incidents || data.events || [];
    for (const item of items) {
      const lat = parseFloat(item.geography?.coordinates?.[1] || item.lat);
      const lng = parseFloat(item.geography?.coordinates?.[0] || item.lon);
      if (isNaN(lat) || isNaN(lng)) continue;
      if (haversineKm(centerLat, centerLng, lat, lng) > radiusKm) continue;
      incidents.push({
        id: `open511-${item.id || Math.random().toString(36).slice(2, 8)}`,
        type: (item.category?.toLowerCase().includes('fire') ? 'fire' : item.category?.toLowerCase().includes('ems') || item.category?.toLowerCase().includes('medical') ? 'ems' : 'police') as 'police' | 'fire' | 'ems',
        category: item.category || 'incident',
        title: item.title || item.description || 'Incident reported',
        description: item.description || '',
        priority: item.priority === 'high' || item.priority === 'critical' ? 'high' : item.priority === 'low' ? 'low' : 'normal',
        lat, lng,
        timestamp: item.start_date || new Date().toISOString(),
        source: 'open511',
        verified: true,
        details: { ...item },
      });
    }
  } catch {}

  // 2. RSS-based scanner feeds (common for county-level police/fire)
  const rssFeeds: Record<string, string[]> = {
    dallas: [
      'https://www.dallaspolice.net/incidents/rss',
      'https://www.dallasfire.org/incidents/rss',
    ],
    default: [],
  };

  const feeds = rssFeeds[county.toLowerCase()] || rssFeeds.default;
  for (const feedUrl of feeds) {
    try {
      const res = await fetch(feedUrl, { signal: AbortSignal.timeout(8000) });
      const text = await res.text();
      // Parse RSS/XML
      const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/g;
      let match;
      while ((match = itemRegex.exec(text)) !== null) {
        const itemText = match[1];
        const titleMatch = itemText.match(/<title[^>]*>([^<]*)<\/title>/);
        const descMatch = itemText.match(/<description[^>]*>([^<]*)<\/description>/);
        const linkMatch = itemText.match(/<link[^>]*>([^<]*)<\/link>/);
        const pubDateMatch = itemText.match(/<pubDate[^>]*>([^<]*)<\/pubDate>/);
        const title = titleMatch ? titleMatch[1] : '';
        const description = descMatch ? descMatch[1] : '';
        const pubDate = pubDateMatch ? pubDateMatch[1] : new Date().toISOString();

        // Try to extract coordinates from description (common format: [lat,long])
        const coordMatch = description.match(/\[(-?\d+\.\d+),(-?\d+\.\d+)\]/);
        if (coordMatch) {
          const lat = parseFloat(coordMatch[1]);
          const lng = parseFloat(coordMatch[2]);
          if (isNaN(lat) || isNaN(lng)) continue;
          if (haversineKm(centerLat, centerLng, lat, lng) > radiusKm) continue;
          const isFire = title.toLowerCase().includes('fire') || title.toLowerCase().includes('ems');
          incidents.push({
            id: `rss-${Math.random().toString(36).slice(2, 10)}`,
            type: isFire ? 'fire' : 'police',
            category: isFire ? 'fire/ems' : 'police',
            title: title.replace('\[[^\]]*\]\s*/g', '').trim(),
            description: description.replace('\[[^\]]*\]\s*/g', '').trim(),
            priority: title.toLowerCase().includes('emergency') || title.toLowerCase().includes('urgent') ? 'high' : 'normal',
            lat, lng,
            timestamp: pubDate,
            source: new URL(feedUrl).hostname,
            verified: true,
            details: { link: linkMatch ? linkMatch[1] : '' },
          });
        }
      }
    } catch {}
  }

  return incidents;
}

/** Detect camera brand from OSM tags, operator name, camera name, and already-set brand. */
function detectCameraBrand(cam: DiscoveredCamera): { brand: CameraBrand; model?: string } {
  // Preserve brand already determined during Overpass mapping (e.g. ring, cctv)
  if (cam.brand === 'ring' || cam.brand === 'cctv') {
    return { brand: cam.brand, model: cam.model || cam.tags?.['model'] || cam.tags?.['camera:model'] || undefined };
  }
  const name = (cam.name || '').toLowerCase();
  const operator = (cam.operator || '').toLowerCase();
  const tags = cam.tags || {};

  // FLOCK detection: explicit FLOCK tags, operator contains "flock", or name contains "flock"
  if (tags['manufacturer']?.toLowerCase().includes('flock') ||
      tags['brand']?.toLowerCase().includes('flock') ||
      operator.includes('flock') ||
      name.includes('flock') ||
      cam.sourceUrl?.toLowerCase().includes('flock')) {
    return { brand: 'flock', model: tags['model'] || tags['camera:model'] || undefined };
  }

  // AXON detection: explicit AXON tags, operator contains "axon", or name contains "axon"
  if (tags['manufacturer']?.toLowerCase().includes('axon') ||
      tags['brand']?.toLowerCase().includes('axon') ||
      operator.includes('axon') ||
      name.includes('axon') ||
      cam.sourceUrl?.toLowerCase().includes('axon')) {
    return { brand: 'axon', model: tags['model'] || tags['camera:model'] || undefined };
  }

  // Check for FLOCK-specific URL patterns in stream URLs
  if (cam.streamUrl?.toLowerCase().includes('flock') || cam.sourceUrl?.toLowerCase().includes('flocksafety')) {
    return { brand: 'flock' };
  }

  // Check for AXON-specific URL patterns
  if (cam.streamUrl?.toLowerCase().includes('axon') || cam.sourceUrl?.toLowerCase().includes('axon')) {
    return { brand: 'axon' };
  }

  return { brand: 'other' };
}

// ─── Route-based camera counter ──────────────────────────────────

export interface RouteCameraCount {
  routeId: string;
  routeName: string;
  totalCameras: number;
  flockCameras: number;
  axonCameras: number;
  otherCameras: number;
  cameras: Array<{ id: string; name: string; brand: CameraBrand; model?: string; lat: number; lng: number }>;
}

/** Count cameras along a route defined by a list of [lat, lng] waypoints.
 *  A camera is "on the route" if it is within a configurable distance (default 0.5 km)
 *  of any segment of the route polyline. */
export function countCamerasOnRoute(
  routeWaypoints: [number, number][],
  cameras: Array<{ lat: number; lng: number; brand?: CameraBrand; model?: string; id: string; name: string }>,
  maxDistanceKm: number = 0.5,
): RouteCameraCount {
  if (routeWaypoints.length < 2) {
    return { routeId: 'unknown', routeName: 'Unknown route', totalCameras: 0, flockCameras: 0, axonCameras: 0, otherCameras: 0, cameras: [] };
  }

  const onRoute: RouteCameraCount['cameras'] = [];

  for (const cam of cameras) {
    // Check distance to each segment of the route
    let minDist = Infinity;
    for (let i = 0; i < routeWaypoints.length - 1; i++) {
      const d = pointToSegmentDistance(cam.lat, cam.lng, routeWaypoints[i][0], routeWaypoints[i][1], routeWaypoints[i + 1][0], routeWaypoints[i + 1][1]);
      if (d < minDist) minDist = d;
    }
    if (minDist <= maxDistanceKm) {
      onRoute.push({ id: cam.id, name: cam.name, brand: cam.brand || 'other', model: cam.model, lat: cam.lat, lng: cam.lng });
    }
  }

  const flockCameras = onRoute.filter((c) => c.brand === 'flock');
  const axonCameras = onRoute.filter((c) => c.brand === 'axon');
  const otherCameras = onRoute.filter((c) => c.brand === 'other');

  return {
    routeId: `route-${routeWaypoints.map((w) => `${w[0].toFixed(3)},${w[1].toFixed(3)}`).join('-')}`,
    routeName: `Route (${routeWaypoints.length} waypoints)`,
    totalCameras: onRoute.length,
    flockCameras: flockCameras.length,
    axonCameras: axonCameras.length,
    otherCameras: otherCameras.length,
    cameras: onRoute,
  };
}

/** Perpendicular distance from a point to a line segment (in km). */
function pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return haversineKm(px, py, x1, y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return haversineKm(px, py, projX, projY);
}

// ─── Main discovery pipeline ────────────────────────────────

export async function discoverCameras(
  input: CameraDiscoveryInput,
  tomTomKey?: string,
  ringAuth?: RingAuth,
): Promise<{
  cameras: DiscoveredCamera[];
  /** Geocoded center of the search */
  resolvedLocation: { lat: number; lng: number; displayName?: string };
  /** Human-readable source description */
  source: string;
  /** Input parameters echoed back */
  query: {
    location: string | { lat: number; lng: number };
    direction?: string;
    radiusMiles: number;
    source: CameraSource;
  };
  /** Pipeline execution metadata */
  meta: {
    timestamp: string;
    elapsedMs: number;
    totalRawResults: number;
    afterSourceFilter: number;
    afterDirectionFilter: number;
    afterDedup: number;
  };
  /** Per-source breakdown */
  sources: Record<string, number>;
  /** Direction matching summary */
  directional: {
    enabled: boolean;
    toward: number;
    away: number;
    unknownDirection: number;
  };
  /** Stream acquisition summary */
  streams: {
    acquired: number;
    verified: number;
    unverified: number;
    byProtocol: { hls: number; image: number; mjpeg: number };
  };
}> {
  const radiusMeters = (input.radiusMiles ?? 2) / 0.000621371;
  const radiusKm = (input.radiusMiles ?? 2) * 1.609;
  const startTime = Date.now();

  // Step 1: Resolve location
  const locRaw = await resolveLocation(input.location);
  // Try to get a display name
  let displayName: string | undefined;
  if (typeof input.location === 'string') {
    const geo = await geocodeAddress(input.location);
    if (geo) displayName = geo.displayName;
  }
  const loc = { ...locRaw, displayName };
  const totalRawResults: number[] = [];

  // Step 2: Query multiple sources in parallel
  const sourceNames: string[] = ['osm'];
  const sources: Promise<DiscoveredCamera[]>[] = [
    queryOverpass(loc.lat, loc.lng, radiusMeters).then((r) => { totalRawResults.push(r.length); return r; }),
  ];

  if (tomTomKey) {
    sources.push(queryTomTom(loc.lat, loc.lng, radiusKm, tomTomKey).then((r) => { totalRawResults.push(r.length); return r; }));
    sourceNames.push('tomtom');
  }

  // 511 API for Texas (auto-detect from location)
  const isTexas = loc.lat < 36.5 && loc.lat > 25.5 && loc.lng > -106 && loc.lng < -93;
  if (isTexas) {
    sourceNames.push('511_tx', 'cctv');
    sources.push(
      query511API('tx', loc.lat, loc.lng, radiusKm).then((r) => { totalRawResults.push(r.length); return r; }),
      queryDOTFeed('tx', loc.lat, loc.lng, radiusKm).then((r) => { totalRawResults.push(r.length); return r; }),
      queryTxDOTITS(loc.lat, loc.lng, radiusKm).then((r) => { totalRawResults.push(r.length); return r; }),
    );
  }

  // Ring cameras — requires user OAuth token (private feeds)
  if (ringAuth?.refreshToken) {
    sourceNames.push('ring');
    sources.push(
      queryRingCameras(loc.lat, loc.lng, radiusKm, ringAuth).then((r) => { totalRawResults.push(r.length); return r; }),
    );
  }

  const results = (await Promise.all(sources)).flat();

  // Step 3: Apply source filter
  const filtered = input.source === 'all' ? results : results.filter((c) => c.source === input.source);

  // Step 4: Apply directional matching — HARD FILTER: include only if camera
  // faces TOWARD the target within ±45° tolerance. If NO cameras face toward
  // the target, fall back to including away-facing cameras (lower confidence).
  let directionalMatch = false;
  let towardCount = 0, awayCount = 0, unknownCount = 0;
  if (input.direction !== undefined) {
    directionalMatch = true;
    const targetBearing = typeof input.direction === 'number' ? input.direction : cardinalToBearing(input.direction);
    const facingToward: DiscoveredCamera[] = [];
    const facingAway: DiscoveredCamera[] = [];
    const noDirection: DiscoveredCamera[] = [];
    for (const cam of filtered) {
      const bearingToTarget = bearingFrom(cam.lat, cam.lng, loc.lat, loc.lng);
      cam.target_bearing = Math.round(bearingToTarget);
      let dir = cam.direction;
      let dirSrc = cam.directionSource;
      if (dir === undefined || dir === null) {
        const inferred = inferCameraDirection(cam.lat, cam.lng, cam.roadName);
        if (inferred !== undefined) { dir = inferred; dirSrc = 'inferred'; }
      }
      if (dir !== undefined && dir !== null) {
        cam.direction = dir;
        cam.camera_bearing = dir;
        cam.directionSource = dirSrc || 'real';
        const diff = Math.abs(dir - bearingToTarget);
        const normalized = Math.min(diff, 360 - diff);
        if (normalized <= 45) {
          cam.confidence = Math.round((1 - normalized / 45) * 100) / 100;
          cam.alignment_score = Math.round((1 - normalized / 45) * 100);
          facingToward.push(cam);
        } else {
          cam.confidence = Math.round((1 - Math.min(normalized, 360 - normalized) / 180) * 100) / 100 * 0.5;
          cam.alignment_score = Math.round((1 - normalized / 180) * 50);
          facingAway.push(cam);
        }
      } else {
        cam.directionSource = 'unknown';
        cam.confidence = 0.35;
        cam.alignment_score = 0;
        noDirection.push(cam);
      }
    }
    towardCount = facingToward.length;
    awayCount = facingAway.length;
    unknownCount = noDirection.length;
    const final = facingToward.length > 0 ? facingToward : [...facingAway, ...noDirection];
    filtered.length = 0;
    filtered.push(...final);
  }

  // Step 5: Acquire stream URLs for all remaining cameras
  await Promise.all(filtered.map(async (cam) => {
    const stream = acquireStreamUrl(cam);
    if (!stream) return;
    cam.streamUrl = stream.streamUrl;
    cam.protocol = stream.protocol;
    cam.stream_url = stream.streamUrl;
    cam.stream_type = stream.protocol === 'jpeg' ? 'image' : (stream.protocol === 'mjpeg' ? 'mjpeg' : 'hls');
    cam.refresh_interval = stream.protocol === 'hls' ? 6 : stream.protocol === 'mjpeg' ? 0 : 3;
    // Attempt HLS playlist fetch to verify the stream
    if (stream.protocol === 'hls') {
      try {
        const resp = await fetch(stream.streamUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
        cam.streamVerified = resp.ok;
        // If HEAD fails, try GET for first few bytes
        if (!resp.ok) {
          const getResp = await fetch(stream.streamUrl, { signal: AbortSignal.timeout(5000) });
          cam.streamVerified = getResp.ok;
        }
      } catch {
        cam.streamVerified = false;
      }
    } else {
      // For JPEG/MJPEG, mark as unverified (CORS often blocks single-frame fetch)
      cam.streamVerified = false;
    }
  }));

  // Step 6: Sort by confidence (descending) and deduplicate by proximity
  const deduped = filtered.sort((a, b) => b.confidence - a.confidence);
  const unique: DiscoveredCamera[] = [];
  for (const cam of deduped) {
    if (!unique.some((u) => haversineKm(u.lat, u.lng, cam.lat, cam.lng) < 0.03)) {
      const brandInfo = detectCameraBrand(cam);
      unique.push({ ...cam, brand: brandInfo.brand, model: brandInfo.model });
    }
  }

  // Compute structured output stats
  const streamAcquired = unique.filter((c) => c.streamUrl).length;
  const streamVerified = unique.filter((c) => c.streamVerified).length;
  const byProto = { hls: 0, image: 0, mjpeg: 0 };
  for (const c of unique) {
    if (c.protocol === 'hls') byProto.hls++;
    else if (c.protocol === 'mjpeg') byProto.mjpeg++;
    else if (c.protocol === 'jpeg') byProto.image++;
  }
  const perSource: Record<string, number> = {};
  for (const c of unique) {
    perSource[c.source] = (perSource[c.source] || 0) + 1;
  }

  return {
    cameras: unique,
    resolvedLocation: loc,
    source: sourceNames.join(' + '),
    query: {
      location: input.location,
      direction: input.direction !== undefined
        ? (typeof input.direction === 'number' ? `${input.direction}°` : input.direction)
        : undefined,
      radiusMiles: input.radiusMiles ?? 2,
      source: input.source,
    },
    meta: {
      timestamp: new Date(startTime).toISOString(),
      elapsedMs: Date.now() - startTime,
      totalRawResults: totalRawResults.reduce((a, b) => a + b, 0),
      afterSourceFilter: input.source === 'all' ? results.length : filtered.length,
      afterDirectionFilter: filtered.length,
      afterDedup: unique.length,
    },
    sources: perSource,
    directional: {
      enabled: directionalMatch,
      toward: towardCount,
      away: awayCount,
      unknownDirection: unknownCount,
    },
    streams: {
      acquired: streamAcquired,
      verified: streamVerified,
      unverified: streamAcquired - streamVerified,
      byProtocol: byProto,
    },
  };
}

// ─── Address validation ─────────────────────────────────────

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number; displayName: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'QuietFlow/2.3' } });
    const data = await res.json();
    if (data?.[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), displayName: data[0].display_name };
  } catch {}
  return null;
}
