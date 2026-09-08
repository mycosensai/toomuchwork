# Architecture Overview — QUIETFLOW Platform

**Layer:** Analysis  
**Navigation:** L2 analysis file supporting 00-index.md

---

## Component Architecture

### Frontend Layer

```
src/
├── app/                 # Next.js App Router
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   └── ...              # Other pages
├── components/          # UI Components
│   ├── ui/              # Shadcn/ui primitives
│   ├── social/          # Social anxiety components
│   ├── theme/           # Obsidian theme components
│   ├── sprint3-5/       # Enterprise panels
│   └── layout/          # App shell, sidebar, header
├── lib/                 # Business logic
│   ├── route-incidents.ts    # Incident avoidance routing
│   ├── social-anxiety/       # Anxiety toolkit core
│   ├── news-alerts.ts         # Real-time alerts
│   ├── traffic-engine.ts      # Traffic calculations
│   └── ...                # Other libs
└── store/               # Zustand global state
    └── index.ts         # App state + actions
```

---

## Data Flow

### Location to Route

```
GPS Location
    │
    ▼
User Location Store State
    │
    ▼
Haversine Distance Calculation
    │
    ▼
Threat Scoring (Incidents + Density)
    │
    ▼
Route Generation (buildIncidentAvoidRoute)
    │
    ▼
Safe Quiet-Route Recommendation
```

### News Alert Flow

```
External API (Sim / Open511)
    │
    ▼
generateNewsAlerts()
    │
    ▼
newsAlerts: NewsAlert[] (Store)
    │
    ▼
NewsAlertsPanel Component
    │
    ▼
User Notification / HUD
```

---

## State Management Architecture

```
                    ┌─────────────────┐
                    │   Zustand Store │
                    │   (Single Source)│
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
  │   UI View    │    │   Route      │    │   Social     │
  │  Components  │    │  Engine      │    │   Anxiety    │
  │ (React)      │    │  (lib/)      │    │   (lib/)     │
  └──────────────┘    └──────────────┘    └──────────────┘
```

---

## Dependency Graph

```
┌─────────────────────────────────────────────────────────┐
│                        NEXT.JS                          │
│              (Routing, SSR, Static Export)             │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│                   REACT + ZUSTAND                      │
│              (State, Components)                         │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────┼───────────────────────────────────────┐
│                 ▼                                        │
│  ┌────────────────────────────────────────────────────┐   │
│  │           LIBRARY LAYER                          │   │
│  │                                                    │   │
│  │  • Turf.js (geospatial)                          │   │
│  │  • Lucide (icons)                                 │   │
│  │  • Haversine calculations                        │   │
│  │  • Mock data generators                          │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Data Sources

| Source | Type | Fallback |
|--------|------|----------|
| Open-Meteo | Weather API | Simulated weather |
| News/Incidents | Simulated/Open511 | Local mock data |
| Camera Feeds | RTSP/ONVIF | Demo URLs |
| Business Data | Local mock | - |

---

## Key Algorithms

### 1. Threat Scoring

```typescript
function scoreSegmentsAgainstIncidents(
  segments: RoadSegment[],
  incidents: ScannerIncident[],
  cameras: Camera[],
  densityLevelWeight: number = 0.4
): ScoredSegment[]
```

Weights: incidents 0.3, density 0.4, cameras 0.3

### 2. Distance Calculation

```typescript
function haversineKm(lat1, lon1, lat2, lon2): number
```

Standard haversine formula for great-circle distance.

### 3. Quiet Route Generation

```typescript
function buildIncidentAvoidRoute(origin, destination, roadSegments, threats, cameras)
```

Dijkstra variant with threat cost penalties.

---

SOURCES (Layer 3 Navigation)

`platform/dossiers/codebase-analysis.txt`
 -> Full codebase static analysis with metrics