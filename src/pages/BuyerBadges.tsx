"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function BuyerBadges() {
  const [buyers, setBuyers] = useState([
    { name: "Buyer1", verified: true },
    { name: "Buyer2", verified: false },
  ]);

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Buyer Verification</h1>
      <div className="space-y-2">
        {buyers.map((b) => (
          <motion.div key={b.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between rounded-xl border border-dark-600 bg-dark-900/60 p-4">
            <span className="text-white">{b.name}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${b.verified ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-500/20 text-gray-400"}`}>{b.verified ? "Verified" : "Unverified"}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}