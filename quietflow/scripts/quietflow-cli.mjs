// QuietFlow CLI launcher (ESM). The app's package.json is CommonJS (Next.js),
// so we run the TS modules through an explicit .mjs entry that imports them.
// Usage: node scripts/quietflow-cli.mjs [godview|discover|route|local|bridge|audit]

import { buildRouteCameraPlan } from '../src/lib/route-camera-plan.ts';
import { aggregateGodView } from '../src/lib/synthetic-feed.ts';
import { auditOwnNetwork } from '../src/lib/lan-camera-auditor.ts';
import { registerLocalCamera, toAppCamera } from '../src/lib/local-camera.ts';
import { startBridge, stopBridge, buildFfmpegArgs, activeBridgeIds } from '../src/lib/local-camera-bridge.ts';
import { findAdminAdminCameras, retryUntilHardened } from '../src/lib/admin-admin-finder.ts';

const DALLAS = { lat: 32.7767, lng: -96.797 };
const print = (...a) => console.log(...a);

async function cmdGodview() {
  const overlay = aggregateGodView(DALLAS, [], { seed: 1337 });
  print('=== QuietFlow God-View (synthetic + consented) ===');
  print(`center: ${overlay.center.lat}, ${overlay.center.lng}`);
  print(`source: ${overlay.source}  tiles: ${overlay.tiles.length}`);
  print(`mean congestion: ${(overlay.meanScore * 100).toFixed(0)}%  worst: ${overlay.worstLevel}`);
}

async function cmdDiscover() {
  print('=== QuietFlow Discovery + Heading Filter (±45°) ===');
  print('(Real discovery: discoverCameras() in src/lib/camera-discovery.ts.)');
  const route = [[32.8000, -96.8100], [32.8000, -96.7900]];
  const cams = [
    { id: 'osm-1', name: 'TxDOT CCTV', lat: 32.8005, lng: -96.8000, camera_bearing: 180, confidence: 0.9, source: 'cctv' },
    { id: 'osm-2', name: 'City cam', lat: 32.8005, lng: -96.8050, camera_bearing: 0, confidence: 0.7, source: 'osm' },
  ];
  const plan = buildRouteCameraPlan({ start: route[0], end: route[1], route, cameras: cams, center: DALLAS });
  print(`toward-facing: ${plan.towardFacingCameras.length}  away: ${plan.awayFacingCameras.length}`);
  print('selected for display:', plan.selectedCameras.map((c) => c.name));
}

async function cmdRoute() {
  const route = [[32.8000, -96.8100], [32.8000, -96.7900]];
  const plan = buildRouteCameraPlan({ start: route[0], end: route[1], route, cameras: [], center: DALLAS, localCameras: [
    { id: 'mine', name: 'My Cam', host: '192.168.1.42', lat: 32.8005, lng: -96.8000, camera_bearing: 180, user: 'quietflow', pass: 'StrongUn1que!Pass' },
  ] });
  print('=== QuietFlow Route Camera Plan (with YOUR local camera, no OAuth) ===');
  print(`toward: ${plan.towardFacingCameras.map((c) => c.name).join(', ')}`);
  print(`God-View tiles: ${plan.godView.tiles.length}  worst=${plan.godView.worstLevel}`);
  print(`local rejected (default creds): ${plan.localRejected.length}`);
}

async function cmdLocal() {
  print('=== Register YOUR camera over local RTSP (no cloud OAuth) ===');
  const good = registerLocalCamera({ id: 'garage', name: 'Garage', host: '192.168.1.42', lat: 32.8005, lng: -96.8000, camera_bearing: 180, user: 'quietflow', pass: 'StrongUn1que!Pass' });
  print(`accepted=${good.accepted} url=${good.rtspUrl}`);
  const bad = registerLocalCamera({ id: 'backyard', name: 'Backyard', host: '192.168.1.43', lat: 32.8006, lng: -96.8010, user: 'admin', pass: '12345' });
  print(`accepted=${bad.accepted} reason=${bad.warning ?? '-'}`);
}

