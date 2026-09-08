# QuietFlow Standalone Code Audit Report

## APK Info
- **APK:** QuietFlow.apk (3.93MB, unsigned, package: `com.quietflow.app`)
- **Project:** C:\Users\vdako\quietflow\android
- **Audit Type:** Comprehensive source code audit (standalone app, no Athena integration)

## Issues Found

### 🔴 HIGH: WebView renders with hardware layers (rendering bugs)
- **File:** `MainActivity.java` (line 20)
- **Issue:** `webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null)` — known to cause
  rendering corruption on some devices, especially with large web apps using WebGL/CSS transforms.
- **Fix:** Changed to `WebView.LAYER_TYPE_SOFTWARE`.

### 🔴 HIGH: Mixed content always allowed (security vulnerability)
- **File:** `MainActivity.java` (line 29)
- **Issue:** `settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW)` — allows
  insecure HTTP content on secure HTTPS pages, vulnerable to MITM attacks.
- **Fix:** Changed to `WebSettings.MIXED_CONTENT_NEVER_ALLOW`.

### 🔴 HIGH: File access and content access enabled (security)
- **File:** `MainActivity.java` (lines 25-26)
- **Issue:** `setAllowFileAccess(true)` and `setAllowContentAccess(true)` allow the WebView
  to access local files and content providers, which is dangerous for a web-based trading app.
- **Fix:** Both set to `false`.

### 🟡 MEDIUM: Missing WebView lifecycle management
- **File:** `MainActivity.java`
- **Issue:** No `onPause()`, `onResume()`, `onBackPressed()`, or `onDestroy()` overrides.
  WebView continues running JavaScript/animations in the background when the app is paused,
  wasting battery and causing memory leaks. No back navigation for WebView history.
- **Fix:** Added all four lifecycle methods with proper WebView cleanup in `onDestroy()`.

### 🟡 MEDIUM: Debug build uses release signing config
- **File:** `build.gradle` (line 39)
- **Issue:** `debug { signingConfig signingConfigs.release }` — debug builds are signed
  with the release keystore, which means debug APKs could be accidentally published
  to production channels. Debug builds should use the default debug keystore.
- **Fix:** Removed explicit signing from debug build, added `debuggable true`.

### 🟡 MEDIUM: Cleartext traffic enabled in manifest
- **File:** `AndroidManifest.xml` (line 12)
- **Issue:** `android:usesCleartextTraffic="true"` — allows plain HTTP traffic, which is
  insecure for a financial trading app handling API keys.
- **Fix:** Changed to `false`.

## Fixes Applied
1. Changed `LAYER_TYPE_HARDWARE` → `LAYER_TYPE_SOFTWARE`
2. Changed `MIXED_CONTENT_ALWAYS_ALLOW` → `MIXED_CONTENT_NEVER_ALLOW`
3. Set `setAllowFileAccess(false)`, `setAllowContentAccess(false)`
4. Added `onPause()`, `onResume()`, `onBackPressed()`, `onDestroy()` lifecycle methods
5. Removed release signing from debug build
6. Changed `usesCleartextTraffic` from `true` to `false`
