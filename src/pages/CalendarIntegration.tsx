"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function CalendarIntegration() {
  const [events] = useState([
    { title: "Auction Ends", date: "2026-09-15" },
    { title: "Verification Due", date: "2026-09-20" },
  ]);
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Calendar Integration</h1>
      <div className="space-y-2">
        {events.map((e, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between rounded-xl border border-dark-600 bg-dark-900/60 p-4">
            <span className="text-white">{e.title}</span>
            <span className="text-sm text-gray-400">{e.date}</span>
          </motion.div>
        ))}
      </div>
      <motion.button whileTap={{ scale: 0.97 }} className="px-6 py-2 bg-gold-600 text-white rounded-lg">Add to Calendar</motion.button>
    </section>
  );
}