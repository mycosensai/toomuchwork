# QuietFlow — authorized-data "God-View" route planning

QuietFlow ingests **only data you are allowed to have**: public/consented traffic
cameras, **your own** LAN cameras (over local RTSP/ONVIF — no cloud login), and a
deterministic synthetic density layer. It builds a route-aware "God-View" — never
touching private or residential feeds you don't own.

## Modules

| Module | File | What it does |
|--------|------|--------------|
| 1. Consented discovery → route plan | `src/lib/heading-filter.ts`, `src/lib/route-camera-plan.ts` | Public/consented camera discovery (OSM, 511, TxDOT) + the **±45° directional heading filter** (toward-facing preferred, away-facing fallback). |
| 1b. Your own cameras, no OAuth | `src/lib/local-camera.ts` | Register cameras YOU own over local RTSP/ONVIF — no vendor cloud login. Refuses devices still on factory-default credentials. |
| 1c. ffmpeg → HLS bridge | `src/lib/local-camera-bridge.ts` | Transcodes YOUR RTSP camera to a browser-playable HLS stream (`/hls/<id>/index.m3u8`) that `LiveCameraView` renders natively. Array-arg ffmpeg (no shell injection). |
| 2. Own-network security auditor | `src/lib/lan-camera-auditor.ts` | LAN-only read-only port probe + advisory default-credential guidance. Refuses unless you confirm ownership. No login, no streaming. |
| 2b. admin/admin finder + retry | `src/lib/admin-admin-finder.ts` | Brand-aware check of YOUR reachable camera-like hosts for `admin/admin` (probes per-brand auth-gated paths; a 401 challenge = hardened, not a false positive), plus `retryUntilHardened()` to re-check until clean. |
| 2c. Local security bridge | `scripts/serve.js` | Tiny localhost server that runs the finder server-side (the static app can't scan a LAN). UI calls `POST /api/find`. |

## How the UI uses it (LAN Security panel)

The app is a **static export** (`next.config` `output:"export"`) with no server, and
browsers can't scan a LAN. So the scan runs in a local helper process:

```bash
node scripts/serve.js        # listens on 127.0.0.1:8788
```

Then open the app → **LAN Security** (sidebar) → enter your CIDR, check "I own this
network", and **Find admin/admin cameras**. Each flagged device has a
**"Re-check (I changed it)"** button that re-runs the scan for that host after you
set a strong password on the device. If the bridge isn't running, the panel shows the
one-line start command. Every request must include `iOwnThisNetwork:true` or the
bridge refuses (403).
| 3. Aggregated God-View overlay | `src/lib/synthetic-feed.ts` | Continuous pulsing density field (consented + synthetic). Density vocab: green=Not busy at all, yellow=A little busy, orange=Pretty poppin, red=Super jeeted, purple=Wait a bit. |

## The one mistake, and the fix

**Mistake:** the first version only let your cameras feed the God-View through a
vendor **cloud OAuth** login (Ring/Nest/Arlo/Wyze tokens). Most of your own LAN
cameras aren't cloud-managed and shouldn't need a vendor account — so they were
effectively unreachable.

**Fix (`src/lib/local-camera.ts` + `local-camera-bridge.ts`):** cameras you own now
register directly over local RTSP/ONVIF via credentials you control — no cloud, no
OAuth, no reverse-engineered vendor API — and an ffmpeg bridge turns the RTSP feed
into HLS that the app plays natively. The authorization boundary (only cameras you're
allowed to view) is preserved; the cloud-login gate is gone for *your* devices.

Safeguards kept:
- A camera still on a **factory default** (`admin/admin`, `12345/12345`,
  `root/root`, …) is **refused** and told to change the password first.
- The auditor's `iOwnThisNetwork` confirmation is still required — it will not scan
  a network you don't own/aren't authorized for.
- ffmpeg runs with an **argument array** (never a shell string) so host/cred values
  can't inject commands.
- Nothing scans the internet or third-party cameras.

## Run

```bash
node scripts/quietflow-cli.mjs godview     # aggregated God-View overlay
node scripts/quietflow-cli.mjs discover    # public discovery + ±45° heading filter
node scripts/quietflow-cli.mjs route       # route plan incl. your local cameras (no OAuth)
node scripts/quietflow-cli.mjs local       # register your own RTSP camera / see default-cred refusal
node scripts/quietflow-cli.mjs bridge      # register + spawn real ffmpeg→HLS bridge, then clean up
node scripts/quietflow-cli.mjs find 192.168.1.0/24 --i-own-this-network       # list cameras still on admin/admin
node scripts/quietflow-cli.mjs harden 192.168.1.0/24 --i-own-this-network     # retry until none are on admin/admin
node scripts/quietflow-cli.mjs audit 192.168.1.0/24 --i-own-this-network
```

Requires `ffmpeg` on PATH (you have 8.1.1). The `bridge` command actually spawns
ffmpeg; against a real camera it writes `public/hls/local-<id>/index.m3u8` + segments.

## Test

```bash
node --test          # 29 tests: heading filter, synthetic feed, local-camera wiring,
                     # ffmpeg arg construction, default-cred refusal, audit gating
```

## Wiring your own camera end-to-end

```ts
import { registerLocalCamera, toAppCamera } from './lib/local-camera';
import { startBridge } from './lib/local-camera-bridge';
import { useStore } from '@/store';

const spec = {
  id: 'garage', name: 'Garage Hikvision', host: '192.168.1.42',
  lat: 32.8005, lng: -96.8000, camera_bearing: 180,
  user: 'quietflow', pass: 'StrongUn1que!Pass',  // NOT a default → accepted
};

const reg = registerLocalCamera(spec);
if (!reg.accepted) throw new Error(reg.warning);            // default cred → refused
const hlsUrl = `/hls/local-${spec.id}/index.m3u8`;
const appCam = toAppCamera(spec, hlsUrl);                   // Camera for the UI
await startBridge({ id: `local-${spec.id}`, rtspUrl: reg.rtspUrl });  // spawn ffmpeg
useStore.getState().addLocalCamera(appCam);                // appears in map + grid
```

Then `LiveCameraView` plays `/hls/local-garage/index.m3u8` via hls.js. Stop with
`stopBridge('local-garage')`.

## Where it renders

- `src/components/camera/live-camera-view.tsx` already plays `protocol: 'hls'` —
  your local cameras flow through unchanged.
- `src/store/index.ts` gained `addLocalCamera` / `removeLocalCamera` so your cameras
  join the `cameras` array (map markers + camera grid).
- `public/hls/` is git-ignored by default in most setups; it's runtime-generated.
