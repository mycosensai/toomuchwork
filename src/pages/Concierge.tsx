import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router'
import { trpc } from '@/providers/trpc'
import {
  Diamond, Send, Loader2, Sparkles, MessageSquare,
  ArrowRight, Search, Wallet, Shield, FileCheck,
  Store, Users, HelpCircle, Bot
} from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'concierge'
  content: string
  recommendations?: Array<{
    id: string
    name: string
    path: string
    reason: string
  }>
}

const QUICK_ACTIONS = [
  { label: 'I want to sell jewelry worth ~$5K', icon: <Store className="w-4 h-4" /> },
  { label: 'I found an antique — what is it worth?', icon: <Search className="w-4 h-4" /> },
  { label: 'I want to buy a luxury watch under $10K', icon: <Wallet className="w-4 h-4" /> },
  { label: 'How do I verify authenticity?', icon: <Shield className="w-4 h-4" /> },
]

export default function Concierge() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'concierge',
      content: "Welcome to **The Vault DFW** — your elite collector exchange. 👋\n\nTell me what you're looking to do, and I'll guide you to the perfect service. Here are some examples to get started:",
      recommendations: [
        { id: 'browse', name: 'Browse Collection', path: '/browse', reason: 'Shop rare items' },
        { id: 'sell', name: 'Sell an Item', path: '/sell', reason: 'List your collectibles' },
        { id: 'appraisal', name: 'AI Appraisal', path: '/appraisal', reason: 'Know your item value' },
      ],
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const conciergeChat = trpc.concierge.chat.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [
        ...prev,
        {
          role: 'concierge',
          content: data.message,
          recommendations: data.recommendations,
        },
      ])
      setIsLoading(false)
    },
    onError: () => {
      setMessages(prev => [
        ...prev,
        {
          role: 'concierge',
          content: "I'm having trouble connecting right now. Please try again or contact support at ratchetkrewelabs@gmail.com",
        },
      ])
      setIsLoading(false)
    },
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (text: string) => {
    const msg = text.trim()
    if (!msg || isLoading) return

    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setInput('')
    setIsLoading(true)
    conciergeChat.mutate({ message: msg })
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-[#080808]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 border border-[#C9A84C] rotate-45 flex items-center justify-center mx-auto mb-4">
            <Bot className="w-7 h-7 text-[#C9A84C] -rotate-45" />
          </div>
          <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#F5EED8] tracking-[4px]">
            The Concierge
          </h1>
          <p className="text-xs text-[#8A6E2F] mt-2 tracking-[2px] uppercase">
            AI-powered site directory & service guide
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-2">
            <div className="bg-[#161616] border border-[#C9A84C]/15 flex flex-col h-[600px]">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    {msg.role === 'concierge' && (
                      <div className="w-8 h-8 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center shrink-0 mt-1">
                        <Bot className="w-4 h-4 text-[#C9A84C]" />
                      </div>
                    )}
                    <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                      <div
                        className={`p-4 ${
                          msg.role === 'user'
                            ? 'bg-[#C9A84C]/10 border border-[#C9A84C]/20'
                            : 'bg-[#1E1E1E] border border-[#C9A84C]/10'
                        }`}
                      >
                        <div className="text-sm text-[#C8BC98] leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </div>
                      </div>

                      {/* Recommendations */}
                      {msg.recommendations && msg.recommendations.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {msg.recommendations.map((rec) => (
                            <Link
                              key={rec.id}
                              to={rec.path}
                              className="flex items-center justify-between p-3 bg-[#1E1E1E] border border-[#C9A84C]/20 hover:border-[#C9A84C]/50 hover:bg-[#C9A84C]/5 transition-all group"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-cinzel text-xs font-semibold text-[#C9A84C] tracking-[1px] flex items-center gap-2">
                                  <Sparkles className="w-3 h-3" />
                                  {rec.name}
                                </div>
                                <div className="text-[10px] text-[#8A6E2F] mt-0.5">{rec.reason}</div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-[#C9A84C] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-[#C9A84C]" />
                    </div>
                    <div className="bg-[#1E1E1E] border border-[#C9A84C]/10 p-4">
                      <Loader2 className="w-5 h-5 text-[#C9A84C] animate-spin" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-[#C9A84C]/15 p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend(input)
                      }
                    }}
                    placeholder="Tell me what you're looking for..."
                    className="flex-1 bg-[#1E1E1E] border border-[#C9A84C]/20 px-4 py-3 text-xs text-[#F5EED8] placeholder-[#8A6E2F] focus:border-[#C9A84C]/50 focus:outline-none transition-colors"
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => handleSend(input)}
                    disabled={isLoading || !input.trim()}
                    className="px-4 py-3 bg-gradient-to-br from-[#C9A84C] to-[#8A6E2F] text-[#080808] disabled:opacity-50 transition-all"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Directory & Quick Actions */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="bg-[#161616] border border-[#C9A84C]/15 p-5">
              <h3 className="font-cinzel text-[10px] font-semibold tracking-[3px] text-[#C9A84C] uppercase mb-3 flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5" />
                Quick Questions
              </h3>
              <div className="space-y-2">
                {QUICK_ACTIONS.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(action.label)}
                    disabled={isLoading}
                    className="w-full text-left p-3 bg-[#1E1E1E] border border-[#C9A84C]/10 hover:border-[#C9A84C]/30 transition-all text-[11px] text-[#C8BC98] flex items-center gap-2 disabled:opacity-50"
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Site Directory */}
            <div className="bg-[#161616] border border-[#C9A84C]/15 p-5">
              <h3 className="font-cinzel text-[10px] font-semibold tracking-[3px] text-[#C9A84C] uppercase mb-3 flex items-center gap-2">
                <Search className="w-3.5 h-3.5" />
                Site Directory
              </h3>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {[
                  { name: 'Browse', path: '/browse', icon: <Store className="w-3.5 h-3.5" /> },
                  { name: 'Sell', path: '/sell', icon: <Wallet className="w-3.5 h-3.5" /> },
                  { name: 'Appraisal', path: '/appraisal', icon: <Search className="w-3.5 h-3.5" /> },
                  { name: 'ProVerify', path: '/proverify', icon: <Shield className="w-3.5 h-3.5" /> },
                  { name: 'Tokens', path: '/token-gallery', icon: <Diamond className="w-3.5 h-3.5" /> },
                  { name: 'Forum', path: '/forum', icon: <MessageSquare className="w-3.5 h-3.5" /> },
                  { name: 'Agents', path: '/agents', icon: <Bot className="w-3.5 h-3.5" /> },
                  { name: 'Support', path: '/support', icon: <HelpCircle className="w-3.5 h-3.5" /> },
                ].map(item => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className="flex items-center gap-2 py-2 px-2 text-xs text-[#C8BC98] hover:text-[#C9A84C] hover:bg-[#1E1E1E] transition-all"
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
