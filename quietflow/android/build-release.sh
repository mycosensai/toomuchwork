#!/usr/bin/env bash
# QuietFlow — Canonical Build Script
# Builds signed AAB (Play Store) + APK (sideload) for quietflow flavor
# Usage: ./build-release.sh [clean]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check keystore.properties exists
if [[ ! -f "keystore.properties" ]]; then
    echo "ERROR: keystore.properties not found!"
    echo "Copy keystore.properties.example to keystore.properties and fill in your credentials."
    exit 1
fi

# Clean if requested
if [[ "${1:-}" == "clean" ]]; then
    echo "Cleaning..."
    ./gradlew clean --no-daemon
fi

echo "=== Building QuietFlow Release ==="
echo "Web export should already be in ../out/ (run 'npm run build' in project root first)"
echo ""

# Sync Capacitor (copies web assets to android/app/src/main/assets/public)
echo "Syncing Capacitor..."
cd ..
npx cap sync android
cd android

# Build both AAB and APK
echo ""
echo "Building AAB (Play Store)..."
./gradlew :app:bundleQuietflowRelease --no-daemon

echo ""
echo "Building APK (sideload)..."
./gradlew :app:assembleQuietflowRelease --no-daemon

echo ""
echo "=== Build Complete ==="
echo "Outputs:"
echo "  AAB: app/build/outputs/bundle/quietflowRelease/app-quietflow-release.aab"
echo "  APK: app/build/outputs/apk/quietflow/release/app-quietflow-release.apk"
echo ""
echo "Verifying signatures..."

# Find apksigner
APKSIGNER=$(find "$ANDROID_HOME/build-tools" -name "apksigner*" -type f 2>/dev/null | head -1)
if [[ -z "$APKSIGNER" ]]; then
    APKSIGNER=$(find "$ANDROID_SDK_ROOT/build-tools" -name "apksigner*" -type f 2>/dev/null | head -1)
fi
if [[ -z "$APKSIGNER" ]]; then
    echo "WARNING: apksigner not found in ANDROID_HOME/ANDROID_SDK_ROOT"
else
    echo "Verifying AAB..."
    java -jar "$APKSIGNER" verify --print-certs app/build/outputs/bundle/quietflowRelease/app-quietflow-release.aab
    echo ""
    echo "Verifying APK..."
    java -jar "$APKSIGNER" verify --print-certs app/build/outputs/apk/quietflow/release/app-quietflow-release.apk
fi

echo ""
echo "Done! Copy outputs to release directory if needed."