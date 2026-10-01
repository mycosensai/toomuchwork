"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function PriceHistory() {
  const [history] = useState([
    { date: "2026-09-01", price: 5200 },
    { date: "2026-09-02", price: 5100 },
    { date: "2026-09-03", price: 5300 },
  ]);
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Price History</h1>
      <div className="space-y-2">
        {history.map((h, i) => (
          <motion.div key={h.date} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center justify-between rounded-xl border border-dark-600 bg-dark-900/60 p-4">
            <span className="text-white">{h.date}</span>
            <span className="text-gold-400">${h.price.toLocaleString()}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}