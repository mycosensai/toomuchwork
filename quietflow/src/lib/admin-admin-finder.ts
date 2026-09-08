// ─── admin/admin Finder + Retry (own-network hardening) ──
//
// Companion to the LAN camera auditor. The auditor ADVISES you to change
// default credentials; this module actively CHECKS whether a camera you OWN is
// still on the classic "admin/admin" default, and RETRIES until they're all
// hardened (or you stop it).
//
// AUTHORIZATION MODEL (same as the auditor):
//   • Runs ONLY on a network you own / are authorized to assess. Refuses unless
//     you pass iOwnThisNetwork:true.
//   • It performs a single, clearly-scoped credential check (HTTP Basic
//     "admin:admin") against YOUR reachable camera-like hosts. It does NOT
//     stream video, does NOT brute-force other credentials, and does NOT touch
//     third-party networks.
//   • This is a device-hardening tool, not an exploit. Use it to verify your own
//     cameras are no longer on factory defaults after you change the password.

import http from 'node:http';
import https from 'node:https';
import { expandCidr, discoverLocalHostsSafe, probePortSafe, CAMERA_PORTS } from './lan-camera-auditor.ts';

export interface AdminAdminFinding {
  ip: string;
  port: number;
  scheme: 'http' | 'https';
  /** true = admin/admin was accepted (device still on default). */
  onAdminAdmin: boolean;
  /** true = could not determine (no HTTP service / timeout / TLS error). */
  unknown: boolean;
  /** Brand whose auth path confirmed the default (when onAdminAdmin). */
  brand?: string;
  /** 'hardened' when an auth challenge (401/403) was seen → real creds required. */
  status?: 'hardened' | string;
  checkedAt: string;
}

export interface FinderResult {
  cidr: string;
  scannedAt: string;
  checked: number;
  stillOnAdminAdmin: AdminAdminFinding[];
  hardened: number;
  authorized: boolean;
}

export interface RetryOptions {
  cidr: string;
  iOwnThisNetwork: boolean;
  /** Max re-checks before giving up. Default 30. */
  maxAttempts?: number;
  /** Wait between attempts (ms). Default 10000. */
  retryMs?: number;
  /** Called after each attempt with the latest result. */
  onAttempt?: (result: FinderResult, attempt: number) => void;
  /** Override the scan step (for tests / custom probe). */
  finder?: (cidr: string, iOwn: boolean) => Promise<FinderResult>;
  /** Override the wait (for tests). */
  sleep?: (ms: number) => Promise<void>;
}

// Known auth-gated endpoints per brand. We send admin:admin against THESE
// (not the open landing page). A device that *challenges* for auth (401/403)
// is treated as HARDENED (auth required) — this kills the false positive where
// an open "/" returns 200 without actually accepting the credential.
const BRAND_AUTH_PATHS: { brand: string; paths: string[] }[] = [
  { brand: 'hikvision', paths: ['/ISAPI/Security/userCheck', '/ISAPI/Security/channels', '/ISAPI/System/deviceInfo'] },
  { brand: 'dahua', paths: ['/cgi-bin/magicBox.cgi?action=getSystemInfo', '/cgi-bin/configManager.cgi?action=getConfig&name=LocalLink'] },
  { brand: 'axis', paths: ['/axis-cgi/usergroup.cgi', '/axis-cgi/param.cgi?action=list'] },
  { brand: 'reolink', paths: ['/cgi-bin/api.cgi?cmd=GetChannelstatus'] },
  { brand: 'generic', paths: ['/cgi-bin/', '/device.htm', '/index.htm'] },
];

export interface ProbeOutcome {
  onAdminAdmin: boolean;
  unknown: boolean;
  /** Brand whose auth path confirmed the default (for the report). */
  brand?: string;
  /** HTTP status observed (for transparency). */
  status?: number;
}

/** Random path that cannot legitimately exist — used as a control probe. */
function controlPath(): string {
  return `/quietflow-control-${Math.random().toString(36).slice(2, 12)}`;
}

/** One HTTP-Basic admin:admin attempt against a single path. */
function tryBasic(ip: string, port: number, scheme: 'http' | 'https', path: string): Promise<{ status: number; errored: boolean }> {
  return new Promise((resolve) => {
    const cred = Buffer.from('admin:admin').toString('base64');
    const lib = scheme === 'https' ? https : http;
    const req = lib.request(
      {
        host: ip,
        port,
        path,
        method: 'GET',
        headers: { Authorization: `Basic ${cred}`, 'User-Agent': 'QuietFlow-Harden/1.0' },
        timeout: 1500,
        rejectUnauthorized: false, // LAN self-signed certs; your own device
      } as any,
      (res) => {
        res.resume();
        resolve({ status: res.statusCode ?? 0, errored: false });
      },
    );
    req.on('error', () => resolve({ status: 0, errored: true }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 0, errored: true });
    });
    req.end();
  });
}

