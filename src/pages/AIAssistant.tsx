/**
 * AIAssistant.tsx — Floating AI assistant widget + page.
 * Powers the /ai page with a chat interface for AI recommendations.
 */
import { trpc } from "@/providers/trpc"
import { useState } from "react"
import { Brain, Sparkles, Send, Loader2, Zap, TrendingUp, BarChart3 } from "lucide-react"

export function AIAssistant() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // AI assistant chat
  const askMutation = trpc.aiAssistant.ask.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response || 'I analyzed the market and found some insights.' }])
      setIsLoading(false)
    },
    onError: () => {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'I encountered an error. Please try again.' }])
      setIsLoading(false)
    },
  })

  const handleSend = () => {
    if (!input.trim()) return
    setMessages((prev) => [...prev, { role: 'user', content: input }])
    setInput("")
    setIsLoading(true)
    askMutation.mutateAsync({ query: input })
  }

  // Quick actions
  const quickActions = [
    { label: 'Market Overview', icon: BarChart3, query: 'What is the current market overview?' },
    { label: 'Price Alerts', icon: TrendingUp, query: 'Set price alerts for trending items' },
    { label: 'Recommendations', icon: Sparkles, query: 'What items match my collection?' },
    { label: 'Bid Strategy', icon: Zap, query: 'What bid strategy should I use?' },
  ]

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <Brain className="w-6 h-6 text-gold-400" />
        <h1 className="text-3xl font-bold text-white">AI Assistant</h1>
      </div>

      <p className="text-gray-400">Ask the AI anything about the marketplace, pricing, or strategy.</p>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => {
              setMessages((prev) => [...prev, { role: 'user', content: action.query }])
              setIsLoading(true)
              askMutation.mutateAsync({ query: action.query })
            }}
            disabled={askMutation.isPending}
            className="bg-dark-800/50 border border-gold-500/20 rounded-xl p-4 text-center hover:border-gold-400/40 transition disabled:opacity-50"
          >
            <action.icon className="w-6 h-6 text-gold-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">{action.label}</p>
          </button>
        ))}
      </div>

      {/* Chat window */}
      <div className="bg-dark-800/50 border border-gold-500/20 rounded-xl overflow-hidden">
        <div className="h-64 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-gray-500 text-center py-8">Start a conversation or pick a quick action above.</p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl p-3 ${
                msg.role === 'user' ? 'bg-gold-500/20 border border-gold-500/30 text-white' :
                'bg-dark-900 border border-gray-700 text-gray-300'
              }`}>
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-dark-900 border border-gray-700 rounded-xl p-3">
                <Loader2 className="animate-spin w-4 h-4 text-gold-400" />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-700 p-4 flex gap-2">
          <input
            type="text"
            placeholder="Ask the AI anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-dark-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-400"
          />
          <button
            onClick={handleSend}
            disabled={askMutation.isPending || !input.trim()}
            className="px-4 py-3 bg-gold-500/90 text-black rounded-lg hover:bg-gold-400 transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  )
}
