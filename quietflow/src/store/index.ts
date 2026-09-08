import { create } from 'zustand';
import {
  Camera,
  BusinessLocation,
  RoadSegment,
  DensityLevel,
  AppSettings,
  WeatherConditions,
  AirQuality,
  OnboardingState,
  TripPlan,
  CommunityReport,
  CorrectionReport,
  CompletedOuting,
  DensityMapLayer,
  QuietWindow,
  DailyDensityProfile,
  CameraSource,
  CameraBrand,
  RouteCameraCount,
  RouteDirections,
  ScannerIncident,
} from '@/types';
import type { NewsAlert, NewsAlertPrefs } from '@/lib/news-alerts';
import { MOCK_CAMERAS, MOCK_BUSINESSES, MOCK_ROAD_SEGMENTS } from '@/lib/mock-data';
import { localCameraToAppCamera } from '@/lib/local-camera';
import type { AggregatedOverlay } from '@/lib/synthetic-feed';
import { generateTypicalProfile } from '@/lib/density-utils';
import { updatePreferences } from '@/lib/notifications';
import { fetchRealEnv } from '@/lib/realtime-env';
import { fetchTomTomLiveTraffic } from '@/lib/live-traffic';
import { pushReport, pullReports, pushCorrection, pullCorrections } from '@/lib/community-sync';

const STORAGE_KEY = 'quietflow-state';

/**
 * A camera you own, as saved on this device.
 *
 * SECURITY: the RTSP password is deliberately NOT part of this shape and is
 * never written to localStorage. Only non-secret connection details persist;
 * the password lives in memory for the session and must be re-entered after a
 * reload. Persisting camera passwords in localStorage would expose them to any
 * XSS on the origin and to anyone with access to the device profile.
 */
export interface StoredLocalCamera {
  id: string;
  name: string;
  host: string;
  lat: number;
  lng: number;
  camera_bearing?: number;
  user: string;
  rtspPort?: number;
  rtspPath?: string;
  brand?: 'cctv' | 'ring' | 'nest' | 'arlo' | 'wyze' | 'other';
  /** ISO timestamp of when this camera was added. */
  addedAt: string;
  /** Last known reachability result from the bridge, if ever checked. */
  lastCheck?: { ok: boolean; at: string; detail?: string };
}

function loadPersisted() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      settings: parsed.settings,
      onboarding: parsed.onboarding,
      tripPlans: parsed.tripPlans ?? [],
      currentTrip: parsed.currentTrip ?? null,
      favoriteCameras: parsed.favoriteCameras ?? [],
      favoritePlaces: parsed.favoritePlaces ?? [],
      completedOutings: parsed.completedOutings ?? [],
      communityReports: parsed.communityReports ?? [],
      corrections: parsed.corrections ?? [],
      recentSearches: parsed.recentSearches ?? [],
      showWelcome: parsed.showWelcome ?? true,
      localCameras: parsed.localCameras ?? [],
    };
  } catch {
    return null;
  }
}

function persistToStorage(state: {
  settings?: AppSettings;
  onboarding?: OnboardingState;
  tripPlans?: TripPlan[];
  currentTrip?: TripPlan | null;
  favoriteCameras?: string[];
  favoritePlaces?: string[];
  completedOutings?: CompletedOuting[];
  communityReports?: CommunityReport[];
  corrections?: CorrectionReport[];
  recentSearches?: string[];
  showWelcome?: boolean;
  localCameras?: StoredLocalCamera[];
}) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const merged = { ...existing, ...state };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // storage full or unavailable — silently ignore
  }
}

interface AppState {
  cameras: Camera[];
  businesses: BusinessLocation[];
  roadSegments: RoadSegment[];
  selectedCamera: Camera | null;
  selectedBusiness: BusinessLocation | null;
  routeTarget: [number, number] | null;
  routeProfile: 'walking' | 'driving';
  userLocation?: [number, number] | null;
  mapCenter: [number, number];
  mapZoom: number;
  densityLayer: DensityMapLayer | null;
  activeView: 'map' | 'cameras' | 'quiet-finder' | 'my-places' | 'insights' | 'settings' | 'trip-planner' | 'community' | 'help' | 'camera-discovery' | 'quiet-route' | 'god-view' | 'traffic' | 'routines' | 'security' | 'my-cameras' | 'hud' | 'news';
  searchQuery: string;
  showWelcome: boolean;
  showAppLauncher: boolean;
  settings: AppSettings;
  weather: WeatherConditions;
  airQuality: AirQuality | null;
  onboarding: OnboardingState;
  tripPlans: TripPlan[];
  currentTrip: TripPlan | null;
  communityReports: CommunityReport[];
  corrections: CorrectionReport[];
  recentSearches: string[];
  densityProfiles: Record<string, DailyDensityProfile[]>;
  favoriteCameras: string[];
  favoritePlaces: string[];
  completedOutings: CompletedOuting[];
  homeLocation: { lat: number; lng: number } | null;
  quietFinderLocation: string | null;
  quietFinderResults: Array<{
    location: BusinessLocation;
    currentLevel: DensityLevel;
    windows: QuietWindow[];
    leaveNowScore: number;
  }>;
  discoveredCameras: import('@/types').DiscoveredCamera[];
  // Directional route camera plan (heading filter over discovered cameras)
  routeCameraPlan: import('@/lib/route-camera-plan').RouteCameraPlan | null;
  routeDirections: RouteDirections | null;
  computeRouteCameraPlan: () => void;
  setRouteDirections: (directions: RouteDirections | null) => void;
  discoveryResult: null | {
    count: number;
    source: string;
    loc: [number, number];
    meta: { timestamp: string; elapsedMs: number; totalRawResults: number; afterSourceFilter: number; afterDirectionFilter: number; afterDedup: number };
    directional: { enabled: boolean; toward: number; away: number; unknownDirection: number };
    streams: { acquired: number; verified: number; unverified: number; byProtocol: { hls: number; image: number; mjpeg: number } };
    query: { location: string | { lat: number; lng: number }; direction?: string; radiusMiles: number; source: CameraSource };
  };
  discoveryLoading: boolean;
  // Route-based camera tracking
  routeWaypoints: [number, number][];
  routeCameraCounts: RouteCameraCount | null;
  mapRef: React.MutableRefObject<any>;
  // Police/Fire scanner
  scannerEnabled: boolean;
  showIncidents: boolean;
  scannerConfig: { county: string; state: string; radiusKm: number; centerLat: number; centerLng: number };
  incidents: ScannerIncident[];
  enRouteIncidents: ScannerIncident[];
  incidentsLoading: boolean;
  lastIncidentFetch: string | null;
  // Dynamic traffic tracking
  liveTraffic: import('@/lib/traffic-engine').LiveTrafficSegment[];
  trafficIncidents: import('@/lib/traffic-engine').TrafficIncidentEvent[];
  routeETA: import('@/lib/traffic-engine').RouteETA | null;
  trafficLastUpdated: string | null;
  /** 'real' = live API data driving congestion; 'simulated' = model fallback. */
  trafficSource: 'real' | 'simulated';
  trafficAlertList: Array<{ id: string; title: string; message: string; severity: 'info' | 'warning' | 'critical'; timestamp: string }>;

