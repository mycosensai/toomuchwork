/**
 * OfferManagement.tsx — Buyer offers management UI.
 * Shows offers received (for sellers) and offers sent (for buyers).
 */
import { trpc } from "@/providers/trpc"
import { useAuth } from "@/hooks/useAuth"
import { useState } from "react"
import { MessageCircle, Check, X, Mail, Loader2 } from "lucide-react"

export function OfferManagement() {
  const { isAuthenticated, user } = useAuth()
  const [showNewOffer, setShowNewOffer] = useState(false)
  const [amount, setAmount] = useState("")
  const [message, setMessage] = useState("")
  const [selectedListingId, setSelectedListingId] = useState<number | null>(null)

  // Fetch offers received by the current user (seller view)
  const { data: receivedOffers, isLoading } = trpc.offers.list.useQuery(undefined, {
    enabled: isAuthenticated === true,
  })

  // Accept offer mutation
  const acceptMutation = trpc.offers.accept.useMutation()
  const declineMutation = trpc.offers.decline.useMutation()

  if (!isAuthenticated) return null

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <MessageCircle className="w-6 h-6 text-gold-400" />
        <h2 className="text-2xl font-bold text-white">Offers</h2>
      </div>

      {/* New offer form */}
      {showNewOffer && selectedListingId && (
        <div className="bg-dark-800/50 border border-gold-500/20 rounded-xl p-4 space-y-4">
          <h3 className="text-lg font-semibold text-white">Make an Offer</h3>
          <input
            type="number"
            placeholder="Amount (SOL)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-dark-900 border border-gold-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-400"
          />
          <textarea
            placeholder="Message to seller (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-dark-900 border border-gold-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-400"
            rows={3}
          />
          <div className="flex gap-3">
            <button
              onClick={async () => {
                await trpc.offers.create.mutateAsync({
                  listingId: selectedListingId,
                  amount: parseFloat(amount),
                  message: message || undefined,
                })
                setShowNewOffer(false)
                setAmount("")
                setMessage("")
              }}
              className="px-6 py-2 bg-gold-500/90 text-black font-semibold rounded-lg hover:bg-gold-400 transition"
            >
              Submit Offer
            </button>
            <button
              onClick={() => setShowNewOffer(false)}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Received offers list */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gold-400">
            <Loader2 className="animate-spin w-4 h-4" />
            <span>Loading offers...</span>
          </div>
        ) : receivedOffers && receivedOffers.length > 0 ? (
          receivedOffers.map((offer) => (
            <div key={offer.id} className="bg-dark-800/50 border border-gold-500/20 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-semibold">${offer.amount} on {offer.listingTitle}</p>
                <p className="text-xs text-gold-400">From {offer.buyerName} • {new Date(offer.createdAt).toLocaleDateString()}</p>
                {offer.message && <p className="text-sm text-gray-300 mt-1 italic">"{offer.message}"</p>}
              </div>
              {offer.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptMutation.mutateAsync({ offerId: offer.id })}
                    className="p-2 bg-emerald-500/90 rounded-lg hover:bg-emerald-400 transition"
                    title="Accept"
                  >
                    <Check className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={() => declineMutation.mutateAsync({ offerId: offer.id })}
                    className="p-2 bg-red-500/90 rounded-lg hover:bg-red-400 transition"
                    title="Decline"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-400">No offers received yet.</p>
        )}
      </div>
    </section>
  )
}
