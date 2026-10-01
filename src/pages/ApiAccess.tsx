"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function ApiAccess() {
  const [apiKey] = useState("vk_live_abc123...");
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">API Access</h1>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-6">
        <p className="text-gray-400 text-sm">Your API Key</p>
        <p className="text-white font-mono mt-2">{apiKey}</p>
        <motion.button whileTap={{ scale: 0.97 }} className="mt-4 px-6 py-2 bg-gold-600 text-white rounded-lg">Regenerate Key</motion.button>
      </motion.div>
    </section>
  );
}