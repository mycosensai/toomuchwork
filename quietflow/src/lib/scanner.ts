// ─── Police / Fire Scanner Module ────────────────────────────────
// Integrates county-level police/fire scanner incident feeds.
// Sources: Open511, RSS feeds, local incident APIs, broadcastify-style feeds.

import { haversineKm } from './camera-discovery';

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

export interface ScannerConfig {
  county: string;
  state: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  incidentTypes: Array<'police' | 'fire' | 'ems'>;
  priorities: Array<'low' | 'normal' | 'high' | 'emergency'>;
}

// ─── County-level RSS/Atom feeds ─────────────────────────────

// Common scanner RSS feed patterns by state/county
const COUNTY_FEEDS: Record<string, string[]> = {
  // Texas — Dallas County
  'dallas-tx': [
    'https://www.dallaspolice.net/incidents/rss',
    'https://www.dallasfire.org/incidents/rss',
    'https://www.dallascounty.org/emergency_management/incidents.xml',
  ],
  // Texas — Tarrant County
  'tarrant-tx': [
    'https://www.fortworth.gov/police/incidents/rss',
    'https://www.tarrantcounty.com/emergency/rss',
  ],
  // Texas — Travis County
  'travis-tx': [
    'https://www.austintexas.gov/rss/austinpoliceincidents',
    'https://www.traviscountytx.gov/after-disaster/incidents.xml',
  ],
  // Florida — Miami-Dade
  'miami-dade-fl': [
    'https://www.miamidade.gov/police/rss',
    'https://www.miamidade.gov/fire/rss',
  ],
  // New York — Nassau County
  'nassau-ny': [
    'https://www.nassaucountyny.gov/197/Police-Department',
  ],
  // California — Los Angeles County
  'los-angeles-ca': [
    'https://www.lapdon.org/rss/incidents',
    'https://www.lafd.org/alerts/rss',
  ],
  // Default: open511 state feed
  default: [],
};

// Open511 endpoints by state
const OPEN511_ENDPOINTS: Record<string, string> = {
  tx: 'https://api.open511.org/v1/incidents',
  fl: 'https://services.fl511.com/api/v1/incidents',
  ga: 'https://511ga.com/api/incidents',
  ny: 'https://511ny.org/api/incidents',
  ca: 'https://dot.ca.gov/api/incidents',
  default: 'https://api.open511.org/v1/incidents',
};

// Broadcastify-style scanner feed endpoints (for major metro areas)
const SCANNER_FEEDS: Record<string, string[]> = {
  'dallas-tx': [
    'https://api.broadcastify.com/apis/jsonfeeds/feedlist.json',
  ],
  'default': [],
};

// ─── Core scanner query function ───────────────────────────

