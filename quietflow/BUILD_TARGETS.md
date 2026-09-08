# QuietFlow Build Targets

This project supports **four build targets** from a single Next.js codebase. The primary target is **PWA (Progressive Web App)** — all others wrap the same static export.

---

## 1. PWA (Primary — Web)
**Platform:** Any browser (desktop/mobile)  
**Output:** Static files in `/out/`  
**Deploy:** Vercel, Netlify, Cloudflare Pages, any static host  

```bash
# Build
npm run build

# Output: /out/ (static HTML/JS/CSS + manifest + service worker)
# Deploy: Push /out/ to any static host
```

**Features:**
- Full app functionality
- Service worker for offline
- Installable on mobile/desktop
- No app store required

---

## 2. Capacitor Android (Mobile App)
**Platform:** Android (API 26+)  
**Output:** AAB (Play Store) + APK (sideload)  
**Wrapper:** `@capacitor/android` — WebView + native bridge  

```bash
# Prerequisites
npm run build          # Generates /out/
npx cap sync android   # Copies /out/ → android/app/src/main/assets/public/

# Build (from android/ directory)
./build-release.sh     # Creates AAB + APK
```

**Artifacts:**
- `android/app/build/outputs/bundle/quietflowRelease/app-quietflow-release.aab` → **Play Store**
- `android/app/build/outputs/apk/quietflow/release/app-quietflow-release.apk` → **Sideload / direct install**

**Keystore:** Required for release builds. See `android/keystore.properties.example`.

**Flavors:**
- `quietflow` → `com.quietflow.app` (this app)
- `athena` → `com.athena.trader` (separate app, different entry point)

---

## 3. Tauri Desktop (Native Desktop)
**Platform:** Windows / macOS / Linux  
**Output:** `.msi` / `.dmg` / `.AppImage` / `.deb`  
**Wrapper:** `@tauri-apps/cli` — WebView2 (Win) / WebKit (macOS/Linux) + Rust backend  

```bash
# Prerequisites
npm run build          # Generates /out/

# Build (from project root)
npm run tauri build    # Or: cargo tauri build
```

**Config:** `src-tauri/tauri.conf.json`  
**Output:** `src-tauri/target/release/bundle/`

**Note:** Tauri uses the same `/out/` static export. No separate web build needed.

---

## 4. Electron Desktop (Alternative Desktop)
**Platform:** Windows / macOS / Linux  
**Output:** `.exe` / `.dmg` / `.AppImage`  
**Wrapper:** `electron` — Chromium + Node.js  

```bash
# Build (from project root)
# Requires electron-builder config (not currently present)
npm run build && electron-builder
```

**Status:** Experimental / secondary. Tauri is preferred for smaller binary size and security.

---

## Build Matrix

| Target | Command | Output | Store | Size |
|--------|---------|--------|-------|------|
| **PWA** | `npm run build` | `/out/` | Web | ~3 MB |
| **Android** | `./android/build-release.sh` | `.aab` + `.apk` | Play Store | ~4 MB |
| **Tauri** | `npm run tauri build` | `.msi`/`.dmg` | Microsoft Store / Mac App Store | ~8 MB |
| **Electron** | (manual) | `.exe`/`.dmg` | Manual | ~80 MB |

---

## CI/CD Recommendations

### GitHub Actions (Example)
```yaml
# .github/workflows/android.yml
on:
  push:
    tags: ['v*']
jobs:
  android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci && npm run build
      - uses: capacitor-actions/sync@v1
      - run: ./android/build-release.sh
        env:
          KEYSTORE_BASE64: ${{ secrets.KEYSTORE_BASE64 }}
          STORE_PASSWORD: ${{ secrets.STORE_PASSWORD }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
      - uses: actions/upload-artifact@v4
        with:
          name: android-release
          path: android/app/build/outputs/**/*.aab
```

### Secrets Required (GitHub / GitLab / Bitrise)
| Secret | Description |
|--------|-------------|
| `KEYSTORE_BASE64` | Base64-encoded `quietflow-release.jks` |
| `STORE_PASSWORD` | Keystore store password |
| `KEY_PASSWORD` | Key password |

---

## Versioning Strategy

| Field | Scheme |
|-------|--------|
| `versionName` | `1.0.0` (semantic, manual bump) |
| `versionCode` | `1000000` + build number (auto-increment in CI) |
| Android flavor suffix | `-quietflow` / `-athena` (auto via flavor) |

Example: `versionCode 1000042` → `1.0.0-build.42`

---

## Quick Reference

```bash
# Full clean rebuild (all targets)
npm run build                           # 1. Web export
npx cap sync android                    # 2. Android sync
cd android && ./build-release.sh clean  # 3. Android AAB+APK
cd .. && npm run tauri build            # 4. Tauri desktop

# Verify Android artifacts
java -jar $ANDROID_HOME/build-tools/*/apksigner.jar verify --print-certs android/app/build/outputs/bundle/quietflowRelease/app-quietflow-release.aab
```

---

**Primary maintainers:** Update this doc when adding/removing targets or changing build process.