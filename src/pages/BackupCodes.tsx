"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function BackupCodes() {
  const [codes, setCodes] = useState([
    { code: "ABCD-1234", used: false },
    { code: "EFGH-5678", used: true },
  ]);

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Backup Codes</h1>
      <div className="space-y-2">
        {codes.map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between rounded-xl border border-dark-600 bg-dark-900/60 p-4">
            <span className="text-white font-mono">{c.code}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${c.used ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"}`}>{c.used ? "Used" : "Active"}</span>
          </motion.div>
        ))}
      </div>
      <motion.button whileTap={{ scale: 0.97 }} className="px-6 py-2 bg-gold-600 text-white rounded-lg">Generate New Codes</motion.button>
    </section>
  );
}