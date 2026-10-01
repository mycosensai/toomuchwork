"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function EmailDigest() {
  const [frequency, setFrequency] = useState("daily");
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Email Digest</h1>
      <div className="flex gap-2">
        {["daily", "weekly"].map((f) => (
          <button key={f} onClick={() => setFrequency(f)} className={`px-4 py-2 rounded-lg ${frequency === f ? "bg-gold-600 text-white" : "bg-dark-800 text-gray-400"}`}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
      </div>
      <motion.button whileTap={{ scale: 0.97 }} className="px-6 py-2 bg-gold-600 text-white rounded-lg">Subscribe</motion.button>
    </section>
  );
}