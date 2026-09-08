// ─── Core Domain Types ────────────────────────────────────────────

export type DensityLevel = 'green' | 'yellow' | 'orange' | 'red' | 'purple';
export type CameraBrand = 'flock' | 'axon' | 'ring' | 'cctv' | 'other';

export const DENSITY_LABELS: Record<DensityLevel, string> = {
  green: 'Not busy at all',
  yellow: 'A little busy',
  orange: 'Pretty poppin',
  red: 'Super jeeted',
  purple: 'Wait a bit',
};

export const DENSITY_COLORS: Record<DensityLevel, string> = {
  green: '#22c55e',
  yellow: '#eab308',
  orange: '#f97316',
  red: '#ef4444',
  purple: '#a855f7',
};

export type TemperatureUnit = 'f' | 'c';
export type ThemeMode = 'system' | 'light' | 'dark' | 'cyberpunk' | 'zen';
export type MapStyle = 'street' | 'satellite' | 'light' | 'topo' | 'voyager';
export type CameraProtocol = 'hls' | 'rtsp' | 'mjpeg' | 'webrtc' | 'jpeg' | 'youtube' | 'synthetic';

export interface Camera {
  id: string;
  name: string;
  lat: number;
  lng: number;
  roadName: string;
  orientation: string;
  streamUrl: string;
  protocol: CameraProtocol;
  jurisdiction: string;
  privacyMasks: Array<{ x: number; y: number; w: number; h: number }>;
  status: 'online' | 'offline' | 'degraded';
  lastFrameAt: string | null;
  healthScore: number;
  resolution: string;
  updateFrequency: number;
  vehicleCountEst?: number;
  densityLevel?: DensityLevel;
  // Live-view metadata
  isPublic?: boolean;          // true = publicly available / authorized feed
  publicNote?: string;         // human label for the source
  thumbnailUrl?: string;       // JPEG snapshot fallback when HLS isn't available
  refresh_interval?: number;   // seconds between JPEG polls (for jpeg/mjpeg feeds)
  is_live?: boolean;           // true = currently receiving frames
  last_frame_timestamp?: string; // ISO timestamp of last successful frame
  streamVerified?: boolean;    // true = actual fetch succeeded
  // Camera brand / model tracking
  brand?: CameraBrand;         // 'flock' | 'axon' | 'other'
  model?: string;              // specific model name (e.g. 'Flock Safety F1', 'Axon Flex')
}

export interface RoadSegment {
  id: string;
  geometry: [number, number][]; // LineString coordinates
  name: string;
  speedLimit: number;
  typicalVolumeProfile: number[]; // 24h baseline
  currentDensity: DensityObservation | null;
}

export interface DensityObservation {
  locationId: string;
  roadSegmentId?: string;
  timestamp: string;
  vehicleCountEst: number;
  vehicleCountUncertainty: number; // ± percentage
  pedestrianEst: number;
  source: 'cv' | 'api' | 'satellite' | 'user';
  confidence: number; // 0–1
  densityLevel: DensityLevel;
}

export interface QuietWindow {
  startTime: string;
  endTime: string;
  expectedLevel: DensityLevel;
  confidence: number;
}

export interface UserPreference {
  maxAcceptableDensity: DensityLevel;
  preferredNotificationWindows: { start: string; end: string }[];
  quietMode: boolean;
  homeLocation: { lat: number; lng: number } | null;
  favoritePlaces: string[]; // location IDs
  anxietyFriendlyUI: boolean;
}

export interface CompletedOuting {
  id: string;
  locationId: string;
  locationName: string;
  timestamp: string;
  calmnessRating: 1 | 2 | 3 | 4 | 5;
  densityAtTime: DensityLevel;
}

// ─── Vehicle Detection Analytics ────────────────────────────

export type VehicleType = 'car' | 'suv' | 'truck' | 'bus' | 'motorcycle' | 'bicycle' | 'pedestrian';

export interface VehicleDetection {
  cameraId: string;
  timestamp: string;
  count: number;
  types: Partial<Record<VehicleType, number>>;
  averageSpeed: number;        // km/h estimated
  confidence: number;          // 0-1
  congestionIndex: number;     // 0 (empty) - 1 (gridlock)
  flowRate: number;            // vehicles per minute
}

export interface TrafficFlow {
  segmentId: string;
  direction: 'nb' | 'sb' | 'eb' | 'wb';
  averageSpeed: number;
  freeFlowSpeed: number;
  congestionLevel: DensityLevel;
  travelTimeMinutes: number;   // current estimate
  freeFlowTimeMinutes: number; // baseline
  timestamp: string;
}

