/**
 * Showcases.tsx — Collector showcase gallery.
 * Powers the /showcases page.
 */
import { trpc } from "@/providers/trpc"
import { useAuth } from "@/hooks/useAuth"
import { Loader2, Image, Users, Star } from "lucide-react"

export function Showcases() {
  const { isAuthenticated } = useAuth()

  // Fetch public showcases
  const { data: showcases, isLoading } = trpc.showcase.list.useQuery(undefined, {
    enabled: isAuthenticated === true,
  })

  // Fetch user's showcases (seller view)
  const { data: myShowcases } = trpc.showcase.my.useQuery(undefined, {
    enabled: isAuthenticated === true,
  })

  if (!isAuthenticated) return null

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <Image className="w-6 h-6 text-gold-400" />
        <h1 className="text-3xl font-bold text-white">Collector Showcases</h1>
      </div>

      <p className="text-gray-400">Browse collections from top collectors and display your own.</p>

      {/* My showcases (if seller) */}
      {myShowcases && myShowcases.length > 0 && (
        <div className="bg-dark-800/30 border border-gold-500/10 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gold-400 mb-3">My Showcases ({myShowcases.length})</h3>
          <div className="flex gap-3 overflow-x-auto">
            {myShowcases.map((s: any) => (
              <div key={s.id} className="flex-shrink-0 bg-dark-900 rounded-lg p-3 border border-gold-500/20">
                <p className="text-sm font-semibold text-white">{s.title}</p>
                <p className="text-xs text-gray-500">{s.listingCount || 0} items</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Public showcases grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gold-400 col-span-full">
            <Loader2 className="animate-spin w-5 h-5" />
            <span>Loading showcases...</span>
          </div>
        ) : showcases && showcases.length > 0 ? (
          showcases.map((s: any) => (
            <div key={s.id} className="bg-dark-800/50 border border-gold-500/20 rounded-xl overflow-hidden hover:border-gold-400/40 transition">
              <div className="h-32 bg-gradient-to-br from-gold-500/10 to-dark-900 flex items-center justify-center">
                <Users className="w-10 h-10 text-gold-400/30" />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold text-white mb-1">{s.title}</h3>
                <p className="text-sm text-gray-400 mb-2">{s.description?.slice(0, 80) || 'A collector\'s showcase.'}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{s.sellerName || 'Anonymous'}</span>
                  <span className="flex items-center gap-1"><Star className="w-3 h-3 text-gold-400" /> {s.listingCount || 0} items</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 col-span-full text-center py-8">No showcases yet. Be the first to create one!</p>
        )}
      </div>
    </section>
  )
}
