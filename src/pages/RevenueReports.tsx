"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function RevenueReports() {
  const [period, setPeriod] = useState("7d");
  const [revenue] = useState(12470);
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Revenue Reports</h1>
      <div className="flex gap-2">
        {["7d", "30d", "90d"].map((p) => (
          <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 rounded-lg text-sm ${period === p ? "bg-gold-600 text-white" : "bg-dark-800 text-gray-400"}`}>{p}</button>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-6">
        <p className="text-gray-400 text-sm">Total Revenue</p>
        <p className="text-3xl text-gold-400">${revenue.toLocaleString()}</p>
      </motion.div>
    </section>
  );
}