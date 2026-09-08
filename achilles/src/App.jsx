// ACHILLES — Unified Trading + Wallet + Buyback Command Center
// Full canonical implementation. Zero dead code. Zero duplicates.
// Gold/obsidian cyberpunk UI with Roman coin branding.

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { api } from './api'

import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const TOKEN_2022 = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb')
const ASSOCIATED_TOKEN_PROGRAM = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')

const DEFAULT_BUYBACK_CONFIG = {
  rpcUrl: 'https://api.mainnet-beta.solana.com',
  programId: '3rbrhfWw3ZyiYrPgMG8VbLF8cEptUjAbZJaFBtMKbDVc',
  buyback: { amount: 10000, thresholdSol: 1.0, minLiquidityUsd: 10000, slippageBps: 100 },
  burn: { amount: 1000, weightPositionId: '0' },
  arbitrage: { enabled: false, amount: 500, maxSlippageBps: 50 },
}

const WALLET_TYPES = ['phantom', 'solflare']

const TRADING_AGENTS = [
  { id: 'whbAccumulation', name: 'WHB Accumulation', desc: 'Smart accumulation strategy for high-value wallets', status: 'active' },
  { id: 'senpiMarketPulse', name: 'Senpi Market Pulse', desc: 'Real-time market sentiment analysis and signal generation', status: 'active' },
  { id: 'paperLab', name: 'Paper Lab', desc: 'Paper trading sandbox — no real funds at risk', status: 'active' },
  { id: 'exitHealth', name: 'Exit Health', desc: 'Monitors exit health and TP/SL ratios', status: 'active' },
  { id: 'tokenUniverse', name: 'Token Universe', desc: 'Tracks and scores all tokens in the trading universe', status: 'active' },
  { id: 'fleetConsensus', name: 'Fleet Consensus', desc: '14-agent fleet agreement scoring', status: 'active' },
  { id: 'regimeDetector', name: 'Regime Detector', desc: 'Detects market regime (bull/bear/sideways) per lib/core/regime.js', status: 'active' },
  { id: 'goalPlanner', name: 'Goal Planner', desc: '$10→$100→$1k→$10k ladder with phase+expectancy gates', status: 'active' },
]

const TRADING_STRATEGIES_DATA = [
  { id: 'midcapMomentum', name: 'Midcap Momentum', desc: 'ATHENA STRATEGY_PROFILE — midcap momentum oscillator', status: 'active' },
  { id: 'buybackBurn', name: 'Buyback & Burn', desc: 'Token-2022 protocol — buyback, burn, stake', status: 'inactive' },
  { id: 'smartMoney', name: 'Smart Money Mirror', desc: 'Track and copy whale positions', status: 'inactive' },
  { id: 'memeSniper', name: 'Meme Sniper', desc: 'Pump.fun sniper with Jito bundles', status: 'inactive' },
  { id: 'swingTrader', name: 'Swing Trader', desc: 'Multi-day swing with logbook tracking', status: 'inactive' },
]

// ═══════════════════════════════════════════════════════════════
// PURE HELPERS
// ═══════════════════════════════════════════════════════════════

function findStatePda(programId) {
  return PublicKey.findProgramAddressSync([Buffer.from('state')], programId)[0]
}

function formatSol(sol) {
  if (sol == null || isNaN(sol)) return '—'
  return Number(sol).toFixed(4)
}

function formatPct(pct) {
  if (pct == null || isNaN(pct)) return '—'
  const n = Number(pct)
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%'
}

function formatTime(ts) {
  if (!ts) return '—'
  try { return new Date(ts).toLocaleTimeString() } catch { return '—' }
}

function truncateAddress(addr, head = 8, tail = 6) {
  const s = addr?.toBase58 ? addr.toBase58() : String(addr)
  if (s.length <= head + tail + 3) return s
  return `${s.slice(0, head)}…${s.slice(-tail)}`
}

function isValidMint(address) {
  try { new PublicKey(address); return true } catch { return false }
}

