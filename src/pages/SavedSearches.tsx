/**
 * SavedSearches.tsx — Saved searches manager with digest results.
 * Powers the /searches page.
 */
import { trpc } from "@/providers/trpc"
import { useAuth } from "@/hooks/useAuth"
import { useState } from "react"
import { Search, Loader2, Trash2, Clock, RefreshCw } from "lucide-react"

export function SavedSearches() {
  const { isAuthenticated } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [category, setCategory] = useState("")

  // Fetch saved searches
  const { data: searches, isLoading } = trpc.savedSearches.list.useQuery(undefined, {
    enabled: isAuthenticated === true,
  })

  // Save a new search
  const saveMutation = trpc.savedSearches.save.useMutation({
    onSuccess: () => {
      setSearchTerm("")
      setCategory("")
    },
  })

  // Delete search
  const deleteMutation = trpc.savedSearches.delete.useMutation()

  // Run a search query
  const runQuery = trpc.savedSearches.save.useMutation()

  if (!isAuthenticated) return null

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Search className="w-6 h-6 text-gold-400" />
          <h1 className="text-3xl font-bold text-white">Saved Searches</h1>
        </div>
      </div>

      {/* Create new search */}
      <div className="bg-dark-800/50 border border-gold-500/20 rounded-xl p-4 space-y-4">
        <h3 className="text-lg font-semibold text-white">Save a New Search</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search term (e.g. 'rare watches')"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-dark-900 border border-gold-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-400"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-dark-900 border border-gold-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-400"
          >
            <option value="">All Categories</option>
            <option value="watches">Watches</option>
            <option value="jewelry">Jewelry</option>
            <option value="coins">Coins</option>
            <option value="art">Art</option>
            <option value="memorabilia">Memorabilia</option>
          </select>
          <button
            onClick={() => saveMutation.mutateAsync({ query: searchTerm, category: category || undefined })}
            disabled={saveMutation.isPending || !searchTerm}
            className="px-4 py-3 bg-gold-500/90 text-black font-semibold rounded-lg hover:bg-gold-400 transition disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Search'}
          </button>
        </div>
      </div>

      {/* Saved searches list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gold-400">
            <Loader2 className="animate-spin w-4 h-4" />
            <span>Loading searches...</span>
          </div>
        ) : searches && searches.length > 0 ? (
          searches.map((s: any) => (
            <div key={s.id} className="bg-dark-800/50 border border-gold-500/20 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gold-500/10 rounded-lg">
                  <Search className="w-5 h-5 text-gold-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">{s.query}</p>
                  <p className="text-xs text-gray-500">
                    {s.category && `Category: ${s.category}`} • Saved {new Date(s.createdAt).toLocaleDateString()}
                  </p>
                  {s.lastDigest && (
                    <p className="text-xs text-gray-400 mt-1">
                      Last digest: {s.lastDigest.results?.length || 0} results • {new Date(s.lastDigest.createdAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {}}
                  className="p-2 hover:bg-gray-700 rounded-lg transition"
                  title="Run search"
                >
                  <RefreshCw className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={() => deleteMutation.mutateAsync({ searchId: s.id })}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-8">No saved searches yet. Save a search to get notified when new items match!</p>
        )}
      </div>
    </section>
  )
}
