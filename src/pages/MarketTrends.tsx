"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function MarketTrends() {
  const [trends] = useState([
    { category: "Luxury Watches", trend: "up", change: "+12%" },
    { category: "Fine Art", trend: "down", change: "-5%" },
    { category: "Rare Coins", trend: "up", change: "+8%" },
  ]);
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Market Trends</h1>
      <div className="space-y-2">
        {trends.map((t, i) => (
          <motion.div key={t.category} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center justify-between rounded-xl border border-dark-600 bg-dark-900/60 p-4">
            <span className="text-white">{t.category}</span>
            <span className={`text-sm ${t.trend === "up" ? "text-emerald-400" : "text-red-400"}`}>{t.change}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}