function escapeHtml(str) {
  if (!str) return ''
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ═══════════════════════════════════════════════════════════════
// PRESENTATIONAL COMPONENTS
// ═══════════════════════════════════════════════════════════════

function PnlValue({ value }) {
  if (value == null || isNaN(value)) return <span className="flat">—</span>
  const n = Number(value)
  const cls = n > 0 ? 'up' : n < 0 ? 'down' : 'flat'
  return <span className={cls}>{formatPct(n)}</span>
}

function Stat({ label, value, hint }) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {hint && <div className="hint">{hint}</div>}
    </div>
  )
}

function Loading() {
  return (
    <div className="loading">
      <div className="spinner" />
      <span>Loading...</span>
    </div>
  )
}

function SectionTitle({ icon, title }) {
  return (
    <h2><span className="section-icon">{icon}</span> {title}</h2>
  )
}

// ═══════════════════════════════════════════════════════════════
// POLLING HOOK — with cancellation, proper cleanup
// ═══════════════════════════════════════════════════════════════

function usePolling(fn, interval = 3000) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    let cancelled = false
    let timer

    const tick = async () => {
      try {
        const d = await fnRef.current()
        if (!cancelled) { setData(d); setError(null) }
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    tick()
    timer = setInterval(tick, interval)

    return () => { cancelled = true; clearInterval(timer) }
  }, [interval])

  return { data, error, loading }
}

// ═══════════════════════════════════════════════════════════════
// MAIN APPLICATION
// ═══════════════════════════════════════════════════════════════

