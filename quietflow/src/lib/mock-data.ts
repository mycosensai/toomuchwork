import { Camera, BusinessLocation, RoadSegment, DensityLevel, CameraProtocol, CameraBrand } from '@/types';
import { generateTypicalProfile } from './density-utils';

// ─── Deterministic PRNG for module-level mock data ─────────────────
function hashString(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  return () => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(hashString('quietflow/mock-data/v1'));
const BASE_TIME = Date.parse('2026-08-07T12:00:00.000Z');

// ─── Dallas road corridor generators ───────────────────────────────
// Same as before up to line 414 — keeping all existing data intact

const JURISDICTIONS = ['TxDOT', 'City of Dallas', 'DART', 'NCTCOG', 'Dallas County'] as const;
const ORIENTATIONS = ['N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW'] as const;
const RESOLUTIONS = ['1920x1080', '1280x720', '2560x1440', '3840x2160'] as const;

interface CameraGen {
  name: string;
  lat: number;
  lng: number;
  roadName: string;
  orientation: string;
  protocol: CameraProtocol;
  jurisdiction: string;
  resolution: string;
  updateFrequency: number;
  seedLevel: DensityLevel;
}

// ── I-35E corridor ──
const I35E_CAMS: CameraGen[] = [];
for (let i = 0; i < 12; i++) {
  const lat = 32.760 + i * 0.015;
  const crossStreets = ['Colorado', 'Zang', 'Dallas Zoo', 'Illinois', 'Marsalis', 'Ledbetter', 'Loop 12', 'Mockingbird', 'Northwest Hwy', 'Royal Ln', 'Valley View', 'Lakeside'];
  I35E_CAMS.push({
    name: `I-35E @ ${crossStreets[i]} (TxDOT)`,
    lat, lng: -96.800 - Math.sin(i * 0.3) * 0.003,
    roadName: 'I-35E',
    orientation: ORIENTATIONS[(i + 2) % 8],
    protocol: 'hls', jurisdiction: JURISDICTIONS[i % 4],
    resolution: RESOLUTIONS[i % 4],
    updateFrequency: 5 + (i % 3) * 5,
    seedLevel: ['yellow', 'orange', 'red', 'yellow', 'green', 'orange', 'yellow', 'green', 'yellow', 'orange', 'red', 'yellow'][i] as DensityLevel,
  });
}

// ── US-75 corridor ──
const US75_CAMS: CameraGen[] = [];
const us75Cross = ['Downtown', 'Live Oak', 'Haskell', 'SMU Blvd', 'Mockingbird', 'Lovers Ln', 'Northwest Hwy', 'Forest Ln', 'Midpark', 'Campbell'];
for (let i = 0; i < 10; i++) {
  const lat = 32.794 + i * 0.014;
  US75_CAMS.push({
    name: `US-75 @ ${us75Cross[i]} (NCTCOG)`,
    lat, lng: -96.783 + Math.cos(i * 0.5) * 0.004,
    roadName: 'US-75',
    orientation: ORIENTATIONS[(i + 4) % 8],
    protocol: 'hls', jurisdiction: JURISDICTIONS[(i + 1) % 4],
    resolution: RESOLUTIONS[(i + 1) % 4],
    updateFrequency: 5 + (i % 4) * 5,
    seedLevel: ['orange', 'red', 'orange', 'yellow', 'green', 'yellow', 'orange', 'yellow', 'green', 'yellow'][i] as DensityLevel,
  });
}

// ── I-635 corridor ──
const I635_CAMS: CameraGen[] = [];
const i635Cross = ['Tom Braniff', 'Preston', 'Hillcrest', 'Coit', 'Central (US-75)', 'Greenville', 'Plano Rd', 'Jupiter'];
for (let i = 0; i < 8; i++) {
  const lng = -96.840 + i * 0.015;
  I635_CAMS.push({
    name: `I-635 @ ${i635Cross[i]} (TxDOT)`,
    lat: 32.915 + Math.sin(i * 0.7) * 0.005, lng,
    roadName: 'I-635',
    orientation: ORIENTATIONS[(i + 1) % 8],
    protocol: 'hls', jurisdiction: JURISDICTIONS[(i + 2) % 4],
    resolution: RESOLUTIONS[(i + 2) % 4],
    updateFrequency: 8 + (i % 3) * 4,
    seedLevel: ['orange', 'yellow', 'yellow', 'red', 'orange', 'yellow', 'green', 'yellow'][i] as DensityLevel,
  });
}

// ── I-30 corridor ──
const I30_CAMS: CameraGen[] = [];
const i30Cross = ['West Dallas', 'Beckley', 'Hampton', 'Zang', 'I-35E', 'Ervay', 'US-75', 'Fitzhugh'];
for (let i = 0; i < 8; i++) {
  const lng = -96.880 + i * 0.020;
  I30_CAMS.push({
    name: `I-30 @ ${i30Cross[i]} (TxDOT)`,
    lat: 32.767 + Math.cos(i * 0.4) * 0.003, lng,
    roadName: 'I-30',
    orientation: ORIENTATIONS[(i + 3) % 8],
    protocol: 'hls', jurisdiction: JURISDICTIONS[(i + 3) % 4],
    resolution: RESOLUTIONS[(i + 3) % 4],
    updateFrequency: 6 + (i % 2) * 6,
    seedLevel: ['green', 'yellow', 'green', 'yellow', 'orange', 'red', 'orange', 'yellow'][i] as DensityLevel,
  });
}

// ── Surface street cameras ──
const SURFACE_CAMS: CameraGen[] = [
  { name: 'Oak Lawn @ Cedar Springs', lat: 32.8008, lng: -96.8035, roadName: 'Oak Lawn Ave', orientation: 'S', protocol: 'jpeg', jurisdiction: 'City of Dallas', resolution: '1920x1080', updateFrequency: 3, seedLevel: 'green' },
  { name: 'Main St @ St Paul', lat: 32.7826, lng: -96.8030, roadName: 'Main St', orientation: 'E', protocol: 'jpeg', jurisdiction: 'City of Dallas', resolution: '1280x720', updateFrequency: 3, seedLevel: 'green' },
  { name: 'Elm St @ Crowdus (Deep Ellum)', lat: 32.7845, lng: -96.7828, roadName: 'Elm St', orientation: 'W', protocol: 'jpeg', jurisdiction: 'City of Dallas', resolution: '1920x1080', updateFrequency: 5, seedLevel: 'yellow' },
  { name: 'Mockingbird @ 75', lat: 32.8385, lng: -96.7805, roadName: 'Mockingbird Ln', orientation: 'E', protocol: 'jpeg', jurisdiction: 'Dallas County', resolution: '2560x1440', updateFrequency: 4, seedLevel: 'orange' },
  { name: 'NW Hwy @ 35E', lat: 32.8593, lng: -96.8100, roadName: 'Loop 12 / NW Hwy', orientation: 'W', protocol: 'jpeg', jurisdiction: 'Dallas County', resolution: '1280x720', updateFrequency: 6, seedLevel: 'red' },
  { name: 'Forest Ln @ 75', lat: 32.9050, lng: -96.7790, roadName: 'Forest Ln', orientation: 'E', protocol: 'jpeg', jurisdiction: 'City of Dallas', resolution: '1920x1080', updateFrequency: 3, seedLevel: 'yellow' },
  { name: 'Commerce @ Record', lat: 32.7815, lng: -96.7960, roadName: 'Commerce St', orientation: 'N', protocol: 'jpeg', jurisdiction: 'City of Dallas', resolution: '1280x720', updateFrequency: 5, seedLevel: 'green' },
  { name: 'Garland @ SMU', lat: 32.8271, lng: -96.7872, roadName: 'Garland Rd', orientation: 'S', protocol: 'jpeg', jurisdiction: 'Dallas County', resolution: '1920x1080', updateFrequency: 4, seedLevel: 'yellow' },
  { name: 'Jefferson @ Bishop (Oak Cliff)', lat: 32.7425, lng: -96.8220, roadName: 'Jefferson Blvd', orientation: 'N', protocol: 'jpeg', jurisdiction: 'City of Dallas', resolution: '1280x720', updateFrequency: 5, seedLevel: 'green' },
  { name: 'Greenville @ Belmont', lat: 32.8137, lng: -96.7698, roadName: 'Greenville Ave', orientation: 'E', protocol: 'jpeg', jurisdiction: 'City of Dallas', resolution: '2560x1440', updateFrequency: 3, seedLevel: 'yellow' },
  { name: 'Preston Rd @ Frankford', lat: 32.9862, lng: -96.8025, roadName: 'Preston Rd', orientation: 'N', protocol: 'jpeg', jurisdiction: 'Dallas County', resolution: '1920x1080', updateFrequency: 4, seedLevel: 'green' },
  { name: 'Inwood @ University', lat: 32.8478, lng: -96.8273, roadName: 'Inwood Rd', orientation: 'W', protocol: 'jpeg', jurisdiction: 'City of Dallas', resolution: '1280x720', updateFrequency: 5, seedLevel: 'yellow' },
];

// ── DNT (Dallas North Tollway) corridor ──
const DNT_CAMS: CameraGen[] = [];
const dntCross = ['Downtown', 'Oak Lawn', 'Wycliff', 'Love Field', 'Walnut Hill', 'Alpha', 'Belt Line', 'Spring Valley', 'Frankford', 'Parker', 'Plano Pkwy', 'Legacy'];
for (let i = 0; i < 12; i++) {
  const lat = 32.792 + i * 0.018;
  DNT_CAMS.push({
    name: `DNT @ ${dntCross[i]} (NTTA)`,
    lat, lng: -96.820 + Math.sin(i * 0.3) * 0.003,
    roadName: 'Dallas North Tollway',
    orientation: ORIENTATIONS[(i + 5) % 8],
    protocol: 'hls', jurisdiction: JURISDICTIONS[(i + 2) % 4],
    resolution: RESOLUTIONS[(i + 2) % 4],
    updateFrequency: 5 + (i % 3) * 5,
    seedLevel: ['orange', 'yellow', 'yellow', 'red', 'orange', 'yellow', 'green', 'yellow', 'orange', 'red', 'yellow', 'green'][i] as DensityLevel,
  });
}

const EXTRA_CAMS: CameraGen[] = [
  { name: 'Skillman @ Abrams', lat: 32.8478, lng: -96.7585, roadName: 'Skillman St', orientation: 'N', protocol: 'jpeg', jurisdiction: 'City of Dallas', resolution: '1920x1080', updateFrequency: 4, seedLevel: 'yellow' },
  { name: 'Belt Line @ Midway', lat: 32.9105, lng: -96.8380, roadName: 'Belt Line Rd', orientation: 'W', protocol: 'jpeg', jurisdiction: 'Dallas County', resolution: '1280x720', updateFrequency: 5, seedLevel: 'green' },
  { name: 'Abrams @ Lake Highlands', lat: 32.8776, lng: -96.7162, roadName: 'Abrams Rd', orientation: 'N', protocol: 'jpeg', jurisdiction: 'City of Dallas', resolution: '2560x1440', updateFrequency: 3, seedLevel: 'yellow' },
  { name: 'Buckner @ Grand Prairie', lat: 32.7520, lng: -96.7645, roadName: 'Buckner Blvd', orientation: 'S', protocol: 'jpeg', jurisdiction: 'Dallas County', resolution: '1280x720', updateFrequency: 6, seedLevel: 'green' },
  { name: 'Ferguson @ Peavy', lat: 32.8354, lng: -96.7342, roadName: 'Ferguson Rd', orientation: 'E', protocol: 'jpeg', jurisdiction: 'City of Dallas', resolution: '1920x1080', updateFrequency: 4, seedLevel: 'yellow' },
  { name: 'Kiest @ Cockrell Hill', lat: 32.7140, lng: -96.8670, roadName: 'Kiest Blvd', orientation: 'W', protocol: 'jpeg', jurisdiction: 'City of Dallas', resolution: '1280x720', updateFrequency: 5, seedLevel: 'green' },
  { name: 'Ross @ Hall', lat: 32.7905, lng: -96.7865, roadName: 'Ross Ave', orientation: 'E', protocol: 'jpeg', jurisdiction: 'City of Dallas', resolution: '1920x1080', updateFrequency: 3, seedLevel: 'yellow' },
  { name: 'Fitzhugh @ Gaston', lat: 32.7922, lng: -96.7750, roadName: 'Fitzhugh Ave', orientation: 'N', protocol: 'jpeg', jurisdiction: 'City of Dallas', resolution: '1280x720', updateFrequency: 4, seedLevel: 'green' },
  { name: 'Buckingham @ Jupiter', lat: 32.9275, lng: -96.7348, roadName: 'Buckingham Rd', orientation: 'E', protocol: 'jpeg', jurisdiction: 'Dallas County', resolution: '1920x1080', updateFrequency: 5, seedLevel: 'yellow' },
  { name: 'Samuel @ Lancaster', lat: 32.7280, lng: -96.7900, roadName: 'Samuel Blvd', orientation: 'W', protocol: 'jpeg', jurisdiction: 'City of Dallas', resolution: '1280x720', updateFrequency: 6, seedLevel: 'green' },
  { name: 'Abrams @ Kingsley', lat: 32.8634, lng: -96.7350, roadName: 'Abrams Rd', orientation: 'N', protocol: 'jpeg', jurisdiction: 'City of Dallas', resolution: '1920x1080', updateFrequency: 4, seedLevel: 'yellow' },
  { name: 'Henderson @ Belmont', lat: 32.8115, lng: -96.7765, roadName: 'Henderson Ave', orientation: 'S', protocol: 'jpeg', jurisdiction: 'City of Dallas', resolution: '2560x1440', updateFrequency: 3, seedLevel: 'green' },
  { name: 'Dyer @ Lookout', lat: 32.8017, lng: -96.7397, roadName: 'Dyer Rd', orientation: 'E', protocol: 'jpeg', jurisdiction: 'Dallas County', resolution: '1280x720', updateFrequency: 5, seedLevel: 'yellow' },
];

// ── Extended corridor: more cameras across wider DFW metro ──
const EXTENDED_CAMERAS: CameraGen[] = [];
const extendedCrossings = [
  { road: 'I-35E', lat: 32.720, lng: -96.790, name: 'I-35E @ I-30', jurisdiction: 'TxDOT' },
  { road: 'I-35E', lat: 32.950, lng: -96.800, name: 'I-35E @ LBJ Pkwy', jurisdiction: 'TxDOT' },
  { road: 'US-75', lat: 32.650, lng: -96.770, name: 'US-75 @ I-30', jurisdiction: 'NCTCOG' },
  { road: 'US-75', lat: 33.020, lng: -96.740, name: 'US-75 @ Plano Rd', jurisdiction: 'NCTCOG' },
  { road: 'I-635', lat: 32.890, lng: -96.900, name: 'I-635 @ Hillcrest', jurisdiction: 'TxDOT' },
  { road: 'I-635', lat: 32.890, lng: -96.650, name: 'I-635 @ Coit', jurisdiction: 'TxDOT' },
  { road: 'I-30', lat: 32.760, lng: -96.930, name: 'I-30 @ Beach St', jurisdiction: 'TxDOT' },
  { road: 'I-30', lat: 32.760, lng: -96.650, name: 'I-30 @ Abram', jurisdiction: 'TxDOT' },
  { road: 'I-20', lat: 32.730, lng: -96.850, name: 'I-20 @ I-35E', jurisdiction: 'TxDOT' },
  { road: 'I-20', lat: 32.730, lng: -96.680, name: 'I-20 @ US-75', jurisdiction: 'TxDOT' },
  { road: 'Belt Line', lat: 32.830, lng: -96.910, name: 'Belt Line @ Royal', jurisdiction: 'City of Dallas' },
  { road: 'Belt Line', lat: 32.830, lng: -96.650, name: 'Belt Line @ Greenville', jurisdiction: 'City of Dallas' },
  { road: 'Northwest Hwy', lat: 32.860, lng: -96.890, name: 'NW Hwy @ Midway', jurisdiction: 'Dallas County' },
  { road: 'Northwest Hwy', lat: 32.860, lng: -96.740, name: 'NW Hwy @ Plano Rd', jurisdiction: 'Dallas County' },
  { road: 'Lovers Ln', lat: 32.835, lng: -96.830, name: 'Lovers @ Douglas', jurisdiction: 'City of Dallas' },
  { road: 'Mockingbird Ln', lat: 32.840, lng: -96.850, name: 'Mockingbird @ Zang', jurisdiction: 'City of Dallas' },
  { road: 'Mockingbird Ln', lat: 32.850, lng: -96.760, name: 'Mockingbird @ Abrams', jurisdiction: 'City of Dallas' },
  { road: 'Preston Rd', lat: 32.980, lng: -96.830, name: 'Preston @ Northwest Hwy', jurisdiction: 'City of Dallas' },
  { road: 'Preston Rd', lat: 32.890, lng: -96.800, name: 'Preston @ Park', jurisdiction: 'Dallas County' },
  { road: 'Greenville Ave', lat: 32.800, lng: -96.780, name: 'Greenville @ Mockingbird', jurisdiction: 'City of Dallas' },
  { road: 'Greenville Ave', lat: 32.830, lng: -96.770, name: 'Greenville @ Lovers', jurisdiction: 'Dallas County' },
  { road: 'Oak Lawn Ave', lat: 32.800, lng: -96.830, name: 'Oak Lawn @ Cedar Springs', jurisdiction: 'City of Dallas' },
  { road: 'Bassemier', lat: 32.900, lng: -96.820, name: 'Skillman @ Bassemier', jurisdiction: 'City of Dallas' },
  { road: 'Skillman', lat: 32.870, lng: -96.770, name: 'Skillman @ Abrams', jurisdiction: 'City of Dallas' },
  { road: 'Coit Rd', lat: 33.020, lng: -96.780, name: 'Coit @ Park', jurisdiction: 'Dallas County' },
  { road: 'Coit Rd', lat: 32.930, lng: -96.750, name: 'Coit @ Preston', jurisdiction: 'Dallas County' },
  { road: 'Gaylord', lat: 33.050, lng: -96.850, name: 'Gaylord @ Jupiter', jurisdiction: 'City of Dallas' },
  { road: 'Midpark', lat: 32.860, lng: -96.780, name: 'Midpark @ Greenville', jurisdiction: 'Dallas County' },
  { road: 'McCallum', lat: 32.920, lng: -96.790, name: 'McCallum @ Coit', jurisdiction: 'Dallas County' },
  { road: 'Arapaho Rd', lat: 33.030, lng: -96.880, name: 'Arapaho @ Coit', jurisdiction: 'Dallas County' },
];

// Snapshot the array before mutating to avoid an infinite loop
// (for...of over an array that grows during iteration never terminates).
for (const ec of [...EXTENDED_CAMERAS]) {
  EXTENDED_CAMERAS.push({
    name: ec.name,
    lat: ec.lat,
    lng: ec.lng,
    roadName: ec.roadName,
    orientation: ORIENTATIONS[Math.floor(rand() * 8)],
    protocol: rand() > 0.5 ? 'hls' : 'jpeg',
    jurisdiction: ec.jurisdiction,
    resolution: RESOLUTIONS[Math.floor(rand() * 4)],
    updateFrequency: 3 + Math.floor(rand() * 7),
    seedLevel: (['green', 'yellow', 'orange', 'red', 'purple'][Math.floor(rand() * 5)]) as DensityLevel,
  });
}

// ── Ring doorbell cameras (mock data — private feeds, synthetic fallback) ──
const RING_DOORBELL_CAMS: CameraGen[] = [
  { name: 'Ring Doorbell @ N Central Expy (Private)', lat: 32.8100, lng: -96.8000, roadName: 'N Central Expy', orientation: 'S', protocol: 'jpeg', jurisdiction: 'Private Residence', resolution: '1920x1080', updateFrequency: 1, seedLevel: 'green' },
  { name: 'Ring Doorbell @ Oak Lawn Ave (Private)', lat: 32.8008, lng: -96.8035, roadName: 'Oak Lawn Ave', orientation: 'N', protocol: 'jpeg', jurisdiction: 'Private Residence', resolution: '1080x1440', updateFrequency: 1, seedLevel: 'green' },
  { name: 'Ring Doorbell @ Greenville Ave (Private)', lat: 32.8137, lng: -96.7698, roadName: 'Greenville Ave', orientation: 'S', protocol: 'jpeg', jurisdiction: 'Private Residence', resolution: '1536x2048', updateFrequency: 1, seedLevel: 'yellow' },
  { name: 'Ring Doorbell @ Preston Rd (Private)', lat: 32.9862, lng: -96.8025, roadName: 'Preston Rd', orientation: 'N', protocol: 'jpeg', jurisdiction: 'Private Residence', resolution: '1920x1080', updateFrequency: 1, seedLevel: 'green' },
  { name: 'Ring Doorbell @ Lovers Ln (Private)', lat: 32.8350, lng: -96.8300, roadName: 'Lovers Ln', orientation: 'S', protocol: 'jpeg', jurisdiction: 'Private Residence', resolution: '1536x2048', updateFrequency: 1, seedLevel: 'yellow' },
];

// ── Doorbell cameras (generic, non-Ring) ──
const DOORBELL_CAMS: CameraGen[] = [
  { name: 'Nest Hello Doorbell (Private)', lat: 32.8385, lng: -96.7950, roadName: 'Mockingbird Ln', orientation: 'N', protocol: 'jpeg', jurisdiction: 'Private Residence', resolution: '1600x1200', updateFrequency: 1, seedLevel: 'green' },
  { name: 'Doorbell Camera @ Uptown (Private)', lat: 32.8030, lng: -96.8000, roadName: 'Uptown', orientation: 'S', protocol: 'jpeg', jurisdiction: 'Private Residence', resolution: '1280x720', updateFrequency: 1, seedLevel: 'green' },
  { name: 'Eufy Doorbell (Private)', lat: 32.7830, lng: -96.7990, roadName: 'Downtown', orientation: 'N', protocol: 'jpeg', jurisdiction: 'Private Residence', resolution: '1600x1200', updateFrequency: 1, seedLevel: 'yellow' },
];

// ── CCTV cameras on buildings (businesses, parking, public areas) ──
const CCTV_CAMERAS: CameraGen[] = [
  { name: 'Westfield Garden State CCTV', lat: 32.9100, lng: -96.7890, roadName: 'Preston Rd', orientation: 'S', protocol: 'mjpeg', jurisdiction: 'Westfield', resolution: '1280x720', updateFrequency: 0, seedLevel: 'yellow' },
  { name: 'Dallas Farmers Market CCTV', lat: 32.7840, lng: -96.7960, roadName: 'Harwood St', orientation: 'N', protocol: 'mjpeg', jurisdiction: 'City of Dallas', resolution: '1920x1080', updateFrequency: 3, seedLevel: 'green' },
  { name: 'Mockingbird Station CCTV', lat: 32.8380, lng: -96.7800, roadName: 'Mockingbird Ln', orientation: 'S', protocol: 'mjpeg', jurisdiction: 'DART', resolution: '1280x720', updateFrequency: 2, seedLevel: 'yellow' },
  { name: 'Galleria Mall Entrance CCTV', lat: 32.9200, lng: -96.8250, roadName: 'Coit Rd', orientation: 'N', protocol: 'mjpeg', jurisdiction: 'Galleria Mall', resolution: '1920x1080', updateFrequency: 2, seedLevel: 'orange' },
  { name: 'Love Field Terminal CCTV', lat: 32.8450, lng: -96.8500, roadName: 'Love Field Rd', orientation: 'S', protocol: 'mjpeg', jurisdiction: 'Dallas Love Field', resolution: '1280x720', updateFrequency: 2, seedLevel: 'yellow' },
  { name: 'Deep Ellum Parking CCTV', lat: 32.7850, lng: -96.7830, roadName: 'Main St', orientation: 'N', protocol: 'mjpeg', jurisdiction: 'City of Dallas', resolution: '1280x720', updateFrequency: 3, seedLevel: 'orange' },
];

const ALL_CAMS = [...I35E_CAMS, ...US75_CAMS, ...I635_CAMS, ...I30_CAMS, ...DNT_CAMS, ...SURFACE_CAMS, ...EXTRA_CAMS, ...EXTENDED_CAMERAS, ...RING_DOORBELL_CAMS, ...DOORBELL_CAMS, ...CCTV_CAMERAS];

export const MOCK_CAMERAS: Camera[] = ALL_CAMS.map((c, i) => {
  const { seedLevel: _sl, ...rest } = c;
  // Assign brand based on camera name/jurisdiction
  const isRing = c.name.toLowerCase().includes('ring');
  const isCctv = c.name.toLowerCase().includes('cctv') || c.protocol === 'mjpeg';
  const isDoorbell = c.jurisdiction === 'Private Residence' && !isRing;
  let brand: CameraBrand;
  let model: string | undefined;
  if (isRing) {
    brand = 'ring';
    model = 'Ring Video Doorbell';
  } else if (isCctv) {
    brand = 'cctv';
    model = c.protocol === 'mjpeg' ? 'CCTV (MJPEG)' : 'CCTV';
  } else if (isDoorbell) {
    brand = 'other';
    model = c.name.includes('Nest') ? 'Nest Hello' : c.name.includes('Eufy') ? 'Eufy Doorbell' : 'Doorbell Cam';
  } else {
    const brandRoll = rand();
    brand = brandRoll < 0.15 ? 'flock' as const : brandRoll < 0.25 ? 'axon' as const : 'other' as const;
    model = brand === 'flock' ? 'Flock Safety F1' : brand === 'axon' ? 'Axon Flex' : undefined;
  }
  return {
    id: `cam-${i + 1}`,
    ...rest,
    privacyMasks: [],
    lastFrameAt: new Date(BASE_TIME - rand() * 60000).toISOString(),
    healthScore: 0.5 + rand() * 0.5,
    vehicleCountEst: Math.floor(rand() * 40) + 3,
    status: 'online' as const,
    brand,
    model,
    densityLevel: c.seedLevel,
    isPublic: true,
    publicNote: `${c.jurisdiction} public ${c.protocol === 'hls' ? 'traffic' : 'surveillance'} camera`,
    thumbnailUrl: undefined,
    // cdn.txdottraffic.org and traffic.dallas.gov are decommissioned (NXDOMAIN) —
    // mock cameras render the built-in synthetic demo feed instead of dead URLs.
    streamUrl: `synthetic://${c.roadName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`,
    protocol: 'synthetic' as const,
    is_live: false,
    last_frame_timestamp: undefined,
  };
}).sort(() => rand() - 0.5).map((c, i) => ({ ...c, id: `cam-${i + 1}` }));

// ─── MASSIVE BUSINESS DATA (150+ POIs across DFW) ────────────────

// Realistic DFW business names for each category
const BUSINESS_NAMES: Record<string, string[]> = {
  grocery: ['Whole Foods Market', 'Trader Joe\'s', 'Central Market', 'Sprouts Farmers Market', 'Fiesta Mart', 'El Rancho', 'Aldi', 'Kroger', 'Tom Thumb', 'Walmart Neighborhood Market', 'Target Grocery', 'H-E-B Central Market', 'Minyard Food Store', 'Carnival Grocery', 'Food Town'],
  pharmacy: ['CVS Pharmacy', 'Walgreens', 'Rite Aid', 'Kroger Pharmacy', 'Tom Thumb Pharmacy', 'MedPlus Pharmacy', 'Allegiance Pharmacy', 'Parkland Pharmacy', 'Albertsons Sav-On', 'Health Mart Pharmacy'],
  coffee: ['Starbucks', 'Dunkin\'', '8-Bit Brew', 'Houndstooth Coffee', 'Weekend Coffee', 'White Rhino Coffee', 'Ascension Coffee', 'Mudhen Cafe', 'Cultivar Coffee', 'OAK Coffee', 'Uncommon Coffee', 'Figure Coffee', 'Pearl Cup Coffee', 'Full City Rooster', 'Park Cities Coffee'],
  restaurant: ['Rodeo Goat', 'Cattleack Barbecue', 'Casa Rubia', 'Uncle Uber\'s Sammich Shop', 'The Rustic', 'FT33', 'Knox Street Bistro', 'Bullion', 'Bowen House', 'Terry Black\'s BBQ', 'McDonald\'s', 'Whataburger', 'Taco Bell', 'Panda Express', 'Chipotle', 'Pei Wei', 'Mesero', 'Mi Cocina', 'Taqueria La Ventana', 'Cane Rosso', 'HG Sply Co.', 'Sixty Vines', 'Meso Maya', 'Rise Soufflé'],
  fast_food: ['McDonald\'s', 'Whataburger', 'Taco Bell', 'Panda Express', 'Chipotle', 'Chick-fil-A', 'Wendy\'s', 'Burger King', 'Sonic Drive-In', 'Raising Cane\'s', 'Popeyes', 'Jack in the Box', 'KFC', 'Taco Bueno', 'Torchy\'s Tacos'],
  gas_station: ['Shell', 'Exxon', 'Chevron', '7-Eleven', 'RaceTrac', 'Valero', 'Phillips 66', 'Circle K', 'QT (QuikTrip)', 'Murphy USA', 'Costco Gas', 'Sam\'s Club Fuel', 'Sunoco', 'Stripes', 'Buc-ee\'s'],
  bank: ['Chase Bank', 'Bank of America', 'Wells Fargo', 'Comerica', 'Texas Capital Bank', 'US Bank', 'Citibank', 'Regions Bank', 'Frost Bank', 'Ammex Bank', 'BBVA', 'PNC Bank', 'Capital One', 'TIB Bank', 'Varo Bank'],
  post_office: ['Dallas Main Post Office', 'Oak Lawn Postal', 'Uptown Post Office', 'Mockingbird Station USPS', 'Preston Hollow Mail', 'Lakewood Post Office', 'Fair Park Post Office', 'Jefferson Station', 'Casa Linda Station', 'White Rock Station'],
  library: ['Dallas Public Library - Main', 'J. Erik Jonsson Library', 'Oak Lawn Public Library', 'Hampton-Illinois Library', 'Preston Royal Library', 'Lakewood Branch Library', 'Fretz Park Library', 'Pauline Wayman Library', 'Highland Hills Library', 'Grauwyler Park Library', 'Skyline Library', 'Audelia Road Library'],
  park: ['Klyde Warren Park', 'White Rock Lake Park', 'Main Street Garden', 'Lee Park (Arlington Park)', 'Turtle Creek Park', 'Griggs Park', 'Fair Park', 'Lake Cliff Park', 'Exall Park', 'Flag Pole Hill Park', 'Reverchon Park', 'Kidd Springs Park', 'Bachman Lake Park', 'Northaven Park', 'Fretz Park'],
  retail: ['Target', 'Walmart', 'Best Buy', 'Nordstrom Rack', 'Home Depot', 'Lowe\'s', 'Old Navy', 'Dollar Tree', 'Bed Bath & Beyond', 'Kohl\'s', 'Marshalls', 'TJ Maxx', 'Ross Dress for Less', 'The Container Store', 'IKEA', 'Costco', 'Sam\'s Club', 'Walmart Supercenter', 'H&M', 'Burlington'],
  hospital: ['UT Southwestern Medical Center', 'Baylor University Medical Center', 'Parkland Memorial Hospital', 'Methodist Dallas Medical Center', 'Presbyterian Hospital of Dallas', 'Medical City Dallas Hospital', 'Children\'s Medical Center Dallas', 'Dallas VA Medical Center', 'Texas Health Dallas', 'Zale Lipshy Hospital', 'St. Paul University Hospital', 'Lakewood Medical Center'],
  school: ['SMU (Southern Methodist University)', 'Dallas College - El Centro', 'UDALL (University of Dallas)', 'Dallas ISD - Booker T. Washington', 'Highland Park High School', 'St. Mark\'s School of Texas', 'The Hockaday School', 'Ursuline Academy', 'Dallas International School', 'Greenhill School', 'Episcopal School of Dallas', 'Lakehill Preparatory School'],
  hotel: ['The Joule Hotel', 'Omni Dallas Hotel', 'Statler Hilton', 'Ritz-Carlton Dallas', 'Hotel ZaZa', 'The Adolphus', 'Marriott Dallas City Center', 'Hilton Anatole', 'Canopy by Hilton', 'Moxy Dallas Uptown', 'Hyatt Regency Dallas', 'Sheraton Dallas', 'Westin Galleria', 'Embassy Suites', 'Aloft Dallas'],
  gym: ['Gold\'s Gym', 'LA Fitness', 'Planet Fitness', '24 Hour Fitness', 'YMCA White Rock', 'YMCA Central Dallas', 'OrangeTheory Fitness', 'Barry\'s Bootcamp', 'Pure Barre', 'SoulCycle', 'Equinox Highland Park', 'Camp Gladiator', 'Fitness Connection', 'The Rush Fitness', 'CKO Kickboxing'],
  laundromat: ['Laundry Time', 'Wash & Dry', 'Spin Clean Laundry', 'Sud Stop', 'Clean Bubbles Laundry', 'QuickWash Coin Laundry', 'Laundry Lounge', 'Fresh Spin Laundry', 'Blue Door Laundry', 'The Laundry Room'],
  bar: ['The Tipsy Alchemist', 'Double Wide', 'The Old Monk', 'Windmill Lounge', 'Reveler\'s Hall', 'High & Tight', 'Truth & Alibi', 'Atwater Alley', 'Hide', 'Standard Pour', 'Sissy\'s Southern Kitchen & Bar', 'The Mitchell', 'Bishop Cider Company', 'Deep Ellum Brewing Co.', 'Pegasus City Brewing'],
  convenience: ['7-Eleven', 'Circle K', 'QuickTrip', 'Racetrac', 'Stop & Go', 'Stripes', 'Kwik Kar', 'Uptown Mart', 'Corner Store', 'Fuel City'],
  hardware: ['Home Depot', 'Lowe\'s', 'Ace Hardware', 'True Value', 'Harbor Freight Tools', 'Central Hardware', 'Dallas Tool & Supply', 'Preston Hardware', 'Lakewood Hardware', 'White Rock Hardware'],
  car_wash: ['Flagship Carwash', 'Ultra Car Wash', 'Super Star Car Wash', 'Tommy\'s Express Car Wash', 'Mister Car Wash', 'Quick Quack Car Wash', 'Autobell Car Wash', 'Pearl Car Wash', 'Bubble Bath Car Wash', 'Clean Streak Car Wash'],
  parking: ['Dallas Parking - CityPlace', 'ParkMobile - Downtown', 'AAA Parking Galleria', 'Park Whiz - Deep Ellum', 'LAZ Parking Uptown', 'RePark Dallas', 'Premier Parking Knox', 'Elite Parking Highland Park', 'Metro Parking Mockingbird', 'Central Parking Love Field'],
  atm: ['Chase ATM', 'Bank of America ATM', 'Wells Fargo ATM', 'Comerica ATM', 'Frost Bank ATM', 'Capital One ATM', 'Speedway ATM', '7-Eleven ATM', 'CVS ATM', 'Walmart ATM'],
  transit: ['DART - Pearl/Arts District Station', 'DART - Union Station', 'DART - Mockingbird Station', 'DART - Downtown Line', 'DART - Cityplace/Uptown Station', 'DART - West End Station', 'DART - Victory Station', 'DART - LBJ/Central Station', 'DART - Park Lane Station', 'DART - South Side Station'],
  police: ['Dallas Police Headquarters', 'Dallas PD - Central Division', 'Dallas PD - Northeast Division', 'Dallas PD - Southeast Division', 'Dallas PD - Southwest Division', 'Dallas PD - North Central Division', 'Dallas County Sheriff', 'Texas DPS Dallas', 'DART Police', 'Love Field Police'],
  fire_station: ['Dallas Fire-Rescue Station 1', 'DFD Station 8 - Downtown', 'DFD Station 18 - Oak Lawn', 'DFD Station 23 - Lakewood', 'DFD Station 30 - Preston Hollow', 'DFD Station 36 - Love Field', 'DFD Station 42 - White Rock', 'DFD Station 48 - Far North', 'DFD Station 55 - Cedar Springs', 'DFD Station 60 - Deep Ellum'],
  place_of_worship: ['First Baptist Church Dallas', 'Dallas Temple - The Church of Jesus Christ', 'St. John\'s Catholic Church', 'St. Michael and All Angels', 'Thanksgiving Square', 'Cathedral Santuario de Guadalupe', 'Temple Emanu-El', 'The Potter\'s House', 'Dallas Korean Church', 'Islamic Association of Dallas'],
  other: ['Dallas Pets Alive Adoption', 'Perot Museum of Nature & Science', 'Dallas Museum of Art', 'Nasher Sculpture Center', 'The Sixth Floor Museum', 'AT&T Discovery District', 'West Village Shopping', 'Dallas Zoo', 'Texas Discovery Gardens', 'Dallas Arboretum', 'Dallas Farmers Market', 'Dallas World Aquarium', 'The Star in Frisco', 'AT&T Stadium (Arlington)', 'American Airlines Center'],
};

// ─── Clusters (expanded) ──────────────────────────────────

interface BizCluster { area: string; lat: number; lng: number; categories: string[]; }
const clusters: BizCluster[] = [
  { area: 'uptown', lat: 32.803, lng: -96.797, categories: ['grocery', 'coffee', 'restaurant', 'pharmacy', 'bank', 'bar', 'car_wash', 'hotel'] },
  { area: 'downtown', lat: 32.783, lng: -96.799, categories: ['bank', 'post_office', 'restaurant', 'library', 'retail', 'hotel', 'atm', 'transit', 'police'] },
  { area: 'deepellum', lat: 32.784, lng: -96.780, categories: ['coffee', 'restaurant', 'retail', 'other', 'bar', 'car_wash'] },
  { area: 'knox', lat: 32.806, lng: -96.790, categories: ['grocery', 'coffee', 'restaurant', 'retail', 'bar', 'hotel'] },
  { area: 'princess-lake', lat: 32.830, lng: -96.788, categories: ['park', 'restaurant', 'coffee', 'grocery'] },
  { area: 'highland-park', lat: 32.838, lng: -96.795, categories: ['pharmacy', 'grocery', 'coffee', 'retail', 'hardware', 'school', 'place_of_worship'] },
  { area: 'preston-hollow', lat: 32.865, lng: -96.802, categories: ['grocery', 'pharmacy', 'bank', 'restaurant', 'gas_station', 'retail'] },
  { area: 'lakewood', lat: 32.825, lng: -96.768, categories: ['park', 'coffee', 'restaurant', 'retail', 'library', 'laundromat', 'hardware'] },
  { area: 'oakcliff', lat: 32.745, lng: -96.825, categories: ['grocery', 'pharmacy', 'restaurant', 'post_office', 'gas_station', 'laundromat'] },
  { area: 'far-north', lat: 32.910, lng: -96.785, categories: ['grocery', 'retail', 'restaurant', 'bank', 'coffee', 'gas_station', 'fast_food'] },
  { area: 'love-field', lat: 32.845, lng: -96.840, categories: ['park', 'other', 'restaurant', 'hotel', 'parking', 'transit', 'car_wash'] },
  { area: 'cedars', lat: 32.770, lng: -96.810, categories: ['grocery', 'pharmacy', 'bank', 'retail', 'other', 'gas_station'] },
  // New clusters for wider coverage
  { area: 'white-rock', lat: 32.830, lng: -96.730, categories: ['park', 'restaurant', 'coffee', 'laundromat', 'gym'] },
  { area: 'north-dallas', lat: 32.940, lng: -96.790, categories: ['grocery', 'retail', 'fast_food', 'gas_station', 'gym', 'hardware'] },
  { area: 'oak-lawn', lat: 32.808, lng: -96.805, categories: ['coffee', 'restaurant', 'bar', 'pharmacy', 'laundromat', 'car_wash'] },
  { area: 'medical-district', lat: 32.812, lng: -96.835, categories: ['hospital', 'pharmacy', 'park', 'restaurant', 'hotel'] },
  { area: 'fair-park', lat: 32.780, lng: -96.755, categories: ['park', 'other', 'police', 'fire_station', 'transit'] },
  { area: 'skillman', lat: 32.860, lng: -96.755, categories: ['grocery', 'pharmacy', 'fast_food', 'gas_station', 'retail', 'hospital'] },
  { area: 'walnut-hill', lat: 32.878, lng: -96.818, categories: ['grocery', 'retail', 'gas_station', 'gym', 'restaurant'] },
  { area: 'park-cities', lat: 32.850, lng: -96.810, categories: ['school', 'place_of_worship', 'library', 'park', 'post_office'] },
];

const generatedBusinesses: any[] = [];
let bizIdx = 0;

// Generate businesses: 2-4 per cluster per category
for (const cluster of clusters) {
  for (const cat of cluster.categories) {
    const names = BUSINESS_NAMES[cat];
    if (!names) continue;
    const used = generatedBusinesses.filter((b) => b.category === cat).length;
    if (rand() > 0.7) continue; // not every cat in every cluster
    const count = rand() > 0.5 ? 2 : 1;
    for (let j = 0; j < count && bizIdx < 180; j++) {
      const name = names[(used + j) % names.length];
      const angle = rand() * Math.PI * 2;
      const spread = 0.006 + rand() * 0.012;
      const rating = 3 + rand() * 2;
      const priceLevel = Math.floor(rand() * 3) + 1;
      
      generatedBusinesses.push({
        id: `biz-${bizIdx + 1}`,
        name: name + (count > 2 && names.length > 2 ? ' (' + cluster.area.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) + ')' : ''),
        category: cat,
        lat: cluster.lat + Math.cos(angle) * spread + (rand() - 0.5) * 0.003,
        lng: cluster.lng + Math.sin(angle) * spread + (rand() - 0.5) * 0.003,
        geofenceRadius: 40 + Math.floor(rand() * 80),
        authorizedCameraIds: [] as string[],
        density: null,
        quietWindows: [] as any[],
        rating: Math.round(rating * 10) / 10,
        priceLevel: priceLevel as 1 | 2 | 3,
        hours: rand() > 0.2
          ? { open: `${6 + Math.floor(rand() * 4)}:00`, close: `${18 + Math.floor(rand() * 6)}:00` }
          : null,
        phone: `(${214 + Math.floor(rand() * 100)}) ${555 + Math.floor(rand() * 100)}-${1000 + Math.floor(rand() * 9000)}`,
        website: rand() > 0.5 ? `https://${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com` : undefined,
        reviewCount: Math.floor(rand() * 500) + 10,
      } as any);
      bizIdx++;
    }
  }
}

