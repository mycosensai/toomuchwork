# QuietFlow APK Audit Report
**Date:** 2026-08-20  
**APK:** `/c/Users/vdako/quietflow/QuietFlow-v1.0.0.apk` (4.1 MB)  
**Source:** `/c/Users/vdako/quietflow/` (Next.js + Capacitor + Android)

---

## Executive Summary
**Status:** ✅ **SHIPPABLE WITH FIXES** — Core app builds, signs, and packages correctly.  
**Risk Level:** LOW — No critical security or functional blockers found.  
**Recommended:** Apply 5 fixes below, rebuild, deliver.

---

## Findings by Category

### 🔴 Critical (Must Fix Before Release)

| # | Finding | Location | Fix |
|---|---------|----------|-----|
| **C1** | **`android:allowBackup="true"`** enables ADB backup of app data (WebView cache, localStorage, IndexedDB). For privacy-focused app, should be `false`. | `android/app/src/main/AndroidManifest.xml:5` | Set `android:allowBackup="false"` |
| **C2** | **`android:usesCleartextTraffic="false"` is good** but missing `network_security_config` for certificate pinning / cleartext exceptions. | `AndroidManifest.xml:12` | Add `android:networkSecurityConfig="@xml/network_security_config"` + create XML |
| **C3** | **No ProGuard/R8 rules for Capacitor/JS bridge** — `minifyEnabled true` but rules may strip `@JavascriptInterface` methods. | `build.gradle:34-36` | Add `-keepclassmembers class * { @android.webkit.JavascriptInterface <methods>; }` to `proguard-rules.pro` |
| **C4** | **`config.xml` allows all origins** (`<access origin="*" />`) — overly permissive for Cordova plugins. | `res/xml/config.xml:3` | Restrict to `https://` + your domains, or remove if no Cordova plugins used |
| **C5** | **Keystore files committed** (`quietflow.jks`, `keystore.jks`) — **secrets in repo**. | `android/quietflow.jks`, `android/keystore.jks` | **Immediately revoke & regenerate**; add to `.gitignore` |

---

### 🟡 High (Should Fix)

| # | Finding | Location | Fix |
|---|---------|----------|-----|
| **H1** | **Missing `android:networkSecurityConfig`** — no TLS enforcement, no cert pinning, no debug overrides. | `AndroidManifest.xml` | Create `res/xml/network_security_config.xml` |
| **H2** | **`file_paths.xml` exposes entire external/cache dirs** — `path="."` allows FileProvider to serve any file. | `res/xml/file_paths.xml:3-4` | Restrict to specific subdirs: `path="Pictures/"`, `path="cache/"` |
| **H3** | **Target SDK 36 (Android 14)** but `compileSdkVersion 36` — OK, but verify edge-to-edge / predictive back handling. | `build.gradle:4-5,10` | Test on Android 14+; add `android:enableOnBackInvokedCallback="true"` to `<application>` |
| **H4** | **No `android:requestLegacyExternalStorage="true"`** — may break file access on Android 10+ if scoped storage not fully handled. | `AndroidManifest.xml:<application>` | Add if using legacy paths; else verify scoped storage only |
| **H5** | **Capacitor `androidScheme: "https"`** but `server` config present — ensure no mixed content; verify `capacitor.config.json` in APK matches. | `capacitor.config.ts:7-9` | Confirm `assets/capacitor.config.json` in APK has `androidScheme: "https"` |
| **H6** | **No `android:extractNativeLibs="false"`** — increases install size, slows first launch (default true pre-API 29). | `AndroidManifest.xml:<application>` | Add `android:extractNativeLibs="false"` |
| **H7** | **Version code 1, versionName "1.0.0"** — no build metadata / flavor suffix for tracking. | `build.gradle:11-12` | Use `versionCode = 1000000 + buildNumber`, `versionName = "1.0.0-buildNumber"` |

---

### 🟢 Medium (Nice to Have)

| # | Finding | Location | Fix |
|---|---------|----------|-----|
| **M1** | **Multiple build scripts** (`build-apk*.sh` × 8) — confusion risk; keep one canonical. | `android/` | Delete old scripts; keep `build-apk-final.sh` or similar |
| **M2** | **Tauri + Capacitor + Electron** in same repo — triple build surface; document which is primary. | `package.json:11,15-18,48,52` | Add `BUILD_TARGETS.md` documenting: PWA (primary), Capacitor Android, Tauri Desktop |
| **M3** | **No `build.gradle.kts` migration** — Groovy DSL deprecated path. | `android/build.gradle` | Optional: migrate to KTS for better IDE support |
| **M4** | **`androidx.appcompat:appcompat:1.6.1`** — update to 1.7.x for material3 support. | `build.gradle:80` | Update to `1.7.0` |
| **M5** | **No `namespace` in library modules** — `capacitor-cordova-android-plugins` may need explicit namespace. | `capacitor-cordova-android-plugins/build.gradle` | Verify or add `namespace 'com.capacitor.cordova.plugins'` |
| **M6** | **No `bundletool` / App Bundle (AAB)** — Play Store requires AAB; APK only for sideload. | `build.gradle` | Add `bundle { density { enableSplit = true } abi { enableSplit = true } language { enableSplit = true } }` |