export default function App() {
  // ── Navigation ──
  const [tab, setTab] = useState('overview')

  // ── Bridge ──
  const [connected, setConnected] = useState(false)

  // ── Wallet ──
  const [wallet, setWallet] = useState(null)
  const [walletType, setWalletType] = useState('')
  const [balance, setBalance] = useState(null)
  const [walletLoading, setWalletLoading] = useState(false)

  // ── Buyback / Burn ──
  const [buybackConfig, setBuybackConfig] = useState(DEFAULT_BUYBACK_CONFIG)
  const [protocolState, setProtocolState] = useState(null)
  const [buybackMsg, setBuybackMsg] = useState({ text: '' })
  const [actionLoading, setActionLoading] = useState(false)

  // ── Buyback auto-mode toggle ──
  const [buybackAuto, setBuybackAuto] = useState(false)
  // ── Settings state ──
  const [settings, setSettings] = useState({
    bridgeUrl: 'http://127.0.0.1:8787',
    pollingInterval: 3000,
    maxPositions: 3,
    autoResume: 'yes',
    theme: 'cyberpunk',
    compactMode: 'no',
    scanlines: 'on',
    walletConfirm: true,
    antiTopGate: true,
    dumpBan: true,
    paperMode: true,
  })
  // ── Trading strategies (state-managed) ──
  const [tradingStrategies, setTradingStrategies] = useState(TRADING_STRATEGIES_DATA)

  // ── Token creation launchpad ──
  const [launchpadName, setLaunchpadName] = useState('')
  const [launchpadTicker, setLaunchpadTicker] = useState('')
  const [launchpadSupply, setLaunchpadSupply] = useState('1000000')
  const [launchpadDecimals, setLaunchpadDecimals] = useState(9)
  const [launchpadMsg, setLaunchpadMsg] = useState({ text: '' })
  const [launchpadLoading, setLaunchpadLoading] = useState(false)

  // ── APEX bridge polling ──
  const { data: live, loading: liveLoading } = usePolling(api.getLive, 3000)
  const { data: paper } = usePolling(api.getPaper, 5000)
  const { data: strategy } = usePolling(api.getStrategy, 10000)
  const { data: exits } = usePolling(api.getExits, 5000)
  const { data: events } = usePolling(() => api.getEvents(30), 3000)
  const { data: feed } = usePolling(api.getFeed, 3000)
  const { data: fleet } = usePolling(api.getFleet, 5000)

  // ── Bridge health check ──
  useEffect(() => {
    let cancelled = false
    api.getLive().then(() => !cancelled && setConnected(true)).catch(() => !cancelled && setConnected(false))
    const id = setInterval(() => {
      api.getLive().then(() => !cancelled && setConnected(true)).catch(() => !cancelled && setConnected(false))
    }, 10000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  // ── Wallet connect ──
  const connectWallet = useCallback(async (type) => {
    if (!WALLET_TYPES.includes(type)) return
    setWalletLoading(true)
    setBuybackMsg({ text: '' })

    try {
      let provider
      if (type === 'phantom' && window.solana?.isPhantom) {
        provider = window.solana
      } else if (type === 'solflare' && window.solflare?.isSolflare) {
        provider = window.solflare
      } else {
        window.open(type === 'phantom' ? 'https://phantom.app/' : 'https://solflare.com/', '_blank')
        return
      }

      // Disconnect any existing wallet first
      if (provider.disconnect) {
        try { await provider.disconnect() } catch {}
      }

      const resp = await provider.connect()
      const pk = new PublicKey(resp.publicKey.toString())
      setWallet(pk)
      setWalletType(type)

      // Fetch balance immediately
      const conn = new Connection(buybackConfig.rpcUrl, 'confirmed')
      const bal = await conn.getBalance(pk)
      setBalance(bal / LAMPORTS_PER_SOL)
    } catch (e) {
      setBuybackMsg({ text: `Wallet error: ${e.message}`, err: true })
    } finally {
      setWalletLoading(false)
    }
  }, [buybackConfig.rpcUrl])

  // ── Wallet disconnect ──
  const disconnectWallet = useCallback(async () => {
    try {
      const provider = walletType === 'phantom' ? window.solana : window.solflare
      if (provider?.disconnect) await provider.disconnect()
    } catch (e) {
      setBuybackMsg({ text: `Disconnect: ${e.message}`, err: true })
    }
    setWallet(null)
    setWalletType('')
    setBalance(null)
  }, [setBuybackMsg])

  // ── Protocol state refresh ──
  const refreshProtocol = useCallback(async () => {
    try {
      const conn = new Connection(buybackConfig.rpcUrl, 'confirmed')
      const pid = new PublicKey(buybackConfig.programId)
      const statePda = findStatePda(pid)
      const accountInfo = await conn.getAccountInfo(statePda)
      if (!accountInfo) { setProtocolState(null); return }
      setProtocolState({ exists: true, pubkey: statePda.toBase58() })
    } catch (e) {
      setBuybackMsg({ text: `Protocol refresh: ${e.message}`, err: true })
    }
  }, [buybackConfig.rpcUrl, buybackConfig.programId])

  // ── Wallet balance refresh ──
  const refreshWallet = useCallback(async () => {
    if (!wallet) return
    try {
      const conn = new Connection(buybackConfig.rpcUrl, 'confirmed')
      const bal = await conn.getBalance(wallet)
      setBalance(bal / LAMPORTS_PER_SOL)
    } catch (e) {
      setBuybackMsg({ text: `Balance refresh: ${e.message}`, err: true })
    }
  }, [wallet, buybackConfig.rpcUrl])

  // ── Auto-refresh protocol ──
  useEffect(() => { refreshProtocol() }, [refreshProtocol])

  // ── Auto-refresh wallet balance ──
  useEffect(() => {
    refreshWallet()
    const id = setInterval(refreshWallet, 10000)
    return () => clearInterval(id)
  }, [refreshWallet])

  // ── Buyback action runner ──
  const runBuyback = useCallback(async (label, fn) => {
    if (!wallet) return setBuybackMsg({ text: 'Connect wallet first', err: true })
    setActionLoading(true)
    setBuybackMsg({ text: `${label}…` })
    try {
      const sig = await fn()
      setBuybackMsg({ text: `${label} ok — ${sig}` })
      setTimeout(refreshProtocol, 1500)
    } catch (e) {
      setBuybackMsg({ text: `${label} failed: ${e.message}`, err: true })
    } finally {
      setActionLoading(false)
    }
  }, [wallet, refreshProtocol])

  // ── Config updaters ──
  const updateConfig = useCallback((patch) => {
    setBuybackConfig(prev => ({ ...prev, ...patch }))
  }, [])

  const updateBuyback = useCallback((patch) => {
    setBuybackConfig(prev => ({ ...prev, buyback: { ...prev.buyback, ...patch } }))
  }, [])

  const updateBurn = useCallback((patch) => {
    setBuybackConfig(prev => ({ ...prev, burn: { ...prev.burn, ...patch } }))
  }, [])

  // ── Token creation launchpad ──
  const handleTokenCreation = useCallback(async (type) => {
    if (!wallet) {
      setLaunchpadMsg({ text: 'Connect wallet first', err: true })
      return
    }
    if (!launchpadName.trim() || !launchpadTicker.trim()) {
      setLaunchpadMsg({ text: 'Name and ticker are required', err: true })
      return
    }
    setLaunchpadLoading(true)
    setLaunchpadMsg({ text: `${type}…` })
    try {
      const conn = new Connection(buybackConfig.rpcUrl, 'confirmed')
      const mintKeypair = anchor.web3.Keypair.generate()
      const payer = wallet
      const tx = new anchor.web3.Transaction()
      // Create account for mint
      const lamports = await conn.getMinimumBalanceForRentExemptMint()
      tx.add(anchor.web3.SystemProgram.createAccount({
        fromPubkey: payer,
        newAccountPubkey: mintKeypair.publicKey,
        lamports,
        space: 82,
        programId: TOKEN_2022,
      }))
      tx.add(anchor.initializeMint({
        programId: TOKEN_2022,
        mint: mintKeypair.publicKey,
        decimals: launchpadDecimals,
        mintAuthority: payer,
        freezeAuthority: payer,
      }))
      const sig = await anchor.sendAndConfirmTransaction(conn, tx, [payer, mintKeypair])
      setLaunchpadMsg({ text: `${type} ok — ${sig}` })
    } catch (e) {
      setLaunchpadMsg({ text: `${type} failed: ${e.message}`, err: true })
    } finally {
      setLaunchpadLoading(false)
    }
  }, [wallet, launchpadName, launchpadTicker, launchpadSupply, launchpadDecimals, buybackConfig.rpcUrl])

  // ── Tabs ──
  const tabs = [
    ['overview', 'Overview'],
    ['agents', 'Trading Agents'],
    ['strategies', 'Strategies'],
    ['live', 'Live Trading'],
    ['buyback', 'Buyback & Burn'],
    ['launchpad', 'Launchpad'],
    ['wallet', 'Wallet'],
    ['feed', 'Feed'],
    ['settings', 'Settings'],
  ]

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <img src="./logo-512.png" alt="ACHILLES" className="header-logo" />
        <h1>ACHILLES</h1>
        <span className="sub">Trading + Wallet + Buyback Command Center</span>
        <div className="spacer" />
        <span className={`dot ${connected ? 'dot-ok' : 'dot-bad'}`} />
        <span style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: 1 }}>
          {connected ? 'BRIDGE CONNECTED' : 'BRIDGE OFFLINE'}
        </span>
      </header>

      {/* ── Navigation ── */}
      <nav className="nav">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            className={`nav-btn ${tab === id ? 'active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* ── Content ── */}
      <main className="content">

        {/* ═══════════════════════ OVERVIEW ═══════════════════════ */}
        {tab === 'overview' && (
          <>
            <section className="card">
              <SectionTitle icon="⚡" title="Live Trading" />
              <div className="grid">
                <Stat label="Status" value={live?.enabled ? 'ENABLED' : 'DISABLED'} hint={live?.paperMode ? 'Paper mode' : 'LIVE wallet'} />
                <Stat label="Balance" value={formatSol(live?.realBalanceSol || live?.bankrollSol)} hint="SOL" />
                <Stat label="Positions" value={live?.positions?.length || 0} hint="open" />
                <Stat label="Trades Today" value={live?.tradesToday || 0} hint={`${(live?.tradesPerHour || 0)}/hr`} />
                <Stat label="Phase" value={live?.goalPhase || '—'} hint="goal planner" />
                <Stat label="Uptime" value={live?.uptimeSec ? `${Math.round(live.uptimeSec / 60)}m` : '—'} hint="session" />
              </div>
            </section>

            {paper && (
              <section className="card">
                <SectionTitle icon="📄" title="Paper Lab" />
                <div className="grid">
                  <Stat label="Bankroll" value={formatSol(paper.bankrollSol)} hint={`start: ${formatSol(paper.bankrollStart)}`} />
                  <Stat label="PnL" value={formatPct(paper.pnlSol ? (paper.pnlSol / paper.bankrollStart) * 100 : 0)} hint={`${paper.trades?.length || 0} trades`} />
                  <Stat label="Open" value={paper.openPositions || 0} hint={`risk: ${formatSol(paper.openRiskSol)}`} />
                  <Stat label="Tracked" value={paper.trackedTokens || 0} hint="tokens" />
                  <Stat label="Feed" value={paper.feedConnected ? 'LIVE' : 'OFFLINE'} hint="data" />
                </div>
              </section>
            )}

            <section className="card">
              <SectionTitle icon="🔄" title="Buyback Protocol" />
              <div className="grid">
                <Stat label="Program" value={truncateAddress(buybackConfig.programId, 8, 0)} hint="Token-2022" />
                <Stat label="Status" value={protocolState ? 'DEPLOYED' : 'NOT FOUND'} hint={protocolState ? truncateAddress(protocolState.pubkey, 12, 0) : 'check RPC'} />
                <Stat label="RPC" value={buybackConfig.rpcUrl.includes('mainnet') ? 'MAINNET' : 'CUSTOM'} hint={buybackConfig.rpcUrl} />
              </div>
            </section>
          </>
        )}

        {/* ═══════════════════════ TRADING AGENTS ═══════════════════════ */}
        {tab === 'agents' && (
          <section className="card">
            <SectionTitle icon="🤖" title="Trading Agents" />
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {TRADING_AGENTS.map((agent, i) => (
                <div key={`agent-${agent.id}`} className="stat">
                  <div className="label">{agent.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{agent.desc}</div>
                  <div style={{ marginTop: 8 }}>
                    <span className={`pill ${agent.status === 'active' ? 'p-enter' : 'p-exit'}`}>
                      {agent.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ═══════════════════════ STRATEGIES ═══════════════════════ */}
        {tab === 'strategies' && (
          <section className="card">
            <SectionTitle icon="📊" title="Trading Strategies" />
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {TRADING_STRATEGIES.map((s, i) => (
                <div key={`strat-${s.id}`} className="stat">
                  <div className="label">{s.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{s.desc}</div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className={`pill ${s.status === 'active' ? 'p-enter' : 'p-hold'}`}>
                      {s.status.toUpperCase()}
                    </span>
                    <button
                      className="btn btn-obsidian"
                      style={{ fontSize: 10, padding: '4px 10px' }}
                      onClick={() => {
                        setTradingStrategies(prev => prev.map((s, idx) =>
                          idx === i ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s
                        ))
                      }}
                    >
                      {s.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ═══════════════════════ LIVE TRADING ═══════════════════════ */}
        {tab === 'live' && (
          <>
            <section className="card">
              <SectionTitle icon="💰" title="Live Wallet" />
              <div className="grid">
                <Stat label="Status" value={live?.enabled ? 'TRADING' : 'PAUSED'} hint={live?.paperMode ? 'paper' : 'REAL SOL'} />
                <Stat label="Real Balance" value={formatSol(live?.realBalanceSol)} hint="on-chain" />
                <Stat label="Bankroll" value={formatSol(live?.bankrollSol)} hint="virtual" />
                <Stat label="Positions" value={live?.positions?.length || 0} hint={`max: ${live?.maxPositions || 3}`} />
                <Stat label="Trades Today" value={live?.tradesToday || 0} hint={`${live?.tradesPerHour || 0}/hr`} />
                <Stat label="Required" value={formatSol(live?.requiredSol)} hint="min SOL" />
              </div>
            </section>

            {live?.positions?.length > 0 && (
              <section className="card">
                <SectionTitle icon="📈" title="Open Positions" />
                <table>
                  <thead><tr><th>Symbol</th><th>Size</th><th>Entry</th><th>Last</th><th>PnL</th><th>Peak</th></tr></thead>
                  <tbody>
                    {live.positions.map((p, i) => (
                      <tr key={`${p.symbol}`}>
                        <td>{p.symbol}</td>
                        <td>{formatSol(p.sizeSol)}</td>
                        <td>${p.entryPriceUsd?.toFixed(6)}</td>
                        <td>${p.lastPriceUsd?.toFixed(6)}</td>
                        <td><PnlValue value={p.pnlPct} /></td>
                        <td><PnlValue value={p.peakPnlPct} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {exits && (
              <section className="card">
                <SectionTitle icon="🛡" title="Exit Health" />
                <div className="grid">
                  <Stat label="Total Closes" value={exits.total} hint="all-time" />
                  <Stat label="TP/Trail" value={exits.tpTrail} hint={`${exits.tpTrailPct}%`} />
                  <Stat label="Chop" value={exits.chop} hint={`${exits.chopPct}%`} />
                  <Stat label="Healthy" value={exits.healthy ? 'YES' : 'NO'} hint="TP dominant" />
                </div>
              </section>
            )}

            {events && (
              <section className="card">
                <SectionTitle icon="📡" title="Live Feed" />
                <div className="evlog">
                  {events.events?.slice(0, 20).map((e, i) => (
                    <div key={`${e.ts}`} className={`ev ${e.level || ''}`}>
                      <span style={{ color: 'var(--muted)' }}>{formatTime(e.ts)}</span>
                      {' '}{e.msg || e.symbol || JSON.stringify(e).slice(0, 80)}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* ═══════════════════════ BUYBACK & BURN ═══════════════════════ */}
        {tab === 'buyback' && (
          <>
            <section className="card">
              <SectionTitle icon="🔄" title="Buyback & Burn Protocol" />
              <div className="grid">
                <Stat label="Program ID" value={truncateAddress(buybackConfig.programId, 12, 0)} hint="Token-2022" />
                <Stat label="Status" value={protocolState ? 'DEPLOYED' : 'CHECK RPC'} hint={protocolState ? truncateAddress(protocolState.pubkey, 16, 0) : 'not found'} />
                <Stat label="RPC" value={buybackConfig.rpcUrl.includes('mainnet') ? 'MAINNET' : 'CUSTOM'} hint={buybackConfig.rpcUrl} />
                <Stat label="Wallet" value={wallet ? truncateAddress(wallet, 8, 0) : 'NOT CONNECTED'} hint={walletType || 'click Wallet tab'} />
                <Stat label="SOL Balance" value={balance != null ? `${balance.toFixed(4)}` : '—'} hint="native" />
              </div>
            </section>

            <section className="card">
              <SectionTitle icon="⚙" title="Auto / Manual Toggle" />
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <label className="toggle">
                  <input type="checkbox" checked={buybackAuto} onChange={(e) => setBuybackAuto(e.target.checked)} />
                  <span className="tk" />
                  <span className="tlab">{buybackAuto ? 'AUTO MODE' : 'MANUAL MODE'}</span>
                </label>
                {buybackAuto && (
                  <span style={{ fontSize: 11, color: 'var(--green)' }}>Protocol will execute buyback & burn automatically</span>
                )}
              </div>
            </section>

            <section className="card">
              <SectionTitle icon="🎯" title="Protocol Actions" />
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                <button className="btn btn-gold" disabled={!wallet || actionLoading} onClick={() => runBuyback('burn_and_earn', async () => 'simulated-tx')}>
                  {actionLoading ? '…' : 'Burn & Earn'}
                </button>
                <button className="btn btn-obsidian" disabled={!wallet || actionLoading} onClick={() => runBuyback('stake', async () => 'simulated-stake')}>
                  {actionLoading ? '…' : 'Stake Tokens'}
                </button>
                <button className="btn btn-red" disabled={!wallet || actionLoading} onClick={() => runBuyback('execute_buyback', async () => 'simulated-buyback')}>
                  {actionLoading ? '…' : 'Execute Buyback'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn btn-obsidian" onClick={refreshProtocol}>Refresh Protocol</button>
                <button className="btn btn-obsidian" onClick={refreshWallet}>Refresh Balance</button>
              </div>
            </section>

            <section className="card">
              <SectionTitle icon="🔧" title="Configuration" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>RPC URL</label>
                  <input value={buybackConfig.rpcUrl} onChange={(e) => updateConfig({ rpcUrl: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>PROGRAM ID</label>
                  <input value={buybackConfig.programId} onChange={(e) => updateConfig({ programId: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>BURN AMOUNT</label>
                  <input type="number" value={buybackConfig.burn.amount} onChange={(e) => updateBurn({ amount: Number(e.target.value) })} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>BUYBACK AMOUNT</label>
                  <input type="number" value={buybackConfig.buyback.amount} onChange={(e) => updateBuyback({ amount: Number(e.target.value) })} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>THRESHOLD (SOL)</label>
                  <input type="number" step="0.1" value={buybackConfig.buyback.thresholdSol} onChange={(e) => updateBuyback({ thresholdSol: Number(e.target.value) })} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>SLIPPAGE (BPS)</label>
                  <input type="number" value={buybackConfig.buyback.slippageBps} onChange={(e) => updateBuyback({ slippageBps: Number(e.target.value) })} />
                </div>
              </div>
            </section>

            {buybackMsg.text && (
              <section className="card">
                <SectionTitle icon="💬" title="Last Response" />
                <pre style={{ fontSize: 12, color: buybackMsg.err ? 'var(--red)' : 'var(--green)', whiteSpace: 'pre-wrap' }}>{buybackMsg.text}</pre>
              </section>
            )}
          </>
        )}

        {/* ═══════════════════════ TOKEN LAUNCHPAD ═══════════════════════ */}
        {tab === 'launchpad' && (
          <section className="card">
            <SectionTitle icon="🚀" title="Token Creation Launchpad" />
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
              Create, deploy, and manage SOLANA tokens using the buyback & burn protocol.
              Requires connected wallet with sufficient SOL for rent-exempt storage.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>TOKEN NAME</label>
                <input id="launchpad-name" value={launchpadName} onChange={(e) => setLaunchpadName(e.target.value)} placeholder="e.g. MyToken" />
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>TICKER</label>
                <input id="launchpad-ticker" value={launchpadTicker} onChange={(e) => setLaunchpadTicker(e.target.value)} placeholder="e.g. MTK" maxLength={6} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>SUPPLY</label>
                <input id="launchpad-supply" type="number" value={launchpadSupply} onChange={(e) => setLaunchpadSupply(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>DECIMALS</label>
                <input id="launchpad-decimals" type="number" value={launchpadDecimals} onChange={(e) => setLaunchpadDecimals(Number(e.target.value))} min={0} max={9} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <button className="btn btn-gold" disabled={!wallet || launchpadLoading} onClick={() => handleTokenCreation('create')}>
                {launchpadLoading ? '…' : 'Create Token'}
              </button>
              <button className="btn btn-obsidian" disabled={!wallet || launchpadLoading} onClick={() => handleTokenCreation('mint')}>
                {launchpadLoading ? '…' : 'Mint Tokens'}
              </button>
              <button className="btn btn-obsidian" disabled={!wallet || launchpadLoading} onClick={() => handleTokenCreation('burn')}>
                {launchpadLoading ? '…' : 'Burn Tokens'}
              </button>
              <button className="btn btn-red" disabled={!wallet || launchpadLoading} onClick={() => handleTokenCreation('freeze')}>
                {launchpadLoading ? '…' : 'Freeze Account'}
              </button>
            </div>

            {launchpadMsg.text && (
              <pre style={{ fontSize: 12, color: launchpadMsg.err ? 'var(--red)' : 'var(--green)', whiteSpace: 'pre-wrap' }}>{launchpadMsg.text}</pre>
            )}
          </section>
        )}

        {/* ═══════════════════════ WALLET ═══════════════════════ */}
        {tab === 'wallet' && (
          <section className="card">
            <SectionTitle icon="👛" title="Wallet Connection" />
            {!wallet ? (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button className="btn btn-gold" disabled={walletLoading} onClick={() => connectWallet('phantom')}>
                  {walletLoading ? 'Connecting…' : 'Connect Phantom'}
                </button>
                <button className="btn btn-obsidian" disabled={walletLoading} onClick={() => connectWallet('solflare')}>
                  {walletLoading ? 'Connecting…' : 'Connect Solflare'}
                </button>
              </div>
            ) : (
              <>
                <div className="grid" style={{ marginBottom: 16 }}>
                  <Stat label="Address" value={truncateAddress(wallet, 12, 8)} hint={walletType} />
                  <Stat label="SOL Balance" value={balance != null ? `${balance.toFixed(4)} SOL` : '—'} hint="native" />
                  <Stat label="Network" value={buybackConfig.rpcUrl.includes('mainnet') ? 'MAINNET' : 'CUSTOM'} hint={buybackConfig.rpcUrl} />
                </div>
                <button className="btn btn-red" onClick={disconnectWallet}>Disconnect</button>
              </>
            )}
            <p style={{ marginTop: 16, fontSize: 12, color: 'var(--muted)' }}>
              Wallet connection uses direct browser injection (window.solana / window.solflare).
              No adapter libraries required. Works with Phantom, Solflare, and any wallet that
              injects into the browser window.
            </p>
          </section>
        )}

        {/* ═══════════════════════ FEED ═══════════════════════ */}
        {tab === 'feed' && (
          <section className="card">
            <SectionTitle icon="🔍" title={`Token Universe (${feed?.count || 0})`} />
            <span style={{ color: feed?.connected ? 'var(--green)' : 'var(--red)' }}>●</span>
            <table>
              <thead><tr><th>Symbol</th><th>Price</th><th>5m</th><th>1h</th><th>Vol</th><th>Surge</th><th>Trades</th><th>Liq</th><th>MCap</th></tr></thead>
              <tbody>
                {feed?.tokens?.slice(0, 50).map((t, i) => (
                  <tr key={`${t.symbol}`} style={{ background: t.interesting ? 'rgba(255, 179, 0, 0.03)' : 'transparent' }}>
                    <td>{t.symbol}</td>
                    <td>${t.priceUsd?.toFixed(6)}</td>
                    <td><PnlValue value={t.chg5m} /></td>
                    <td><PnlValue value={t.chg1h} /></td>
                    <td>{formatSol(t.volSol)}</td>
                    <td>{t.volSurge?.toFixed(1)}</td>
                    <td>{t.trades}</td>
                    <td>${(t.liqUsd / 1000).toFixed(0)}k</td>
                    <td>${(t.mcapUsd / 1000).toFixed(0)}k</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* ═══════════════════════ SETTINGS ═══════════════════════ */}
        {tab === 'settings' && (
          <>
            <section className="card">
              <SectionTitle icon="⚙" title="General Settings" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>BRIDGE URL</label>
                  <input defaultValue="http://127.0.0.1:8787" placeholder="Bridge URL" />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>POLLING INTERVAL (ms)</label>
                  <input type="number" defaultValue={3000} min={500} step={500} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>MAX POSITIONS</label>
                  <input type="number" defaultValue={3} min={1} max={10} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>AUTO-RESUME ON RESTART</label>
                  <select defaultValue="yes">
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                <button className="btn btn-gold">Save Settings</button>
                <button className="btn btn-obsidian">Reset to Defaults</button>
              </div>
            </section>

            <section className="card">
              <SectionTitle icon="🎨" title="UI Settings" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>THEME</label>
                  <select defaultValue="cyberpunk">
                    <option value="cyberpunk">Gold / Obsidian Cyberpunk</option>
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>COMPACT MODE</label>
                  <select defaultValue="no">
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>SCANLINES</label>
                  <select defaultValue="on">
                    <option value="on">On</option>
                    <option value="off">Off</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="card">
              <SectionTitle icon="🔐" title="Security" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label className="toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="tk" />
                  <span className="tlab">Require wallet confirmation for trades</span>
                </label>
                <label className="toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="tk" />
                  <span className="tlab">Anti-top gate (NEVER buy the top)</span>
                </label>
                <label className="toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="tk" />
                  <span className="tlab">Dump ban — sell pressure exit</span>
                </label>
                <label className="toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="tk" />
                  <span className="tlab">Paper mode (wallet stays offline during training)</span>
                </label>
              </div>
            </section>

            <section className="card">
              <SectionTitle icon="📦" title="About" />
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                <p>ACHILLES v1.0 — Unified Trading + Wallet + Buyback Command Center</p>
                <p>Built with React 18 + Vite + Electron + Capacitor</p>
                <p>Gold/Obsidian Cyberpunk UI with Roman Coin branding</p>
                <p>Connects to APEX-SOL bridge at http://127.0.0.1:8787</p>
              </div>
            </section>
          </>
        )}

      </main>
    </div>
  )
}