// Assign cameras to nearest businesses
for (const biz of generatedBusinesses) {
  const nearby = MOCK_CAMERAS
    .map((c, ci) => ({ cam: c, dist: Math.sqrt((c.lat - biz.lat) ** 2 + (c.lng - biz.lng) ** 2), ci }))
    .filter((x) => x.dist < 0.025)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 3);
  biz.authorizedCameraIds = nearby.map((x) => x.cam.id);
}

// Initialize density and parking lot data
for (const biz of generatedBusinesses) {
  const vehicle = Math.floor(rand() * 35) + 1;
  biz.density = {
    locationId: biz.id,
    timestamp: new Date(BASE_TIME).toISOString(),
    vehicleCountEst: vehicle,
    vehicleCountUncertainty: 0.1 + rand() * 0.25,
    pedestrianEst: Math.floor(vehicle * (0.2 + rand() * 0.8)),
    source: (['cv', 'api', 'satellite', 'user'] as const)[Math.floor(rand() * 4)],
    confidence: 0.6 + rand() * 0.35,
    densityLevel: (vehicle <= 5 ? 'green' : vehicle <= 15 ? 'yellow' : vehicle <= 30 ? 'orange' : vehicle <= 50 ? 'red' : 'purple') as DensityLevel,
  };
  biz.quietWindows = [
    { startTime: new Date(BASE_TIME + 3600000 + rand() * 3600000).toISOString(), endTime: new Date(BASE_TIME + 7200000 + rand() * 3600000).toISOString(), expectedLevel: 'green' as DensityLevel, confidence: 0.7 + rand() * 0.2 },
    ...(rand() > 0.4 ? [{ startTime: new Date(BASE_TIME + 7200000 + rand() * 7200000).toISOString(), endTime: new Date(BASE_TIME + 10800000 + rand() * 7200000).toISOString(), expectedLevel: 'yellow' as DensityLevel, confidence: 0.65 + rand() * 0.2 }] : []),
  ];
  
  // Parking lot for relevant categories
  if (['grocery', 'retail', 'pharmacy', 'restaurant', 'fast_food', 'convenience', 'hardware', 'gas_station'].includes(biz.category)) {
    const baseTotalSpaces = biz.category === 'grocery' ? 150 + Math.floor(rand() * 200) :
                            biz.category === 'retail' ? 200 + Math.floor(rand() * 300) :
                            biz.category === 'gas_station' ? 20 + Math.floor(rand() * 30) :
                            biz.category === 'hardware' ? 100 + Math.floor(rand() * 100) :
                            biz.category === 'convenience' ? 15 + Math.floor(rand() * 20) :
                            biz.category === 'restaurant' || biz.category === 'fast_food' ? 50 + Math.floor(rand() * 100) :
                            80 + Math.floor(rand() * 80);
    
    const occupiedSpacesCount = Math.floor(baseTotalSpaces * (0.15 + rand() * 0.65));
    const lotSize = 0.0008;
    const geometry = [
      [biz.lng - lotSize, biz.lat - lotSize],
      [biz.lng + lotSize, biz.lat - lotSize],
      [biz.lng + lotSize, biz.lat + lotSize],
      [biz.lng - lotSize, biz.lat + lotSize],
      [biz.lng - lotSize, biz.lat - lotSize]
    ];
    
    biz.parkingLot = {
      id: `lot-${biz.id}`,
      businessId: biz.id,
      geometry,
      totalSpaces: Math.floor(baseTotalSpaces),
      accessibleSpaces: Math.floor(baseTotalSpaces * 0.04),
      evChargingSpaces: Math.floor(baseTotalSpaces * 0.03),
      entrances: [[biz.lng - lotSize * 0.5, biz.lat - lotSize], [biz.lng + lotSize * 0.5, biz.lat - lotSize]],
      type: 'surface',
      hours: biz.hours || { open: '06:00', close: '23:00' },
      currentOccupancy: {
        timestamp: new Date(BASE_TIME).toISOString(),
        occupiedSpaces: Math.floor(occupiedSpacesCount),
        totalSpaces: Math.floor(baseTotalSpaces),
        occupancyRate: occupiedSpacesCount / baseTotalSpaces,
        vehiclesByType: {
          car: Math.floor(occupiedSpacesCount * 0.55),
          suv: Math.floor(occupiedSpacesCount * 0.25),
          truck: Math.floor(occupiedSpacesCount * 0.10),
          motorcycle: Math.floor(occupiedSpacesCount * 0.05),
          van: Math.floor(occupiedSpacesCount * 0.05),
        },
        avgDwellMinutes: 20 + Math.floor(rand() * 30),
        entryRate: Math.floor(occupiedSpacesCount * (0.5 + rand() * 1.5)),
        exitRate: Math.floor(occupiedSpacesCount * (0.8 + rand() * 0.4)),
        source: 'simulation',
        confidence: 0.75,
        lastUpdated: new Date(BASE_TIME).toISOString(),
      }
    };
  }
}

