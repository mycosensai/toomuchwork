'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '@/store';
import { Badge } from '@/components/ui/badge';
import { DENSITY_COLORS, MapStyle, DensityLevel, HeatGridCell } from '@/types';
import { CATEGORY_ICONS } from '@/types/geospatial';
import { Navigation } from 'lucide-react';
import { ParkingLotOverlay } from '@/components/map/parking-lot-overlay';
import { ExploreNearby } from '@/components/explore/explore-nearby';
import { haversineKm } from '@/lib/camera-discovery';
import { stateColor } from '@/lib/traffic-engine';
import { downsampleRoute } from '@/lib/route-geometry';
import { buildRouteDirections } from '@/lib/route-directions';

// ─── Base map styles (ALL key-free / anonymous) ─────────────────────
const MAP_STYLES: Record<MapStyle, { tiles: string[]; attribution: string; maxzoom?: number }> = {
  street: {
    tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
    attribution: '© OpenStreetMap contributors',
    maxzoom: 19,
  },
  light: {
    tiles: ['https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png'],
    attribution: '© Stadia Maps, © Stamen Design, © OpenMapTiles, © OpenStreetMap contributors',
    maxzoom: 20,
  },
  satellite: {
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.jpg'],
    attribution: '© Esri, Maxar, Earthstar Geographics and the GIS User Community',
    maxzoom: 20,
  },
  topo: {
    tiles: ['https://tile.opentopomap.org/{z}/{x}/{y}.png'],
    attribution: '© OpenTopoMap (CC-BY-SA), © OpenStreetMap contributors',
    maxzoom: 17,
  },
  voyager: {
    tiles: ['https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg'],
    attribution: '© Stadia Maps, © Stamen Design, © OpenStreetMap contributors',
    maxzoom: 18,
  },
};

function trafficTiles(provider: 'density' | 'tomtom' | 'mapbox', key: string | undefined): { tiles: string[]; attribution: string } | null {
  if (!key || key.trim().length === 0) return null;
  if (provider === 'tomtom') {
    return {
      tiles: [`https://api.tomtom.com/traffic/map/4/tile/{z}/{x}/{y}.png?key=${encodeURIComponent(key.trim())}&t=1`],
      attribution: '© TomTom',
    };
  }
  return null;
}

const HEAT_COLORS: Record<string, string> = {
  green: '#22c55e', yellow: '#eab308', orange: '#f97316', red: '#ef4444', purple: '#a855f7',
};

/** Map a scanner incident priority to a hex color for the map layer. */
function priorityColorHex(priority: string): string {
  switch (priority) {
    case 'emergency': return '#ef4444';
    case 'high': return '#f97316';
    case 'normal': return '#eab308';
    case 'low': return '#a1a1aa';
    default: return '#a855f7';
  }
}

