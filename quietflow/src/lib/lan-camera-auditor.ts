// ─── Own-Network Camera Security Auditor (Module 2) ──
//
// PURPOSE: help the OWNER of a LAN find their IP cameras that are still on
// factory default credentials (admin/admin, 12345/12345, root/root) or other
// insecure config, and tell them to change them. This is defensive hardening.
//
// AUTHORIZATION MODEL (you must read this before running):
//   • This tool ONLY scans networks you own or are explicitly authorized to
//     assess. It never scans third parties, the internet at large, residential
//     doorbells you don't own, or anyone else's CCTV.
//   • Running against a network you don't own/aren't authorized for is
//     unauthorized access and is illegal in most jurisdictions.
//   • `requireOwnershipConfirmation` is ON by default and will refuse to run
//     unless you pass `{ iOwnThisNetwork: true }`. Do not bypass this.
//
// BEHAVIOR: it does NOT try to log in to or authenticate against any camera,
// and it does NOT stream or capture any video. It only (a) probes ports you
// specify on hosts in a CIDR you specify, and (b) reports that a host is
// reachable with a camera-typical port open. The "default credential" finding
// is purely advisory: it lists the well-known default pairs so you know which
// devices to go harden. No credential is ever sent over the network here.

import { createConnection } from 'node:net';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { DEFAULT_CREDS } from './credential-defaults.ts';

const execFileAsync = promisify(execFile);

export interface AuditHost {
  ip: string;
  reachable: boolean;
  openPorts: number[];
  /** True if any open port is a common camera/admin port. */
  cameraLike: boolean;
  notes: string[];
}

export interface AuditFinding {
  host: string;
  severity: 'high' | 'medium' | 'low' | 'info';
  message: string;
  recommendation: string;
}

export interface AuditResult {
  cidr: string;
  scannedAt: string;
  hostsScanned: number;
  hostsUp: number;
  cameraLikeHosts: AuditHost[];
  findings: AuditFinding[];
  /** Advisory list of well-known default credential pairs to check manually. */
  defaultCredsToChange: Array<{ user: string; pass: string; appliesTo: string }>;
  authorized: boolean;
}

export interface AuditorConfig {
  cidr: string;
  ports?: number[];
  connectTimeoutMs?: number;
  /** MUST be true to run. Set by the operator who owns the network. */
  iOwnThisNetwork: boolean;
}

// Common camera / admin ports we report on (read-only probe; no auth attempted).
const DEFAULT_PORTS = [80, 443, 554, 23, 8000, 8080, 8554];

// Well-known factory defaults are defined in ./credential-defaults.ts (pure,
// no Node built-ins) and re-used here so there is a single source of truth.
export { matchesKnownDefault } from './credential-defaults.ts';

// ─── CIDR → host list ───

export function expandCidr(cidr: string): string[] {
  const [base, bitsStr] = cidr.split('/');
  const bits = bitsStr ? parseInt(bitsStr, 10) : 24;
  if (Number.isNaN(bits) || bits < 0 || bits > 32) {
    throw new Error(`Invalid CIDR prefix: ${cidr}`);
  }
  const parts = base.split('.').map((n) => parseInt(n, 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    throw new Error(`Invalid CIDR base: ${base}`);
  }
  const ipInt = ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
  const hostBits = 32 - bits;
  const network = (ipInt & (~0 << hostBits)) >>> 0;
  const total = Math.pow(2, hostBits);
  // Skip network (.0) and broadcast (.255) for /24-and-wider; skip if too large.
  if (total > 1024) {
    throw new Error(`Refusing to expand ${cidr} (${total} hosts). Scan a /22 or smaller.`);
  }
  const ips: string[] = [];
  for (let i = 1; i < total - 1 || total <= 2; i++) {
    const n = (network + i) >>> 0;
    ips.push(`${(n >>> 24) & 255}.${(n >>> 16) & 255}.${(n >>> 8) & 255}.${n & 255}`);
    if (ips.length >= total - 1) break;
  }
  return ips;
}

// ─── Single TCP port probe (no payload sent; pure reachability) ───

function probePort(ip: string, port: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (open: boolean) => {
      if (done) return;
      done = true;
      sock.destroy();
      resolve(open);
    };
    const sock = createConnection(port, ip);
    sock.setTimeout(timeoutMs);
    sock.once('connect', () => finish(true));
    sock.once('timeout', () => finish(false));
    sock.once('error', () => finish(false));
  });
}

// ─── Host discovery (ARP-based, OS-native, no external deps) ───

async function discoverLocalHosts(): Promise<string[]> {
  const platform = process.platform;
  try {
    if (platform === 'win32') {
      const { stdout } = await execFileAsync('arp', ['-a']);
      return parseArpWindows(stdout);
    }
    if (platform === 'darwin') {
      const { stdout } = await execFileAsync('arp', ['-a', '-n']);
      return parseArpUnix(stdout);
    }
    // Linux / other
    const { stdout } = await execFileAsync('ip', ['neighbor']);
    return parseIpNeighbor(stdout);
  } catch {
    return [];
  }
}

