"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function ConversionTracking() {
  const [metrics] = useState({ visitors: 1247, conversions: 104, rate: "8.3%" });
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Conversion Tracking</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-4"><p className="text-gray-400 text-sm">Visitors</p><p className="text-2xl text-white">{metrics.visitors.toLocaleString()}</p></motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-4"><p className="text-gray-400 text-sm">Conversions</p><p className="text-2xl text-white">{metrics.conversions}</p></motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-4"><p className="text-gray-400 text-sm">Rate</p><p className="text-2xl text-gold-400">{metrics.rate}</p></motion.div>
      </div>
    </section>
  );
}