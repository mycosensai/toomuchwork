// API client — talks to the APEX-SOL bridge (localhost:8787 or configured host)

const BRIDGE_URL = import.meta.env.VITE_BRIDGE_URL || 'http://127.0.0.1:8787'

export async function fetchJSON(path) {
  const res = await fetch(BRIDGE_URL + path)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`)
  return res.json()
}

export async function postJSON(path, body) {
  const res = await fetch(BRIDGE_URL + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`)
  return res.json()
}

// ---- Data hooks ----

export const api = {
  // Core status
  getLive:       () => fetchJSON('/live'),
  getPaper:      () => fetchJSON('/paper'),
  getStatusFull: () => fetchJSON('/status/full'),
  getExits:      () => fetchJSON('/exits'),
  getFeed:       () => fetchJSON('/feed'),
  getFleet:      () => fetchJSON('/fleet'),
  getTrainer:    () => fetchJSON('/trainer'),
  getReflect:    () => fetchJSON('/reflect'),
  getMarket:     () => fetchJSON('/market'),
  getAiReview:   () => fetchJSON('/ai-review'),
  getLearn:      () => fetchJSON('/learn'),
  getPrice:      () => fetchJSON('/price'),
  getEvents:     (n = 40) => fetchJSON(`/events?n=${n}`),
  getSniper:     () => fetchJSON('/sniper'),
  getPaperProfiles: () => fetchJSON('/paper-profiles'),
  getPaperConfig: () => fetchJSON('/api/paper-config'),
  setPaperConfig: (body) => postJSON('/api/paper-config', body),
  getStrategy:   () => fetchJSON('/status/full').then(r => r.strategy),

  // Controls
  control: (body) => postJSON('/api/control', body),
  manual:  (body) => postJSON('/manual', body),
}
