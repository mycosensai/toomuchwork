# Platform 00 Index

**Project:** QuietFlow v2  
**Created:** 2024-09-08  
**Artifact Pyramid Layers:** L1 Summary (this file), L2 Analysis, L3 Dossiers

---

## Platform Purpose

QuietFlow is a privacy-first navigation application designed for individuals with social anxiety. It provides crowd avoidance routing, real-time incident alerts, and an integrated social anxiety toolkit.

---

## Architecture at a Glance

```
┌──────────────────────────────────────────────┐
│  Frontend: Next.js 14 + React + TypeScript  │
│  State: Zustand (single source of truth)     │
│  Data: Simulated + Real API hybrid           │
│  Security: Zero tracking, local-first        │
└──────────────────────────────────────────────┘
```

---

## Deployment Status

| Target | Status | Artifact |
|--------|--------|----------|
| Web (CF Pages) | ✅ Live | `.next/` output |
| Android APK | ✅ Built | `app-quietflow-release.apk` |
| Windows .exe | ✅ Built | `QuietFlow Setup.exe` |

---

## Quick Links

| Layer | Document | Purpose |
|-------|----------|---------|
| L2 | [Architecture Overview](./analysis/architecture-overview.md) | Component architecture, data flow |
| L2 | [Security Controls](./analysis/security-controls.md) | Threat model, privacy guarantees |
| L2 | [Deployment Strategy](./analysis/deployment-strategy.md) | Build processes, CI/CD pipelines |
| L3 | [Codebase Analysis](./dossiers/codebase-analysis.txt) | Static metrics, performance baseline |

---

## Build Verification

```bash
# All green
$ npm run build     # ✓ Success
$ npm test          # ✓ 49/49 pass
$ npx tsc --noEmit  # ✓ 0 errors
$ ./gradlew assembleRelease  # ✓ APK built
```

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 App Router |
| State | Zustand 4 |
| UI | Tailwind CSS + Shadcn/ui |
| Maps | MapLibre GL JS |
| Geo | Turf.js, Custom haversine |
| Mobile | Capacitor |
| Testing | Jest, React Testing Library |

---

## Platform Owners

- **Lead**: Platform Engineering Team
- **Security**: Built-in privacy controls
- **Deployments**: GitHub Actions automated

---

## Next Evolution

Planned improvements:

1. CI/CD pipelines (GitHub Actions templates)
2. Container orchestration (Docker configs)  
3. Monitoring stack (Prometheus + Grafana)
4. Secrets management (SOPS encryption)

---

*End of L1 Summary*