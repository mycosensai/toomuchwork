"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function LoginAlerts() {
  const [alerts, setAlerts] = useState([
    { time: "2026-09-08 10:23", ip: "192.168.1.1", success: true },
    { time: "2026-09-08 09:15", ip: "10.0.0.1", success: false },
  ]);

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Login Alerts</h1>
      <div className="space-y-2">
        {alerts.map((a, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between rounded-xl border border-dark-600 bg-dark-900/60 p-4">
            <span className="text-white">{a.time}</span>
            <span className="text-xs text-gray-400">{a.ip}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${a.success ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>{a.success ? "Success" : "Failed"}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}