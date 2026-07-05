import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { trpc } from '@/providers/trpc'
import {
  MessageSquare, Plus, Pin, Lock, ArrowUp,
  Loader2, Search, Diamond, ChevronDown, Eye
} from 'lucide-react'

const CATEGORIES = [
  { id: 'general', label: 'General', color: 'text-[#C9A84C]' },
  { id: 'collectors', label: 'Collectors Corner', color: 'text-blue-400' },
  { id: 'trading', label: 'Trading & Sales', color: 'text-emerald-400' },
  { id: 'appraisals', label: 'Appraisal Discussion', color: 'text-purple-400' },
  { id: 'announcements', label: 'Announcements', color: 'text-red-400' },
]

export default function Forum() {
  const { user, isAuthenticated, isAdmin } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeCategory = searchParams.get('category') || ''
  const [page, setPage] = useState(1)
  const [showNewPost, setShowNewPost] = useState(false)
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'general' })

  const { data, isLoading } = trpc.forum.listPosts.useQuery({
    category: activeCategory || undefined,
    page,
    limit: 20,
  })

  const { data: categories } = trpc.forum.listCategories.useQuery()
  const createPost = trpc.forum.createPost.useMutation({
    onSuccess: () => {
      trpc.forum.listPosts.invalidate()
      trpc.forum.listCategories.invalidate()
      setShowNewPost(false)
      setNewPost({ title: '', content: '', category: 'general' })
    }
  })

  const togglePin = trpc.forum.togglePin.useMutation({
    onSuccess: () => trpc.forum.listPosts.invalidate()
  })

  const toggleLock = trpc.forum.toggleLock.useMutation({
    onSuccess: () => trpc.forum.listPosts.invalidate()
  })

  const deletePost = trpc.forum.deletePost.useMutation({
    onSuccess: () => trpc.forum.listPosts.invalidate()
  })

  const handleCategoryFilter = (cat: string) => {
    if (cat === activeCategory) {
      setSearchParams({})
    } else if (cat) {
      setSearchParams({ category: cat })
    } else {
      setSearchParams({})
    }
    setPage(1)
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-[#080808]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#F5EED8] tracking-[4px] flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-[#C9A84C]" />
              Community Forum
            </h1>
            <p className="text-xs text-[#8A6E2F] mt-1 tracking-[1px]">
              Connect with fellow collectors
            </p>
          </div>
          {isAuthenticated && (
            <button
              onClick={() => setShowNewPost(!showNewPost)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#C9A84C] to-[#8A6E2F] text-[#080808] text-[10px] tracking-[3px] uppercase font-cinzel font-bold hover:shadow-[0_0_30px_rgba(201,168,76,0.3)] transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              New Post
            </button>
          )}
        </div>

        {/* New Post Form */}
        {showNewPost && (
          <div className="bg-[#161616] border border-[#C9A84C]/25 p-6 mb-8">
            <h2 className="font-cinzel text-xs font-semibold tracking-[3px] text-[#C9A84C] uppercase mb-4">Create New Post</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Post title..."
                value={newPost.title}
                onChange={(e) => setNewPost(p => ({ ...p, title: e.target.value }))}
                className="w-full bg-[#1E1E1E] border border-[#C9A84C]/20 px-4 py-3 text-xs text-[#F5EED8] placeholder-[#8A6E2F] focus:border-[#C9A84C]/50 focus:outline-none transition-colors"
              />
              <select
                value={newPost.category}
                onChange={(e) => setNewPost(p => ({ ...p, category: e.target.value }))}
                className="w-full bg-[#1E1E1E] border border-[#C9A84C]/20 px-4 py-3 text-xs text-[#F5EED8] focus:border-[#C9A84C]/50 focus:outline-none transition-colors"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
              <textarea
                placeholder="Write your post... (links from non-admin users are automatically removed)"
                value={newPost.content}
                onChange={(e) => setNewPost(p => ({ ...p, content: e.target.value }))}
                rows={6}
                className="w-full bg-[#1E1E1E] border border-[#C9A84C]/20 px-4 py-3 text-xs text-[#F5EED8] placeholder-[#8A6E2F] focus:border-[#C9A84C]/50 focus:outline-none transition-colors resize-y"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    if (!newPost.title.trim() || !newPost.content.trim()) return
                    createPost.mutate(newPost)
                  }}
                  disabled={createPost.isPending || !newPost.title.trim() || !newPost.content.trim()}
                  className="px-6 py-2.5 bg-gradient-to-br from-[#C9A84C] to-[#8A6E2F] text-[#080808] text-[10px] tracking-[3px] uppercase font-cinzel font-bold hover:shadow-[0_0_30px_rgba(201,168,76,0.3)] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {createPost.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  Publish Post
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => handleCategoryFilter('')}
            className={`px-3 py-1.5 text-[9px] tracking-[2px] uppercase font-cinzel border transition-all ${
              !activeCategory
                ? 'border-[#C9A84C] text-[#C9A84C] bg-[#C9A84C]/10'
                : 'border-[#C9A84C]/20 text-[#8A6E2F] hover:border-[#C9A84C]/50'
            }`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryFilter(cat.id)}
              className={`px-3 py-1.5 text-[9px] tracking-[2px] uppercase font-cinzel border transition-all ${
                activeCategory === cat.id
                  ? 'border-[#C9A84C] text-[#C9A84C] bg-[#C9A84C]/10'
                  : 'border-[#C9A84C]/20 text-[#8A6E2F] hover:border-[#C9A84C]/50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Posts List */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" />
          </div>
        ) : !data?.posts.length ? (
          <div className="text-center py-16">
            <MessageSquare className="w-12 h-12 text-[#C9A84C]/30 mx-auto mb-4" />
            <p className="text-sm text-[#8A6E2F] font-cinzel tracking-[2px]">No posts yet</p>
            {isAuthenticated && (
              <button
                onClick={() => setShowNewPost(true)}
                className="mt-4 text-xs text-[#C9A84C] hover:underline"
              >
                Be the first to post
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {data.posts.map(post => (
              <div
                key={post.id}
                className={`bg-[#161616] border ${post.isPinned ? 'border-[#C9A84C]/40' : 'border-[#C9A84C]/10'} hover:border-[#C9A84C]/30 transition-all`}
              >
                <Link to={`/forum/${post.id}`} className="block p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        {post.isPinned && <Pin className="w-3 h-3 text-[#C9A84C]" />}
                        {post.isLocked && <Lock className="w-3 h-3 text-red-400" />}
                        <h3 className="font-cinzel text-sm font-semibold text-[#F5EED8] truncate tracking-[1px]">
                          {post.title}
                        </h3>
                      </div>
                      <p className="text-xs text-[#8A6E2F] line-clamp-2 mb-2">{post.content}</p>
                      <div className="flex items-center gap-4 text-[9px] text-[#6A5E2F] tracking-[1px]">
                        <span>By {post.userName}</span>
                        <span className={`px-2 py-0.5 border border-[#C9A84C]/20 ${
                          CATEGORIES.find(c => c.id === post.category)?.color || 'text-[#C9A84C]'
                        }`}>
                          {CATEGORIES.find(c => c.id === post.category)?.label || post.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {post.replyCount}
                        </span>
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1 shrink-0" onClick={(e) => e.preventDefault()}>
                        <button
                          onClick={() => togglePin.mutate({ id: post.id })}
                          className={`p-1.5 border border-[#C9A84C]/20 hover:border-[#C9A84C]/50 transition-all ${
                            post.isPinned ? 'text-[#C9A84C]' : 'text-[#8A6E2F]'
                          }`}
                          title={post.isPinned ? 'Unpin' : 'Pin'}
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => toggleLock.mutate({ id: post.id })}
                          className={`p-1.5 border border-[#C9A84C]/20 hover:border-[#C9A84C]/50 transition-all ${
                            post.isLocked ? 'text-red-400' : 'text-[#8A6E2F]'
                          }`}
                          title={post.isLocked ? 'Unlock' : 'Lock'}
                        >
                          <Lock className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => { if (confirm('Delete this post?')) deletePost.mutate({ id: post.id }) }}
                          className="p-1.5 border border-red-400/20 text-red-400 hover:border-red-400/50 transition-all"
                          title="Delete"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: Math.min(data.totalPages, 10) }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 text-[10px] font-cinzel tracking-[2px] border transition-all ${
                  p === page
                    ? 'border-[#C9A84C] text-[#C9A84C] bg-[#C9A84C]/10'
                    : 'border-[#C9A84C]/20 text-[#8A6E2F] hover:border-[#C9A84C]/50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
