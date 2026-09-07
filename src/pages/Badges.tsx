/**
 * Badges.tsx — Badge & rank hub with progress tracking.
 * Powers the /badges page.
 */
import { trpc } from "@/providers/trpc"
import { useAuth } from "@/hooks/useAuth"
import { Loader2, Trophy, Crown, Shield, Star, Zap } from "lucide-react"

const TIER_STYLES = {
  Collector: { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30', icon: Star },
  Curator: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: Shield },
  Appraiser: { color: 'text-gold-400', bg: 'bg-gold-500/10', border: 'border-gold-500/30', icon: Trophy },
  Dealer: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: Crown },
}

export function Badges() {
  const { isAuthenticated } = useAuth()

  // Fetch user's tier + leaderboard
  const { data: tierData, isLoading } = trpc.membership.tier.useQuery(undefined, {
    enabled: isAuthenticated === true,
  })
  const { data: leaderboard } = trpc.membership.leaderboard.useQuery(undefined, {
    enabled: isAuthenticated === true,
  })

  if (!isAuthenticated) return null

  const currentRank = tierData?.rank || 'Collector'
  const style = TIER_STYLES[currentRank as keyof typeof TIER_STYLES] || TIER_STYLES.Collector
  const Icon = style.icon
  const progress = tierData?.progress || 0
  const nextRank = tierData?.nextRank
  const nextMinSales = tierData?.nextRankMinSales

  const TIER_ICONS: Record<string, string> = {
    Collector: '🪙', Curator: '📋', Appraiser: '🔍', Dealer: '🏛️'
  }

  return (
    <section className="space-y-10">
      <div className="flex items-center gap-3">
        <Trophy className="w-6 h-6 text-gold-400" />
        <h1 className="text-3xl font-bold text-white">Your Ranks</h1>
      </div>

      {/* Current rank card */}
      <div className={`bg-dark-800/50 border ${style.border} rounded-xl p-6`}>
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-3 ${style.bg} rounded-xl`}>
            <Icon className={`w-8 h-8 ${style.color}`} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{currentRank}</h2>
            <p className="text-sm text-gray-400">{TIER_ICONS[currentRank]} Rank • {progress}% complete</p>
          </div>
        </div>

        <div className="w-full bg-dark-900 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              currentRank === 'Dealer' ? 'bg-red-400' :
              currentRank === 'Appraiser' ? 'bg-gold-400' :
              currentRank === 'Curator' ? 'bg-emerald-400' : 'bg-gray-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {nextRank && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-400">Next rank: {nextRank}</span>
            <span className="text-gray-500">{nextMinSales} sales needed</span>
          </div>
        )}
      </div>

      {/* All badge tiers */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Badge Tiers</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(TIER_ICONS).map(([rank, icon]) => {
            const s = TIER_STYLES[rank as keyof typeof TIER_STYLES] || TIER_STYLES.Collector
            const isActive = rank === currentRank
            return (
              <div key={rank} className={`bg-dark-800/50 border ${isActive ? s.border : 'border-gray-700'} rounded-xl p-4 text-center ${isActive ? 'ring-1 ring-gold-500/30' : ''}`}>
                <div className="text-3xl mb-2">{icon}</div>
                <h4 className={`font-bold ${s.color}`}>{rank}</h4>
                <p className="text-xs text-gray-500 mt-1">{rank === 'Collector' ? '0+ sales' : `${rank === 'Curator' ? 5 : rank === 'Appraiser' ? 25 : 100}+ sales`}</p>
                {isActive && <div className="mt-2 text-xs text-gold-400 font-semibold">ACTIVE</div>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Leaderboard */}
      {leaderboard && leaderboard.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Top Sellers</h3>
          <div className="space-y-2">
            {leaderboard.map((seller: any, i: number) => (
              <div key={seller.id} className="flex items-center gap-4 bg-dark-800/30 border border-gray-700 rounded-xl p-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  i === 0 ? 'bg-gold-500/20 text-gold-400' :
                  i === 1 ? 'bg-gray-400/20 text-gray-300' :
                  i === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-700 text-gray-500'
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{seller.name}</p>
                  <p className="text-xs text-gray-500">{seller.salesCount || 0} sales</p>
                </div>
                <span className="text-xs text-gray-400">{seller.rank}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