  setActiveView: (view: AppState['activeView']) => void;
  selectCamera: (camera: Camera | null) => void;
  selectBusiness: (business: BusinessLocation | null) => void;
  setMapCenter: (center: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
  setRouteProfile: (p: 'walking' | 'driving') => void;
  setRouteTarget: (t: [number, number] | null) => void;
  setUserLocation: (loc: [number, number] | null) => void;
  setSearchQuery: (q: string) => void;
  setShowWelcome: (show: boolean) => void;
  setShowAppLauncher: (show: boolean) => void;
  hydrateFromStorage: () => void;
  updateSettings: (s: Partial<AppSettings>) => void;
  toggleAnxietyMode: () => void;
  toggleQuietMode: () => void;
  setTheme: (theme: AppSettings['theme']) => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  nextOnboardingStep: () => void;
  addTripPlan: (plan: TripPlan) => void;
  setCurrentTrip: (plan: TripPlan | null) => void;
  removeTripPlan: (id: string) => void;
  toggleFavoriteCamera: (id: string) => void;
  toggleFavoritePlace: (id: string) => void;
  addFavoritePlace: (id: string) => void;
  removeFavoritePlace: (id: string) => void;
  setHomeLocation: (loc: { lat: number; lng: number } | null) => void;
  logOuting: (outing: CompletedOuting) => void;
  searchQuietFinder: (query: string) => void;
  addRecentSearch: (q: string) => void;
  loadDensityData: () => void;
  generateDensityProfile: (locationId: string) => DailyDensityProfile[];
  addCommunityReport: (report: CommunityReport) => void;
  addCorrection: (c: CorrectionReport) => void;
  applyCorrection: (c: CorrectionReport) => void;
  // Blend recent community reports into business density (real user data).
  applyCommunityDensity: () => void;
  verifyStreams: () => Promise<void>;
  resetAllData: () => void;
  discoverCameras: (input: import('@/types').CameraDiscoveryInput) => Promise<void>;
  clearDiscovery: () => void;
  setDiscoveredCameras: (cams: import('@/types').DiscoveredCamera[]) => void;
  // Local camera (your own RTSP/ONVIF, no OAuth) → HLS bridge → camera grid
  addLocalCamera: (camera: Camera) => void;
  removeLocalCamera: (id: string) => void;
  // Police/Fire scanner actions
  fetchIncidents: () => Promise<void>;
  refreshIncidents: () => Promise<void>;
  setScannerEnabled: (enabled: boolean) => void;
  setScannerConfig: (config: Partial<{ county: string; state: string; radiusKm: number; centerLat: number; centerLng: number }>) => void;
  setShowIncidents: (show: boolean) => void;
  setEnRouteIncidents: (incidents: ScannerIncident[]) => void;
  detectEnRouteIncidents: () => void;
  // God-View aggregated density overlay (consented cameras + synthetic fill)
  godViewOverlay: AggregatedOverlay | null;
  computeGodViewOverlay: () => void;
  // Route waypoint + camera-count actions
  setRouteWaypoints: (waypoints: [number, number][]) => void;
  calculateRouteCameraCounts: () => void;
  generateQuietRoute: (start: [number, number], end: [number, number]) => void;
  refreshQuietRoute: () => void;
  // Saved own-camera configs (persisted; distinct from addLocalCamera, which
  // injects a live Camera into the grid for the current session)
  localCameras: StoredLocalCamera[];
  saveLocalCameraConfig: (cam: StoredLocalCamera) => void;
  deleteLocalCameraConfig: (id: string) => void;
  setLocalCameraCheck: (id: string, check: { ok: boolean; at: string; detail?: string }) => void;
  // Dynamic traffic tracking actions
  refreshLiveTraffic: () => void;
  computeRouteETA: () => void;
  recommendTrafficAlerts: () => void;
  // Real environmental data (Open-Meteo) — replaces simulated weather defaults
  refreshRealEnv: () => Promise<void>;
  // News alerts — citizens-app style real-time alerts
  newsAlerts: NewsAlert[];
  newsAlertPrefs: NewsAlertPrefs;
  addNewsAlert: (alert: NewsAlert) => void;
  dismissNewsAlert: (id: string) => void;
  markNewsRead: (id: string) => void;
  markNewsAllRead: () => void;
  updateNewsPrefs: (p: Partial<NewsAlertPrefs>) => void;
}

function genProf(): DailyDensityProfile[] {
  const t = generateTypicalProfile();
  return t.map((v, i) => ({
    hour: i,
    typicalDensity: Math.round(v),
    predictedDensity: Math.round(v + (Math.random() - 0.5) * 10),
    confidence: 0.7 + Math.random() * 0.25,
  }));
}

function leaveNowScore(biz: BusinessLocation): number {
  const lv: Record<string, number> = { green: 0, yellow: 1, orange: 2, red: 3, purple: 4 };
  const base = 100 - (lv[biz.density?.densityLevel || 'green'] || 0) * 25;
  const has = biz.quietWindows.some(w => {
    const d = new Date(w.startTime).getTime() - Date.now();
    return d > 0 && d < 7200000 && w.expectedLevel === 'green';
  });
  return base + (has ? 10 : 0);
}

const persisted = null as ReturnType<typeof loadPersisted>;


export const useStore = create<AppState>((set, get) => ({
  cameras: MOCK_CAMERAS,
  businesses: MOCK_BUSINESSES,
  roadSegments: MOCK_ROAD_SEGMENTS,
  selectedCamera: null,
  selectedBusiness: null,
  routeTarget: null,
  routeProfile: 'walking',
  mapCenter: [-96.796, 32.795],
  mapZoom: 13,
  densityLayer: null,
  activeView: 'hud',
  showAppLauncher: true,
  searchQuery: '',
  showWelcome: true,
  localCameras: [],
  settings: {
    theme: 'cyberpunk', temperatureUnit: 'f', mapStyle: 'street',
    maxAcceptableDensity: 'yellow', quietMode: false, anxietyFriendlyUI: false,
    showBusinessDensity: true, showCameraMarkers: true, showRoadDensity: true,
    showLiveTraffic: true, showHeatmap: false, showIncidents: true, showDensityRings: false,
    notificationEnabled: false, notificationStartHour: 8, notificationEndHour: 20,
    reduceAnimations: false, largeText: false, highContrast: false,
    trafficProvider: 'density', tomTomKey: undefined, mapboxKey: undefined,
    directionsProvider: 'osrm',
    routeVoiceGuidance: true,
  },
  weather: { temperature: 82, condition: 'sunny', humidity: 45, windSpeed: 8, precipitation: 0, icon: '☀️', source: 'simulated' },
  airQuality: null,
  onboarding: { completed: false, currentStep: 0, skipped: false },
  tripPlans: [],
  currentTrip: null,
  communityReports: [],
  corrections: [],
  recentSearches: ['Whole Foods', 'CVS', 'Library'],
  densityProfiles: {},
  favoriteCameras: ['cam-1', 'cam-6'],
  favoritePlaces: [],
  completedOutings: [],
  homeLocation: null,
  quietFinderLocation: null,
  quietFinderResults: [],
  discoveredCameras: [] as import('@/types').DiscoveredCamera[],
  routeCameraPlan: null,
  routeDirections: null,
  discoveryResult: null as {
    count: number; source: string; loc: [number, number];
    meta: { timestamp: string; elapsedMs: number; totalRawResults: number; afterSourceFilter: number; afterDirectionFilter: number; afterDedup: number };
    directional: { enabled: boolean; toward: number; away: number; unknownDirection: number };
    streams: { acquired: number; verified: number; unverified: number; byProtocol: { hls: number; image: number; mjpeg: number } };
    query: { location: string | { lat: number; lng: number }; direction?: string; radiusMiles: number; source: import('@/types').CameraSource };
  } | null,
  discoveryLoading: false,
  // Route-based camera tracking
  routeWaypoints: [] as [number, number][],
  routeCameraCounts: null as RouteCameraCount | null,
  mapRef: { current: null } as React.MutableRefObject<any>,
  // Police/Fire scanner initial state
  scannerEnabled: true,
  showIncidents: true,
  scannerConfig: { county: 'dallas', state: 'tx', radiusKm: 15, centerLat: 32.795, centerLng: -96.796 },
  incidents: [] as ScannerIncident[],
  enRouteIncidents: [] as ScannerIncident[],
  incidentsLoading: false,
  lastIncidentFetch: null,
  // Dynamic traffic tracking initial state
  liveTraffic: [] as import('@/lib/traffic-engine').LiveTrafficSegment[],
  trafficIncidents: [] as import('@/lib/traffic-engine').TrafficIncidentEvent[],
  routeETA: null as import('@/lib/traffic-engine').RouteETA | null,
  trafficLastUpdated: null,
  trafficSource: 'simulated' as 'real' | 'simulated',
  trafficAlertList: [] as Array<{ id: string; title: string; message: string; severity: 'info' | 'warning' | 'critical'; timestamp: string }>,

  setActiveView: (v) => set({ activeView: v }),
  selectCamera: (c) => set({ selectedCamera: c }),
  selectBusiness: (b) => set({ selectedBusiness: b, routeTarget: b ? [b.lng, b.lat] : null }),
  setMapCenter: (c) => set({ mapCenter: c }),
  setMapZoom: (z) => set({ mapZoom: z }),
  setRouteProfile: (p) => set({ routeProfile: p }),
  setRouteTarget: (t) => set({ routeTarget: t }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setShowWelcome: (s) => {
    set({ showWelcome: s });
    persistToStorage({ showWelcome: s });
  },
  setShowAppLauncher: (s) => set({ showAppLauncher: s }),
  hydrateFromStorage: () => {
    const p = loadPersisted();
    if (!p) return;
    set({
      showWelcome: p.showWelcome ?? true,
      localCameras: p.localCameras ?? [],
      settings: {
        theme: 'cyberpunk', temperatureUnit: 'f', mapStyle: 'street',
        maxAcceptableDensity: 'yellow', quietMode: false, anxietyFriendlyUI: false,
        showBusinessDensity: true, showCameraMarkers: true, showRoadDensity: true,
        showLiveTraffic: true, showHeatmap: false, showIncidents: true, showDensityRings: false,
        notificationEnabled: false, notificationStartHour: 8, notificationEndHour: 20,
        reduceAnimations: false, largeText: false, highContrast: false,
        trafficProvider: 'density', tomTomKey: undefined, mapboxKey: undefined,
        directionsProvider: 'osrm',
        routeVoiceGuidance: true,
        ...p.settings,
      },
      onboarding: p.onboarding ?? { completed: false, currentStep: 0, skipped: false },
      tripPlans: p.tripPlans ?? [],
      currentTrip: p.currentTrip ?? null,
      communityReports: p.communityReports ?? [],
      recentSearches: p.recentSearches ?? ['Whole Foods', 'CVS', 'Library'],
      favoriteCameras: p.favoriteCameras ?? ['cam-1', 'cam-6'],
      favoritePlaces: p.favoritePlaces ?? [],
      completedOutings: p.completedOutings ?? [],
    });
    // Re-surface saved own-cameras into the live grid/map (bridge HLS URLs).
    if (p.localCameras && p.localCameras.length) {
      const ownCams = p.localCameras.map((c: StoredLocalCamera) => localCameraToAppCamera(c));
      set((s) => {
        const existing = new Set(s.cameras.map((c) => c.id));
        const merged = [...s.cameras];
        for (const cam of ownCams) if (!existing.has(cam.id)) merged.push(cam);
        return { cameras: merged };
      });
    }
    // Fold any recent community reports into displayed density on load.
    get().applyCommunityDensity();
    // Pull shared reports from the circle backend (best-effort).
    pullReports().then((remote) => {
      if (remote.length) {
        const merged = [...remote, ...get().communityReports];
        const seen = new Set<string>();
        const dedup = merged.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
        set({ communityReports: dedup });
        get().applyCommunityDensity();
      }
    }).catch(() => {});
    // Pull shared corrections from the circle backend (best-effort).
    pullCorrections().then((remote) => {
      if (remote.length) {
        const seen = new Set(get().corrections.map((c) => c.id));
        const fresh = remote.filter((c) => !seen.has(c.id));
        if (fresh.length) {
          set({ corrections: [...fresh, ...get().corrections] });
          fresh.forEach((c) => get().applyCorrection(c));
        }
      }
    }).catch(() => {});
  },
  updateSettings: (s) => set((st) => {
    const updated = { ...st.settings, ...s };
    persistToStorage({ settings: updated });
    // Bridge notification settings to notification system
    if ('notificationEnabled' in s) {
      updatePreferences({ enabled: s.notificationEnabled ?? updated.notificationEnabled });
    }
    return { settings: updated };
  }),
  toggleAnxietyMode: () => set((s) => {
    const updated = { ...s.settings, anxietyFriendlyUI: !s.settings.anxietyFriendlyUI };
    persistToStorage({ settings: updated });
    return { settings: updated };
  }),
  toggleQuietMode: () => set((s) => {
    const updated = { ...s.settings, quietMode: !s.settings.quietMode };
    persistToStorage({ settings: updated });
    return { settings: updated };
  }),
  setTheme: (t) => set((s) => {
    const updated = { ...s.settings, theme: t };
    persistToStorage({ settings: updated });
    return { settings: updated };
  }),
  completeOnboarding: () => {
    const o = { completed: true, currentStep: 0, skipped: false };
    set({ onboarding: o, showWelcome: false });
    persistToStorage({ onboarding: o, showWelcome: false });
  },
  skipOnboarding: () => {
    const o = { completed: true, currentStep: 0, skipped: true };
    set({ onboarding: o, showWelcome: false });
    persistToStorage({ onboarding: o, showWelcome: false });
  },
  nextOnboardingStep: () => set((s) => ({ onboarding: { ...s.onboarding, currentStep: s.onboarding.currentStep + 1 } })),
  addTripPlan: (p) => set((s) => {
    const updated = [...s.tripPlans, p];
    persistToStorage({ tripPlans: updated });
    return { tripPlans: updated };
  }),
  setCurrentTrip: (p) => set({ currentTrip: p }),
  removeTripPlan: (id) => set((s) => {
    const updated = s.tripPlans.filter((p) => p.id !== id);
    persistToStorage({ tripPlans: updated, currentTrip: s.currentTrip?.id === id ? null : s.currentTrip });
    return { tripPlans: updated, currentTrip: s.currentTrip?.id === id ? null : s.currentTrip };
  }),
  toggleFavoriteCamera: (id) => set((s) => {
    const updated = s.favoriteCameras.includes(id)
      ? s.favoriteCameras.filter((c) => c !== id)
      : [...s.favoriteCameras, id];
    persistToStorage({ favoriteCameras: updated });
    return { favoriteCameras: updated };
  }),
  toggleFavoritePlace: (id) => {
    if (get().favoritePlaces.includes(id)) {
      get().removeFavoritePlace(id);
    } else {
      get().addFavoritePlace(id);
    }
  },
  addFavoritePlace: (id) => set((s) => {
    if (s.favoritePlaces.includes(id)) return s;
    const updated = [...s.favoritePlaces, id];
    persistToStorage({ favoritePlaces: updated });
    return { favoritePlaces: updated };
  }),
  removeFavoritePlace: (id) => set((s) => {
    const updated = s.favoritePlaces.filter((p) => p !== id);
    persistToStorage({ favoritePlaces: updated });
    return { favoritePlaces: updated };
  }),
  setHomeLocation: (loc) => set({ homeLocation: loc }),
  setUserLocation: (loc) => set({ userLocation: loc }),
  logOuting: (outing) => set((s) => {
    const updated = [outing, ...s.completedOutings].slice(0, 100);
    persistToStorage({ completedOutings: updated });
    return { completedOutings: updated };
  }),

  searchQuietFinder: (query) => {
    const businesses = get().businesses;
    const lower = query.toLowerCase();
    const matched = businesses.filter((b) => b.name.toLowerCase().includes(lower) || b.category.toLowerCase().includes(lower));
    set({ quietFinderResults: matched.map((location) => ({ location, currentLevel: location.density?.densityLevel || 'green', windows: location.quietWindows, leaveNowScore: leaveNowScore(location) })) });
  },
  addRecentSearch: (q) => set((s) => {
    const updated = [q, ...s.recentSearches.filter((x) => x !== q)].slice(0, 10);
    persistToStorage({ recentSearches: updated });
    return { recentSearches: updated };
  }),

  loadDensityData: () => {
    const { roadSegments, businesses, cameras } = get();
    set({
      densityLayer: {
        roadSegments: roadSegments.map((rs) => ({ id: rs.id, geometry: rs.geometry, level: (rs.currentDensity?.densityLevel || 'green') as DensityLevel, vehicleCount: rs.currentDensity?.vehicleCountEst || 0 })),
        cameraMarkers: cameras.map((cam) => ({ id: cam.id, lat: cam.lat, lng: cam.lng, status: cam.status, level: (cam.densityLevel || 'green') as DensityLevel })),
        businessMarkers: businesses.map((biz) => ({ id: biz.id, lat: biz.lat, lng: biz.lng, name: biz.name, category: biz.category, level: biz.density?.densityLevel || 'green' })),
      },
    });
  },
  generateDensityProfile: (id) => {
    const p = get().densityProfiles;
    if (p[id]) return p[id];
    const n = genProf();
    set((s) => ({ densityProfiles: { ...s.densityProfiles, [id]: n } }));
    return n;
  },
  addCorrection: (c) => {
    const updated = [c, ...get().corrections];
    persistToStorage({ corrections: updated });
    set({ corrections: updated });
    get().applyCorrection(c);
    pushCorrection(c).catch(() => {});
  },
  // Apply a single correction to live state (camera stale, traffic clear/jam, crowd wrong).
  applyCorrection: (c) => {
    if (c.targetType === 'camera' && c.correctionType === 'camera_down') {
      set((s) => ({
        cameras: s.cameras.map((cam) =>
          cam.id === c.targetId ? { ...cam, healthScore: Math.min(cam.healthScore, 0.2), status: 'degraded' as const } : cam,
        ),
      }));
    } else if (c.targetType === 'location' && (c.correctionType === 'traffic_clear' || c.correctionType === 'traffic_jam')) {
      // Nudge the matching road segment density toward the correction.
      const level = c.correctionType === 'traffic_clear' ? 'green' : 'red';
      set((s) => ({
        roadSegments: s.roadSegments.map((rs) =>
          rs.id === c.targetId && rs.currentDensity
            ? { ...rs, currentDensity: { ...rs.currentDensity, densityLevel: level, source: 'user' as const, timestamp: new Date().toISOString() } }
            : rs,
        ),
      }));
    }
    // crowd_wrong / camera_back handled by re-running density blend / stream verify.
    if (c.correctionType === 'crowd_wrong') get().applyCommunityDensity();
  },
    addCommunityReport: (r) => {
    const updated = [r, ...get().communityReports];
    persistToStorage({ communityReports: updated });
    set({ communityReports: updated });
    get().applyCommunityDensity();
    // Best-effort sync to the shared backend (no-op if endpoint unset/offline).
    pushReport(r).catch(() => {});
  },
  // Blend recent community reports (last 6h) into business density so the
  // displayed busy-ness reflects REAL user observations, not just the model.
  // Each blended business gets densitySource: 'user'. Reports older than 6h
  // are ignored so stale reports don't override live conditions forever.
  applyCommunityDensity: () => {
    const { communityReports, businesses } = get();
    const cutoff = Date.now() - 6 * 3600 * 1000;
    const recent = communityReports.filter((r) => new Date(r.timestamp).getTime() >= cutoff);
    if (recent.length === 0) return;
    const byLoc = new Map<string, DensityLevel[]>();
    for (const r of recent) {
      if (!byLoc.has(r.locationId)) byLoc.set(r.locationId, []);
      byLoc.get(r.locationId)!.push(r.density);
    }
    const rank: Record<DensityLevel, number> = { green: 0, yellow: 1, orange: 2, red: 3, purple: 4 };
    const inv: DensityLevel[] = ['green', 'yellow', 'orange', 'red', 'purple'];
    set({
      businesses: businesses.map((b) => {
        const reports = byLoc.get(b.id);
        if (!reports || reports.length === 0) return b;
        const avg = reports.reduce((s, d) => s + rank[d], 0) / reports.length;
        const blended = inv[Math.min(4, Math.max(0, Math.round(avg)))];
        const latest = recent.filter((r) => r.locationId === b.id).sort((a, c) => new Date(c.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        const density = b.density ? { ...b.density, densityLevel: blended, source: 'user' as const } : b.density;
        return { ...b, density, densitySource: 'user' as const, lastCommunityReportAt: latest?.timestamp };
      }),
    });
  },
  // Truthfully probe each camera's stream reachability and update status.
  // Client-side probe (no server route needed for static/WebView builds).
  // JPEG/MJPEG/image streams can be probed directly; HLS/manifest probes are
  // best-effort and degrade to "online" when CORS blocks the check.
  verifyStreams: async () => {
    const { cameras } = get();
    const results = await Promise.all(
      cameras.map(async (cam) => {
        try {
          if (cam.protocol === 'jpeg' || cam.protocol === 'mjpeg') {
            // Probe the snapshot directly with a cache-busting image request.
            const url = `${cam.streamUrl}${cam.streamUrl.includes('?') ? '&' : '?'}_probe=${Date.now()}`;
            const img = new Image();
            const ok = await new Promise<boolean>((resolve) => {
              const t = setTimeout(() => resolve(false), 6000);
              img.onload = () => { clearTimeout(t); resolve(true); };
              img.onerror = () => { clearTimeout(t); resolve(false); };
              img.src = url;
            });
            return {
              id: cam.id,
              status: ok ? (cam.status === 'degraded' ? 'degraded' : 'online') : 'offline',
              healthScore: ok ? Math.max(cam.healthScore, 0.6) : 0,
              lastFrameAt: ok ? new Date().toISOString() : cam.lastFrameAt,
            } as const;
          }
          // HLS/rtsp/etc: cannot probe from browser without CORS; assume the
          // simulator's seeded status stands (truthful: we don't claim liveness).
          return { id: cam.id, status: cam.status, healthScore: cam.healthScore, lastFrameAt: cam.lastFrameAt } as const;
        } catch {
          return { id: cam.id, status: 'offline', healthScore: 0, lastFrameAt: cam.lastFrameAt } as const;
        }
      }),
    );
    set((s) => ({
      cameras: s.cameras.map((c) => {
        const r = results.find((x) => x.id === c.id);
        return r ? { ...c, status: r.status, healthScore: r.healthScore, lastFrameAt: r.lastFrameAt } : c;
      }),
    }));
  },
  resetAllData: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  },
  discoverCameras: async (input) => {
    set({ discoveryLoading: true });
    try {
      const tomTomKey = get().settings.tomTomKey;
      const { discoverCameras: dc } = await import('@/lib/camera-discovery');
      const result = await dc(input, tomTomKey);
      // Auto-detect FLOCK/AXON cameras and count them
      const flockCount = result.cameras.filter((c) => c.brand === 'flock').length;
      const axonCount = result.cameras.filter((c) => c.brand === 'axon').length;
      set({
        discoveredCameras: result.cameras,
        discoveryResult: {
          count: result.cameras.length,
          source: result.source,
          loc: [result.resolvedLocation.lat, result.resolvedLocation.lng],
          meta: result.meta,
          directional: result.directional,
          streams: result.streams,
          query: result.query,
        },
        discoveryLoading: false,
      });
      // Auto-switch to map view to show discovered cameras
      if (result.cameras.length > 0) set({ activeView: 'map' });
    } catch {
      set({ discoveryLoading: false });
    }
  },
  clearDiscovery: () => set({ discoveredCameras: [], discoveryResult: null }),
  setDiscoveredCameras: (cams) => set({ discoveredCameras: cams }),
  addLocalCamera: (camera) => set((s) => {
    if (s.cameras.some((c) => c.id === camera.id)) return {};
    return { cameras: [...s.cameras, camera] };
  }),
  removeLocalCamera: (id) => set((s) => ({ cameras: s.cameras.filter((c) => c.id !== id) })),
  // Police/Fire scanner actions
  setRouteWaypoints: (waypoints: [number, number][]) => set({ routeWaypoints: waypoints }),
  calculateRouteCameraCounts: () => {
    const { routeWaypoints, cameras } = get();
    if (routeWaypoints.length < 2) {
      set({ routeCameraCounts: null });
      return;
    }
    import('@/lib/camera-discovery').then((mod) => {
      const counts = mod.countCamerasOnRoute(routeWaypoints, cameras);
      set({ routeCameraCounts: counts });
    });
  },
  // QuietRoute — route optimization avoiding cameras/people/busy areas
  generateQuietRoute: (start: [number, number], end: [number, number]) => {
    const { cameras, businesses, roadSegments, discoveredCameras } = get();
    import('@/lib/quiet-route').then((mod) => {
      const extra = discoveredCameras.map((d) => mod.discoveredToCamera(d));
      const result = mod.generateQuietRoute(start, end, cameras, businesses, roadSegments, undefined, extra);
      set({ routeCameraCounts: {
        routeId: result.routeId,
        routeName: 'QuietRoute',
        totalCameras: result.cameraCount,
        flockCameras: result.flockCameras,
        axonCameras: result.axonCameras,
        otherCameras: result.otherCameras,
        cameras: result.camerasOnRoute.map((c) => ({ id: c.id, name: c.name, brand: c.brand as import('@/types').CameraBrand, model: c.model, lat: c.lat, lng: c.lng })),
      }});
    });
  },
  refreshQuietRoute: () => {
    const { routeWaypoints, cameras, businesses, roadSegments } = get();
    if (routeWaypoints.length < 2) return;
    import('@/lib/quiet-route').then((mod) => {
      const start: [number, number] = [routeWaypoints[0][0], routeWaypoints[0][1]];
      const end: [number, number] = [routeWaypoints[routeWaypoints.length - 1][0], routeWaypoints[routeWaypoints.length - 1][1]];
      const result = mod.generateQuietRoute(start, end, cameras, businesses, roadSegments);
      set({ routeCameraCounts: {
        routeId: result.routeId,
        routeName: 'QuietRoute',
        totalCameras: result.cameraCount,
        flockCameras: result.flockCameras,
        axonCameras: result.axonCameras,
        otherCameras: result.otherCameras,
        cameras: result.camerasOnRoute.map((c) => ({ id: c.id, name: c.name, brand: c.brand as import('@/types').CameraBrand, model: c.model, lat: c.lat, lng: c.lng })),
      }});
    });
  },
  computeRouteCameraPlan: () => {
    const { routeWaypoints, discoveredCameras, userLocation, mapCenter } = get();
    if (routeWaypoints.length < 2) { set({ routeCameraPlan: null }); return; }
    const start = routeWaypoints[0];
    const end = routeWaypoints[routeWaypoints.length - 1];
    const center = userLocation
      ? { lat: userLocation[1], lng: userLocation[0] }
      : { lat: mapCenter[1], lng: mapCenter[0] };
    import('@/lib/route-camera-plan').then((mod) => {
      const plan = mod.buildRouteCameraPlan({
        start,
        end,
        route: routeWaypoints,
        cameras: discoveredCameras,
        center,
        headingToleranceDeg: 45,
        seed: 1337,
      });
      set({ routeCameraPlan: plan });
    });
  },
  setRouteDirections: (directions) => set({ routeDirections: directions }),
  // Saved own-camera configs
  saveLocalCameraConfig: (cam) => {
    set((s) => {
      // Re-saving the same id replaces the existing entry rather than
      // silently creating a duplicate.
      const next = [...s.localCameras.filter((c) => c.id !== cam.id), cam];
      persistToStorage({ localCameras: next });
      return { localCameras: next };
    });
  },
  deleteLocalCameraConfig: (id) => {
    set((s) => {
      const next = s.localCameras.filter((c) => c.id !== id);
      persistToStorage({ localCameras: next });
      return { localCameras: next };
    });
  },
  setLocalCameraCheck: (id, check) => {
    set((s) => {
      const next = s.localCameras.map((c) => (c.id === id ? { ...c, lastCheck: check } : c));
      persistToStorage({ localCameras: next });
      return { localCameras: next };
    });
  },
  // Police/Fire scanner actions
  setScannerEnabled: (enabled) => set({ scannerEnabled: enabled }),
  setScannerConfig: (config) => set((s) => ({ scannerConfig: { ...s.scannerConfig, ...config } })),
  setShowIncidents: (show) => set({ showIncidents: show }),
  fetchIncidents: async () => {
    const { scannerEnabled, scannerConfig, routeWaypoints, setEnRouteIncidents } = get();
    if (!scannerEnabled) return;
    set({ incidentsLoading: true });
    try {
      const { generateMockIncidents } = await import('@/lib/scanner-data');
      const incidents = generateMockIncidents({
        centerLat: scannerConfig.centerLat || 32.795,
        centerLng: scannerConfig.centerLng || -96.796,
        radiusKm: scannerConfig.radiusKm,
        county: scannerConfig.county,
        state: scannerConfig.state,
      });
      set({ incidents, incidentsLoading: false, lastIncidentFetch: new Date().toISOString() });
      // Detect en-route incidents
      if (routeWaypoints.length >= 2) {
        const { detectEnRouteIncidents: detect } = await import('@/lib/scanner-data');
        const enRoute = detect(routeWaypoints, incidents);
        setEnRouteIncidents(enRoute);
      }
    } catch {
      set({ incidentsLoading: false });
    }
  },
  refreshIncidents: async () => {
    await get().fetchIncidents();
  },
  detectEnRouteIncidents: () => {
    const { routeWaypoints, incidents } = get();
    if (routeWaypoints.length < 2) return;
    import('@/lib/scanner-data').then(({ detectEnRouteIncidents: detect }) => {
      const enRoute = detect(routeWaypoints, incidents);
      set({ enRouteIncidents: enRoute });
    });
  },
  setEnRouteIncidents: (incidents) => set({ enRouteIncidents: incidents }),
  godViewOverlay: null,
  computeGodViewOverlay: () => {
    const { cameras, userLocation, mapCenter } = get();
    const center = userLocation
      ? { lat: userLocation[1], lng: userLocation[0] }
      : { lat: mapCenter[1], lng: mapCenter[0] };
    // Consented/public cameras seed the real overlay; synthetic fill completes
    // the surface. (Private/own cameras are intentionally excluded — they are
    // not public surveillance sources.)
    const points = cameras.map((c) => ({ lat: c.lat, lng: c.lng, confidence: 0.85 }));
    import('@/lib/synthetic-feed').then((mod) => {
      const overlay = mod.aggregateGodView(center, points, { radiusKm: 6, seed: 1337 });
      set({ godViewOverlay: overlay });
    });
  },
  // Dynamic traffic tracking
  refreshLiveTraffic: () => {
    const { roadSegments, settings } = get();
    const key = settings.trafficProvider === 'tomtom' ? settings.tomTomKey
      : settings.trafficProvider === 'mapbox' ? settings.mapboxKey
      : undefined;
    const fallbackSim = () => {
      import('@/lib/traffic-engine').then((mod) => {
        const traffic = mod.computeLiveTraffic(roadSegments);
        const incidents = mod.generateTrafficIncidents(roadSegments);
        set({ liveTraffic: traffic, trafficIncidents: incidents, trafficLastUpdated: new Date().toISOString(), trafficSource: 'simulated' });
        get().recommendTrafficAlerts();
      });
    };
    // Try REAL live traffic when a keyed provider is selected and a key exists.
    if (key && key.trim().length > 0 && settings.trafficProvider !== 'density') {
      fetchTomTomLiveTraffic(roadSegments, key).then((real) => {
        if (real && real.segments.length) {
          import('@/lib/traffic-engine').then((mod) => {
            const incidents = mod.generateTrafficIncidents(roadSegments);
            set({ liveTraffic: real.segments, trafficIncidents: incidents, trafficLastUpdated: real.timestamp, trafficSource: 'real' });
            get().recommendTrafficAlerts();
          });
        } else {
          fallbackSim();
        }
      }).catch(() => fallbackSim());
      return;
    }
    // Key-free density model (simulated).
    fallbackSim();
  },
  computeRouteETA: () => {
    const { routeWaypoints, routeTarget, liveTraffic, trafficIncidents } = get();
    if (!routeTarget || routeWaypoints.length < 2) {
      set({ routeETA: null });
      return;
    }
    const { roadSegments } = get();
    // Use all road segments as the route path approximation
    const segmentIds = roadSegments.map((rs) => rs.id);
    const start: [number, number] = [routeWaypoints[0][0], routeWaypoints[0][1]];
    const end: [number, number] = [routeWaypoints[routeWaypoints.length - 1][0], routeWaypoints[routeWaypoints.length - 1][1]];
    import('@/lib/traffic-engine').then((mod) => {
      const eta = mod.computeRouteETA(
        `eta-${Date.now()}`,
        'Current route',
        segmentIds,
        liveTraffic,
        trafficIncidents,
        start,
        end,
      );
      set({ routeETA: eta });
    });
  },
  recommendTrafficAlerts: () => {
    const { liveTraffic, trafficIncidents } = get();
    const alerts: Array<{ id: string; title: string; message: string; severity: 'info' | 'warning' | 'critical'; timestamp: string }> = [];
    // Severe congestion alerts
    for (const seg of liveTraffic) {
      if (seg.trafficState === 'severe') {
        alerts.push({ id: `al-${seg.segmentId}-severe`, title: `Severe congestion on ${seg.name}`, message: `${Math.round(seg.speedKph)} km/h, ${seg.delayMin} min delay`, severity: 'critical', timestamp: new Date().toISOString() });
      } else if (seg.trafficState === 'heavy') {
        alerts.push({ id: `al-${seg.segmentId}-heavy`, title: `Heavy traffic on ${seg.name}`, message: `${Math.round(seg.speedKph)} km/h`, severity: 'warning', timestamp: new Date().toISOString() });
      }
    }
    // Incidents
    for (const inc of trafficIncidents) {
      if (inc.active && (inc.severity === 'major' || inc.severity === 'critical')) {
        alerts.push({ id: `al-inc-${inc.id}`, title: `${inc.type} on ${inc.name}`, message: inc.description + ` (+${inc.delayAddedMin} min)`, severity: inc.severity === 'critical' ? 'critical' : 'warning', timestamp: inc.startedAt });
      }
    }
    set({ trafficAlertList: alerts.slice(0, 12) });
  },
  // Real environmental data (Open-Meteo, keyless). Fetches live weather + air
  // quality for the current map center (or user location) and replaces the
  // seeded simulated defaults. Never fabricates — on failure we keep prior values.
  refreshRealEnv: async () => {
    const { mapCenter, userLocation, settings } = get();
    const center = userLocation
      ? { lat: userLocation[1], lng: userLocation[0] }
      : { lat: mapCenter[1], lng: mapCenter[0] };
    const snapshot = await fetchRealEnv(center.lat, center.lng, settings.temperatureUnit);
    if (snapshot) {
      set({ weather: snapshot.weather, airQuality: snapshot.airQuality });
    }
  },
  // News alerts — citizens-app style real-time alerts
  newsAlerts: [],
  newsAlertPrefs: { enabled: true, categories: [], minSeverity: 'low', hideRead: false, soundAlerts: false, pushNotifications: false, refreshIntervalSec: 30 },
  addNewsAlert: (alert) => set((s) => ({ newsAlerts: [alert, ...s.newsAlerts].slice(0, 200) })),
  dismissNewsAlert: (id) => set((s) => ({ newsAlerts: s.newsAlerts.map((a) => a.id === id ? { ...a, read: true } : a) })),
  markNewsRead: (id) => set((s) => ({ newsAlerts: s.newsAlerts.map((a) => a.id === id ? { ...a, read: true } : a) })),
  markNewsAllRead: () => set((s) => ({ newsAlerts: s.newsAlerts.map((a) => ({ ...a, read: true })) })),
  updateNewsPrefs: (p) => set((s) => ({ newsAlertPrefs: { ...s.newsAlertPrefs, ...p } })),
}));