"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function DeviceManager() {
  const [devices, setDevices] = useState([
    { id: "1", name: "MacBook Pro", lastActive: "2026-09-08" },
    { id: "2", name: "iPhone 15", lastActive: "2026-09-07" },
  ]);

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Device Manager</h1>
      <div className="space-y-2">
        {devices.map((d) => (
          <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between rounded-xl border border-dark-600 bg-dark-900/60 p-4">
            <span className="text-white">{d.name}</span>
            <span className="text-xs text-gray-400">Last: {d.lastActive}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}