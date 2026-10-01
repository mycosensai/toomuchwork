"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function DraftListings() {
  const [drafts, setDrafts] = useState([
    { id: "1", title: "Vintage Rolex", status: "draft" },
    { id: "2", title: "Diamond Ring", status: "draft" },
  ]);

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Draft Listings</h1>
      <div className="space-y-2">
        {drafts.map((d) => (
          <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between rounded-xl border border-dark-600 bg-dark-900/60 p-4">
            <span className="text-white">{d.title}</span>
            <span className="text-xs text-gray-400 capitalize">{d.status}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}