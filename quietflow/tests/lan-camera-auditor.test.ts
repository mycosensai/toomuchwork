import { test } from 'node:test';
import assert from 'node:assert/strict';
import { expandCidr, auditOwnNetwork } from '../src/lib/lan-camera-auditor.ts';

test('expandCidr expands a /30 correctly (2 usable hosts)', () => {
  const ips = expandCidr('192.168.1.0/30');
  assert.deepEqual(ips, ['192.168.1.1', '192.168.1.2']);
});

test('expandCidr refuses oversized ranges', () => {
  assert.throws(() => expandCidr('10.0.0.0/8'));
});

test('expandCidr rejects malformed CIDR', () => {
  assert.throws(() => expandCidr('not-an-ip'));
});

test('audit refuses to run without ownership confirmation', async () => {
  const res = await auditOwnNetwork({ cidr: '192.168.1.0/30', iOwnThisNetwork: false });
  assert.equal(res.authorized, false);
  assert.equal(res.hostsScanned, 0);
  assert.match(res.findings[0].message, /confirm you own/);
});

test('audit runs an authorized scan when iOwnThisNetwork:true (no real hosts expected on TEST-NET)', async () => {
  // 192.0.2.0/30 is RFC 5737 TEST-NET-1 — unroutable, safe to probe.
  // We assert the gate flips to authorized and the scan completes without throwing.
  const res = await auditOwnNetwork({ cidr: '192.0.2.0/30', iOwnThisNetwork: true, connectTimeoutMs: 1 });
  assert.equal(res.authorized, true);
  assert.ok(res.hostsScanned >= 2);
  // defaultCredsToChange is always advisory and present.
  assert.ok(res.defaultCredsToChange.length >= 4);
});
