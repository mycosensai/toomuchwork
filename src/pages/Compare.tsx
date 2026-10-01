"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Compare() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Compare Listings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Listing A</h2>
          <input value={a} onChange={(e) => setA(e.target.value)} placeholder="Search listing..." className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-white" />
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Listing B</h2>
          <input value={b} onChange={(e) => setB(e.target.value)} placeholder="Search listing..." className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-white" />
        </motion.div>
      </div>
      {a && b && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-6">
          <p className="text-gold-400 text-sm">Comparison view would render here.</p>
        </motion.div>
      )}
    </section>
  );
}