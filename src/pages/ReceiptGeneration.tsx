"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function ReceiptGeneration() {
  const [receipts] = useState([
    { id: "REC-001", amount: "$500", date: "2026-09-01" },
    { id: "REC-002", amount: "$1,200", date: "2026-09-05" },
  ]);
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Receipt Generation</h1>
      <div className="space-y-2">
        {receipts.map((r, i) => (
          <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center justify-between rounded-xl border border-dark-600 bg-dark-900/60 p-4">
            <span className="text-white">{r.id}</span>
            <span className="text-gold-400">{r.amount}</span>
            <span className="text-xs text-gray-400">{r.date}</span>
          </motion.div>
        ))}
      </div>
      <motion.button whileTap={{ scale: 0.97 }} className="px-6 py-2 bg-gold-600 text-white rounded-lg">Generate Receipt</motion.button>
    </section>
  );
}