function addRoadsLayer(map: any, visible: boolean) {
  map.addSource('roads', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  map.addLayer({
    id: 'roads-layer',
    type: 'line',
    source: 'roads',
    paint: {
      'line-color': ['get', 'color'],
      'line-width': ['interpolate', ['linear'], ['get', 'weight'], 0, 2, 1, 7],
      'line-opacity': 0.85,
      'line-blur': 0.5,
    },
  });
  map.setLayoutProperty('roads-layer', 'visibility', visible ? 'visible' : 'none');
}

// ─── Category icon symbol set for POI labels ─────────────────────
function addPOILabelsLayer(map: any) {
  // Businesses with names showing at zoom >= 15
  map.addLayer({
    id: 'poi-labels',
    type: 'symbol',
    source: 'businesses',
    minzoom: 14,
    layout: {
      'text-field': ['step', ['zoom'],
        ['get', 'short_name'],
        16, ['concat', ['get', 'short_name'], ' ', ['get', 'category_icon']]
      ],
      'text-size': ['step', ['zoom'], 8, 15, 9, 17, 11],
      'text-offset': [0, -1.8],
      'text-anchor': 'bottom',
      'text-font': ['Open Sans Regular'],
      'text-max-width': 8,
    },
    paint: {
      'text-color': '#374151',
      'text-halo-color': '#ffffff',
      'text-halo-width': 2,
      'text-halo-blur': 1,
      'text-opacity': ['step', ['zoom'], 0, 14, 0, 15, 0.85, 16, 1],
    },
    filter: ['!', ['has', 'point_count']],
  });
  
  // Category dots at lower zoom
  map.addLayer({
    id: 'poi-category-dots',
    type: 'circle',
    source: 'businesses',
    minzoom: 12,
    maxzoom: 15,
    paint: {
      'circle-radius': ['step', ['zoom'], 3, 12, 3, 13, 4, 14, 5],
      'circle-color': ['match', ['get', 'category'],
        'grocery', '#22c55e', 'pharmacy', '#3b82f6', 'coffee', '#a855f7',
        'restaurant', '#f97316', 'fast_food', '#ef4444', 'gas_station', '#eab308',
        'bank', '#6366f1', 'park', '#84cc16', 'retail', '#ec4899',
        '#6b7280'
      ],
      'circle-opacity': 0.8,
      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#ffffff',
    },
    filter: ['!', ['has', 'point_count']],
  });
  
  // Category dots at low zoom (clustered businesses)
  map.addLayer({
    id: 'poi-cluster-dots',
    type: 'circle',
    source: 'businesses',
    minzoom: 8,
    maxzoom: 12,
    paint: {
      'circle-radius': ['step', ['get', 'point_count'], 4, 5, 6, 10, 8, 20, 12],
      'circle-color': '#6b7280',
      'circle-opacity': 0.6,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#ffffff',
    },
    filter: ['has', 'point_count'],
  });
}

/**
 * Compute an intricate multi-layer heat cell: combines camera density,
 * pedestrian/business density, road traffic density, and incident density.
 */
function computeHeatCell(
  lat: number,
  lng: number,
  cameras: any[],
  businesses: any[],
  roadSegments: any[],
  discovered: any[] = [],
  gridStep: number,
): HeatGridCell {
  const radius = gridStep * 3; // ~1km influence radius
  const lv: Record<string, number> = { green: 0.1, yellow: 0.25, orange: 0.45, red: 0.65, purple: 0.9 };

  let cameraScore = 0;
  let camCount = 0;
  for (const c of cameras) {
    if (!c.densityLevel && !c.vehicleCountEst) continue;
    if (Math.abs(c.lat - lat) > radius || Math.abs(c.lng - lng) > radius) continue;
    const d = haversineKm(lat, lng, c.lat, c.lng);
    if (d > radius) continue;
    const proximity = 1 - d / radius;
    const level = c.densityLevel || 'yellow';
    cameraScore += (lv[level] || 0.2) * proximity;
    camCount++;
  }
  // Discovered cameras add to density signal
  for (const dc of discovered) {
    if (Math.abs(dc.lat - lat) > radius || Math.abs(dc.lng - lng) > radius) continue;
    if (haversineKm(lat, lng, dc.lat, dc.lng) > radius) continue;
    cameraScore += 0.35;
    camCount++;
  }
  const cameraDensity = camCount > 0 ? Math.min(1, cameraScore / camCount) : 0.02;

  let pedScore = 0;
  let pedCount = 0;
  for (const b of businesses) {
    if (!b.density?.densityLevel) continue;
    if (Math.abs(b.lat - lat) > radius || Math.abs(b.lng - lng) > radius) continue;
    const d = haversineKm(lat, lng, b.lat, b.lng);
    if (d > radius) continue;
    const proximity = 1 - d / radius;
    const level = b.density.densityLevel || 'green';
    pedScore += (lv[level] || 0.1) * proximity;
    pedCount++;
  }
  const pedestrianDensity = pedCount > 0 ? Math.min(1, pedScore / pedCount) : 0.02;

  let roadScore = 0;
  let roadCount = 0;
  for (const rs of roadSegments || []) {
    if (!rs.currentDensity?.densityLevel) continue;
    // Sample along the road geometry
    for (const [rlng, rlat] of (rs.geometry || [])) {
      if (Math.abs(rlat - lat) > radius || Math.abs(rlng - lng) > radius) continue;
      const d = haversineKm(lat, lng, rlat, rlng);
      if (d > radius) continue;
      const proximity = 1 - d / radius;
      roadScore += (lv[rs.currentDensity.densityLevel] || 0.1) * proximity;
      roadCount++;
      break; // one sample per segment per cell
    }
  }
  const roadDensity = roadCount > 0 ? Math.min(1, roadScore / roadCount) : 0.02;

  // Composite weight (0-1) with roads weighted slightly lower (they don't mean "busy" alone)
  const weight = Math.min(1,
    cameraDensity * 0.35 +
    pedestrianDensity * 0.45 +
    roadDensity * 0.2 +
    0.02, // baseline
  );

  return {
    lat,
    lng,
    weight,
    cameraDensity,
    pedestrianDensity,
    roadDensity,
    incidentDensity: 0,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Build concentric density rings around a selected location, colored by
 * the local business density at each radius (F8).
 */
function buildDensityRings(selected: any, businesses: any[]): any[] {
  if (!selected) return [];
  const rings: any[] = [];
  const radiiKm = [0.5, 1, 1.5, 2, 3];
  const levelScores: Record<string, number> = { green: 0.1, yellow: 0.25, orange: 0.45, red: 0.65, purple: 0.9 };

  for (const r of radiiKm) {
    // Compute avg density of businesses within this radius band (ring)
    let sum = 0, count = 0;
    for (const b of businesses) {
      const d = haversineKm(selected.lat, selected.lng, b.lat, b.lng);
      if (d <= r && d > (r - 0.5)) {
        sum += levelScores[b.density?.densityLevel || 'green'] ?? 0.2;
        count++;
      }
    }
    const density = count ? sum / count : 0.08;
    // Color by density
    const color = density > 0.6 ? '#ef4444' : density > 0.45 ? '#f97316' : density > 0.3 ? '#eab308' : density > 0.18 ? '#84cc16' : '#22c55e';
    // Approximate a circle as a polygon
    const coords: [number, number][] = [];
    const steps = 48;
    const latPerKm = 0.009;
    const lngPerKm = 0.009 / Math.cos(selected.lat * Math.PI / 180);
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      coords.push([
        selected.lng + Math.cos(angle) * r * lngPerKm,
        selected.lat + Math.sin(angle) * r * latPerKm,
      ]);
    }
    rings.push({
      type: 'Feature',
      properties: { color, radiusKm: r, density: Math.round(density * 100) },
      geometry: { type: 'LineString', coordinates: coords },
    });
  }
  return rings;
}

function MapLibreMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const userLocRef = useRef<[number, number] | null>(null);
  const { cameras, businesses, roadSegments, settings, incidents, scannerEnabled, showIncidents, liveTraffic, selectedBusiness } = useStore();
  const mapStyleKey = settings.mapStyle;
  const [styleError, setStyleError] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ id: string; name: string; lng: number; lat: number; kind: 'business' | 'camera' }>>([]);
  const [explorePoint, setExplorePoint] = useState<{ lat: number; lng: number } | null>(null);
  const [showExplore, setShowExplore] = useState(false);

  const locate = () => {
    const map = mapRef.current;
    if (!map || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const ll: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        userLocRef.current = ll;
        useStore.getState().setUserLocation(ll);
        if (map.getSource && map.getSource('userloc')) {
          map.getSource('userloc').setData({
            type: 'FeatureCollection',
            features: [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: ll } }],
          });
        }
        if (mapRef.current) mapRef.current.flyTo({ center: ll, zoom: 14 });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  // Search autocomplete
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) { setResults([]); return; }
    const bq = businesses
      .filter((b) => b.name.toLowerCase().includes(q) || b.category.toLowerCase().includes(q))
      .map((b) => ({ id: b.id, name: b.name, lng: b.lng, lat: b.lat, kind: 'business' as const }));
    const cq = cameras
      .filter((c) => c.name.toLowerCase().includes(q) || c.roadName.toLowerCase().includes(q))
      .map((c) => ({ id: c.id, name: c.name, lng: c.lng, lat: c.lat, kind: 'camera' as const }));
    setResults([...bq, ...cq].slice(0, 6));
  }, [query, businesses, cameras]);

  const flyToPlace = (r: { id: string; name: string; lng: number; lat: number; kind: 'business' | 'camera' }) => {
    const map = mapRef.current;
    if (map) map.flyTo({ center: [r.lng, r.lat], zoom: 15 });
    setQuery(r.name);
    setResults([]);
    if (r.kind === 'business') {
      const biz = useStore.getState().businesses.find((b) => b.id === r.id);
      if (biz) useStore.getState().selectBusiness(biz);
    } else {
      const cam = useStore.getState().cameras.find((c) => c.id === r.id);
      if (cam) useStore.getState().selectCamera(cam);
    }
  };

  const drawRoute = useCallback((to: [number, number], profile: 'walking' | 'driving') => {
    const map = mapRef.current;
    const from = userLocRef.current;
    if (!map || !from) return;
    const store = useStore.getState();
    const prov = store.settings.directionsProvider;
    const key = store.settings.mapboxKey;
    const routeLabel = store.selectedBusiness?.name ?? 'Current destination';
    const url = prov === 'mapbox' && key
      ? `https://api.mapbox.com/directions/v5/mapbox/${profile}/${from[0]},${from[1]};${to[0]},${to[1]}?geometries=geojson&access_token=${encodeURIComponent(key)}`
      : `https://router.project-osrm.org/route/v1/${profile}/${from[0]},${from[1]};${to[0]},${to[1]}?overview=full&geometries=geojson`;
    fetch(url)
      .then((r) => r.json())
      .then((data: unknown) => {
        const coords = (data as { routes?: Array<{ geometry?: { coordinates?: unknown } }> })?.routes?.[0]?.geometry?.coordinates;
        if (!coords || !map.getSource) {
          store.setRouteDirections(null);
          return;
        }
        const src = map.getSource('route');
        if (src) src.setData({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } }] });

        // Publish the real route geometry to the store. Everything route-aware
        // downstream (QuietRoute, the route camera counter, live ETA, en-route
        // incident detection, turn-by-turn guidance) reads routeWaypoints + routeDirections.
        //
        // OSRM returns hundreds of coordinates for a long route; downsample to
        // a bounded set so per-waypoint geo work stays cheap while keeping the
        // true start and end.
        const waypoints = downsampleRoute(coords as [number, number][], 60);
        const directions = buildRouteDirections(prov as 'osrm' | 'mapbox', routeLabel, data, waypoints, from, to);
        store.setRouteWaypoints(waypoints);
        store.setRouteDirections(directions);
        store.calculateRouteCameraCounts();
        store.computeRouteCameraPlan();
        store.computeRouteETA();
        store.detectEnRouteIncidents();
      })
      .catch(() => {
        useStore.getState().setRouteDirections(null);
      });
  }, []);

  // Init map
  useEffect(() => {
    let map: any;
    let cancelled = false;
    import('maplibre-gl').then((mod) => {
      if (cancelled || !containerRef.current) return;
      const mb = mod.default || mod;
      const base = MAP_STYLES[mapStyleKey] || MAP_STYLES.street;
      try {
        map = new mb.Map({
          container: containerRef.current!,
          style: {
            version: 8,
            glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
            sources: {
              base: { type: 'raster', tiles: base.tiles, tileSize: 256, attribution: base.attribution, maxzoom: base.maxzoom },
            },
            layers: [{ id: 'base', type: 'raster', source: 'base' }],
          },
          center: [-96.796, 32.795],
          zoom: 10.5,
        });
        mapRef.current = map;

        map.on('load', () => {
          const prov = useStore.getState().settings.trafficProvider;
          const tk = useStore.getState().settings.tomTomKey;
          const mk = useStore.getState().settings.mapboxKey;
          if (prov !== 'density') {
            const t = trafficTiles(prov, prov === 'tomtom' ? tk : mk);
            if (t) {
              map.addSource('traffic', { type: 'raster', tiles: t.tiles, tileSize: 256, attribution: t.attribution });
              map.addLayer({ id: 'traffic-layer', type: 'raster', source: 'traffic', paint: { 'raster-opacity': 0.7 } });
              map.setLayoutProperty('traffic-layer', 'visibility', useStore.getState().settings.showLiveTraffic ? 'visible' : 'none');
            } else { addRoadsLayer(map, useStore.getState().settings.showLiveTraffic); }
          } else { addRoadsLayer(map, useStore.getState().settings.showLiveTraffic); }

          // ── Heatmap grid (intricate multi-layer) ──
          const { cameras: initCams, businesses: initBiz, roadSegments: initRoads } = useStore.getState();
          const heatGrid: any[] = [];
          // Finer grid: ~0.003° per cell (~300m) for detailed density
          const GRID_STEP = 0.0035;
          for (let lat = 32.71; lat <= 32.99; lat += GRID_STEP) {
            for (let lng = -96.89; lng <= -96.69; lng += GRID_STEP) {
              const cell = computeHeatCell(lat, lng, initCams, initBiz, initRoads, [], GRID_STEP);
              heatGrid.push({
                type: 'Feature',
                properties: {
                  weight: cell.weight,
                  cameraDensity: cell.cameraDensity,
                  pedestrianDensity: cell.pedestrianDensity,
                  roadDensity: cell.roadDensity,
                  incidentDensity: cell.incidentDensity,
                  lat, lng,
                },
                geometry: { type: 'Point', coordinates: [lng, lat] },
              });
            }
          }
          map.addSource('heat', { type: 'geojson', data: { type: 'FeatureCollection', features: heatGrid } });
          map.addLayer({
            id: 'heat-layer', type: 'heatmap', source: 'heat',
            paint: {
              'heatmap-weight': ['get', 'weight'],
              'heatmap-intensity': 2.2, 'heatmap-radius': 55,
              'heatmap-opacity': useStore.getState().settings.showHeatmap ? 0.85 : 0,
              'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'],
                0, 'rgba(0,0,0,0)',
                0.08, '#22c55e',
                0.2, '#a3e635',
                0.32, '#eab308',
                0.45, '#f97316',
                0.6, '#ef4444',
                0.75, '#a855f7',
                0.9, '#7c3aed'],
            },
          });
          // Intricate pulsing animation
          let pulseDir = 1;
          const pulseInterval = setInterval(() => {
            const m = mapRef.current;
            if (!m || !m.setPaintProperty) return;
            const current = m.getPaintProperty?.('heat-layer', 'heatmap-radius') ?? 55;
            const step = pulseDir * 1.5;
            const next = Math.min(85, Math.max(35, current + step));
            if (next >= 85 || next <= 35) pulseDir *= -1;
            if (m.setPaintProperty) m.setPaintProperty('heat-layer', 'heatmap-radius', next);
          }, 70);
          (map as any)._pulseInterval = pulseInterval;

          // ── Data sources ──
          // Businesses — cluster for density at low zoom, show names at high zoom
          map.addSource('businesses', {
            type: 'geojson', data: { type: 'FeatureCollection', features: [] },
            cluster: true, clusterMaxZoom: 13, clusterRadius: 50,
          });
          map.addSource('cameras', { type: 'geojson', data: { type: 'FeatureCollection', features: [] }, cluster: true, clusterMaxZoom: 13, clusterRadius: 40 });

          // Business cluster circles
          map.addLayer({
            id: 'biz-cluster', type: 'circle', source: 'businesses',
            filter: ['has', 'point_count'],
            paint: {
              'circle-color': ['step', ['get', 'point_count'], '#22c55e', 5, '#84cc16', 10, '#eab308', 25, '#f97316', 50, '#ef4444'],
              'circle-radius': ['step', ['get', 'point_count'], 12, 5, 16, 10, 20, 25, 26, 50, 32],
              'circle-opacity': 0.75,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#fff',
            },
          });
          map.addLayer({
            id: 'biz-cluster-count', type: 'symbol', source: 'businesses',
            filter: ['has', 'point_count'],
            layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 12, 'text-font': ['Open Sans Bold'] },
            paint: { 'text-color': '#fff' },
          });

          // Camera clusters
          map.addLayer({
            id: 'cameras-cluster', type: 'circle', source: 'cameras',
            filter: ['has', 'point_count'],
            paint: {
              'circle-color': ['step', ['get', 'point_count'], '#3b82f6', 10, '#6366f1', 30, '#8b5cf6'],
              'circle-radius': ['step', ['get', 'point_count'], 14, 10, 20, 30, 28],
              'circle-opacity': 0.7, 'circle-stroke-width': 2, 'circle-stroke-color': '#fff',
            },
          });
          map.addLayer({
            id: 'cameras-cluster-count', type: 'symbol', source: 'cameras',
            filter: ['has', 'point_count'],
            layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 12, 'text-font': ['Open Sans Bold'] },
            paint: { 'text-color': '#fff' },
          });
          map.addLayer({
            id: 'cameras-layer', type: 'circle', source: 'cameras',
            filter: ['!', ['has', 'point_count']],
            paint: { 'circle-radius': 5, 'circle-color': '#3b82f6', 'circle-stroke-width': 1.5, 'circle-stroke-color': '#fff', 'circle-opacity': 0.85 },
          });

          // Business markers (individual)
          map.addLayer({
            id: 'businesses-layer', type: 'circle', source: 'businesses',
            filter: ['!', ['has', 'point_count']],
            paint: { 'circle-radius': 7, 'circle-color': '#22c55e', 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' },
          });

          // ── POI Labels (Google Maps style) ──
          addPOILabelsLayer(map);

          // ── Discovered cameras ──
          map.addSource('discovered', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
          map.addLayer({
            id: 'discovered-layer', type: 'circle', source: 'discovered',
            paint: { 'circle-radius': 7, 'circle-color': '#f59e0b', 'circle-opacity': 0.85, 'circle-stroke-width': 2.5, 'circle-stroke-color': '#fff' },
          });
          map.addLayer({
            id: 'discovered-label', type: 'symbol', source: 'discovered',
            layout: { 'text-field': ['get', 'name'], 'text-size': 9, 'text-offset': [0, -1.5], 'text-anchor': 'bottom', 'text-font': ['Open Sans Regular'] },
            paint: { 'text-color': '#f59e0b', 'text-halo-color': '#fff', 'text-halo-width': 1.5 },
          });

          // ── Click handlers ──
          map.on('click', 'businesses-layer', (e: any) => {
            if (e.features?.[0]) {
              const id = e.features[0].properties?.id;
              const biz = useStore.getState().businesses.find((b) => b.id === id);
              if (biz) {
                useStore.getState().selectBusiness(biz);
                if (mapRef.current) mapRef.current.flyTo({ center: [biz.lng, biz.lat], zoom: 16 });
              }
            }
          });

          // Click cluster -> zoom into cluster
          map.on('click', 'biz-cluster', (e: any) => {
            if (e.features?.[0]) {
              const geom = e.features[0].geometry;
              if (geom && mapRef.current) {
                mapRef.current.flyTo({ center: geom.coordinates, zoom: mapRef.current.getZoom() + 2 });
              }
            }
          });
          map.on('click', 'cameras-cluster', (e: any) => {
            if (e.features?.[0]) {
              const geom = e.features[0].geometry;
              if (geom && mapRef.current) {
                mapRef.current.flyTo({ center: geom.coordinates, zoom: mapRef.current.getZoom() + 2 });
              }
            }
          });

          // Click on POI label → select business
          map.on('click', 'poi-labels', (e: any) => {
            if (e.features?.[0]) {
              const id = e.features[0].properties?.id;
              const biz = useStore.getState().businesses.find((b) => b.id === id);
              if (biz) {
                useStore.getState().selectBusiness(biz);
                if (mapRef.current) mapRef.current.flyTo({ center: [biz.lng, biz.lat], zoom: 16 });
              }
            }
          });

          map.on('click', 'cameras-layer', (e: any) => {
            if (e.features?.[0]) {
              const id = e.features[0].properties?.id;
              const cam = useStore.getState().cameras.find((c) => c.id === id);
              if (cam) useStore.getState().selectCamera(cam);
            }
          });
          map.on('click', 'discovered-layer', (e: any) => {
            if (e.features?.[0]) {
              const id = e.features[0].properties?.id;
              const dc = useStore.getState().discoveredCameras.find((d: any) => d.id === id);
              if (dc && mapRef.current) {
                mapRef.current.flyTo({ center: [dc.lng, dc.lat], zoom: 16 });
                const { cameras, selectCamera, setActiveView } = useStore.getState();
                const exists = cameras.some((c) => c.id === dc.id);
                if (!exists && dc.streamUrl) {
                  const newCam = {
                    id: dc.id, name: dc.name, lat: dc.lat, lng: dc.lng,
                    roadName: dc.roadName || 'unknown',
                    orientation: dc.direction !== undefined ? `${dc.direction}°` : 'N',
                    streamUrl: dc.streamUrl, protocol: dc.protocol || 'jpeg' as const,
                    jurisdiction: dc.operator || 'Discovered', privacyMasks: [],
                    status: 'online' as const, lastFrameAt: new Date().toISOString(),
                    healthScore: 0.7, resolution: '1280x720', updateFrequency: 5,
                    isPublic: true, publicNote: `Discovered via OSM`,
                    vehicleCountEst: Math.floor(Math.random() * 30) + 5, densityLevel: 'green' as any,
                  };
                  useStore.setState({ cameras: [...cameras, newCam] });
                  selectCamera(newCam);
                } else if (exists) {
                  const cam = cameras.find((c) => c.id === dc.id);
                  if (cam) selectCamera(cam);
                }
                setActiveView('cameras');
              }
            }
          });

          // ── Right-click / long-press on empty map → explore nearby ──
          map.on('contextmenu', (e: any) => {
            e.originalEvent?.preventDefault();
            setExplorePoint({ lat: e.lngLat.lat, lng: e.lngLat.lng });
            setShowExplore(true);
          });
          // Touch long-press — tap and hold for 600ms on mobile
          let touchTimer: ReturnType<typeof setTimeout> | null = null;
          const onTouchStart = (e: any) => {
            if (e.originalEvent && e.originalEvent.touches && e.originalEvent.touches.length === 1) {
              touchTimer = setTimeout(() => {
                if (e.lngLat) {
                  setExplorePoint({ lat: e.lngLat.lat, lng: e.lngLat.lng });
                  setShowExplore(true);
                }
              }, 600);
            }
          };
          const onTouchEnd = () => {
            if (touchTimer) { clearTimeout(touchTimer); touchTimer = null; }
          };
          map.getCanvasContainer().addEventListener('touchstart', onTouchStart, { passive: true });
          map.getCanvasContainer().addEventListener('touchend', onTouchEnd, { passive: true });
          map.getCanvasContainer().addEventListener('touchcancel', onTouchEnd, { passive: true });

          // ── User location ──
          map.addSource('userloc', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
          map.addLayer({
            id: 'userloc-layer', type: 'circle', source: 'userloc',
            paint: { 'circle-radius': 9, 'circle-color': '#3b82f6', 'circle-opacity': 0.25, 'circle-stroke-width': 3, 'circle-stroke-color': '#2563eb' },
          });

          // Route source
          map.addSource('route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
          map.addLayer({
            id: 'route-layer', type: 'line', source: 'route',
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: { 'line-color': '#2563eb', 'line-width': 5, 'line-opacity': 0.9 },
          });

          // ── Density rings around selected location (F8) ──
          map.addSource('density-rings', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
          map.addLayer({
            id: 'density-rings-layer', type: 'line', source: 'density-rings',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': ['get', 'color'], 'line-width': 2.5, 'line-opacity': 0.8, 'line-dasharray': [2, 1] },
          });

          // ── Explore marker (pinned point) ──
          map.addSource('explore-pin', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
          map.addLayer({
            id: 'explore-pin-layer', type: 'symbol', source: 'explore-pin',
            layout: { 'text-field': '📍', 'text-size': 24, 'text-anchor': 'bottom' },
          });

          // ── Police/Fire scanner incidents ──
          map.addSource('incidents', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
          // Incident icon symbols — emoji text labels, no sprite images needed
          map.addLayer({
            id: 'incidents-layer', type: 'symbol', source: 'incidents',
            minzoom: 10,
            layout: {
              'text-field': ['get', 'icon'],
              'text-font': ['Open Sans Bold'],
              'text-size': 18,
              'text-offset': [0, -0.7],
              'text-anchor': 'bottom',
              'text-allow-overlap': false,
              'text-ignore-placement': false,
            },
            paint: { 'text-color': ['get', 'color'], 'text-halo-color': '#000000', 'text-halo-width': 1 },
          });
        });
      } catch (e) {
        console.error('MapLibre init failed:', e);
        setStyleError(true);
      }
    });

    return () => { cancelled = true; if (map) { clearInterval((map as any)._pulseInterval); map.remove(); } mapRef.current = null; };
  }, []);

  // Style change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource) return;
    const base = MAP_STYLES[mapStyleKey] || MAP_STYLES.street;
    const src = map.getSource('base');
    if (src && 'tiles' in src) { (src as any).tiles = base.tiles; src.fire?.('data'); }
  }, [mapStyleKey]);

  // Toggle layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.setLayoutProperty) return;
    try {
      const prov = settings.trafficProvider;
      const key = prov === 'tomtom' ? settings.tomTomKey : prov === 'mapbox' ? settings.mapboxKey : undefined;
      const trafficLayer = prov !== 'density' && key ? 'traffic-layer' : 'roads-layer';
      map.setLayoutProperty(trafficLayer, 'visibility', settings.showLiveTraffic ? 'visible' : 'none');
      map.setPaintProperty('heat-layer', 'heatmap-opacity', settings.showHeatmap ? 0.75 : 0);
    } catch {}
  }, [settings.showLiveTraffic, settings.showHeatmap]);

  // Update markers + data
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource) return;
    try {
      const camFeatures = cameras.map((c) => ({
        type: 'Feature',
        properties: { id: c.id, level: c.densityLevel || 'green', status: c.status },
        geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
      }));

      const bizFeatures = businesses.map((b) => ({
        type: 'Feature',
        properties: {
          id: b.id,
          name: b.name,
          short_name: b.name.length > 14 ? b.name.slice(0, 12) + '..' : b.name,
          category: b.category || 'other',
          category_icon: CATEGORY_ICONS[b.category as keyof typeof CATEGORY_ICONS] || '📍',
          level: b.density?.densityLevel || 'green',
        },
        geometry: { type: 'Point', coordinates: [b.lng, b.lat] },
      }));

      // Heat grid — intricate multi-layer density
      const { discoveredCameras } = useStore.getState();
      const heatGrid: any[] = [];
      const GRID_STEP = 0.0035;
      for (let lat = 32.71; lat <= 32.99; lat += GRID_STEP) {
        for (let lng = -96.89; lng <= -96.69; lng += GRID_STEP) {
          const cell = computeHeatCell(lat, lng, cameras, businesses, roadSegments, discoveredCameras, GRID_STEP);
          heatGrid.push({
            type: 'Feature',
            properties: {
              weight: cell.weight,
              cameraDensity: cell.cameraDensity,
              pedestrianDensity: cell.pedestrianDensity,
              roadDensity: cell.roadDensity,
              incidentDensity: cell.incidentDensity,
              lat, lng,
            },
            geometry: { type: 'Point', coordinates: [lng, lat] },
          });
        }
      }

      const liveTrafficMap = new Map((liveTraffic || []).map((t) => [t.segmentId, t]));
      const roadFeatures = (roadSegments || []).map((rs: any) => {
        // Prefer live traffic color when available
        const live = liveTrafficMap.get(rs.id);
        if (live) {
          return {
            type: 'Feature',
            properties: { color: stateColor(live.trafficState), weight: Math.min(1, live.congestionIndex + 0.2) },
            geometry: { type: 'LineString', coordinates: rs.geometry },
          };
        }
        const lvl = rs.currentDensity?.densityLevel || 'green';
        return {
          type: 'Feature',
          properties: { color: DENSITY_COLORS[lvl as keyof typeof DENSITY_COLORS] || '#22c55e', weight: Math.min(1, (rs.currentDensity?.vehicleCountEst || 5) / 50) },
          geometry: { type: 'LineString', coordinates: rs.geometry },
        };
      });

      if (map.getSource('cameras')) map.getSource('cameras').setData({ type: 'FeatureCollection', features: settings.showCameraMarkers ? camFeatures : [] });
      if (map.getSource('businesses')) map.getSource('businesses').setData({ type: 'FeatureCollection', features: settings.showBusinessDensity ? bizFeatures : [] });
      if (map.getSource('heat')) map.getSource('heat').setData({ type: 'FeatureCollection', features: heatGrid });
      // Density rings (F8)
      if (map.getSource('density-rings')) {
        const features = buildDensityRings(selectedBusiness, businesses);
        map.getSource('density-rings').setData({ type: 'FeatureCollection', features: settings.showDensityRings ? features : [] });
      }
      if (map.getSource('discovered')) {
        const dc = useStore.getState().discoveredCameras;
        map.getSource('discovered').setData({
          type: 'FeatureCollection',
          features: dc.map((d: any) => ({ type: 'Feature', properties: { id: d.id, name: d.name }, geometry: { type: 'Point', coordinates: [d.lng, d.lat] } })),
        });
      }
      if (map.getSource('roads')) map.getSource('roads').setData({ type: 'FeatureCollection', features: roadFeatures });
      if (map.getSource('userloc') && userLocRef.current) {
        map.getSource('userloc').setData({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: userLocRef.current } }] });
      }
      // Update incidents source
      if (map.getSource('incidents')) {
        const shouldShow = scannerEnabled && showIncidents;
        const incFeatures = shouldShow
          ? incidents.map((inc: any) => ({
              type: 'Feature',
              properties: {
                id: inc.id,
                type: inc.type,
                icon: inc.type === 'fire' ? '🔥' : inc.type === 'ems' ? '🅰️' : '👮',
                color: priorityColorHex(inc.priority),
                priority: inc.priority,
                title: inc.title,
              },
              geometry: { type: 'Point', coordinates: [inc.lng, inc.lat] },
            }))
          : [];
        map.getSource('incidents').setData({ type: 'FeatureCollection', features: incFeatures });
      }
    } catch {}
  }, [cameras, businesses, roadSegments, settings.showCameraMarkers, settings.showBusinessDensity, settings.showDensityRings, selectedBusiness, incidents, scannerEnabled, showIncidents, liveTraffic]);

  // Draw route
  const routeTarget = useStore((s) => s.routeTarget);
  const routeProfile = useStore((s) => s.routeProfile);
  const userLocation = useStore((s) => s.userLocation);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource) return;
    if (routeTarget && userLocation) { drawRoute(routeTarget, routeProfile); }
    else if (map.getSource('route')) {
      map.getSource('route').setData({ type: 'FeatureCollection', features: [] });
      // Clearing the drawn route must also clear the derived route state,
      // otherwise QuietRoute / the camera counter / the ETA keep showing
      // results for a route that is no longer active.
      const store = useStore.getState();
      if (store.routeWaypoints.length > 0) {
        store.setRouteWaypoints([]);
        store.setRouteDirections(null);
        store.calculateRouteCameraCounts();
        store.computeRouteETA();
        store.setEnRouteIncidents([]);
      }
    }
  }, [routeTarget, routeProfile, userLocation, drawRoute]);

  // Show explore pin
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource) return;
    if (explorePoint && map.getSource('explore-pin')) {
      map.getSource('explore-pin').setData({
        type: 'FeatureCollection',
        features: [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [explorePoint.lng, explorePoint.lat] } }],
      });
    } else if (map.getSource('explore-pin')) {
      map.getSource('explore-pin').setData({ type: 'FeatureCollection', features: [] });
    }
  }, [explorePoint]);

  if (styleError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-zinc-400">
        <p className="text-sm">Map failed to load. Check your connection.</p>
      </div>
    );
  }

  return (
    <div className="hud-map relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      
      {/* Search box (compact, top-center) */}
      <div className="absolute left-1/2 top-3 z-20 w-64 -translate-x-1/2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search places or cameras…"
          className="w-full rounded-lg border border-zinc-200 bg-white/95 px-3 py-2 text-xs text-zinc-800 shadow-sm backdrop-blur-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-950/95 dark:text-zinc-100"
        />
        {results.length > 0 && (
          <div className="mt-1 overflow-hidden rounded-lg border border-zinc-200 bg-white/95 shadow-md backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/95">
            {results.map((r) => (
              <button
                key={`${r.kind}-${r.id}`}
                onClick={() => flyToPlace(r)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <span className="truncate">{r.name}</span>
                <span className="ml-2 text-[10px] uppercase text-zinc-400">{r.kind}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Locate-me */}
      <button
        onClick={locate}
        className="absolute bottom-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white/90 text-zinc-700 shadow-md backdrop-blur-sm transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/90 dark:text-zinc-200"
        title="Locate me"
        aria-label="Locate me"
      >
        <Navigation className="h-5 w-5" />
      </button>

      {/* Zoom controls */}
      <div className="absolute right-4 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1 rounded-lg border border-zinc-200 bg-white/90 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/90">
        <button onClick={() => { if (mapRef.current) mapRef.current.zoomIn(); }} className="flex h-10 w-10 items-center justify-center text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800" aria-label="Zoom in">+</button>
        <button onClick={() => { if (mapRef.current) mapRef.current.zoomOut(); }} className="flex h-10 w-10 items-center justify-center text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800" aria-label="Zoom out">−</button>
      </div>

      {/* Explore nearby panel (right-click on map) */}
      {showExplore && explorePoint && (
        <>
          <div className="absolute inset-0 z-30 bg-black/20" onClick={() => { setShowExplore(false); setExplorePoint(null); }} />
          <ExploreNearby
            lat={explorePoint.lat}
            lng={explorePoint.lng}
            onClose={() => { setShowExplore(false); setExplorePoint(null); }}
          />
        </>
      )}
    </div>
  );
}

export function LivingMap() {
  const { activeView, settings, updateSettings, cameras, roadSegments, selectedCamera } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  if (activeView !== 'map') return null;

  const styleKeys = Object.keys(MAP_STYLES) as Array<keyof typeof MAP_STYLES>;

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-center">
          <div className="mb-4 text-4xl">🌿</div>
          <p className="text-sm text-zinc-500">Loading QuietFlow map…</p>
        </div>
      </div>
    );
  }

  const trafficLabel = settings.trafficProvider === 'density' ? 'Traffic: density model · no key'
    : settings.trafficProvider === 'tomtom' ? 'Traffic: TomTom live'
    : 'Traffic: Mapbox live';

  return (
    <div className="absolute inset-0">
      <MapLibreMap />

      {/* Map controls overlay */}
      <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
        <div className="flex gap-1 rounded-lg border border-zinc-200 bg-white/90 p-1 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/90">
          {styleKeys.map((k) => (
            <button
              key={k}
              onClick={() => updateSettings({ mapStyle: k })}
              className={`rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                settings.mapStyle === k
                  ? 'bg-emerald-500 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
            >
              {k}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-lg border border-zinc-200 bg-white/90 p-1 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/90">
          <button
            onClick={() => updateSettings({ showLiveTraffic: !settings.showLiveTraffic })}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              settings.showLiveTraffic
                ? 'bg-blue-500 text-white'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
            }`}
          >
            Live Traffic
          </button>
          <button
            onClick={() => updateSettings({ showHeatmap: !settings.showHeatmap })}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              settings.showHeatmap
                ? 'bg-orange-500 text-white'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
            }`}
          >
            Heatmap
          </button>
          <button
            onClick={() => updateSettings({ showDensityRings: !settings.showDensityRings })}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              settings.showDensityRings
                ? 'bg-violet-500 text-white'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
            }`}
          >
            Density Rings
          </button>
        </div>
        {/* Live traffic legend */}
        {settings.showLiveTraffic && (
          <div className="rounded-lg border border-zinc-200 bg-white/90 p-2 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/90">
            <div className="mb-1 text-[9px] font-semibold uppercase text-zinc-400">Live Traffic</div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
              {(['free', 'light', 'moderate', 'heavy', 'severe'] as const).map((s) => (
                <div key={s} className="flex items-center gap-1 text-[9px] text-zinc-500">
                  <span className="inline-block h-2 w-3 rounded-sm" style={{ backgroundColor: stateColor(s) }} />
                  <span className="capitalize">{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Camera info overlay when selected */}
      {selectedCamera && (
        <div className="absolute left-4 bottom-4 z-10 rounded-lg border border-zinc-200 bg-white/90 p-3 text-xs backdrop-blur-sm max-w-xs dark:border-zinc-800 dark:bg-zinc-950/90">
          <div className="font-semibold text-zinc-800 dark:text-zinc-100">{selectedCamera.name}</div>
          <div className="mt-0.5 text-zinc-500">{selectedCamera.roadName} · {selectedCamera.jurisdiction}</div>
          <div className="mt-1 flex items-center gap-1">
            <span className={`inline-block h-2 w-2 rounded-full ${selectedCamera.status === 'online' ? 'bg-emerald-500' : selectedCamera.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'}`} />
            <span className="capitalize">{selectedCamera.status}</span>
            {selectedCamera.resolution && <span className="ml-2 text-zinc-400">{selectedCamera.resolution}</span>}
          </div>
        </div>
      )}
      
      {/* Parking lot occupancy overlay */}
      <ParkingLotOverlay />
      
      <div className="absolute right-4 top-4 z-10 rounded-lg border border-zinc-200 bg-white/90 p-3 text-xs text-zinc-500 shadow-sm backdrop-blur-sm">
        <div><span className="font-semibold text-zinc-800">{cameras.filter((c) => c.status === 'online').length}</span> online cameras</div>
        <div><span className="font-semibold text-zinc-800">{cameras.filter((c) => c.status === 'offline').length}</span> offline</div>
        <div className="mt-1.5 text-[10px] text-emerald-600">{trafficLabel}</div>
        <div className="mt-1 text-[10px] text-zinc-400">Right-click on map to explore nearby</div>
      </div>
    </div>
  );
}