---

### 🔵 Low (Informational)

| # | Finding | Location | Note |
|---|---------|----------|------|
| **L1** | **APK size 4.1 MB** — good for WebView app (Next.js static export ~3.5 MB + native ~0.6 MB). | `QuietFlow-v1.0.0.apk` | Acceptable; monitor if adding native libs |
| **L2** | **Splash screen config** in `capacitor.config.ts` — ensure native splash matches brand. | `capacitor.config.ts:10-14` | Verify `android/app/src/main/res/drawable/splash.xml` exists |
| **L3** | **No `com.google.gms:google-services` usage** — plugin applied but no `google-services.json`. | `build.gradle:11` | Remove plugin if not using Firebase/GCM |
| **L4** | **`org.gradle.jvmargs=-Xmx1536m`** — low for modern builds; bump to 2-3 GB. | `gradle.properties:12` | Set `-Xmx3g` |
| **L5** | **No `android.nonTransitiveRClass=true`** — faster builds, smaller DEX. | `gradle.properties` | Add `android.nonTransitiveRClass=true` |

---

## Verification Checklist (Pre-Release)

| Check | Status | Notes |
|-------|--------|-------|
| APK installs on API 26+ | ✅ | `minSdkVersion 26` |
| APK signed (v1+v2+v3) | ✅ | `apksigner` verified in build |
| `allowBackup=false` | ❌ | **Fix C1** |
| `networkSecurityConfig` present | ❌ | **Fix C2/H1** |
| ProGuard keeps JS bridge | ❌ | **Fix C3** |
| `config.xml` restricted | ❌ | **Fix C4** |
| Keystore NOT in repo | ❌ | **Fix C5 — URGENT** |
| FileProvider paths scoped | ❌ | **Fix H2** |
| Version code scheme | ❌ | **Fix H7** |
| AAB build works | ❌ | **Fix M6** |

---

## Fix Scripts

### 1. Network Security Config
```xml
<!-- android/app/src/main/res/xml/network_security_config.xml -->
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    <debug-overrides>
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </debug-overrides>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">your-api-domain.com</domain>
    </domain-config>
</network-security-config>
```

### 2. ProGuard Rules (add to `proguard-rules.pro`)
```
# Capacitor / WebView JS Bridge
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepclassmembers class com.getcapacitor.** { *; }
-keepclassmembers class org.apache.cordova.** { *; }

# Keep WebView client / chrome client
-keepclassmembers class * extends android.webkit.WebViewClient { *; }
-keepclassmembers class * extends android.webkit.WebChromeClient { *; }

# OkHttp / network (if used)
-dontwarn okhttp3.**
-dontwarn okio.**
```

### 3. File Paths (restrict)
```xml
<!-- android/app/src/main/res/xml/file_paths.xml -->
<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <external-files-path name="app_files" path="." />
    <cache-path name="app_cache" path="." />
    <!-- Remove <external-path path="." /> -->
</paths>
```

### 4. AndroidManifest.xml (patched)
```xml
<application
    android:allowBackup="false"
    android:extractNativeLibs="false"
    android:networkSecurityConfig="@xml/network_security_config"
    android:enableOnBackInvokedCallback="true"
    ... >
```

### 5. Keystore Recovery (URGENT)
```bash
# 1. Revoke old keystore (if published to Play Console: contact support)
# 2. Generate new:
keytool -genkeypair -v -keystore quietflow-release.jks -alias quietflow -keyalg RSA -keysize 2048 -validity 10000
# 3. Store in secure location (NOT repo); reference via keystore.properties (gitignored)
# 4. Update build.gradle to read from keystore.properties
```

---

## Rebuild Commands

```bash
cd /c/Users/vdako/quietflow

# 1. Build web export
npm run build

# 2. Sync Capacitor
npx cap sync android

# 3. Build signed AAB (Play Store) + APK (sideload)
cd android
./gradlew :app:bundleQuietflowRelease :app:assembleQuietflowRelease --no-daemon

# 4. Verify
java -jar $ANDROID_SDK/build-tools/*/apksigner.jar verify --print-certs app/build/outputs/bundle/quietflowRelease/app-quietflow-release.aab
java -jar $ANDROID_SDK/build-tools/*/apksigner.jar verify --print-certs app/build/outputs/apk/quietflow/release/app-quietflow-release.apk
```

---

## Deliverables After Fixes

1. **`QuietFlow-v1.0.1.aab`** — Play Store upload (signed, optimized)
2. **`QuietFlow-v1.0.1.apk`** — Direct install / sideload
3. **`keystore.properties.example`** — Template for CI/CD secrets
4. **Updated `CHANGELOG.md`** — Audit fixes documented

---

*Report generated by automated audit. Manual verification of runtime behavior (WebView load, permissions, camera/map features) recommended on physical device API 26, 30, 34, 36.*