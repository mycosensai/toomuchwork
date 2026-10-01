"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function AuditLog() {
  const [logs] = useState([
    { time: "2026-09-08 10:23", action: "Login", user: "user@example.com", ip: "192.168.1.1" },
    { time: "2026-09-08 09:15", action: "Purchase", user: "user@example.com", ip: "10.0.0.1" },
  ]);

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Audit Log</h1>
      <div className="space-y-2">
        {logs.map((log, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between rounded-xl border border-dark-600 bg-dark-900/60 p-4">
            <span className="text-white">{log.action}</span>
            <span className="text-sm text-gray-400">{log.user}</span>
            <span className="text-xs text-gray-500">{log.time}</span>
            <span className="text-xs text-gray-400">{log.ip}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}