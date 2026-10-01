"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function ABTesting() {
  const [tests] = useState([
    { name: "Homepage Hero", variants: 2, winner: "A" },
    { name: "CTA Button", variants: 3, winner: "B" },
  ]);
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">A/B Testing</h1>
      <div className="space-y-2">
        {tests.map((t, i) => (
          <motion.div key={t.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center justify-between rounded-xl border border-dark-600 bg-dark-900/60 p-4">
            <span className="text-white">{t.name}</span>
            <span className="text-sm text-gray-400">{t.variants} variants</span>
            <span className="text-xs px-2 py-1 rounded-full bg-gold-500/20 text-gold-400">Winner: {t.winner}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}