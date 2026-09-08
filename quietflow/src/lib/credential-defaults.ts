// ─── Known factory-default credentials (advisory, pure) ──
//
// A small, dependency-free list of well-known default (user, pass) pairs for
// common camera/NVR brands. Used to REFUSE streaming from a device still on
// factory defaults (you must change it first) and to advise which devices to
// harden.
//
// This module is intentionally free of any Node built-ins (no `node:net`) so it
// can be imported by client code (e.g. local-camera.ts via the My Cameras view)
// without pulling server-only APIs into the browser bundle.

export interface DefaultCred {
  user: string;
  pass: string;
  appliesTo: string;
}

export const DEFAULT_CREDS: DefaultCred[] = [
  { user: 'admin', pass: 'admin', appliesTo: 'Hikvision / Dahua / generic' },
  { user: 'admin', pass: '12345', appliesTo: 'Hikvision (classic default)' },
  { user: 'root', pass: 'root', appliesTo: 'Axis / some Linux-based NVRs' },
  { user: 'admin', pass: '', appliesTo: 'Some ONVIF / no-password devices' },
  { user: 'ubnt', pass: 'ubnt', appliesTo: 'Ubiquiti (old default)' },
];

/** Returns the brand family a (user,pass) pair matches, or null if not a known default. */
export function matchesKnownDefault(user: string, pass: string): string | null {
  for (const d of DEFAULT_CREDS) {
    if (user === d.user && pass === d.pass) return d.appliesTo;
  }
  return null;
}
