import { useState } from 'react'
import { trpc } from '@/providers/trpc'
import { Loader2, Landmark, CheckCircle2, AlertTriangle, ExternalLink, Banknote, Wallet } from 'lucide-react'

/**
 * SellerPayoutPanel — "Get Paid" block for sellers.
 * - Connect bank via Stripe-hosted onboarding (payout.onboarding)
 * - Show verification status (payout.status)
 * - List pending payouts and let the seller transfer them (payout.initiateTransfer)
 * Mirrors the gold-on-obsidian theme of the rest of the site.
 */
export default function SellerPayoutPanel() {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const statusQ = trpc.payout.status.useQuery()
  const pendingQ = trpc.payout.pendingOrders.useQuery(undefined, { enabled: statusQ.data?.onboarded === true })
  const onboarding = trpc.payout.onboarding.useMutation()
  const transfer = trpc.payout.initiateTransfer.useMutation()
  const [claimingId, setClaimingId] = useState<number | null>(null)

  const onboarded = statusQ.data?.onboarded === true
  const transfersEnabled = statusQ.data?.transfersEnabled === true
  const pending = pendingQ.data || []

  const handleOnboard = async () => {
    setBusy(true); setErr(null); setOk(null)
    try {
      const res = await onboarding.mutateAsync({})
      if (res?.url) window.location.href = res.url  // Stripe-hosted onboarding
      else { setErr('Onboarding link unavailable — try again.'); setBusy(false) }
    } catch (e: any) {
      setErr(e?.message || 'Could not start onboarding.'); setBusy(false)
    }
  }

  const handleTransfer = async (orderId: number) => {
    setBusy(true); setErr(null); setOk(null); setClaimingId(orderId)
    try {
      const res = await transfer.mutateAsync({ orderId })
      setOk(`Payout sent! Transfer ${res.transferId} — $${res.amount} on its way to your bank.`)
      statusQ.refetch()
      pendingQ.refetch()
    } catch (e: any) {
      setErr(e?.message || 'Transfer failed.')
    } finally {
      setBusy(false); setClaimingId(null)
    }
  }

  return (
    <div className="bg-[#161616] border border-[#C9A84C]/25 p-6 relative mb-8">
      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#C9A84C]" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#C9A84C]" />

      <h3 className="text-[9px] tracking-[4px] uppercase text-[#C9A84C] font-cinzel font-semibold mb-4 flex items-center gap-2">
        <Landmark className="w-3.5 h-3.5" /> Get Paid — Seller Payouts
      </h3>

      {!onboarded ? (
        <div>
          <p className="text-[11px] text-[#C8BC98] mb-4 leading-relaxed">
            Connect your bank account through Stripe to receive payouts when your items sell.
            We never hold your money — proceeds go straight from the sale to your bank.
          </p>
          <button
            onClick={handleOnboard}
            disabled={busy}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-[#C9A84C] to-[#8A6E2F] text-[#080808] font-cinzel text-[10px] tracking-[3px] uppercase font-bold hover:shadow-[0_0_30px_rgba(201,168,76,0.35)] disabled:opacity-50 transition-all"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
            Connect Bank for Payouts
          </button>
        </div>
      ) : transfersEnabled ? (
        <div className="flex items-start gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] text-emerald-400 font-semibold mb-1">Bank connected &amp; verified</p>
            <p className="text-[10px] text-[#C8BC98]">Your payout account is ready. Funds are transferred to you after each sale is confirmed.</p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/20">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] text-amber-400 font-semibold mb-1">Onboarding incomplete</p>
            <p className="text-[10px] text-[#C8BC98] mb-3">Finish the remaining steps in Stripe to receive payouts.</p>
            <button onClick={handleOnboard} disabled={busy}
              className="inline-flex items-center gap-2 px-4 py-2 border border-[#C9A84C] text-[#C9A84C] font-cinzel text-[9px] tracking-[3px] uppercase font-semibold hover:bg-[#C9A84C]/8 transition-all">
              <ExternalLink className="w-3 h-3" /> Resume Onboarding
            </button>
          </div>
        </div>
      )}

      {err && <p className="mt-4 text-[10px] text-red-400">{err}</p>}
      {ok && <p className="mt-4 text-[10px] text-emerald-400">{ok}</p>}

      {onboarded && transfersEnabled && (
        <div className="mt-6 pt-5 border-t border-[#C9A84C]/15">
          <h4 className="text-[9px] tracking-[3px] uppercase text-[#C9A84C] font-cinzel font-semibold mb-3 flex items-center gap-2">
            <Wallet className="w-3.5 h-3.5" /> Pending Payouts
          </h4>
          {pending.length === 0 ? (
            <p className="text-[10px] text-[#8A6E2F]">No pending payouts — all settled.</p>
          ) : (
            <div className="space-y-2">
              {pending.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3 p-3 bg-[#1E1E1E] border border-[#C9A84C]/10">
                  <div className="min-w-0">
                    <p className="text-[11px] text-[#F5EED8] truncate">{o.listingTitle}</p>
                    <p className="text-[9px] text-[#8A6E2F]">Order #{o.id} &middot; {o.orderStatus}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-cinzel text-sm font-bold text-emerald-400">
                      ${Number(o.payoutAmount || 0).toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleTransfer(o.id)}
                      disabled={busy || claimingId === o.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-br from-[#C9A84C] to-[#8A6E2F] text-[#080808] font-cinzel text-[9px] tracking-[2px] uppercase font-bold hover:shadow-[0_0_20px_rgba(201,168,76,0.35)] disabled:opacity-50 transition-all"
                    >
                      {claimingId === o.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Banknote className="w-3 h-3" />}
                      {claimingId === o.id ? 'Sending...' : 'Claim'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
