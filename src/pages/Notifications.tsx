/**
 * Notifications.tsx — In-app notification center.
 * Powers the /notifications page with inbox, filtering, and mark-as-read.
 */
import { trpc } from "@/providers/trpc"
import { useAuth } from "@/hooks/useAuth"
import { useState } from "react"
import { Bell, Check, X, Mail, AlertTriangle, Gavel, Crown, Loader2 } from "lucide-react"

const TYPE_ICONS: Record<string, React.ReactNode> = {
  offer: <Gavel className="w-4 h-4 text-gold-400" />,
  alert: <AlertTriangle className="w-4 h-4 text-red-400" />,
  payout: <Crown className="w-4 h-4 text-emerald-400" />,
  bid: <Gavel className="w-4 h-4 text-blue-400" />,
  message: <Mail className="w-4 h-4 text-purple-400" />,
  membership: <Crown className="w-4 h-4 text-gold-400" />,
}

export function Notifications() {
  const { isAuthenticated } = useAuth()
  const [filter, setFilter] = useState<string>('all')

  // Fetch notifications
  const { data: notifications, isLoading } = trpc.notifications.list.useQuery(undefined, {
    enabled: isAuthenticated === true,
  })

  // Mark as read mutation
  const markReadMutation = trpc.notifications.markRead.useMutation()
  const markAllMutation = trpc.notifications.markAllRead.useMutation()

  if (!isAuthenticated) return null

  const filtered = filter === 'all'
    ? notifications
    : notifications?.filter((n: any) => n.type === filter)

  const unreadCount = notifications?.filter((n: any) => !n.read).length || 0

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-gold-400" />
          <h1 className="text-3xl font-bold text-white">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-gold-500/20 text-gold-400 text-xs px-2 py-1 rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllMutation.mutateAsync({})}
            disabled={markAllMutation.isPending}
            className="px-4 py-2 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-600 transition"
          >
            {markAllMutation.isPending ? 'Marking...' : 'Mark all read'}
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['all', 'offer', 'alert', 'payout', 'bid', 'message', 'membership'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-sm rounded-lg capitalize transition ${filter === f ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30' : 'bg-dark-800 text-gray-400 border border-gray-700 hover:border-gray-600'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gold-400">
            <Loader2 className="animate-spin w-4 h-4" />
            <span>Loading notifications...</span>
          </div>
        ) : filtered && filtered.length > 0 ? (
          filtered.map((n: any) => (
            <div
              key={n.id}
              className={`bg-dark-800/50 border rounded-xl p-4 flex items-start gap-4 ${n.read ? 'border-gray-700' : 'border-gold-500/20'} hover:border-gray-600 transition`}
            >
              <div className="mt-1">{TYPE_ICONS[n.type] || <Bell className="w-4 h-4 text-gray-500" />}</div>
              <div className="flex-1">
                <p className={`text-sm ${n.read ? 'text-gray-500' : 'text-white'}`}>{n.title || n.message}</p>
                <p className="text-xs text-gray-500 mt-1">{n.message?.slice(0, 120) || n.description?.slice(0, 120)}</p>
                <p className="text-xs text-gray-600 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              {!n.read && (
                <button
                  onClick={() => markReadMutation.mutateAsync({ notificationId: n.id })}
                  className="flex-shrink-0 p-1 hover:bg-gray-700 rounded transition"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-8">No notifications found.</p>
        )}
      </div>
    </section>
  )
}
