// Sign the unsigned QuietFlow release APK with apksigner.
// AGP's legacy KeystoreHelper can't read modern PKCS12 keys ("tag type 35"),
// so we sign post-build with apksigner (modern keystore reader).
//
// Usage: node scripts/sign-release.cjs
// Env: KEYSTORE_PASSWORD, KEY_PASSWORD (default to build.gradle values).

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const SDK = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT ||
  'C:/Users/vdako/AppData/Local/Android/Sdk';
const APKSIGNER = 'C:/Users/vdako/AppData/Local/Android/Sdk/build-tools/36.0.0/lib/apksigner.jar';
const ZIPALIGN = 'C:/Users/vdako/AppData/Local/Android/Sdk/build-tools/36.0.0/zipalign.exe';

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'android', 'app', 'build', 'outputs', 'apk', 'release');
const UNSIGNED = path.join(BUILD, 'app-release-unsigned.apk');
const ALIGNED = path.join(BUILD, 'app-release-aligned.apk');
const SIGNED = path.join(BUILD, 'app-release.apk');
const KEYSTORE = path.join(ROOT, 'android', 'app', 'keystore.jks');

const KS_PASS = process.env.KEYSTORE_PASSWORD || 'quietflow123';
const KEY_PASS = process.env.KEY_PASSWORD || 'quietflow123';
const ALIAS = 'quietflow';

if (!fs.existsSync(UNSIGNED)) {
  console.error('Unsigned APK not found:', UNSIGNED);
  console.error('Run: cd android && ./gradlew assembleRelease');
  process.exit(1);
}

console.log('Aligning...');
execFileSync(ZIPALIGN, ['-p', '4', UNSIGNED, ALIGNED], { stdio: 'inherit' });

console.log('Signing with apksigner...');
execFileSync('java', [
  '-jar', APKSIGNER,
  'sign',
  '--ks', KEYSTORE,
  '--ks-key-alias', ALIAS,
  '--ks-pass', `pass:${KS_PASS}`,
  '--key-pass', `pass:${KEY_PASS}`,
  '--out', SIGNED,
  ALIGNED,
], { stdio: 'inherit' });

console.log('Verifying...');
execFileSync('java', ['-jar', APKSIGNER, 'verify', '--verbose', SIGNED], { stdio: 'inherit' });

console.log('\n✅ Signed release APK:', SIGNED);
console.log('   Size:', (fs.statSync(SIGNED).size / 1e6).toFixed(2), 'MB');
