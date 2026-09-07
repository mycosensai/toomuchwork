/**
 * AdminAuditLog.tsx — Admin audit log page.
 */
import { trpc } from "@/providers/trpc";
import { useState } from "react";
import { Shield, FileText, Filter, Download } from "lucide-react";

export default function AdminAuditLog() {
  const [filter, setFilter] = useState("all");
  const { data: logs, isLoading } = trpc.auditLog.list.useQuery({ limit: 50, offset: 0 });

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-gold-400" />
        <h1 className="text-3xl font-bold text-white">Audit Log</h1>
      </div>

      <div className="flex gap-2">
        {["all", "login", "logout", "password_reset", "dispute", "content", "payment"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 text-sm rounded-lg capitalize transition ${filter === f ? "bg-gold-500/20 text-gold-400 border border-gold-500/30" : "bg-dark-800 text-gray-400 border border-gray-700"}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="bg-dark-800/50 border border-gold-500/20 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left text-xs text-gray-500 p-3">Time</th>
              <th className="text-left text-xs text-gray-500 p-3">User</th>
              <th className="text-left text-xs text-gray-500 p-3">Action</th>
              <th className="text-left text-xs text-gray-500 p-3">IP</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="p-8 text-center text-gray-500">Loading...</td></tr>
            ) : logs && logs.length > 0 ? (
              logs.map((log: any) => (
                <tr key={log.id} className="border-b border-gray-800 hover:bg-dark-900/50">
                  <td className="p-3 text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="p-3 text-xs text-white">{log.userId}</td>
                  <td className="p-3 text-xs text-gold-400">{log.action}</td>
                  <td className="p-3 text-xs text-gray-500">{log.ip}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="p-8 text-center text-gray-500">No logs found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