export const MOCK_BUSINESSES: BusinessLocation[] = generatedBusinesses as BusinessLocation[];

// ─── 25+ Road Segments (same as before) ──────────────────────────
function roadSeg(id: string, coords: [number, number][], name: string, speedLimit: number) {
  return {
    id, geometry: coords, name, speedLimit,
    typicalVolumeProfile: generateTypicalProfile(),
    currentDensity: {
    locationId: id,
    roadSegmentId: id,
    timestamp: new Date(BASE_TIME).toISOString(),
    vehicleCountEst: Math.floor(rand() * 40),
      vehicleCountUncertainty: 0.15,
      pedestrianEst: Math.floor(rand() * 15),
      source: 'cv' as const,
      confidence: 0.7 + rand() * 0.25,
      densityLevel: (['green', 'yellow', 'orange', 'red', 'purple'] as const)[Math.floor(rand() * 5)],
    },
  };
}

export const MOCK_ROAD_SEGMENTS: RoadSegment[] = [
  roadSeg('road-1', [[-96.803, 32.760], [-96.802, 32.770], [-96.800, 32.783], [-96.800, 32.795], [-96.801, 32.810]], 'I-35E South', 65),
  roadSeg('road-2', [[-96.801, 32.810], [-96.802, 32.830], [-96.803, 32.850], [-96.804, 32.870], [-96.805, 32.890], [-96.806, 32.920]], 'I-35E North', 65),
  roadSeg('road-3', [[-96.785, 32.794], [-96.784, 32.808], [-96.783, 32.822], [-96.783, 32.838]], 'US-75 South', 60),
  roadSeg('road-4', [[-96.783, 32.838], [-96.784, 32.856], [-96.784, 32.874], [-96.785, 32.892], [-96.785, 32.910]], 'US-75 North', 60),
  roadSeg('road-5', [[-96.850, 32.914], [-96.835, 32.915], [-96.820, 32.916], [-96.805, 32.915], [-96.790, 32.914], [-96.775, 32.913], [-96.760, 32.912]], 'I-635 West', 70),
  roadSeg('road-6', [[-96.880, 32.768], [-96.860, 32.769], [-96.840, 32.768], [-96.820, 32.766], [-96.800, 32.765], [-96.780, 32.764], [-96.760, 32.762]], 'I-30', 65),
  roadSeg('road-7', [[-96.805, 32.798], [-96.803, 32.802], [-96.800, 32.803]], 'Oak Lawn Ave', 30),
  roadSeg('road-8', [[-96.800, 32.838], [-96.785, 32.838], [-96.775, 32.837]], 'Mockingbird Ln', 35),
  roadSeg('road-9', [[-96.810, 32.778], [-96.800, 32.781], [-96.795, 32.783], [-96.785, 32.784]], 'Main St / Elm St', 30),
  roadSeg('road-10', [[-96.810, 32.860], [-96.800, 32.860], [-96.790, 32.861], [-96.780, 32.860]], 'NW Hwy / Loop 12', 45),
  roadSeg('road-11', [[-96.800, 32.845], [-96.800, 32.838], [-96.798, 32.828]], 'University Blvd', 30),
  roadSeg('road-12', [[-96.810, 32.905], [-96.800, 32.905], [-96.790, 32.906], [-96.780, 32.906]], 'Forest Ln', 40),
  roadSeg('road-13', [[-96.830, 32.847], [-96.820, 32.847], [-96.810, 32.848], [-96.800, 32.848]], 'Inwood Rd', 35),
  roadSeg('road-14', [[-96.800, 32.828], [-96.798, 32.820], [-96.795, 32.810], [-96.793, 32.800], [-96.792, 32.788]], 'Central Expwy service', 35),
  roadSeg('road-15', [[-96.825, 32.740], [-96.822, 32.750], [-96.820, 32.760], [-96.818, 32.770]], 'Jefferson Blvd', 30),
  roadSeg('road-16', [[-96.775, 32.808], [-96.772, 32.816], [-96.770, 32.824], [-96.768, 32.830]], 'Greenville Ave', 30),
  roadSeg('road-17', [[-96.803, 32.903], [-96.803, 32.890], [-96.802, 32.880], [-96.802, 32.870]], 'Dallas North Tollway (frontage)', 45),
  roadSeg('road-18', [[-96.790, 32.986], [-96.796, 32.978], [-96.797, 32.966], [-96.798, 32.954], [-96.799, 32.942]], 'Preston Rd', 40),
  roadSeg('road-19', [[-96.830, 32.770], [-96.810, 32.770], [-96.800, 32.770], [-96.790, 32.770], [-96.780, 32.771]], 'Colorado Blvd', 35),
  roadSeg('road-20', [[-96.800, 32.750], [-96.800, 32.742], [-96.798, 32.735]], 'Ledbetter Dr', 40),
  roadSeg('road-21', [[-96.805, 32.810], [-96.800, 32.815], [-96.792, 32.820], [-96.786, 32.826]], 'Garland Rd', 30),
  roadSeg('road-22', [[-96.810, 32.798], [-96.798, 32.798], [-96.790, 32.799], [-96.782, 32.799]], 'Bryan St / Live Oak', 30),
  roadSeg('road-23', [[-96.800, 32.921], [-96.786, 32.923], [-96.775, 32.925]], 'Royal Ln', 30),
  roadSeg('road-24', [[-96.830, 32.790], [-96.820, 32.790], [-96.810, 32.790], [-96.804, 32.790], [-96.800, 32.790], [-96.795, 32.790]], 'Illinois Ave', 35),
  roadSeg('road-25', [[-96.808, 32.790], [-96.808, 32.798], [-96.808, 32.808], [-96.808, 32.818], [-96.807, 32.828]], 'Hampton Rd', 35),
];
