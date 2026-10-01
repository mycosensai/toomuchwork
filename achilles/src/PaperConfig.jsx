// PaperConfig — full paper-training + recursive-learning config dashboard.
// Reads GET /api/paper-config, writes POST /api/paper-config (in-memory only,
// allowlisted keys; engine restart needed only for PAPER_TICK_MS).
import React, { useState, useEffect, useCallback } from 'react'
import { api } from './api'

function fmtMs(ms) {
  const n = Number(ms)
  if (!Number.isFinite(n)) return '—'
  if (n < 1000) return `${n}ms`
  if (n < 60000) return `${(n / 1000).toFixed(n % 1000 ? 1 : 0)}s`
  if (n < 3600000) return `${(n / 60000).toFixed(n % 60000 ? 1 : 0)}m`
  return `${(n / 3600000).toFixed(1)}h`
}

function asBool(v) {
  return v === true || v === 'true' || v === '1' || v === 1
}

// ── field registry: key, label, hint, editor ──
const SECTIONS = [
  {
    id: 'engine', icon: '🎛', title: 'Engine & Bankroll',
    fields: [
      { key: 'PAPER_MAX_POSITIONS', label: 'Max open positions', hint: 'Concurrent paper positions', type: 'number', min: 1, max: 20, step: 1 },
      { key: 'PAPER_BANKROLL_SOL', label: 'Bankroll (SOL)', hint: 'Paper bankroll ceiling — applied live via setBankroll', type: 'number', min: 0.01, step: 0.1 },
      { key: 'PAPER_BASE_POSITION_SOL', label: 'Base size (SOL)', hint: 'Per-trade size before compounding multiplier', type: 'number', min: 0.001, step: 0.005 },
      { key: 'PAPER_COMPOUND_STEP', label: 'Compound step', hint: 'Size multiplier growth per win', type: 'number', min: 0, step: 0.05 },
      { key: 'PAPER_COMPOUND_MAX_MULT', label: 'Compound max mult', hint: 'Ceiling on win-streak sizing', type: 'number', min: 1, step: 0.25 },
      { key: 'PAPER_FEE_PER_TRADE_SOL', label: 'Fee per trade (SOL)', hint: 'Simulated fee deducted per fill', type: 'number', min: 0, step: 0.0001 },
      { key: 'PAPER_RENT_RESERVE_SOL', label: 'Rent reserve (SOL)', hint: 'Kept back for token-account rent', type: 'number', min: 0, step: 0.001 },
      { key: 'PAPER_TICK_MS', label: 'Tick interval (ms)', hint: 'Engine loop cadence — needs restart to apply', type: 'number', min: 250, step: 250, restart: true, human: fmtMs },
    ],
  },
  {
    id: 'entry', icon: '🎯', title: 'Entry Gates',
    fields: [
      { key: 'PAPER_MIN_RATING', label: 'Min rating', hint: 'Pump-score floor to enter', type: 'number', step: 0.5 },
      { key: 'PAPER_MIN_CONV', label: 'Min conviction', hint: 'Fleet-conviction floor (optimizer auto-tunes live)', type: 'number', step: 1 },
      { key: 'PAPER_MIN_CONV_FLOOR', label: 'Conviction floor', hint: 'Optimizer never tunes below this', type: 'number', step: 1 },
      { key: 'OPTIMIZER_MAX_CONV', label: 'Optimizer max conv', hint: 'Optimizer never tunes above this', type: 'number', step: 1 },
      { key: 'PAPER_MIN_VOLUME_SOL', label: 'Min 5m volume (SOL)', hint: 'Absolute flow floor', type: 'number', min: 0, step: 1 },
      { key: 'PAPER_HEAVY_VOLUME_SOL', label: 'Heavy volume (SOL)', hint: 'Fast-lane volume threshold', type: 'number', min: 0, step: 1 },
      { key: 'PAPER_HEAVY_MIN_TRADES', label: 'Heavy min trades', hint: 'Trade-count leg of fast lane', type: 'number', min: 0, step: 1 },
      { key: 'PAPER_VOL_SURGE_MIN', label: 'Min vol surge ×', hint: 'Volume-vs-baseline multiple', type: 'number', min: 0, step: 0.1 },
      { key: 'PAPER_MIN_ENTRY_BUY_RATIO', label: 'Min buy ratio', hint: 'Buys/(buys+sells) floor', type: 'number', min: 0, max: 1, step: 0.05 },
      { key: 'PAPER_MIN_LIQ_USD', label: 'Min liquidity ($)', hint: 'LP depth floor', type: 'number', min: 0, step: 500 },
      { key: 'PAPER_MIN_MCAP_USD', label: 'Min mcap ($)', hint: 'Dust-launch filter', type: 'number', min: 0, step: 1000 },
      { key: 'PAPER_MAX_ENTRY_CHANGE', label: 'Max entry move %', hint: 'Legacy spike cap', type: 'number', step: 5 },
      { key: 'PAPER_MAX_ENTRY_CHANGE5M', label: 'Max 5m move %', hint: 'Never-buy-the-top gate (tight)', type: 'number', step: 5 },
      { key: 'PAPER_MAX_ENTRY_CHANGE5M_WIDE', label: 'Max 5m move % (wide)', hint: 'Top gate, wide lane', type: 'number', step: 5 },
      { key: 'PAPER_MAX_ENTRY_CHANGE1H', label: 'Max 1h move %', hint: 'Extended-top gate', type: 'number', step: 10 },
    ],
  },
  {
    id: 'exits', icon: '🚪', title: 'Exits & Holding',
    fields: [
      { key: 'PAPER_TP', label: 'Take-profit ×', hint: 'Ladder target multiple (legacy)', type: 'number', min: 0, step: 0.1 },
      { key: 'PAPER_TP_PCT', label: 'Take-profit %', hint: 'TP rung in percent', type: 'number', step: 1 },
      { key: 'PAPER_SL_PCT', label: 'Stop-loss %', hint: 'Soft stop', type: 'number', step: 1 },
      { key: 'PAPER_HARD_SL_PCT', label: 'Hard stop %', hint: 'Unconditional exit', type: 'number', step: 1 },
      { key: 'PAPER_TRAIL_STEP_PCT', label: 'Trail step %', hint: 'Trailing-stop step', type: 'number', step: 0.5 },
      { key: 'PAPER_MAX_HOLD_MS', label: 'Max hold', hint: 'Time stop', type: 'number', min: 0, step: 10000, human: fmtMs },
      { key: 'PAPER_MIN_HOLD_MS', label: 'Min hold', hint: 'Skips instant exits', type: 'number', min: 0, step: 500, human: fmtMs },
      { key: 'PAPER_MAX_HOLD_HARD_MS', label: 'Max hold (hard)', hint: 'Forced close, no exceptions', type: 'number', min: 0, step: 60000, human: fmtMs },
      { key: 'PAPER_EXIT_VOL_DROP_PCT', label: 'Exit vol-drop %', hint: 'Volume-collapse exit trigger', type: 'number', step: 5 },
      { key: 'PAPER_VOL_DROP_PCT', label: 'Vol-drop %', hint: 'General volume fade exit', type: 'number', step: 5 },
      { key: 'PAPER_LIQ_DROP_PCT', label: 'Liq-drop %', hint: 'Rug-pull evacuation trigger', type: 'number', step: 5 },
      { key: 'PAPER_MOMENTUM_FADE_SURGE', label: 'Momentum fade surge ×', hint: 'Surge leg of fade exit', type: 'number', min: 0, step: 0.1 },
      { key: 'PAPER_MOMENTUM_FADE_MIN_HOLD_MS', label: 'Fade min hold', hint: 'Fade exit arming time', type: 'number', min: 0, step: 1000, human: fmtMs },
      { key: 'PAPER_MOMENTUM_FADE_MAX_CHANGE', label: 'Fade max change %', hint: 'Fade exit price leg', type: 'number', step: 5 },
    ],
  },
  {
    id: 'risk', icon: '🛡', title: 'Sell Pressure, Cooldowns & Bans',
    fields: [
      { key: 'PAPER_SELL_PRESSURE_ENABLED', label: 'Sell-pressure exits', hint: 'On-chain sell-wall evacuation', type: 'bool' },
      { key: 'PAPER_SELL_PRESSURE_BUY_RATIO', label: 'SP buy ratio', hint: 'Below this + pressure = exit', type: 'number', min: 0, max: 1, step: 0.05 },
      { key: 'PAPER_SELL_PRESSURE_MIN_TRADES', label: 'SP min trades', hint: 'Sample size for SP read', type: 'number', min: 0, step: 1 },
      { key: 'PAPER_SELL_PRESSURE_MIN_HOLD_MS', label: 'SP min hold', hint: 'Arming time', type: 'number', min: 0, step: 500, human: fmtMs },
      { key: 'PAPER_REENTRY_COOLDOWN_MS', label: 'Re-entry cooldown', hint: 'Blocks instant re-buy after close', type: 'number', min: 0, step: 10000, human: fmtMs },
      { key: 'PAPER_DUMP_BAN_MS', label: 'Dump ban', hint: 'Bans SL-closed corpses from re-entry', type: 'number', min: 0, step: 60000, human: fmtMs },
    ],
  },
  {
    id: 'learn', icon: '🧠', title: 'Recursive Learning',
    fields: [
      { key: 'REGIME_ENABLED', label: 'Regime detect→log→pivot', hint: 'Always-on pivot loop (trend/vol/mom/liq)', type: 'bool' },
      { key: 'REGIME_BIAS_OFFSET', label: 'Regime bias offset', hint: 'Bullish/bearish nudge on regime score', type: 'number', step: 1 },
      { key: 'REGIME_FLOOR_MIN', label: 'Regime floor min', hint: 'Adverse-market conviction floor lift', type: 'number', min: 0, max: 1, step: 0.05 },
      { key: 'REGIME_LOG_INTERVAL_MS', label: 'Regime log interval', hint: 'Snapshot cadence to regime_log', type: 'number', min: 1000, step: 5000, human: fmtMs },
      { key: 'STRATEGY_PROFILE', label: 'Strategy profile', hint: 'Active fleet weighting preset', type: 'select', options: ['midcap-momentum', 'balanced', 'meme-pump', 'blue-chip', 'slow-grind', 'hummingbot', 'senpai'] },
      { key: 'STRATEGY_AUTO_SWITCH', label: 'Auto strategy switch', hint: 'Let samples promote the best profile', type: 'bool' },
      { key: 'STRATEGY_SWITCH_EVERY_MS', label: 'Switch eval every', hint: 'Switcher re-rank cadence', type: 'number', min: 10000, step: 10000, human: fmtMs },
      { key: 'STRATEGY_SWITCH_MIN_SAMPLES', label: 'Switch min samples', hint: 'Closes needed before a switch', type: 'number', min: 1, step: 1 },
      { key: 'STRATEGY_WEIGHTS', label: 'Strategy weights', hint: 'JSON override, e.g. {"meme":0.5,...}', type: 'text' },
      { key: 'PAPER_PRE_VET', label: 'Paper pre-vet gate', hint: 'Live entries shadow through paper sim', type: 'bool' },
      { key: 'PAPER_VET_CONVICTION_THRESHOLD', label: 'Vet conviction', hint: 'Questionable-entry bar', type: 'number', min: 0, max: 1, step: 0.05 },
      { key: 'PAPER_VET_LIQ_THRESHOLD', label: 'Vet liq floor ($)', hint: 'Below this = questionable', type: 'number', min: 0, step: 500 },
      { key: 'PAPER_KOL_BYPASS', label: 'KOL bypass', hint: 'High-KOL coins skip static gates', type: 'bool' },
    ],
  },
]

