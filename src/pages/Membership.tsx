/**
 * Membership.tsx — Vault Pro subscription + badge tiers.
 * Powers the /membership page with tier selection and rank progress.
 */
import { trpc } from "@/providers/trpc"
import { useAuth } from "@/hooks/useAuth"
import { useState } from "react"
import { Crown, Sparkles, Shield, Star, Loader2, Check, Lock } from 'lucide-react'

const PLANS = [
  { name: 'Monthly', price: 19.99, period: 'mo', features: ['Early access to new listings', 'Priority support', 'Basic price alerts'] },
  { name: 'Quarterly', price: 49.99, period: 'qtr', features: ['Everything in Monthly', 'Extended price alerts (30 days)', 'Curated collection access', 'Advanced analytics'] },
  { name: 'Annual', price: 149.99, period: 'yr', features: ['Everything in Quarterly', 'Unlimited price alerts', 'AI recommendations', 'ProVerify discount', 'Priority onboarding'] },
]

const BADGE_TIERS = [
  { rank: 'Collector', icon: '🪙', minSales: 0, color: 'text-gray-400' },
  { rank: 'Curator', icon: '📋', minSales: 5, color: 'text-emerald-400' },
  { rank: 'Appraiser', icon: '🔍', minSales: 25, color: 'text-gold-400' },
  { rank: 'Dealer', icon: '🏛️', minSales: 100, color: 'text-red-400' },
]

export function Membership() {
  const { isAuthenticated, user } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  // Fetch user's membership tier
  const { data: tierData, isLoading } = trpc.membership.tier.useQuery(undefined, {
    enabled: isAuthenticated === true,
  })

  // Subscription checkout
  const checkoutMutation = trpc.subscriptions.checkout.useMutation()

  if (!isAuthenticated) return null

  const currentRank = tierData?.rank || 'Collector'
  const progress = tierData?.progress || 0
  const nextRank = tierData?.nextRank
  const nextMinSales = tierData?.nextRankMinSales

  return (
    <section className="space-y-10">
      <div className="flex items-center gap-3">
        <Sparkles className="w-6 h-6 text-gold-400" />
        <h1 className="text-3xl font-bold text-white">Vault Pro & Ranks</h1>
      </div>

      {/* Membership tier + progress */}
      <div className="bg-dark-800/50 border border-gold-500/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Your Rank</h2>
            <p className="text-gray-400">{currentRank}</p>
          </div>
          {nextRank && (
            <div className="text-right">
              <p className="text-sm text-gold-400">Next: {nextRank}</p>
              <p className="text-xs text-gray-500">{nextMinSales} sales to unlock</p>
            </div>
          )}
        </div>
        <div className="w-full bg-dark-900 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-gold-600 to-gold-400 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">{progress}% to {nextRank || 'max rank'}</p>
      </div>

      {/* Badge tiers */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Badge Tiers</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {BADGE_TIERS.map((tier) => (
            <div
              key={tier.rank}
              className={`bg-dark-800/50 border rounded-xl p-4 text-center ${tier.rank === currentRank ? 'border-gold-500 bg-gold-500/5' : 'border-gray-700'}`}
            >
              <div className="text-3xl mb-2">{tier.icon}</div>
              <h3 className={`font-bold ${tier.color}`}>{tier.rank}</h3>
              <p className="text-xs text-gray-500">{tier.minSales}+ sales</p>
              {tier.rank === currentRank && <Check className="w-4 h-4 text-gold-400 mt-2 mx-auto" />}
            </div>
          ))}
        </div>
      </div>

      {/* Vault Pro subscription */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Vault Pro Membership</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div key={plan.name} className="bg-dark-800/50 border border-gold-500/20 rounded-xl p-6 hover:border-gold-400/40 transition">
              <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
              <p className="text-3xl font-bold text-gold-400 mb-4">${plan.price}<span className="text-sm text-gray-500">/{plan.period}</span></p>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => {
                  setSelectedPlan(plan.name)
                  checkoutMutation.mutateAsync({ plan: plan.name.toLowerCase(), amount: plan.price })
                }}
                disabled={checkoutMutation.isPending}
                className="w-full px-4 py-2 bg-gold-500/90 text-black font-semibold rounded-lg hover:bg-gold-400 transition disabled:opacity-50"
              >
                {checkoutMutation.isPending ? 'Processing...' : `Subscribe — $${plan.price}/${plan.period}`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