/**
 * Check a host for the admin/admin default using brand-aware auth-gated paths.
 * Logic:
 *   • A control probe on a random non-existent path runs FIRST. If that path
 *     also "succeeds" with admin:admin, the device answers affirmatively to
 *     everything (open landing page, catch-all router, HTTPS redirector) and no
 *     finding can be trusted → unknown. This is what stops a plain router from
 *     being reported as a wide-open Hikvision camera.
 *   • Only a genuine 2xx counts as acceptance. A 3xx redirect is NOT acceptance
 *     — routers 308-redirect every path to HTTPS, which is not a credential
 *     result.
 *   • If a path returns 401/403 (challenge) → auth is required → hardened.
 *   • If everything errors/timeouts/closed → unknown.
 */
async function tryAdminAdmin(ip: string, port: number, scheme: 'http' | 'https'): Promise<ProbeOutcome> {
  // Control probe: a path that cannot exist. If admin:admin "works" here, the
  // host answers 2xx indiscriminately and every later hit would be a false
  // positive.
  const control = await tryBasic(ip, port, scheme, controlPath());
  if (!control.errored && control.status >= 200 && control.status < 300) {
    return { onAdminAdmin: false, unknown: true };
  }

  let sawChallenge = false;
  for (const { brand, paths } of BRAND_AUTH_PATHS) {
    for (const p of paths) {
      const r = await tryBasic(ip, port, scheme, p);
      if (r.errored) continue;
      // Only a real 2xx is acceptance. 3xx is a redirect, not a credential result.
      if (r.status >= 200 && r.status < 300) {
        return { onAdminAdmin: true, unknown: false, brand, status: r.status };
      }
      if (r.status === 401 || r.status === 403) {
        sawChallenge = true;
      }
    }
  }
  // No gated path accepted admin:admin. If we saw an auth challenge, the device
  // requires real credentials → hardened. Otherwise we couldn't determine.
  return { onAdminAdmin: false, unknown: !sawChallenge, brand: sawChallenge ? 'hardened' : undefined, status: undefined };
}

/**
 * Check a single host/port you own for the admin/admin default.
 * Exported so tests exercise the REAL decision logic rather than a
 * reimplementation of it.
 */
export async function checkHostForAdminAdmin(
  ip: string,
  port: number,
  scheme: 'http' | 'https',
): Promise<ProbeOutcome> {
  return tryAdminAdmin(ip, port, scheme);
}

/** Discover which of YOUR reachable camera-like hosts are still on admin/admin. */
export async function findAdminAdminCameras(cidr: string, iOwnThisNetwork: boolean): Promise<FinderResult> {
  const base: FinderResult = {
    cidr,
    scannedAt: new Date().toISOString(),
    checked: 0,
    stillOnAdminAdmin: [],
    hardened: 0,
    authorized: false,
  };
  if (!iOwnThisNetwork) return base; // refusal handled by caller message

  // Gather candidate hosts: CIDR expansion unioned with live ARP table.
  let targets: string[] = [];
  try {
    targets = expandCidr(cidr);
  } catch {
    targets = [];
  }
  const arp = await discoverLocalHostsSafe();
  const seen = new Set([...targets, ...arp]);

  const findings: AdminAdminFinding[] = [];
  await Promise.all(
    [...seen].map(async (ip) => {
      // Only check hosts that look camera-like (reachable on a camera port).
      const ports = [80, 443, 8080, 8000];
      const results = await Promise.all(ports.map((p) => probePortSafe(ip, p, 600)));
      const openHttp = ports.filter((_, i) => results[i]);
      if (openHttp.length === 0) return;

      for (const port of openHttp) {
        const scheme: 'http' | 'https' = port === 443 ? 'https' : 'http';
        const r = await tryAdminAdmin(ip, port, scheme);
        findings.push({
          ip,
          port,
          scheme,
          onAdminAdmin: r.onAdminAdmin,
          unknown: r.unknown,
          brand: r.brand,
          status: r.unknown ? undefined : r.onAdminAdmin ? r.brand : 'hardened',
          checkedAt: new Date().toISOString(),
        });
        break; // one scheme per host is enough
      }
    }),
  );

  const decided = findings.filter((f) => !f.unknown);
  const still = findings.filter((f) => f.onAdminAdmin);
  return {
    ...base,
    checked: decided.length,
    stillOnAdminAdmin: still,
    hardened: decided.length - still.length,
    authorized: true,
  };
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Retry the admin/admin check until every reachable camera you own is hardened
 * (no longer on admin/admin), or until maxAttempts is reached.
 *
 * Returns the last result plus the attempt count. Use onAttempt to drive a UI
 * progress bar. Pass finder/sleep overrides for testing without real scans.
 */
export async function retryUntilHardened(opts: RetryOptions): Promise<FinderResult & { attempts: number }> {
  const maxAttempts = opts.maxAttempts ?? 30;
  const retryMs = opts.retryMs ?? 10000;
  const finder = opts.finder ?? ((c, o) => findAdminAdminCameras(c, o));
  const sleep = opts.sleep ?? defaultSleep;

  let last: FinderResult = await finder(opts.cidr, opts.iOwnThisNetwork);
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    opts.onAttempt?.(last, attempt);
    if (last.stillOnAdminAdmin.length === 0) {
      return { ...last, attempts: attempt };
    }
    if (attempt < maxAttempts) await sleep(retryMs);
    last = await finder(opts.cidr, opts.iOwnThisNetwork);
  }
  return { ...last, attempts: maxAttempts };
}
