"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function CategoryPerformance() {
  const [categories] = useState([
    { name: "Antiques", views: 2847, sales: 42 },
    { name: "Luxury Watches", views: 1892, sales: 31 },
    { name: "Fine Jewelry", views: 563, sales: 8 },
  ]);
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Category Performance</h1>
      <div className="space-y-2">
        {categories.map((cat, i) => (
          <motion.div key={cat.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center justify-between rounded-xl border border-dark-600 bg-dark-900/60 p-4">
            <span className="text-white">{cat.name}</span>
            <span className="text-sm text-gray-400">Views: {cat.views.toLocaleString()}</span>
            <span className="text-sm text-emerald-400">Sales: {cat.sales}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}