export async function queryScannerIncidents(
  config: ScannerConfig,
): Promise<ScannerIncident[]> {
  const incidents: ScannerIncident[] = [];
  const countyKey = `${config.county}-${config.state}`.toLowerCase();

  // 1. Open511 API (state-level traffic/incident data)
  const open511Url = OPEN511_ENDPOINTS[config.state.toLowerCase()] || OPEN511_ENDPOINTS.default;
  try {
    const res = await fetch(
      `${open511Url}?lat=${config.centerLat}&lon=${config.centerLng}&radius=${Math.round(config.radiusKm * 1000)}`,
      { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'QuietFlow/2.4' } },
    );
    const data = await res.json();
    const items = data.incidents || data.events || data.features || [];
    for (const item of items) {
      const lat = parseFloat(item.geography?.coordinates?.[1] || item.lat || item.latitude || 0);
      const lng = parseFloat(item.geography?.coordinates?.[0] || item.lon || item.longitude || 0);
      if (isNaN(lat) || isNaN(lng)) continue;
      if (haversineKm(config.centerLat, config.centerLng, lat, lng) > config.radiusKm) continue;

      // Categorize
      const title = item.title || item.description || '';
      const desc = item.description || '';
      const lower = (title + ' ' + desc).toLowerCase();
      let type: 'police' | 'fire' | 'ems';
      let category = item.category || 'incident';

      if (lower.includes('fire') || lower.includes('burn') || lower.includes('wildfire') || lower.includes('structure fire')) {
        type = 'fire';
        category = 'fire';
      } else if (lower.includes('medical') || lower.includes('ems') || lower.includes('ambulance') || lower.includes('injury')) {
        type = 'ems';
        category = 'ems';
      } else {
        type = 'police';
        category = 'police';
      }

      // Priority mapping
      let priority: 'low' | 'normal' | 'high' | 'emergency' = 'normal';
      if (lower.includes('emergency') || lower.includes('critical') || lower.includes('hazard')) {
        priority = 'emergency';
      } else if (lower.includes('accident') || lower.includes('crash') || lower.includes('blocked')) {
        priority = 'high';
      } else if (item.priority === 'high' || item.priority === 'critical') {
        priority = 'high';
      } else if (item.priority === 'low') {
        priority = 'low';
      }

      incidents.push({
        id: `open511-${item.id || Math.random().toString(36).slice(2, 10)}`,
        type,
        category,
        title: title.replace(/\[([^\]]*)\]\s*/g, '').trim(),
        description: desc.replace(/\[([^\]]*)\]\s*/g, '').trim(),
        priority,
        lat,
        lng,
        timestamp: item.start_date || item.updated_at || new Date().toISOString(),
        source: 'open511',
        verified: true,
        details: { ...item },
      });
    }
  } catch {}

  // 2. County RSS feeds
  const rssFeeds = COUNTY_FEEDS[countyKey] || COUNTY_FEEDS.default;
  for (const feedUrl of rssFeeds) {
    try {
      const res = await fetch(feedUrl, { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'QuietFlow/2.4' } });
      const text = await res.text();
      // Parse RSS/XML items
      const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/g;
      let match;
      while ((match = itemRegex.exec(text)) !== null) {
        const itemText = match[1];
        const titleMatch = itemText.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>|<title[^>]*>([^<]*)<\/title>/i);
        const descMatch = itemText.match(/<description[^>]*><!\[CDATA\[(.*?)\]\]><\/description>|<description[^>]*>([^<]*)<\/description>/i);
        const linkMatch = itemText.match(/<link[^>]*>([^<]*)<\/link>/i);
        const pubDateMatch = itemText.match(/<pubDate[^>]*>([^<]*)<\/pubDate>/i);

        const title = titleMatch ? (titleMatch[1] || titleMatch[2] || '') : '';
        const description = descMatch ? (descMatch[1] || descMatch[2] || '') : '';
        const link = linkMatch ? linkMatch[1] : '';
        const pubDate = pubDateMatch ? pubDateMatch[1] : new Date().toISOString();

        // Extract coordinates from description (common formats: [lat,long], lat=XX, long=XX)
        let lat: number | null = null;
        let lng: number | null = null;

        // Try [lat, long] format
        const coordMatch = description.match(/\[(-?\d+\.\d+),\s*(-?\d+\.\d+)\]/);
        if (coordMatch) {
          lat = parseFloat(coordMatch[1]);
          lng = parseFloat(coordMatch[2]);
        }
        // Try lat=/long= format
        if (!lat) {
          const latMatch = description.match(/lat(?:itude)?=([-?\d.]+)/i);
          const lngMatch = description.match(/long(?:itude)?=([-?\d.]+)/i);
          if (latMatch && lngMatch) {
            lat = parseFloat(latMatch[1]);
            lng = parseFloat(lngMatch[1]);
          }
        }

        if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) continue;
        if (haversineKm(config.centerLat, config.centerLng, lat, lng) > config.radiusKm) continue;

        const fullText = (title + ' ' + description).toLowerCase();
        let type: 'police' | 'fire' | 'ems' = 'police';
        if (fullText.includes('fire') || fullText.includes('burn')) type = 'fire';
        else if (fullText.includes('medical') || fullText.includes('ems') || fullText.includes('ambulance')) type = 'ems';

        let priority: 'low' | 'normal' | 'high' | 'emergency' = 'normal';
        if (fullText.includes('emergency') || fullText.includes('critical')) priority = 'emergency';
        else if (fullText.includes('accident') || fullText.includes('crash') || fullText.includes('blocked')) priority = 'high';

        // Filter by type/priority preferences
        if (!config.incidentTypes.includes(type)) continue;
        if (!config.priorities.includes(priority)) continue;

        incidents.push({
          id: `rss-${Math.random().toString(36).slice(2, 10)}`,
          type,
          category: type,
          title: title.replace(/\[([^\]]*)\]\s*/g, '').trim(),
          description: description.replace(/\[([^\]]*)\]\s*/g, '').trim(),
          priority,
          lat,
          lng,
          timestamp: pubDate,
          source: new URL(feedUrl).hostname,
          verified: true,
          details: { link },
        });
      }
    } catch {}
  }

  // 3. Police scanner audio feed (broadcastify-style) — metadata only
  const scannerFeeds = SCANNER_FEEDS[countyKey] || SCANNER_FEEDS.default;
  for (const feedUrl of scannerFeeds) {
    try {
      const res = await fetch(feedUrl, { signal: AbortSignal.timeout(8000) });
      const data = await res.json();
      const feeds = data.feeds || [];
      for (const feed of feeds) {
        if (feed.description?.toLowerCase().includes(countyKey.split('-')[0]) ||
            feed.description?.toLowerCase().includes(config.county.toLowerCase())) {
          // Add as an informational scanner feed entry
          incidents.push({
            id: `scanner-${feed.feedid || Math.random().toString(36).slice(2, 8)}`,
            type: 'police',
            category: 'scanner-feed',
            title: `Live Scanner Feed: ${feed.description || 'Police/Fire'}`,
            description: `Online scanner feed with ${feed.listeners || '?'} listeners. Feed ID: ${feed.feedid || 'unknown'}`,
            priority: 'low',
            lat: config.centerLat,
            lng: config.centerLng,
            timestamp: new Date().toISOString(),
            source: 'broadcastify',
            verified: false,
            details: { feedId: feed.feedid, listeners: feed.listeners, url: feed.url },
          });
        }
      }
    } catch {}
  }

  return incidents;
}

// ─── Helper: format incident for display ─────────────────────

export function formatIncidentTime(timestamp: string): string {
  const d = new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function priorityColor(priority: ScannerIncident['priority']): { bg: string; text: string; label: string } {
  switch (priority) {
    case 'emergency': return { bg: 'bg-red-500', text: 'text-white', label: 'EMERGENCY' };
    case 'high': return { bg: 'bg-orange-500', text: 'text-white', label: 'HIGH' };
    case 'normal': return { bg: 'bg-yellow-500', text: 'text-black', label: 'NORMAL' };
    case 'low': return { bg: 'bg-zinc-400', text: 'text-black', label: 'LOW' };
  }
}

export function typeIcon(type: ScannerIncident['type']): string {
  switch (type) {
    case 'fire': return '🚒';
    case 'ems': return '🅰️';
    case 'police': return '👮';
  }
}