// ─── API Response Types ───────────────────────────────────────────

export interface DensityMapLayer {
  roadSegments: Array<{
    id: string;
    geometry: [number, number][];
    level: DensityLevel;
    vehicleCount: number;
  }>;
  cameraMarkers: Array<{
    id: string;
    lat: number;
    lng: number;
    status: string;
    level: DensityLevel;
  }>;
  businessMarkers: Array<{
    id: string;
    lat: number;
    lng: number;
    name: string;
    category: string;
    level: DensityLevel;
  }>;
}

export interface QuietFinderResult {
  location: BusinessLocation;
  windows: QuietWindow[];
  bestWindow: QuietWindow | null;
  currentLevel: DensityLevel;
  leaveNowScore: number; // 0–100, higher = better to go now
}

// ─── New Feature Types ────────────────────────────────────────────

export interface AirQuality {
  usAqi: number;
  pm2_5: number;
  pm10: number;
  carbonMonoxide: number;
  source: 'real' | 'simulated';
  timestamp: string;
}

export interface WeatherConditions {
  temperature: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'foggy' | 'clear';
  humidity: number;
  windSpeed: number;
  precipitation: number;
  icon: string;
  /** 'real' = live observation (Open-Meteo); 'simulated' = seeded default. */
  source?: 'real' | 'simulated';
  timestamp?: string;
}

export interface AppSettings {
  theme: ThemeMode;
  temperatureUnit: TemperatureUnit;
  mapStyle: MapStyle;
  maxAcceptableDensity: DensityLevel;
  quietMode: boolean;
  anxietyFriendlyUI: boolean;
  showBusinessDensity: boolean;
  showCameraMarkers: boolean;
  showRoadDensity: boolean;
  showLiveTraffic: boolean;
  showHeatmap: boolean;
  showIncidents: boolean;
  notificationEnabled: boolean;
  notificationStartHour: number;
  notificationEndHour: number;
  reduceAnimations: boolean;
  largeText: boolean;
  highContrast: boolean;
  // Live-traffic source: 'density' (key-free) or 'tomtom'/'mapbox' (key)
  trafficProvider: 'density' | 'tomtom' | 'mapbox';
  tomTomKey?: string;
  mapboxKey?: string;
  // Routing/directions: 'osrm' (key-free public demo) or 'mapbox' (key)
  directionsProvider: 'osrm' | 'mapbox';
  routeVoiceGuidance: boolean;
  showDensityRings?: boolean;
}

export interface RouteDirectionStep {
  index: number;
  instruction: string;
  maneuverType: string;
  modifier?: string;
  roadName?: string;
  distanceMeters: number;
  durationSeconds: number;
  geometry?: [number, number][];
  drivingSide?: 'left' | 'right';
  exitNumber?: string | number;
}

export interface RouteDirections {
  provider: 'osrm' | 'mapbox';
  routeName: string;
  origin: [number, number];
  destination: [number, number];
  distanceMeters: number;
  durationSeconds: number;
  geometry: [number, number][];
  steps: RouteDirectionStep[];
  generatedAt: string;
}

export interface TripStop {
  locationId: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  estimatedDensityAtArrival?: DensityLevel;
}

export interface TripPlan {
  id: string;
  name: string;
  stops: TripStop[];
  totalEstimatedDuration: number;
  bestTimeToLeave: string;
  overallDensityScore: number;
}

export interface OnboardingState {
  completed: boolean;
  currentStep: number;
  skipped: boolean;
}

export interface CommunityReport {
  id: string;
  locationId: string;
  locationName: string;
  density: DensityLevel;
  comment: string;
  timestamp: string;
  authorId: string;
  helpful: number;
  /** 'density' = busyness report; 'correction' = fix a bad/stale signal. */
  kind?: 'density' | 'correction';
  /** For corrections: what is wrong. */
  correctionType?: 'camera_down' | 'camera_back' | 'traffic_clear' | 'traffic_jam' | 'crowd_wrong';
}

export interface CorrectionReport {
  id: string;
  kind: 'correction';
  correctionType: 'camera_down' | 'camera_back' | 'traffic_clear' | 'traffic_jam' | 'crowd_wrong';
  targetId: string;       // camera id or location id
  targetType: 'camera' | 'location';
  note?: string;
  timestamp: string;
  authorId: string;
}

export interface DailyDensityProfile {
  hour: number; // 0-23
  typicalDensity: number; // 0-100
  currentDensity?: number;
  predictedDensity?: number;
  confidence: number;
}

// ─── Business Location ─────────────────────────────────────────────

