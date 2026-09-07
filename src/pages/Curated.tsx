/**
 * Curated.tsx — Curated collections / Vault Picks gallery.
 * Powers the /curated page.
 */
import { trpc } from "@/providers/trpc"
import { useAuth } from "@/hooks/useAuth"
import { Loader2, LayoutGrid, Users, Sparkles } from "lucide-react"

export function Curated() {
  const { isAuthenticated } = useAuth()

  // Fetch curated collections
  const { data: collections, isLoading } = trpc.curator.list.useQuery(undefined, {
    enabled: isAuthenticated === true,
  })

  if (!isAuthenticated) return null

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="w-6 h-6 text-gold-400" />
        <h1 className="text-3xl font-bold text-white">Curated Collections</h1>
      </div>

      <p className="text-gray-400">Vault Picks — handpicked collections from top collectors and editors.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gold-400 col-span-full">
            <Loader2 className="animate-spin w-5 h-5" />
            <span>Loading collections...</span>
          </div>
        ) : collections && collections.length > 0 ? (
          collections.map((c: any) => (
            <div key={c.id} className="bg-dark-800/50 border border-gold-500/20 rounded-xl overflow-hidden hover:border-gold-400/40 transition">
              <div className="h-40 bg-gradient-to-br from-gold-500/20 to-dark-900 flex items-center justify-center relative">
                <LayoutGrid className="w-12 h-12 text-gold-400/50" />
                <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  {c.itemCount || 0} items
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold text-white mb-1">{c.name}</h3>
                <p className="text-sm text-gray-400 mb-3">{c.description?.slice(0, 80) || 'A curated collection of rare finds.'}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Users className="w-3 h-3" />
                  <span>{c.contributorName || 'Anonymous Collector'}</span>
                  {c.isFeatured && <span className="text-gold-400">• Featured</span>}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 col-span-full text-center py-8">No curated collections yet. Check back soon!</p>
        )}
      </div>
    </section>
  )
}
