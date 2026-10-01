"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function CommissionCalc() {
  const [value, setValue] = useState(0);

  const commission = value < 1000 ? 0.05 : value < 7500 ? 0.07 : value < 10000 ? 0.10 : 0.05;
  const youGet = value * (1 - commission);

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Commission Calculator</h1>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-6">
        <input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} placeholder="Item value..." className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-white" />
        <div className="mt-4 space-y-2">
          <p className="text-gray-400">Commission: <span className="text-white">{(commission * 100).toFixed(0)}%</span></p>
          <p className="text-gray-400">You receive: <span className="text-gold-400">${youGet.toFixed(2)}</span></p>
        </div>
      </motion.div>
    </section>
  );
}