export interface BusinessLocation {
  id: string;
  name: string;
  category:
    | 'grocery'
    | 'pharmacy'
    | 'coffee'
    | 'bank'
    | 'post_office'
    | 'library'
    | 'park'
    | 'restaurant'
    | 'retail'
    | 'other';
  lat: number;
  lng: number;
  geofenceRadius: number; // meters
  authorizedCameraIds: string[];
  density: DensityObservation | null;
  quietWindows: QuietWindow[];
  // Parking lot data
  parkingLot?: ParkingLot;
  hours?: { open: string; close: string } | null;
  phone?: string;
  website?: string;
  rating?: number; // 1-5
  reviewCount?: number;
  /** Provenance of the currently displayed density: real user reports vs simulated model. */
  densitySource?: 'user' | 'simulated';
  lastCommunityReportAt?: string;
}

// ─── Parking Lot Types ─────────────────────────────────────────────

export interface ParkingLot {
  id: string;
  businessId: string;
  // Polygon geometry [lng, lat][]
  geometry: [number, number][];
  // Total parking spaces
  totalSpaces: number;
  // Accessible spaces
  accessibleSpaces: number;
  // Electric vehicle charging spots
  evChargingSpaces: number;
  // Entrance/exit points [lng, lat]
  entrances: [number, number][];
  // Lot type
  type: 'surface' | 'garage' | 'underground' | 'mixed';
  // Operating hours
  hours: { open: string; close: string } | null; // 24h if null
  // Current occupancy (updated by detection engine)
  currentOccupancy?: ParkingLotOccupancy;
}

export interface ParkingLotOccupancy {
  // Current timestamp
  timestamp: string;
  // Occupied spaces
  occupiedSpaces: number;
  // Total spaces
  totalSpaces: number;
  // Occupancy rate 0-1
  occupancyRate: number;
  // Vehicles by type
  vehiclesByType: {
    car: number;
    suv: number;
    truck: number;
    motorcycle: number;
    van: number;
  };
  // Average dwell time (minutes)
  avgDwellMinutes: number;
  // Entry/exit rates (vehicles/hour)
  entryRate: number;
  exitRate: number;
  // Detection source
  source: 'camera' | 'sensor' | 'satellite' | 'simulation' | 'mixed';
  // Confidence 0-1
  confidence: number;
  // Last updated
  lastUpdated: string;
}

// ─── Parking Lot Occupancy History ────────────────────────────────────────────────

export interface BusinessBusyComparison {
  businessId: string;
  businessName: string;
  category: string;
  currentOccupancy: number;
  averageOccupancy: number;
  percentileRank: number; // 0-100, where 100 = busiest in category
  distanceFromUser: number; // meters
  isOpen: boolean;
  lastUpdated: string;
}

export interface ParkingLotOccupancyHistory {
  parkingLotId: string;
  businessId: string;
  records: Array<{
    timestamp: string;
    occupiedSpaces: number;
    totalSpaces: number;
    occupancyRate: number;
    vehiclesByType: Record<VehicleType, number>;
    avgDwellMinutes: number;
    entryRate: number;
    exitRate: number;
    source: 'camera' | 'sensor' | 'satellite' | 'simulation' | 'mixed';
    confidence: number;
  }>;
}

// ─── Camera Discovery Types ────────────────────────────────

export type CameraSource = '511_ny' | '511_tx' | 'nyc_opendata' | 'osm' | 'tomtom' | 'manual' | 'ring' | 'doorbell' | 'cctv' | 'local' | 'all';
export type BearingDirection = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export interface CameraDiscoveryInput {
  location: string | { lat: number; lng: number };  // address or coords
  direction?: BearingDirection | number;              // cardinal string OR bearing degrees
  radiusMiles?: number;                               // 0.5-10, default 2
  source: CameraSource;                               // filter
}

export interface DiscoveredCamera {
  id: string;
  name: string;
  lat: number;
  lng: number;
  camera_bearing?: number;      // which way camera points (0-359°)
  target_bearing?: number;      // bearing from camera to your search target
  alignment_score?: number;     // 0-100% directional match
  roadName?: string;
  direction?: number;
  directionSource?: 'real' | 'inferred' | 'unknown';
  operator?: string;
  source: CameraSource;
  sourceUrl?: string;
  streamUrl?: string;
  protocol?: 'hls' | 'jpeg' | 'mjpeg' | 'rtsp' | 'synthetic';
  stream_url?: string;
  stream_type?: 'mjpeg' | 'hls' | 'image';
  refresh_interval?: number;     // seconds between JPEG polls
  streamVerified?: boolean;      // true = actual fetch succeeded
  is_live?: boolean;           // true = currently receiving frames
  last_frame_timestamp?: string; // ISO timestamp of last successful frame
  confidence: number;
  tags?: Record<string, string>;
  // Camera brand / model tracking
  brand?: CameraBrand;         // 'flock' | 'axon' | 'other'
  model?: string;              // specific model name (e.g. 'Flock Safety F1', 'Axon Flex')
}

