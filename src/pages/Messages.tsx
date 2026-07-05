import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { trpc } from '@/providers/trpc'
import {
  Mail, Send, Inbox, Loader2, MessageSquare, Reply,
  Trash2, ArrowLeft, Diamond, ChevronDown
} from 'lucide-react'
import { Link } from 'react-router'

export default function Messages() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [activeView, setActiveView] = useState<'inbox' | 'outbox' | 'compose'>('inbox')
  const [selectedMsg, setSelectedMsg] = useState<any>(null)
  const [replyText, setReplyText] = useState('')
  const [composeForm, setComposeForm] = useState({ recipientEmail: '', subject: '', body: '' })

  const { data: inbox, isLoading: inboxLoading } = trpc.messages.inbox.useQuery(
    { page: 1, limit: 50 },
    { enabled: isAuthenticated && activeView === 'inbox' }
  )
  const { data: outbox } = trpc.messages.outbox.useQuery(
    { page: 1, limit: 50 },
    { enabled: isAuthenticated && activeView === 'outbox' }
  )
  const { data: unreadCount } = trpc.messages.unreadCount.useQuery(
    undefined,
    { enabled: isAuthenticated }
  )

  const markRead = trpc.messages.markRead.useMutation({
    onSuccess: () => {
      trpc.messages.inbox.invalidate()
      trpc.messages.unreadCount.invalidate()
    }
  })
  const deleteMsg = trpc.messages.delete.useMutation({
    onSuccess: () => {
      trpc.messages.inbox.invalidate()
      trpc.messages.outbox.invalidate()
      setSelectedMsg(null)
    }
  })
  const replyMutation = trpc.messages.reply.useMutation({
    onSuccess: () => {
      trpc.messages.inbox.invalidate()
      trpc.messages.outbox.invalidate()
      setReplyText('')
    }
  })

  if (authLoading) {
    return (
      <div className="min-h-screen pt-32 flex justify-center bg-[#080808]">
        <Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-32 bg-[#080808] text-center">
        <p className="text-[#8A6E2F] text-sm">Sign in to view messages</p>
        <Link to="/login" className="text-[#C9A84C] text-xs hover:underline mt-2 inline-block">
          Sign In
        </Link>
      </div>
    )
  }

  const msgs = activeView === 'inbox' ? inbox?.messages : outbox?.messages

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-[#080808]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#F5EED8] tracking-[4px] flex items-center gap-3">
            <Mail className="w-6 h-6 text-[#C9A84C]" />
            Messages
            {unreadCount && unreadCount.count > 0 && (
              <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5">
                {unreadCount.count} unread
              </span>
            )}
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[#C9A84C]/15">
          {[
            { id: 'inbox', label: 'Inbox', icon: <Inbox className="w-4 h-4" /> },
            { id: 'outbox', label: 'Sent', icon: <Send className="w-4 h-4" /> },
            { id: 'compose', label: 'New Message', icon: <MessageSquare className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveView(tab.id as any); setSelectedMsg(null) }}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs tracking-[2px] uppercase font-cinzel font-semibold transition-all border-b-2 ${
                activeView === tab.id
                  ? 'border-[#C9A84C] text-[#C9A84C]'
                  : 'border-transparent text-[#8A6E2F] hover:text-[#C9A84C]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Compose View */}
        {activeView === 'compose' && (
          <div className="bg-[#161616] border border-[#C9A84C]/25 p-6">
            <h2 className="font-cinzel text-xs font-semibold tracking-[3px] text-[#C9A84C] uppercase mb-4">New Message</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[9px] tracking-[3px] uppercase text-[#C9A84C] mb-2">Recipient Email</label>
                <input
                  type="text"
                  placeholder="user@example.com"
                  value={composeForm.recipientEmail}
                  onChange={(e) => setComposeForm(f => ({ ...f, recipientEmail: e.target.value }))}
                  className="w-full bg-[#1E1E1E] border border-[#C9A84C]/20 px-4 py-3 text-xs text-[#F5EED8] placeholder-[#8A6E2F] focus:border-[#C9A84C]/50 focus:outline-none transition-colors"
                />
              </div>
              <input
                type="text"
                placeholder="Subject"
                value={composeForm.subject}
                onChange={(e) => setComposeForm(f => ({ ...f, subject: e.target.value }))}
                className="w-full bg-[#1E1E1E] border border-[#C9A84C]/20 px-4 py-3 text-xs text-[#F5EED8] placeholder-[#8A6E2F] focus:border-[#C9A84C]/50 focus:outline-none transition-colors"
              />
              <textarea
                placeholder="Your message..."
                value={composeForm.body}
                onChange={(e) => setComposeForm(f => ({ ...f, body: e.target.value }))}
                rows={6}
                className="w-full bg-[#1E1E1E] border border-[#C9A84C]/20 px-4 py-3 text-xs text-[#F5EED8] placeholder-[#8A6E2F] focus:border-[#C9A84C]/50 focus:outline-none transition-colors resize-y"
              />
              <div className="flex justify-end">
                <button
                  className="px-6 py-2.5 bg-gradient-to-br from-[#C9A84C] to-[#8A6E2F] text-[#080808] text-[10px] tracking-[3px] uppercase font-cinzel font-bold hover:shadow-[0_0_30px_rgba(201,168,76,0.3)] transition-all"
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Message Detail */}
        {selectedMsg ? (
          <div className="bg-[#161616] border border-[#C9A84C]/15 p-6">
            <button
              onClick={() => setSelectedMsg(null)}
              className="flex items-center gap-2 text-[10px] tracking-[3px] uppercase text-[#C8BC98] hover:text-[#C9A84C] transition-colors mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to {activeView === 'inbox' ? 'Inbox' : 'Sent'}
            </button>
            <div className="border-b border-[#C9A84C]/10 pb-4 mb-4">
              <h2 className="font-cinzel text-sm font-semibold text-[#F5EED8] tracking-[1px] mb-2">{selectedMsg.subject}</h2>
              <div className="flex items-center gap-3 text-[10px] text-[#8A6E2F]">
                <span>From: {selectedMsg.senderName}</span>
                <span>To: {selectedMsg.recipientName}</span>
                <span>{new Date(selectedMsg.createdAt).toLocaleString()}</span>
              </div>
            </div>
            <div className="text-sm text-[#C8BC98] leading-relaxed whitespace-pre-wrap mb-6">
              {selectedMsg.body}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!replyText.trim()) return
                  replyMutation.mutate({ parentMessageId: selectedMsg.id, body: replyText })
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#C9A84C] to-[#8A6E2F] text-[#080808] text-[10px] tracking-[3px] uppercase font-cinzel font-bold"
              >
                <Reply className="w-3.5 h-3.5" />
                Reply
              </button>
              <button
                onClick={() => { if (confirm('Delete this message?')) deleteMsg.mutate({ id: selectedMsg.id }) }}
                className="flex items-center gap-2 px-4 py-2 border border-red-400/20 text-red-400 text-[10px] tracking-[3px] uppercase font-cinzel"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
            <div className="mt-4">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                rows={3}
                className="w-full bg-[#1E1E1E] border border-[#C9A84C]/20 px-4 py-3 text-xs text-[#F5EED8] placeholder-[#8A6E2F] focus:border-[#C9A84C]/50 focus:outline-none transition-colors resize-y"
              />
            </div>
          </div>
        ) : (
          /* Message List */
          <div className="space-y-2">
            {!msgs?.length ? (
              <div className="text-center py-12 text-[#8A6E2F] text-xs">
                {activeView === 'inbox' ? 'No messages in your inbox' : 'No sent messages'}
              </div>
            ) : (
              msgs.map(msg => (
                <div
                  key={msg.id}
                  onClick={() => {
                    if (activeView === 'inbox' && !msg.isRead) markRead.mutate({ id: msg.id })
                    setSelectedMsg(msg)
                  }}
                  className={`bg-[#161616] border border-[#C9A84C]/10 hover:border-[#C9A84C]/30 transition-all p-4 cursor-pointer ${
                    !msg.isRead && activeView === 'inbox' ? 'border-l-[#C9A84C] border-l-2' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-cinzel text-xs font-semibold text-[#F5EED8]">
                          {activeView === 'inbox' ? msg.senderName : msg.recipientName}
                        </span>
                        {!msg.isRead && activeView === 'inbox' && (
                          <span className="text-[8px] bg-[#C9A84C]/20 text-[#C9A84C] px-1.5 py-0.5">NEW</span>
                        )}
                      </div>
                      <h3 className="text-xs text-[#C8BC98] font-medium mb-1 truncate">{msg.subject}</h3>
                      <p className="text-[11px] text-[#8A6E2F] truncate">{msg.body}</p>
                    </div>
                    <span className="text-[9px] text-[#6A5E2F] shrink-0 ml-4">
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