function Field({ field, value, onChange }) {
  const v = value ?? ''
  if (field.type === 'bool') {
    return (
      <select value={asBool(v) ? 'true' : 'false'} onChange={e => onChange(field.key, e.target.value)}>
        <option value="true">On</option>
        <option value="false">Off</option>
      </select>
    )
  }
  if (field.type === 'select') {
    return (
      <select value={String(v)} onChange={e => onChange(field.key, e.target.value)}>
        {field.options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    )
  }
  if (field.type === 'number') {
    return (
      <input
        type="number" value={v}
        min={field.min} max={field.max} step={field.step ?? 'any'}
        onChange={e => onChange(field.key, e.target.value)}
      />
    )
  }
  return <input type="text" value={v} onChange={e => onChange(field.key, e.target.value)} spellCheck={false} />
}

export default function PaperConfig() {
  const [snap, setSnap] = useState(null)
  const [error, setError] = useState(null)
  const [edits, setEdits] = useState({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    try {
      const d = await api.getPaperConfig()
      setSnap(d)
      setError(null)
    } catch (e) {
      setError(e.message)
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, 5000)
    return () => clearInterval(id)
  }, [load])

  const onChange = useCallback((key, val) => {
    setEdits(prev => ({ ...prev, [key]: val }))
    setMsg('')
  }, [])

  const effVal = key => (key in edits ? edits[key] : snap?.values?.[key] ?? '')

  const dirtyKeys = Object.keys(edits).filter(k => String(edits[k]) !== String(snap?.values?.[k] ?? ''))
  const dirtyRestart = dirtyKeys.filter(k => (snap?.restartNeeded || []).includes(k))

  const save = async () => {
    if (!dirtyKeys.length) return
    setSaving(true)
    setMsg('')
    try {
      const body = {}
      for (const k of dirtyKeys) body[k] = edits[k]
      const r = await api.setPaperConfig(body)
      if (r.ok) {
        setMsg(`Applied ${r.changed.length} key${r.changed.length === 1 ? '' : 's'}: ${r.changed.join(', ')}${r.restartNeeded?.length ? ` — restart engine for: ${r.restartNeeded.join(', ')}` : ''}`)
        setEdits({})
        load()
      } else {
        setMsg(`Failed: ${r.error || 'unknown'}`)
      }
    } catch (e) {
      setMsg(`Failed: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  const L = snap?.learning || {}

  return (
    <>
      {/* ── live learner status ── */}
      <section className="card">
        <h2><span className="section-icon">📡</span> Recursive Learning — Live Status</h2>
        {error && <div style={{ color: 'var(--red)', fontSize: 12 }}>Bridge unreachable: {error} (endpoints go live on next engine restart)</div>}
        <div className="grid">
          <div className="stat">
            <div className="label">Regime</div>
            <div className="value" style={{ fontSize: 16 }}>{L.regime?.regime || L.regime?.current || '—'}</div>
            <div className="hint">{L.regimeEnabled ? 'detect→log→pivot ON' : 'DISABLED'}</div>
          </div>
          <div className="stat">
            <div className="label">Optimizer</div>
            <div className="value" style={{ fontSize: 16 }}>conv {L.optimizer?.minConv ?? '—'}</div>
            <div className="hint">TP {L.optimizer?.tpHint ?? '—'} / SL {L.optimizer?.slHint ?? '—'} · n={L.optimizer?.windowSample ?? 0}</div>
          </div>
          <div className="stat">
            <div className="label">Trainer</div>
            <div className="value" style={{ fontSize: 16 }}>{L.trainer ? `${Math.round((L.trainer.winRate || 0) * 100)}% WR` : '—'}</div>
            <div className="hint">{L.trainer?.totalExamples ?? 0} examples{L.trainer?.proven ? ' · PROVEN' : ' · warming up'}</div>
          </div>
          <div className="stat">
            <div className="label">Paper Bankroll</div>
            <div className="value" style={{ fontSize: 16 }}>{L.paperBankroll != null ? `${Number(L.paperBankroll).toFixed(4)} SOL` : '—'}</div>
            <div className="hint">{L.openPositions ?? 0} open · profiles {L.profiles?.on ? 'ON' : 'OFF'}</div>
          </div>
        </div>
      </section>

      {/* ── save bar ── */}
      <section className="card">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-gold" disabled={!dirtyKeys.length || saving} onClick={save}>
            {saving ? 'Applying…' : `Apply ${dirtyKeys.length} change${dirtyKeys.length === 1 ? '' : 's'}`}
          </button>
          <button className="btn btn-obsidian" disabled={!dirtyKeys.length || saving} onClick={() => { setEdits({}); setMsg('') }}>
            Discard
          </button>
          {dirtyRestart.length > 0 && (
            <span style={{ fontSize: 11, color: 'var(--gold)' }}>⚠ {dirtyRestart.join(', ')} need engine restart</span>
          )}
          {msg && <span style={{ fontSize: 11, color: 'var(--muted)' }}>{msg}</span>}
          <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 'auto' }}>in-memory only · allowlisted paper keys · live wallet untouched</span>
        </div>
      </section>

      {/* ── sections ── */}
      {SECTIONS.map(sec => (
        <section className="card" key={sec.id}>
          <h2><span className="section-icon">{sec.icon}</span> {sec.title}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {sec.fields.map(f => {
              const dirty = String(edits[f.key] ?? '') !== '' && String(edits[f.key]) !== String(snap?.values?.[f.key] ?? '')
              const shown = effVal(f.key)
              return (
                <div key={f.key} style={dirty ? { outline: '1px solid var(--gold)', borderRadius: 4, padding: 6 } : { padding: 6 }}>
                  <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>
                    {f.label.toUpperCase()}
                    {f.restart && <span style={{ color: 'var(--gold)' }}> ⟳</span>}
                  </label>
                  <Field field={f} value={shown} onChange={onChange} />
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
                    {f.hint}{f.human && shown !== '' ? ` · now ${f.human(shown)}` : ''} · <span style={{ fontFamily: 'monospace' }}>{f.key}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </>
  )
}
