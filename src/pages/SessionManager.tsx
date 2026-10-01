"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function SessionManager() {
  const [sessions, setSessions] = useState([
    { id: "1", device: "Chrome / Windows", ip: "192.168.1.1", active: true },
    { id: "2", device: "Safari / iPhone", ip: "10.0.0.1", active: false },
  ]);

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Session Manager</h1>
      <div className="space-y-2">
        {sessions.map((s) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between rounded-xl border border-dark-600 bg-dark-900/60 p-4">
            <span className="text-white">{s.device}</span>
            <span className="text-xs text-gray-400">{s.ip}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${s.active ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-500/20 text-gray-400"}`}>{s.active ? "Active" : "Expired"}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}