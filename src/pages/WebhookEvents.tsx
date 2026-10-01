"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function WebhookEvents() {
  const [events] = useState([
    { type: "listing.created", time: "2026-09-08 10:23" },
    { type: "bid.placed", time: "2026-09-08 10:15" },
  ]);
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Webhook Events</h1>
      <div className="space-y-2">
        {events.map((e, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between rounded-xl border border-dark-600 bg-dark-900/60 p-4">
            <span className="text-white font-mono">{e.type}</span>
            <span className="text-xs text-gray-400">{e.time}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}