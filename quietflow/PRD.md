# PRD — ComfyRoute (working name)

> Status: DRAFT v0.1 — gating document. The build is NOT "ready" until the
> acceptance criteria in MVP.md pass. This PRD is grounded in a code audit of
> the current repo (formerly "QuietFlow"), not in aspiration.

## 1. Product name decision (OPEN — owner: you)
Candidate names proposed: `comfyroute`, `avoidthemall`, `theworldisscary`, `SEE-P-S`.
Recommendation: **ComfyRoute** — it states the value (comfort/calm routing) and is
pronounceable. applicationId would become `com.comfyroute.app` (currently
`com.quietflow.app` — rename is required before any public release). Decide before MVP.

## 2. One-liner
A navigation app that previews the *environmental and social exposure* of a route —
how crowded, how many cameras, how much traffic clutter — and offers calmer
walk/drive alternatives, to reduce pre-travel anxiety.

## 3. Problem (honest)
You (and friends) experience social/overall anxiety about going places. The unknown
— crowds, surveillance, chaos at the destination — amplifies it. The product thesis:
*if you can see what to expect before you leave, the trip feels manageable.*
This thesis is UNVALIDATED. It needs 3–5 user conversations before MVP sign-off
(see Section 9). We do not yet know if "preview" actually reduces anxiety or just
adds a new thing to worry about.

## 4. Target users
- Primary: you (single real user, dogfooding).
- Secondary: a small circle of friends (≤10) who will alpha-test.
- NOT yet: the public. Public release requires the data-reality gap (Section 6) closed.

## 5. Core user flow (the one thing)
1. Open app.
2. Type a destination in the search bar.
3. App computes 2–3 route options (walk / drive).
4. Each option shows an *environmental preview*: crowd level, camera count on route,
   traffic clutter, destination busyness — each tagged REAL or PREVIEW.
5. User picks the calmer route and navigates.

This flow already exists in code (search-destinations.tsx → living-map.tsx →
quiet-route-panel.tsx). What is missing is that steps 3–4 are real data, not simulation.

## 6. DATA REALITY TABLE (the most important section)
What is genuinely real vs. faked in the current repo, from the audit:

| Capability | Real? | Source in code |
|---|---|---|
| Geocode destination | YES | Nominatim (camera-discovery.ts) |
| Route geometry / directions | YES | OSRM public router + Mapbox Directions (living-map.tsx) |
| Turn-by-turn steps | YES | route-directions.ts parses real response |
| Map render | YES | MapLibre GL |
| Camera *locations* | YES | OSM Overpass (camera-discovery.ts: queryOverpass) |
| Camera *live stream* | MOSTLY NO | TxDOT/NCTCOG/Dallas/511 hardcoded "decommissioned" → `synthetic://` fallback; only OSM-tagged `camera:url` or 511 JSON are real |
| Traffic congestion | NO | `traffic-engine.ts` — deterministic noise model, comment: "Simulates real-time traffic flow" |
| Vehicle count in parking lot | NO | `generateVehicleDetection` — hash/mulberry32 pseudo-random, no CV |
| Crowd density | NO | `data-simulator.ts` simulation |
| Air quality / noise / temp | NOT WIRED | no API; only a mock `weather` object in traffic-panel |
| "Best time to leave" | NO | derived from simulated density |
| Community reports | UNVERIFIED | community.tsx exists; data source not confirmed real |

**Conclusion:** the product's premise (remote environmental measurement) is currently a
demo. MVP must either (a) wire REAL sources for the headline signals, or (b) clearly
label every non-real signal as "PREVIEW / simulated" so it never misleads.

## 7. Success metrics (how we'll know it's thought through)
- ≥3 users complete the core flow without assistance and report the preview felt *useful*.
- ≥50% of route previews use at least one REAL signal (camera locations + traffic from a live API).
- Anxiety self-rating (1–5) before vs. after using the preview shows a measurable drop in alpha test.
- Zero crashes on the supported Android build; installable signed APK delivered.

## 8. Non-goals (v1)
- No user accounts / social network (single-device alpha).
- No monetization.
- No iOS/Windows/macOS public release (Electron/Tauri shells exist but are out of MVP scope).
- No real-time turn-by-turn voice navigation beyond what OSRM/Mapbox steps provide.

## 9. Open questions / decisions required
1. Name + applicationId rename. (Section 1)
2. Real-data strategy for traffic: TomTom/Mapbox live traffic (needs key) vs. keep simulated?
3. Real-data strategy for "vehicles/crowd": is remote CV feasible, or do we rely on
   crowd-sourced reports + destination busyness APIs (Google Places, OSM opening hours)?
4. Camera streams: pursue 511-state JSON feeds (real, some states) or drop live video
   from MVP and keep camera *locations* only?
5. Validate the anxiety thesis with 3–5 interviews before committing to "calm" branding.

## 10. Privacy & ethics note
This app enumerates surveillance cameras and crowd density — sensitive by nature.
MVP must: (a) not upload user location to any server we don't control; (b) label
simulated data honestly; (c) avoid implying it can "avoid all cameras" (legally/factually false).
