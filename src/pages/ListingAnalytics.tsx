"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function ListingAnalytics() {
  const [views, setViews] = useState(1247);
  const [clicks, setClicks] = useState(89);
  const [saves, setSaves] = useState(23);

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Listing Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-4">
          <p className="text-gray-400 text-sm">Views</p>
          <p className="text-2xl text-white">{views.toLocaleString()}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-4">
          <p className="text-gray-400 text-sm">Clicks</p>
          <p className="text-2xl text-white">{clicks.toLocaleString()}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-4">
          <p className="text-gray-400 text-sm">Saves</p>
          <p className="text-2xl text-white">{saves.toLocaleString()}</p>
        </motion.div>
      </div>
    </section>
  );
}