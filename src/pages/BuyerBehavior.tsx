"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function BuyerBehavior() {
  const [metrics] = useState({ avgSession: "4m 32s", bounceRate: "32%", conversion: "8.4%" });
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Buyer Behavior</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-4"><p className="text-gray-400 text-sm">Avg. Session</p><p className="text-2xl text-white">{metrics.avgSession}</p></motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-4"><p className="text-gray-400 text-sm">Bounce Rate</p><p className="text-2xl text-white">{metrics.bounceRate}</p></motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-4"><p className="text-gray-400 text-sm">Conversion</p><p className="text-2xl text-gold-400">{metrics.conversion}</p></motion.div>
      </div>
    </section>
  );
}