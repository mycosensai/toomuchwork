# Architecture — ComfyRoute (audit-grounded)

> Describes the ACTUAL current system (audited 2026-08-10), then the gaps that
> must close for the product to be real. Stack confirmed from package.json,
> src/, android/.

## 1. Stack (real)
- Frontend: Next.js 16 + React 19 + TypeScript + Tailwind 4.
- Maps: `maplibre-gl` (vector tiles), `maplibre` route lines.
- State: `zustand` (src/store/index.ts).
- Live video: `hls.js` (live-camera-view.tsx).
- Charts: `recharts` (env previews).
- Packaging: Capacitor 5 (Android/iOS) + Tauri 2 + Electron 43 shells.
- Native Android: Gradle build, signed APK produced (quietflow.jks).

## 2. Module map (real files)
```
src/
  app/            layout.tsx, page.tsx, globals.css
  components/
    map/          living-map.tsx (1068 lines: render + REAL routing fetch),
                  parking-lot-overlay.tsx (simulated occupancy)
    search/       search-destinations.tsx (destination input + geocode)
    camera/       camera-discovery.tsx, camera-grid.tsx,
                  live-camera-view.tsx (HLS + SyntheticFeed),
                  quiet-route-panel.tsx, route-camera-counter.tsx
    trip/         trip-planner.tsx
    layout/       app-shell.tsx, data-simulator.tsx (THE SIMULATION ENGINE),
                  route-guidance-panel.tsx, traffic-panel.tsx, settings-panel.tsx
    quiet-finder/ quiet-finder.tsx
  lib/
    camera-discovery.ts  (Overpass + 511 + Ring stubs; STREAM_PATTERNS → synthetic)
    route-directions.ts  (REAL parse of OSRM/Mapbox responses)
    traffic-engine.ts    (SIMULATED traffic model)
    density-utils.ts     (generateVehicleDetection = hash pseudo-random)
    scanner.ts, heading-filter.ts
  store/          zustand store
  types/          shared types
```

## 3. Data flow (as built)
```
search → Nominatim geocode (REAL)
  → living-map.tsx fetch OSRM/Mapbox (REAL route)
  → route-directions.ts parse (REAL steps)
  → camera-discovery.ts queryOverpass (REAL camera locations)
       └─ STREAM_PATTERNS → mostly synthetic:// (FAKE video)
  → data-simulator.ts ticks:
       ├─ crowd density (FAKE)
       ├─ vehicle detection (FAKE, hash-based)
       └─ traffic (FAKE, noise model)
  → quiet-route-panel.tsx renders "calm route" from mixed real+sim
```

## 4. The gap (what must become real for the product to be true)
| Layer | Now | Needed for MVP |
|---|---|---|
| Routing | REAL | Keep; add provider config + key storage |
| Camera locations | REAL (OSM) | Keep; expand 511-state JSON where real |
| Camera video | Synthetic | Either real 511/HLS feeds OR drop video, keep locations |
| Traffic | Simulated | Live API (TomTom/Mapbox) OR label "preview" |
| Crowd/vehicle | Simulated | Crowd-sourced reports + Places/OSM busyness OR label "preview" |
| Env (air/noise) | Absent | Wire WAQI/PurpleAir + weather API OR exclude |

## 5. Backend needs (currently none)
- No server, no auth. For alpha: keep client-only. If community reports are added,
  a minimal backend (Cloudflare D1/Workers) is needed — but that is POST-MVP.
- Secrets: Mapbox token currently pasted in settings UI (settings-panel.tsx).
  Move to a secure source before any shared build.

## 6. Security / privacy (audit flags)
- Keystore exists (quietflow.jks) — used to sign APK. Fine.
- Location is sensitive: ensure no silent upload. Current code is client-only (good).
- `camera-discovery.ts` Ring OAuth path exists but requires user token — out of MVP.

## 7. Build & release pipeline
- `npm run build` → Next static export → Capacitor `sync` → Gradle `assembleRelease`.
- Signed APK produced via quietflow.jks (signing re-enabled in build.gradle).
- No CI, no tests, no version-control history (git has 0 commits). All three are
  prerequisites for calling the build "thought through."

## 8. Known technical debt (from audit)
- `JS class fields fail node --check on Windows` note in memory — verify build scripts.
- `capacitor.config.ts` path mismatch (`../keystore.jks` vs `quietflow.jks`) — fixed this session.
- 174 occurrences of synthetic/mock/simulated/decommissioned markers in src.
- Android minSdk 26; v2 signing verified.