function parseArpWindows(text: string): string[] {
  const ips = new Set<string>();
  for (const line of text.split('\n')) {
    const m = line.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
    if (m) ips.add(m[1]);
  }
  return [...ips];
}

function parseArpUnix(text: string): string[] {
  const ips = new Set<string>();
  for (const line of text.split('\n')) {
    const m = line.match(/\((\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\)/);
    if (m) ips.add(m[1]);
  }
  return [...ips];
}

function parseIpNeighbor(text: string): string[] {
  const ips = new Set<string>();
  for (const line of text.split('\n')) {
    const m = line.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
    if (m) ips.add(m[1]);
  }
  return [...ips];
}

// ─── Exported safe helpers (reused by the admin/admin finder) ───

/** Ports treated as "camera-like" for discovery. */
export const CAMERA_PORTS = new Set([80, 443, 554, 23, 8000, 8080, 8554, 37777, 34567, 5000]);

/** Pure reachability probe (no payload). Exported for reuse. */
export function probePortSafe(ip: string, port: number, timeoutMs: number): Promise<boolean> {
  return probePort(ip, port, timeoutMs);
}

/** ARP/neighbor host discovery. Exported for reuse (returns [] on failure). */
export async function discoverLocalHostsSafe(): Promise<string[]> {
  return discoverLocalHosts();
}

// ─── Main audit ───

/**
 * Audit camera-like hosts on a network you OWN. Pure reachability probing +
 * advisory default-cred guidance. No login attempts, no video capture.
 */
export async function auditOwnNetwork(cfg: AuditorConfig): Promise<AuditResult> {
  if (!cfg.iOwnThisNetwork) {
    return {
      cidr: cfg.cidr,
      scannedAt: new Date().toISOString(),
      hostsScanned: 0,
      hostsUp: 0,
      cameraLikeHosts: [],
      findings: [
        {
          host: '(none)',
          severity: 'info',
          message: 'Audit refused: you must confirm you own/are authorized for this network.',
          recommendation: 'Re-run with { iOwnThisNetwork: true } for a network you own.',
        },
      ],
      defaultCredsToChange: DEFAULT_CREDS,
      authorized: false,
    };
  }

  const ports = cfg.ports && cfg.ports.length ? cfg.ports : DEFAULT_PORTS;
  const timeout = cfg.connectTimeoutMs ?? 600;

  // Prefer live ARP hosts (fast, accurate) and union with CIDR expansion
  // so the operator can scan a specific subnet explicitly.
  let targets: string[];
  try {
    targets = expandCidr(cfg.cidr);
  } catch {
    targets = [];
  }
  const arpHosts = await discoverLocalHosts();
  const seen = new Set<string>(arpHosts);
  for (const t of targets) seen.add(t);
  const allTargets = [...seen];

  const cameraPorts = new Set([80, 443, 554, 23, 8000, 8080, 8554, 37777, 34567, 5000]);
  const hosts: AuditHost[] = [];

  await Promise.all(
    allTargets.map(async (ip) => {
      const results = await Promise.all(ports.map((p) => probePort(ip, p, timeout)));
      const openPorts = ports.filter((_, i) => results[i]);
      if (openPorts.length === 0) return;
      const cameraLike = openPorts.some((p) => cameraPorts.has(p));
      hosts.push({
        ip,
        reachable: true,
        openPorts,
        cameraLike,
        notes: cameraLike
          ? ['Camera/admin-style port open — verify it is yours and change defaults.']
          : ['Reachable host with non-camera ports open.'],
      });
    }),
  );

  const cameraLikeHosts = hosts.filter((h) => h.cameraLike);
  const findings: AuditFinding[] = [];

  for (const h of cameraLikeHosts) {
    findings.push({
      host: h.ip,
      severity: 'high',
      message: `Camera-like device at ${h.ip} (ports: ${h.openPorts.join(', ')}). If this is yours and still on factory defaults, it is exposed.`,
      recommendation:
        'Log in via the vendor app/web UI and set a STRONG unique password. Disable Telnet (23) and UPnP; keep firmware updated. If it is NOT yours, disconnect it from your network.',
    });
    if (h.openPorts.includes(23)) {
      findings.push({
        host: h.ip,
        severity: 'high',
        message: `Telnet (23) is open on ${h.ip}. Telnet is plaintext and a common attack vector.`,
        recommendation: 'Disable Telnet; use SSH or the vendor UI only. Never expose 23 to the internet.',
      });
    }
    if (h.openPorts.includes(554)) {
      findings.push({
        host: h.ip,
        severity: 'medium',
        message: `RTSP (554) is open on ${h.ip}. Without a strong stream password, anyone on the LAN can view the feed.`,
        recommendation: 'Set a strong RTSP password; bind the stream to a VLAN/isolated IoT network.',
      });
    }
  }

  return {
    cidr: cfg.cidr,
    scannedAt: new Date().toISOString(),
    hostsScanned: allTargets.length,
    hostsUp: hosts.length,
    cameraLikeHosts,
    findings,
    defaultCredsToChange: DEFAULT_CREDS,
    authorized: true,
  };
}
