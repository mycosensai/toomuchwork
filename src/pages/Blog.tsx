/**
 * Blog.tsx — Editorial blog / articles.
 * Powers the /blog page.
 */
import { trpc } from "@/providers/trpc"
import { useAuth } from "@/hooks/useAuth"
import { Loader2, Newspaper, Calendar, Clock, Tag } from "lucide-react"

export function Blog() {
  const { isAuthenticated } = useAuth()

  // Fetch editorial articles
  const { data: articles, isLoading } = trpc.editorial.list.useQuery(undefined, {
    enabled: isAuthenticated === true,
  })

  if (!isAuthenticated) return null

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <Newspaper className="w-6 h-6 text-gold-400" />
        <h1 className="text-3xl font-bold text-white">The Vault Journal</h1>
      </div>

      <p className="text-gray-400">Expert insights, market analysis, and collector stories from the editorial team.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gold-400 col-span-full">
            <Loader2 className="animate-spin w-5 h-5" />
            <span>Loading articles...</span>
          </div>
        ) : articles && articles.length > 0 ? (
          articles.map((a: any) => (
            <div key={a.id} className="bg-dark-800/50 border border-gold-500/20 rounded-xl overflow-hidden hover:border-gold-400/40 transition group cursor-pointer">
              <div className="h-40 bg-gradient-to-br from-gold-500/10 to-dark-900 flex items-center justify-center">
                <Newspaper className="w-12 h-12 text-gold-400/30 group-hover:text-gold-400/60 transition" />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <Tag className="w-3 h-3" />
                  <span>{a.category || 'General'}</span>
                  <span>•</span>
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-gold-400 transition">{a.title}</h3>
                <p className="text-sm text-gray-400 line-clamp-3">{a.excerpt || a.content?.slice(0, 120) || 'Read more...'}</p>
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{a.readTime || '5 min read'}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 col-span-full text-center py-8">No articles published yet. Stay tuned!</p>
        )}
      </div>
    </section>
  )
}
