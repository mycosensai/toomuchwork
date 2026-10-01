"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function SellerRatings() {
  const [sellers, setSellers] = useState([
    { name: "CollectorA", rating: 4.8 },
    { name: "DealerB", rating: 4.5 },
  ]);

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Seller Ratings</h1>
      <div className="space-y-2">
        {sellers.map((s) => (
          <motion.div key={s.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between rounded-xl border border-dark-600 bg-dark-900/60 p-4">
            <span className="text-white">{s.name}</span>
            <span className="text-gold-400">★ {s.rating}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}