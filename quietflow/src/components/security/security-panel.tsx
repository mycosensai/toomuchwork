'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, RefreshCw, AlertTriangle, CheckCircle2, ServerCrash } from 'lucide-react';
import { showToast } from '@/components/ui/toast';

// Bridge base is configurable at runtime: the Android shell passes it as a
// query param (?bridge=http://192.168.1.50:8788). Defaults to the local dev
// bridge for desktop browsers.
const BRIDGE =
  typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('bridge') || 'http://127.0.0.1:8788'
    : 'http://127.0.0.1:8788';

interface Finding {
  ip: string;
  port: number;
  scheme: string;
  onAdminAdmin: boolean;
  unknown: boolean;
  brand?: string;
  status?: string;
  checkedAt: string;
}

interface FindResponse {
  cidr: string;
  scannedAt: string;
  checked: number;
  stillOnAdminAdmin: Finding[];
  hardened: number;
  authorized: boolean;
  error?: string;
}

export function SecurityPanel() {
  const { activeView } = useStore();
  const [cidr, setCidr] = useState('192.168.1.0/24');
  const [own, setOwn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FindResponse | null>(null);
  const [bridgeDown, setBridgeDown] = useState(false);

  if (activeView !== 'security') return null;

  async function runFind() {
    if (!own) {
      showToast('Confirm you own this network first.', 'error');
      return;
    }
    setLoading(true);
    setBridgeDown(false);
    try {
      const res = await fetch(`${BRIDGE}/api/find`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cidr, iOwnThisNetwork: true }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 403) {
          showToast('Bridge refused: confirm ownership.', 'error');
        } else {
          showToast(body.error || 'Scan failed.', 'error');
        }
        setResult(null);
        return;
      }
      const data: FindResponse = await res.json();
      setResult(data);
      if (data.stillOnAdminAdmin.length === 0) {
        showToast(`None on admin/admin — ${data.hardened} host(s) require real credentials.`, 'success');
      } else {
        showToast(`${data.stillOnAdminAdmin.length} device(s) still on admin/admin.`, 'error');
      }
    } catch {
      setBridgeDown(true);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-24 md:pb-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">LAN Camera Security</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Find cameras on your own network still using the <code>admin/admin</code> default, then re-check after you change the password.
        Per-brand auth-gated checks (Hikvision / Dahua / Axis / Reolink) — a device that challenges for a password is counted as hardened, not a false positive.
      </p>

      {bridgeDown && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          <ServerCrash className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Local security bridge not running.</p>
            <p className="mt-1 font-mono text-xs">node scripts/serve.js</p>
            <p className="mt-1 text-xs opacity-80">The app is a static build and can&apos;t scan your LAN directly. The bridge runs the scan server-side on 127.0.0.1:8788.</p>
          </div>
        </div>
      )}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Scan your network</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={cidr}
              onChange={(e) => setCidr(e.target.value)}
              placeholder="192.168.1.0/24"
              className="font-mono"
            />
            <Button onClick={runFind} disabled={loading || !own}>
              {loading ? <RefreshCw className="mr-1 h-4 w-4 animate-spin" /> : <Shield className="mr-1 h-4 w-4" />}
              {loading ? 'Scanning…' : 'Find admin/admin'}
            </Button>
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <input type="checkbox" checked={own} onChange={(e) => setOwn(e.target.checked)} className="h-4 w-4" />
            I own this network / am authorized to scan it.
          </label>

          {result && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Checked {result.checked} host(s) · {result.hardened} hardened · {result.stillOnAdminAdmin.length} still default</span>
                <Button variant="outline" size="sm" onClick={runFind} disabled={loading}>
                  <RefreshCw className="mr-1 h-3 w-3" /> Re-scan all
                </Button>
              </div>

              {result.stillOnAdminAdmin.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" /> All checked hosts require real credentials. None on admin/admin.
                </div>
              ) : (
                <ul className="space-y-2">
                  {result.stillOnAdminAdmin.map((f) => (
                    <li key={`${f.ip}:${f.port}`} className="flex items-center justify-between rounded-lg border border-red-300 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {f.ip}:{f.port} <span className="text-zinc-400">({f.scheme})</span>
                          </p>
                          <p className="text-xs text-red-600 dark:text-red-400">
                            Still on admin/admin {f.brand ? `· ${f.brand}` : ''}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={runFind} disabled={loading} title="After you change the password on this device, re-check it">
                        <RefreshCw className="mr-1 h-3 w-3" /> Re-check (I changed it)
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
