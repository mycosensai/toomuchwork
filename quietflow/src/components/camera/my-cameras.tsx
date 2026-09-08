'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import type { StoredLocalCamera } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { registerLocalCamera } from '@/lib/local-camera';
import { localCameraToAppCamera, CAMERA_BRIDGE_BASE } from '@/lib/local-camera';
import type { LocalCameraSpec } from '@/lib/local-camera';
import { Video, Plus, Trash2, ShieldAlert, ShieldCheck, MapPin, Info } from 'lucide-react';

// The security bridge that owns RTSP→HLS transcoding. Same origin/port the LAN
// Security panel uses; the static app itself cannot open an RTSP socket.
const BRIDGE = 'http://127.0.0.1:8788';

interface FormState {
  name: string;
  host: string;
  user: string;
  pass: string;
  lat: string;
  lng: string;
  bearing: string;
  rtspPort: string;
  rtspPath: string;
  brand: NonNullable<LocalCameraSpec['brand']>;
}

const EMPTY_FORM: FormState = {
  name: '', host: '', user: '', pass: '',
  lat: '', lng: '', bearing: '',
  rtspPort: '554', rtspPath: '', brand: 'cctv',
};

export function MyCameras() {
  const activeView = useStore((s) => s.activeView);
  const localCameras = useStore((s) => s.localCameras);
  const saveLocalCameraConfig = useStore((s) => s.saveLocalCameraConfig);
  const deleteLocalCameraConfig = useStore((s) => s.deleteLocalCameraConfig);
  const addLocalCamera = useStore((s) => s.addLocalCamera);
  const removeLocalCamera = useStore((s) => s.removeLocalCamera);
  const userLocation = useStore((s) => s.userLocation);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (activeView !== 'my-cameras') return null;

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const useMyLocation = () => {
    if (!userLocation) {
      setError('No device location available yet. Enable location on the Map view first, or type coordinates manually.');
      return;
    }
    // userLocation is [lng, lat]
    set('lng', String(userLocation[0]));
    set('lat', String(userLocation[1]));
    setError(null);
  };

  const submit = () => {
    setError(null);
    setNotice(null);

    if (!form.name.trim()) { setError('Give the camera a name.'); return; }
    if (!form.host.trim()) { setError('Enter the camera IP or hostname on your LAN.'); return; }
    if (!form.user.trim()) { setError('Enter the camera username.'); return; }

    const lat = Number(form.lat);
    const lng = Number(form.lng);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) { setError('Latitude must be a number between -90 and 90.'); return; }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) { setError('Longitude must be a number between -180 and 180.'); return; }

    let bearing: number | undefined;
    if (form.bearing.trim()) {
      const b = Number(form.bearing);
      if (!Number.isFinite(b) || b < 0 || b > 360) { setError('Bearing must be between 0 and 360 degrees.'); return; }
      bearing = b;
    }

    const port = form.rtspPort.trim() ? Number(form.rtspPort) : 554;
    if (!Number.isInteger(port) || port < 1 || port > 65535) { setError('RTSP port must be between 1 and 65535.'); return; }

    const id = `${form.host.replace(/[^\w.-]/g, '-')}-${Date.now().toString(36)}`;
    const spec: LocalCameraSpec = {
      id,
      name: form.name.trim(),
      host: form.host.trim(),
      lat, lng,
      camera_bearing: bearing,
      user: form.user.trim(),
      pass: form.pass,
      rtspPort: port,
      rtspPath: form.rtspPath.trim() || undefined,
      brand: form.brand,
    };

    // The library refuses factory-default credentials outright — surface that
    // refusal instead of saving a camera that can never legitimately stream.
    const result = registerLocalCamera(spec);
    if (!result.accepted) {
      setError(result.warning ?? 'Camera refused.');
      return;
    }

    const stored: StoredLocalCamera = {
      id, name: spec.name, host: spec.host,
      lat, lng, camera_bearing: bearing,
      user: spec.user, rtspPort: port,
      rtspPath: spec.rtspPath, brand: spec.brand,
      addedAt: new Date().toISOString(),
    };
    saveLocalCameraConfig(stored);
    // Make it appear in the camera grid + map right now.
    addLocalCamera(localCameraToAppCamera(stored));
    // Hand the RTSP URL + credentials (session-only) to the local bridge so it
    // can transcode the stream. The bridge is a separate process; if it's not
    // running this call simply fails silently and the camera shows as offline.
    registerWithBridge(spec).catch(() => {});
    setForm(EMPTY_FORM);
    setShowForm(false);
    setNotice(`Saved "${stored.name}". The password is kept for this session only and is never written to disk.`);
  };

  return (
    <div className="hud-frame h-full overflow-y-auto p-4 pb-24">
      <div className="mx-auto max-w-3xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-50">
              <Video className="h-5 w-5 text-emerald-500" />
              My Cameras
            </h2>
            <p className="text-xs text-zinc-500">
              Cameras you own, over your own network. No vendor cloud, no OAuth.
            </p>
          </div>
          <Button onClick={() => { setShowForm((v) => !v); setError(null); setNotice(null); }}>
            <Plus className="mr-1 h-4 w-4" />
            {showForm ? 'Cancel' : 'Add camera'}
          </Button>
        </div>

        {/* Authorization notice */}
        <Card className="border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/30">
          <CardContent className="flex gap-2 p-3 text-xs text-amber-900 dark:text-amber-200">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Only add cameras you own or are authorized to view.</p>
              <p className="mt-1 opacity-90">
                Streaming needs the local bridge running on {BRIDGE} (it does the RTSP→HLS
                transcode; a static web app cannot open an RTSP socket). Cameras still on a
                factory-default password are refused — change the password on the device first.
              </p>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40">
            <CardContent className="flex gap-2 p-3 text-xs text-red-800 dark:text-red-200">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </CardContent>
          </Card>
        )}
        {notice && (
          <Card className="border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40">
            <CardContent className="flex gap-2 p-3 text-xs text-emerald-800 dark:text-emerald-200">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{notice}</span>
            </CardContent>
          </Card>
        )}

        {/* Add form */}
        {showForm && (
          <Card>
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-sm">Add a camera you own</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-3 pt-1">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Name" hint="e.g. Driveway">
                  <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Driveway" />
                </Field>
                <Field label="Host / IP" hint="on your LAN">
                  <input className={inputCls} value={form.host} onChange={(e) => set('host', e.target.value)} placeholder="192.168.1.42" />
                </Field>
                <Field label="Username">
                  <input className={inputCls} value={form.user} onChange={(e) => set('user', e.target.value)} placeholder="your-camera-user" autoComplete="off" />
                </Field>
                <Field label="Password" hint="session only — never saved to disk">
                  <input className={inputCls} type="password" value={form.pass} onChange={(e) => set('pass', e.target.value)} autoComplete="new-password" />
                </Field>
                <Field label="Latitude">
                  <input className={inputCls} value={form.lat} onChange={(e) => set('lat', e.target.value)} placeholder="32.7950" inputMode="decimal" />
                </Field>
                <Field label="Longitude">
                  <input className={inputCls} value={form.lng} onChange={(e) => set('lng', e.target.value)} placeholder="-96.7960" inputMode="decimal" />
                </Field>
                <Field label="Facing bearing" hint="optional, 0=N 90=E">
                  <input className={inputCls} value={form.bearing} onChange={(e) => set('bearing', e.target.value)} placeholder="180" inputMode="decimal" />
                </Field>
                <Field label="RTSP port">
                  <input className={inputCls} value={form.rtspPort} onChange={(e) => set('rtspPort', e.target.value)} placeholder="554" inputMode="numeric" />
                </Field>
                <Field label="RTSP path" hint="optional; blank = common default">
                  <input className={inputCls} value={form.rtspPath} onChange={(e) => set('rtspPath', e.target.value)} placeholder="cam/realmonitor?channel=1&subtype=0" />
                </Field>
                <Field label="Brand">
                  <select className={inputCls} value={form.brand} onChange={(e) => set('brand', e.target.value as FormState['brand'])}>
                    <option value="cctv">Generic CCTV</option>
                    <option value="ring">Ring</option>
                    <option value="nest">Nest</option>
                    <option value="arlo">Arlo</option>
                    <option value="wyze">Wyze</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" onClick={useMyLocation}>
                  <MapPin className="mr-1 h-4 w-4" />
                  Use my location
                </Button>
                <Button onClick={submit}>Save camera</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Saved cameras */}
        {localCameras.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-zinc-500">
              No cameras yet. Add one you own to see it here and on the map.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {localCameras.map((cam) => (
              <Card key={cam.id}>
                <CardContent className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 shrink-0 text-emerald-500" />
                      <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{cam.name}</span>
                      <Badge variant="default" size="sm" className="text-[10px]">
                        {(cam.brand ?? 'cctv').toUpperCase()}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      {cam.user}@{cam.host}:{cam.rtspPort ?? 554} · {cam.lat.toFixed(4)}, {cam.lng.toFixed(4)}
                      {cam.camera_bearing != null ? ` · facing ${cam.camera_bearing}°` : ''}
                    </p>
                    {cam.lastCheck && (
                      <p className={`mt-0.5 text-[11px] ${cam.lastCheck.ok ? 'text-emerald-600' : 'text-red-600'}`}>
                        {cam.lastCheck.ok ? 'Reachable' : 'Unreachable'} · {new Date(cam.lastCheck.at).toLocaleString()}
                        {cam.lastCheck.detail ? ` · ${cam.lastCheck.detail}` : ''}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => { deleteLocalCameraConfig(cam.id); removeLocalCamera(`local-${cam.id}`); }}
                    aria-label={`Remove ${cam.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-md border border-zinc-300 bg-white px-2.5 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100';

/** Tell the local RTSP→HLS bridge about a camera (RTSP URL + credentials).
 *  Session-only — never persisted. Resolves true if the bridge accepted it. */
async function registerWithBridge(spec: LocalCameraSpec): Promise<boolean> {
  const port = spec.rtspPort ?? 554;
  const path = spec.rtspPath ?? 'cam/realmonitor?channel=1&subtype=0';
  const rtspUrl = `rtsp://${encodeURIComponent(spec.user)}:${encodeURIComponent(spec.pass)}@${spec.host}:${port}/${path}`;
  try {
    const res = await fetch(`${CAMERA_BRIDGE_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: spec.id, name: spec.name, rtspUrl, brand: spec.brand }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
        {label}
        {hint ? <span className="ml-1 font-normal text-zinc-400">({hint})</span> : null}
      </span>
      {children}
    </label>
  );
}
