import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { trpc } from '@/providers/trpc'
import { Lock, ShieldCheck, CheckCircle2, X, CreditCard, Loader2, Sparkles } from 'lucide-react'

type PremiumType = 'appraisal' | 'proverify'

interface WidgetProps {
  type: PremiumType
  targetId: number
  itemName?: string
  onUnlocked?: () => void
  trigger?: 'auto' | 'button'
  /** Display amount override (e.g. the tier fee stored on a ProVerify case). */
  amount?: string
}

/**
 * StripeCheckoutWidget — the transparent, centered floating checkout.
 *
 * Renders a centered modal overlay (mid-screen) that explains EXACTLY what
 * the report costs and what it includes, with a single "Unlock with Stripe"
 * action. Payment happens on Stripe's hosted checkout; the success URL
 * returns here and verifyPayment flips the report to unlocked IN PLACE.
 */
export default function StripeCheckoutWidget({ type, targetId, itemName = '', onUnlocked, trigger = 'auto', amount: amountOverride }: WidgetProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(trigger === 'auto')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const pricing = trpc.premium.pricing.useQuery()
  const createCheckout = trpc.premium.createCheckout.useMutation()
  const verifyPayment = trpc.premium.verifyPayment.useMutation()

  const amount = amountOverride || pricing.data?.[type]?.amount || (type === 'appraisal' ? '$29.00' : '$49.99')
  const includes = pricing.data?.[type]?.includes || []
  const isAppraisal = type === 'appraisal'
  const serviceName = isAppraisal ? 'AI Appraisal Report' : 'ProVerify Engine Report'

  const close = () => {
    if (!busy) setOpen(false)
  }

  const handleUnlock = async () => {
    setBusy(true)
    setError(null)
    const current = location.pathname + location.search
    try {
      const res = await createCheckout.mutateAsync({
        type,
        targetId,
        itemName,
        successUrl: window.location.origin + current,
        cancelUrl: window.location.origin + current,
      })
      if (res.alreadyPaid) {
        onUnlocked?.()
        setOpen(false)
        return
      }
      if (res.url) {
        // Stripe hosted checkout — redirect; user returns to this page.
        window.location.href = res.url
        return
      }
      setError('Unable to start checkout. Please try again.')
      setBusy(false)
    } catch (e: any) {
      setError(e?.message || 'Something went wrong. Please try again.')
      setBusy(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{ background: 'rgba(4,4,4,0.78)', backdropFilter: 'blur(6px)' }}
      onClick={close}
      role="dialog"
      aria-modal="true"
    >
      {/* Centered floating card */}
      <div
        className="relative w-full max-w-md bg-[#141414] border border-[#C9A84C]/40 shadow-[0_0_80px_rgba(201,168,76,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Corner ornaments — matches site aesthetic */}
        <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-[#C9A84C]" />
        <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-[#C9A84C]" />
        <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-[#C9A84C]" />
        <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-[#C9A84C]" />

        <button
          onClick={close}
          aria-label="Close"
          className="absolute top-3 right-3 text-[#8A6E2F] hover:text-[#C9A84C] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-8">
          {/* Lock + title */}
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-3.5 h-3.5 text-[#C9A84C]" />
            <p className="text-[9px] tracking-[4px] uppercase text-[#C9A84C]">
              Premium Report
            </p>
          </div>
          <h2 className="font-cinzel text-xl text-[#F5EED8] tracking-[2px] mb-1">
            {serviceName}
          </h2>
          {itemName && (
            <p className="font-cormorant italic text-sm text-[#C8BC98] mb-4 truncate">
              {itemName}
            </p>
          )}

          {/* Transparent price */}
          <div className="flex items-end gap-2 mb-1">
            <span className="font-cinzel text-4xl text-[#C9A84C] font-bold">{amount}</span>
            <span className="text-[10px] text-[#8A6E2F] uppercase tracking-[2px] mb-2">
              one-time · instant unlock
            </span>
          </div>
          <p className="text-[10px] text-[#8A6E2F] mb-5">
            No subscription. Pay once, keep your full report.
          </p>

          {/* What's included */}
          {includes.length > 0 && (
            <div className="border border-[#C9A84C]/20 bg-[#1E1E1E] p-4 mb-5">
              <p className="text-[9px] tracking-[3px] uppercase text-[#8A6E2F] mb-3">
                Your report includes
              </p>
              <ul className="space-y-2">
                {includes.map((inc) => (
                  <li key={inc} className="flex items-start gap-2 text-xs text-[#C8BC98]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A84C] mt-0.5 shrink-0" />
                    {inc}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400 mb-3">{error}</p>
          )}

          {/* Unlock CTA */}
          <button
            onClick={handleUnlock}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-br from-[#C9A84C] to-[#8A6E2F] text-[#080808] font-cinzel text-[11px] tracking-[3px] uppercase font-bold hover:shadow-[0_0_40px_rgba(201,168,76,0.4)] transition-all disabled:opacity-60"
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Opening secure checkout…
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Unlock with Stripe — {amount}
              </>
            )}
          </button>

          {/* Trust row */}
          <div className="flex items-center justify-center gap-4 mt-4 text-[9px] text-[#8A6E2F] tracking-[1px]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#C9A84C]/70" />
              Secure card payment
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#C9A84C]/70" />
              Instant unlock
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
