/**
 * Alerts.tsx — Price alerts dashboard.
 * Powers the /alerts page with active alerts, snapshot history, and trigger status.
 */
import { trpc } from "@/providers/trpc"
import { useAuth } from "@/hooks/useAuth"
import { useState } from "react"
import { AlertTriangle, Bell, Clock, TrendingDown, Loader2, Plus } from "lucide-react"

export function Alerts() {
  const { isAuthenticated } = useAuth()
  const [showNewAlert, setShowNewAlert] = useState(false)
  const [symbol, setSymbol] = useState("")
  const [targetPrice, setTargetPrice] = useState("")
  const [direction, setDirection] = useState<'drop' | 'rise'>('drop')

  // Fetch price alerts
  const { data: alerts, isLoading } = trpc.priceAlerts.list.useQuery(undefined, {
    enabled: isAuthenticated === true,
  })

  // Set alert mutation
  const setAlertMutation = trpc.priceAlerts.set.useMutation({
    onSuccess: () => {
      setSymbol("")
      setTargetPrice("")
      setShowNewAlert(false)
    },
  })

  if (!isAuthenticated) return null

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-gold-400" />
          <h1 className="text-3xl font-bold text-white">Price Alerts</h1>
        </div>
        <button
          onClick={() => setShowNewAlert(!showNewAlert)}
          className="px-4 py-2 bg-gold-500/90 text-black font-semibold rounded-lg hover:bg-gold-400 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Alert
        </button>
      </div>

      {/* New alert form */}
      {showNewAlert && (
        <div className="bg-dark-800/50 border border-gold-500/20 rounded-xl p-4 space-y-4">
          <h3 className="text-lg font-semibold text-white">Create Price Alert</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Symbol (e.g. ABC123)"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="bg-dark-900 border border-gold-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-400"
            />
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as 'drop' | 'rise')}
              className="bg-dark-900 border border-gold-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-400"
            >
              <option value="drop">Price Drops Below</option>
              <option value="rise">Price Rises Above</option>
            </select>
            <input
              type="number"
              placeholder="Target price (SOL)"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="bg-dark-900 border border-gold-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-400"
            />
          </div>
          <button
            onClick={() => setAlertMutation.mutateAsync({ symbol, targetPrice: parseFloat(targetPrice), direction })}
            disabled={setAlertMutation.isPending || !symbol || !targetPrice}
            className="px-6 py-2 bg-emerald-500/90 text-white font-semibold rounded-lg hover:bg-emerald-400 transition disabled:opacity-50"
          >
            {setAlertMutation.isPending ? 'Setting...' : 'Set Alert'}
          </button>
        </div>
      )}

      {/* Active alerts list */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gold-400">
            <Loader2 className="animate-spin w-4 h-4" />
            <span>Loading alerts...</span>
          </div>
        ) : alerts && alerts.length > 0 ? (
          alerts.map((alert: any) => (
            <div key={alert.id} className="bg-dark-800/50 border border-gold-500/20 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${direction === 'drop' ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                  {direction === 'drop'
                    ? <TrendingDown className="w-5 h-5 text-red-400" />
                    : <Bell className="w-5 h-5 text-emerald-400" />}
                </div>
                <div>
                  <p className="text-white font-semibold">{alert.symbol}</p>
                  <p className="text-xs text-gray-500">
                    Alert {direction === 'drop' ? 'below' : 'above'} {alert.targetPrice} SOL • Created {new Date(alert.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${alert.triggered ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-400'}`}>
                  {alert.triggered ? 'TRIGGERED' : 'ACTIVE'}
                </span>
                {alert.lastSnapshot && (
                  <span className="text-xs text-gray-500">
                    Last: {alert.lastSnapshot.currentPrice} SOL
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-8">No active price alerts. Create one to get notified when prices move!</p>
        )}
      </div>
    </section>
  )
}
