"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function TwoFactor() {
  const [enabled, setEnabled] = useState(false);
  const [code, setCode] = useState("");

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Two-Factor Auth</h1>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-6">
        <p className="text-white mb-2">Status: {enabled ? "Enabled" : "Disabled"}</p>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setEnabled(!enabled)} className={`px-6 py-2 rounded-lg ${enabled ? "bg-red-600 text-white" : "bg-emerald-600 text-white"}`}>{enabled ? "Disable" : "Enable"}</motion.button>
        {enabled && (
          <div className="mt-4">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter 6-digit code..." className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-white" />
            <motion.button whileTap={{ scale: 0.97 }} className="mt-2 px-6 py-2 bg-gold-600 text-white rounded-lg">Verify</motion.button>
          </div>
        )}
      </motion.div>
    </section>
  );
}