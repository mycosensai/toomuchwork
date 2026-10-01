"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("7d");
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Analytics</h1>
      <div className="flex gap-2">
        {["7d", "30d", "90d"].map((p) => (
          <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 rounded-lg text-sm ${period === p ? "bg-gold-600 text-white" : "bg-dark-800 text-gray-400"}`}>{p}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-4">
          <p className="text-gray-400 text-sm">Views</p>
          <p className="text-2xl text-white">128,492</p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-4">
          <p className="text-gray-400 text-sm">Sales</p>
          <p className="text-2xl text-white">342</p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-4">
          <p className="text-gray-400 text-sm">Revenue</p>
          <p className="text-2xl text-white">$12,847</p>
        </motion.div>
      </div>
    </section>
  );
}