async function cmdBridge() {
  print('=== Register + ffmpeg→HLS bridge for YOUR camera ===');
  const spec = { id: 'garage', name: 'Garage', host: '192.168.1.42', lat: 32.8005, lng: -96.8000, camera_bearing: 180, user: 'quietflow', pass: 'StrongUn1que!Pass' };
  const reg = registerLocalCamera(spec);
  if (!reg.accepted) { print('Refused:', reg.warning); return; }
  const hlsUrl = `/hls/local-${spec.id}/index.m3u8`;
  const appCam = toAppCamera(spec, hlsUrl);
  print(`App Camera: id=${appCam.id} protocol=${appCam.protocol} streamUrl=${appCam.streamUrl}`);
  print('ffmpeg args:', buildFfmpegArgs(reg.rtspUrl, `public/hls/local-${spec.id}`, 2, 5).join(' '));
  // Actually start the bridge (requires ffmpeg on PATH). This spawns ffmpeg.
  const handle = await startBridge({ id: `local-${spec.id}`, rtspUrl: reg.rtspUrl });
  print(`Bridge started → ${handle.hlsUrl} (ffmpeg pid ${handle.process.pid})`);
  print('Active bridges:', activeBridgeIds());
  // Give ffmpeg a moment, then show whether segments appeared.
  await new Promise((r) => setTimeout(r, 2500));
  await stopBridge(handle.id);
  print('Bridge stopped; HLS segments cleaned up.');
}

async function cmdAudit() {
  print('=== QuietFlow Own-Network Camera Auditor ===');
  print('Scans a network you OWN only. Read-only port probes. No login, no streaming.');
  const argv = process.argv.slice(3);
  const cidr = argv.find((a) => a.includes('/')) ?? '192.168.1.0/24';
  const own = argv.includes('--i-own-this-network');
  if (!own) {
    print('\nREFUSED: pass --i-own-this-network to confirm you own/are authorized for this LAN.');
    print('Example: node scripts/quietflow-cli.mjs audit 192.168.1.0/24 --i-own-this-network');
    const res = await auditOwnNetwork({ cidr, iOwnThisNetwork: false });
    print(`authorized=${res.authorized}`);
    return;
  }
  print(`\nScanning ${cidr} (authorized by operator)...`);
  const res = await auditOwnNetwork({ cidr, iOwnThisNetwork: true, connectTimeoutMs: 500 });
  print(`hostsScanned=${res.hostsScanned} hostsUp=${res.hostsUp} cameraLike=${res.cameraLikeHosts.length}`);
  for (const f of res.findings.slice(0, 10)) print(`[${f.severity}] ${f.host}: ${f.message}`);
  print('\nDefault credentials to change on YOUR devices:');
  for (const d of res.defaultCredsToChange) print(`  ${d.user}/${d.pass || '(empty)'} — ${d.appliesTo}`);
}

async function cmdFind() {
  print('=== Find cameras still on admin/admin (YOUR network) ===');
  const argv = process.argv.slice(3);
  const cidr = argv.find((a) => a.includes('/')) ?? '192.168.1.0/24';
  const own = argv.includes('--i-own-this-network');
  if (!own) {
    print('REFUSED: pass --i-own-this-network. Example:');
    print('  node scripts/quietflow-cli.mjs find 192.168.1.0/24 --i-own-this-network');
    const res = await findAdminAdminCameras(cidr, false);
    print(`authorized=${res.authorized}`);
    return;
  }
  const res = await findAdminAdminCameras(cidr, true);
  print(`checked=${res.checked} stillOnAdminAdmin=${res.stillOnAdminAdmin.length} hardened=${res.hardened}`);
  for (const f of res.stillOnAdminAdmin) print(`  STILL DEFAULT: ${f.ip}:${f.port} (${f.scheme})`);
}

async function cmdHarden() {
  print('=== Retry until all YOUR cameras are off admin/admin ===');
  const argv = process.argv.slice(3);
  const cidr = argv.find((a) => a.includes('/')) ?? '192.168.1.0/24';
  const own = argv.includes('--i-own-this-network');
  if (!own) {
    print('REFUSED: pass --i-own-this-network.');
    return;
  }
  const res = await retryUntilHardened({
    cidr,
    iOwnThisNetwork: true,
    maxAttempts: 30,
    retryMs: 8000,
    onAttempt: (r, a) => print(`  attempt ${a}: ${r.stillOnAdminAdmin.length} still on admin/admin, ${r.hardened} hardened`),
  });
  print(`Done in ${res.attempts} attempt(s). Remaining on admin/admin: ${res.stillOnAdminAdmin.length}`);
}

const cmd = process.argv[2] ?? 'godview';
const runners = { godview: cmdGodview, discover: cmdDiscover, route: cmdRoute, local: cmdLocal, bridge: cmdBridge, audit: cmdAudit, find: cmdFind, harden: cmdHarden };
if (!runners[cmd]) { print('Usage: node scripts/quietflow-cli.mjs [godview|discover|route|local|bridge|audit]'); process.exit(1); }
runners[cmd]().catch((e) => { console.error(e); process.exit(1); });
