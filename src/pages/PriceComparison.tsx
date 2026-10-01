"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function PriceComparison() {
  const [query, setQuery] = useState("");
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Price Comparison</h1>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search item to compare..." className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-white" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-4">
          <p className="text-white font-semibold">Your Listing</p>
          <p className="text-2xl text-gold-400">$1,200</p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-4">
          <p className="text-white font-semibold">Market Average</p>
          <p className="text-2xl text-emerald-400">$1,150</p>
        </motion.div>
      </div>
    </section>
  );
}