export function bearingToCardinal(bearing: number): BearingDirection {
  const dirs: BearingDirection[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(bearing / 45) % 8];
}

export function cardinalToBearing(dir: BearingDirection): number {
  const map: Record<BearingDirection, number> = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };
  return map[dir];
}

// ─── Parking Lot Geometry ───────────────────────────────────────

export interface ParkingLotGeometry {
  id: string;
  businessId: string;
  polygon: [number, number][]; // Polygon coordinates [lng, lat]
  totalSpaces: number;
  accessibleSpaces: number;
  entryPoints: Array<{ lat: number; lng: number; bearing: number }>;
  exitPoints: Array<{ lat: number; lng: number; bearing: number }>;
  isCovered: boolean;
  hasEVCharging: boolean;
}

export interface VehicleDetectionResult {
  parkingLotId: string;
  businessId: string;
  timestamp: string;
  totalVehicles: number;
  vehiclesByType: Record<VehicleType, number>;
  occupiedSpaces: number;
  vacantSpaces: number;
  occupancyRate: number; // 0-1
  detectionMethod: 'satellite' | 'camera' | 'sensor' | 'simulation';
  confidence: number; // 0-1
  // Per-row breakdown for large lots
  rows?: Array<{
    rowId: string;
    spaces: number;
    occupied: number;
    vehicles: Array<{ type: VehicleType; lat: number; lng: number }>;
  }>;
}

export interface BusinessParkingAnalytics {
  businessId: string;
  businessName: string;
  category: BusinessLocation['category'];
  lat: number;
  lng: number;
  // Current snapshot
  currentOccupancy: number; // 0-1
  currentVehicleCount: number;
  totalSpaces: number;
  // Historical comparison
  averageOccupancyForTime: number; // 0-1 based on historical data for this hour/day
  occupancyVsAverage: number; // -1 to 1 (negative = less busy than average)
  // Trends
  hourlyTrend: Array<{ hour: number; occupancy: number; vehicleCount: number }>;
  dailyTrend: Array<{ day: string; avgOccupancy: number; peakOccupancy: number }>;
  // Busy-ness scoring
  busyScore: number; // 0-100 (100 = extremely busy)
  busyLevel: DensityLevel;
  // Predictions
  predictedOccupancyNextHour: number;
  predictedPeakTime: string; // ISO timestamp
  predictedPeakOccupancy: number;
  // Wait time estimates
  estimatedWaitMinutes: number;
  recommendedVisitTime: string; // ISO timestamp of next quiet window
  // Data freshness
  lastUpdated: string;
  dataSource: 'camera' | 'sensor' | 'satellite' | 'simulation' | 'mixed';
  confidence: number;
}

// ─── Route Camera Count ────────────────────────────────────────

export interface RouteCameraCount {
  routeId: string;
  routeName: string;
  totalCameras: number;
  flockCameras: number;
  axonCameras: number;
  otherCameras: number;
  cameras: Array<{ id: string; name: string; brand: CameraBrand; model?: string; lat: number; lng: number }>;
}

// ─── Scanner Incident Types ────────────────────────────────────────

export type ScannerType = 'police' | 'fire' | 'ems';
export type ScannerPriority = 'low' | 'normal' | 'high' | 'emergency';

export interface ScannerIncident {
  id: string;
  type: ScannerType;
  category: string;
  title: string;
  description: string;
  priority: ScannerPriority;
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
  incidentTypes: ScannerType[];
  priorities: ScannerPriority[];
}

// ─── Heatmap Grid Type ───────────────────────────────────────────

export interface HeatGridCell {
  lat: number;
  lng: number;
  weight: number;        // 0-1, overall density
  cameraDensity: number;  // 0-1, camera concentration
  pedestrianDensity: number; // 0-1, business/pedestrian concentration
  roadDensity: number;    // 0-1, road traffic density
  incidentDensity: number; // 0-1, scanner incidents
  lastUpdated: string;
}

export interface HeatGrid {
  grid: HeatGridCell[];
  gridSize: number;       // degrees per cell
  bounds: { north: number; south: number; east: number; west: number };
  lastUpdated: string;
}