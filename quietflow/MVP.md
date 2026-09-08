# MVP Definition & Acceptance Gate — ComfyRoute

> The build is RELEASED ONLY when every item in "Definition of Done" passes.
> Until then, any APK is a prototype, not a product.

## 1. MVP thesis
Smallest thing that delivers REAL value: a user types a destination, sees real route
options with REAL camera locations and REAL traffic, and picks a calmer one. Anything
that cannot be made real in MVP must be visibly labeled "PREVIEW" and excluded from
the anxiety-relief claim.

## 2. IN SCOPE (real-data MVP)
- [ ] Destination search + geocode (Nominatim) — already real.
- [ ] Route options (walk/drive) via OSRM/Mapbox — already real; add provider switch + key storage.
- [ ] Real camera *locations* on/near route via OSM Overpass — already real; keep.
- [ ] Real traffic layer via one live API (TomTom or Mapbox traffic) with key in secure storage.
- [ ] Calm-route scoring that uses ONLY real signals (camera count + live traffic + destination busyness from a real source).
- [ ] Honest "PREVIEW" badge on any signal that is not real.
- [ ] Signed, installable Android APK delivered to alpha testers.

## 3. OUT OF SCOPE (post-MVP or preview-only)
- Live CCTV video playback (drop from MVP; keep camera locations). Revisit via real 511/HLS feeds.
- Computer-vision vehicle/crowd counting (not feasible remotely at MVP; replace with crowd-sourced reports later).
- Air-quality / noise sensing (wire WAQI + weather API post-MVP).
- Accounts, community, cross-device sync.
- iOS / desktop public builds.

## 4. ACCEPTANCE CRITERIA (the gate)
A build is "ready" only if ALL are true:
1. `npm run build` succeeds with zero type errors.
2. `./gradlew assembleRelease` produces a signed APK that installs on Android 8+.
3. Core flow works end-to-end on a real device with a real destination in Dallas.
4. Every number shown to the user is traceable to a real source OR carries a "PREVIEW" label. No silent simulation in the anxiety-relief path.
5. At least one live traffic API returns real data in the demo (verified by logging).
6. ≥3 alpha users complete the flow and report the preview useful (see PRD §7).
7. No crash on the supported path; basic error states handled (no route, no network).
8. Git: initial commit + tagged MVP; CHANGELOG notes real vs preview features.

## 5. PHASED PLAN
Phase A — Truthful prototype (this week):
  - Label all simulated signals "PREVIEW"; ship current signed APK as alpha demo.
  - Decide name + applicationId rename.
Phase B — Real traffic + cameras (next):
  - Wire one live traffic API; expand 511-state JSON camera feeds.
  - Remove synthetic fallback from the core anxiety path.
Phase C — Validate:
  - 3–5 user interviews; anxiety self-rating before/after.
  - If thesis holds, plan crowd-sourced reports + env APIs (post-MVP).

## 6. Definition of Done
- Code builds, signs, installs.
- Data-reality table (PRD §6) updated: every MVP signal marked REAL or PREVIEW.
- Alpha testers using it; feedback logged.
- Git history exists; MVP tagged.
- README explains what is real vs preview.

## 7. Current blocker to "ready"
The core promise (remote environmental measurement of crowd/vehicles) is simulated.
Until Phase B replaces it with real sources — or Phase A honestly labels it — the
product cannot claim to "ease anxiety by showing what to expect." This is the single
most important thing to resolve, and it is a research + integration task, not a build task.
