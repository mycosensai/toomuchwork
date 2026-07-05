import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { trpc } from '@/providers/trpc'
import {
  MessageSquare, ArrowLeft, Loader2, Pin, Lock,
  Send, Trash2, Diamond
} from 'lucide-react'

export default function ForumPost() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated, isAdmin } = useAuth()
  const [replyContent, setReplyContent] = useState('')

  const { data, isLoading, error } = trpc.forum.getPost.useQuery({ id: Number(id) })
  const replyMutation = trpc.forum.replyToPost.useMutation({
    onSuccess: () => {
      trpc.forum.getPost.invalidate({ id: Number(id) })
      setReplyContent('')
    }
  })
  const deletePost = trpc.forum.deletePost.useMutation({
    onSuccess: () => navigate('/forum')
  })
  const deleteReply = trpc.forum.deletePost.useMutation({
    onSuccess: () => trpc.forum.getPost.invalidate({ id: Number(id) })
  })

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 flex justify-center bg-[#080808]">
        <Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen pt-32 bg-[#080808] text-center">
        <p className="text-[#8A6E2F] text-sm">Post not found</p>
        <Link to="/forum" className="text-[#C9A84C] text-xs hover:underline mt-2 inline-block">
          Back to Forum
        </Link>
      </div>
    )
  }

  const { post, replies } = data

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-[#080808]">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link
          to="/forum"
          className="inline-flex items-center gap-2 text-[10px] tracking-[3px] uppercase text-[#C8BC98] hover:text-[#C9A84C] transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Forum
        </Link>

        {/* Post Header */}
        <div className="bg-[#161616] border border-[#C9A84C]/20 p-6 sm:p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {post.isPinned && <Pin className="w-4 h-4 text-[#C9A84C]" />}
                {post.isLocked && <Lock className="w-4 h-4 text-red-400" />}
                <span className={`px-2 py-0.5 text-[8px] tracking-[2px] uppercase border border-[#C9A84C]/20 text-[#C9A84C]`}>
                  {post.category}
                </span>
              </div>
              <h1 className="font-cinzel text-xl sm:text-2xl font-bold text-[#F5EED8] tracking-[2px]">
                {post.title}
              </h1>
            </div>
            {isAdmin && (
              <button
                onClick={() => { if (confirm('Delete this entire post?')) deletePost.mutate({ id: post.id }) }}
                className="p-2 border border-red-400/20 text-red-400 hover:border-red-400/50 transition-all shrink-0"
                title="Delete post"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Author Info */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#C9A84C]/10">
            <div className="w-8 h-8 rounded-full bg-[#1E1E1E] border border-[#C9A84C]/20 flex items-center justify-center text-xs text-[#C9A84C] font-cinzel overflow-hidden">
              {post.userAvatar ? (
                <img src={post.userAvatar} alt="" className="w-full h-full object-cover" />
              ) : (
                post.userName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <span className="text-xs text-[#F5EED8] font-cinzel">{post.userName}</span>
              <span className="text-[9px] text-[#8A6E2F] ml-3">
                {new Date(post.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </span>
            </div>
          </div>

          {/* Post Content */}
          <div className="text-sm text-[#C8BC98] leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>
        </div>

        {/* Reply Form */}
        {isAuthenticated && !post.isLocked && (
          <div className="bg-[#161616] border border-[#C9A84C]/15 p-5 mb-6">
            <h3 className="font-cinzel text-xs font-semibold tracking-[3px] text-[#C9A84C] uppercase mb-3 flex items-center gap-2">
              <Send className="w-3.5 h-3.5" />
              Post a Reply
            </h3>
            <div className="flex gap-3">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your reply... (links from non-admin users are automatically removed)"
                rows={3}
                className="flex-1 bg-[#1E1E1E] border border-[#C9A84C]/20 px-4 py-3 text-xs text-[#F5EED8] placeholder-[#8A6E2F] focus:border-[#C9A84C]/50 focus:outline-none transition-colors resize-y"
              />
              <button
                onClick={() => {
                  if (!replyContent.trim()) return
                  replyMutation.mutate({ postId: post.id, content: replyContent })
                }}
                disabled={replyMutation.isPending || !replyContent.trim()}
                className="px-5 py-2 bg-gradient-to-br from-[#C9A84C] to-[#8A6E2F] text-[#080808] text-[10px] tracking-[3px] uppercase font-cinzel font-bold hover:shadow-[0_0_30px_rgba(201,168,76,0.3)] transition-all disabled:opacity-50 shrink-0 self-end"
              >
                {replyMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Reply'
                )}
              </button>
            </div>
          </div>
        )}

        {post.isLocked && (
          <div className="bg-red-500/5 border border-red-500/20 p-4 mb-6 text-xs text-red-400 text-center">
            This thread has been locked. No new replies can be added.
          </div>
        )}

        {/* Replies */}
        <div className="space-y-3">
          <h2 className="font-cinzel text-xs font-semibold tracking-[3px] text-[#C9A84C] uppercase mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Replies ({replies.length})
          </h2>

          {replies.length === 0 ? (
            <div className="text-center py-8 text-[#8A6E2F] text-xs">
              No replies yet. Be the first to respond!
            </div>
          ) : (
            replies.map(reply => (
              <div key={reply.id} className="bg-[#161616] border border-[#C9A84C]/10 p-4 hover:border-[#C9A84C]/20 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#1E1E1E] border border-[#C9A84C]/20 flex items-center justify-center text-[10px] text-[#C9A84C] font-cinzel shrink-0 overflow-hidden">
                    {reply.userAvatar ? (
                      <img src={reply.userAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      reply.userName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-[#F5EED8] font-cinzel">{reply.userName}</span>
                      <span className="text-[9px] text-[#8A6E2F]">
                        {new Date(reply.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="text-xs text-[#C8BC98] leading-relaxed whitespace-pre-wrap">
                      {reply.content}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
