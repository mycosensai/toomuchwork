"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AgentStatusPage() {
  const [status, setStatus] = useState("active");
  const [logs, setLogs] = useState([
    { time: "10:23", agent: "Appraiser", action: "Completed appraisal #4821", status: "success" },
    { time: "10:19", agent: "ProVerify", action: "Verification started for #3910", status: "info" },
    { time: "10:15", agent: "Concierge", action: "Response sent to buyer", status: "success" },
  ]);

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Agent Status</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["active", "idle", "processing"].map((s) => (
          <motion.div key={s} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl border p-4 ${s === status ? "border-gold-500 bg-gold-500/10" : "border-dark-600 bg-dark-900/60"}`}>
            <p className="text-white font-semibold capitalize">{s}</p>
            <p className="text-sm text-gray-400">{s === "active" ? "Currently processing requests" : s === "idle" ? "Waiting for tasks" : "Running analysis"}</p>
          </motion.div>
        ))}
      </div>
      <div className="rounded-xl border border-dark-600 bg-dark-900/60 p-4">
        <h2 className="text-white font-semibold mb-2">Activity Log</h2>
        <AnimatePresence>
          {logs.map((log, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 py-2 border-b border-dark-700 last:border-0">
              <span className="text-xs text-gray-500 w-12">{log.time}</span>
              <span className="text-sm text-white">{log.agent}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${log.status === "success" ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"}`}>{log.status}</span>
              <span className="text-sm text-gray-400">{log.action}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}