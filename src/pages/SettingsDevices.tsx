/**
 * SettingsDevices.tsx — Device & session management.
 */
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Trash2, Monitor, Smartphone, Clock, AlertTriangle } from "lucide-react";

export default function SettingsDevices() {
  const { isAuthenticated } = useAuth();
  const { data: sessions, isLoading } = trpc.session.list.useQuery(undefined, { enabled: isAuthenticated });
  const revokeAllMutation = trpc.session.revokeAll.useMutation();

  if (!isAuthenticated) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <Monitor className="w-6 h-6 text-gold-400" />
        <h1 className="text-3xl font-bold text-white">Sessions</h1>
      </div>

      <p className="text-gray-400">Manage your active sessions and logged-in devices.</p>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gold-400"><Loader2 className="animate-spin w-5 h-5" /> Loading...</div>
        ) : sessions && sessions.length > 0 ? (
          sessions.map((s: any) => (
            <div key={s.id} className="bg-dark-800/50 border border-gold-500/20 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gold-500/10 rounded-lg"><Smartphone className="w-5 h-5 text-gold-400" /></div>
                <div>
                  <p className="text-white font-semibold">{s.deviceInfo || "Unknown Device"}</p>
                  <p className="text-xs text-gray-500">{s.ipAddress} • {s.createdAt ? new Date(s.createdAt).toLocaleString() : "Unknown"}</p>
                </div>
              </div>
              {!s.isCurrent && (
                <button className="p-2 hover:bg-red-500/20 rounded-lg transition"><Trash2 className="w-4 h-4 text-red-400" /></button>
              )}
              {s.isCurrent && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">Current</span>}
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-8">No active sessions.</p>
        )}
      </div>

      <button onClick={() => revokeAllMutation.mutateAsync({})} disabled={revokeAllMutation.isPending} className="w-full px-4 py-3 bg-red-500/90 text-white font-semibold rounded-lg hover:bg-red-400 transition disabled:opacity-50">
        {revokeAllMutation.isPending ? "Revoking..." : "Revoke All Other Sessions"}
      </button>
    </section>
  );
}
