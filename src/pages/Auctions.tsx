/**
 * Auctions.tsx — Timed auction browse & bidding.
 * Powers the /auctions page with active auctions, countdown timers, and place-bid flow.
 */
import { trpc } from "@/providers/trpc"
import { useAuth } from "@/hooks/useAuth"
import { useState } from "react"
import { Clock, Gavel, Trophy, Loader2, TrendingUp, AlertTriangle } from "lucide-react"

export function Auctions() {
  const { isAuthenticated, user } = useAuth()
  const [selectedAuction, setSelectedAuction] = useState<number | null>(null)
  const [bidAmount, setBidAmount] = useState("")

  // Fetch active auctions
  const { data: auctions, isLoading } = trpc.auctions.get.useQuery(undefined, {
    enabled: isAuthenticated === true,
  })

  // Place bid mutation
  const bidMutation = trpc.auctions.bid.useMutation({
    onSuccess: () => {
      setBidAmount("")
      setSelectedAuction(null)
    },
  })

  if (!isAuthenticated) return null

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <Gavel className="w-6 h-6 text-gold-400" />
        <h1 className="text-3xl font-bold text-white">Live Auctions</h1>
      </div>

      <p className="text-gray-400">
        Timed auctions with anti-sniping protection. Place your bid before the countdown ends.
      </p>

      {/* Active auctions grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gold-400 col-span-full">
            <Loader2 className="animate-spin w-5 h-5" />
            <span>Loading auctions...</span>
          </div>
        ) : auctions && auctions.length > 0 ? (
          auctions.map((auction) => (
            <div key={auction.id} className="bg-dark-800/50 border border-gold-500/20 rounded-xl overflow-hidden hover:border-gold-400/40 transition">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs bg-gold-500/20 text-gold-400 px-2 py-1 rounded">
                    {auction.auctionStatus === 'active' ? 'LIVE' : auction.auctionStatus}
                  </span>
                  {auction.auctionStatus === 'active' && (
                    <span className="text-xs text-red-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Ending soon
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{auction.listingTitle}</h3>
                <p className="text-sm text-gray-400 mb-3">{auction.description?.slice(0, 80)}...</p>

                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Current Bid</p>
                    <p className="text-xl font-bold text-gold-400">{auction.highestBid ? `$${auction.highestBid}` : 'No bids yet'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Reserve Price</p>
                    <p className="text-sm font-semibold text-white">${auction.auctionReservePrice || 'N/A'}</p>
                  </div>
                </div>

                {auction.auctionReservePrice && auction.highestBid && auction.highestBid < auction.auctionReservePrice && (
                  <div className="flex items-center gap-2 text-xs text-orange-400 mb-3">
                    <AlertTriangle className="w-3 h-3" />
                    Reserve not met yet
                  </div>
                )}

                {auction.auctionStatus === 'active' && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Your bid (SOL)"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        className="flex-1 bg-dark-900 border border-gold-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-400"
                      />
                      <button
                        onClick={() => setSelectedAuction(auction.id)}
                        disabled={!bidAmount || parseFloat(bidAmount) <= 0}
                        className="px-4 py-2 bg-gold-500/90 text-black font-semibold rounded-lg text-sm hover:bg-gold-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Bid
                      </button>
                    </div>
                    {selectedAuction === auction.id && (
                      <button
                        onClick={() => bidMutation.mutateAsync({ auctionId: auction.id, amount: parseFloat(bidAmount) })}
                        disabled={bidMutation.isPending}
                        className="w-full px-4 py-2 bg-emerald-500/90 text-white font-semibold rounded-lg text-sm hover:bg-emerald-400 transition disabled:opacity-50"
                      >
                        {bidMutation.isPending ? 'Placing...' : 'Confirm Bid'}
                      </button>
                    )}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>{auction.bidCount || 0} bids</span>
                  <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-gold-400" /> {auction.auctionWinner ? `Winner: $${auction.auctionWinner}` : 'Open'}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-400 col-span-full">No active auctions right now. Check back soon!</p>
        )}
      </div>
    </section>
  )
}
