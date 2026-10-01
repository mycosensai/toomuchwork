"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Accessibility() {
  const [fontSize, setFontSize] = useState("medium");
  const [contrast, setContrast] = useState("normal");

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Accessibility</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-4">
          <p className="text-white font-semibold mb-2">Font Size</p>
          <div className="flex gap-2">
            {["small", "medium", "large"].map((s) => (
              <button key={s} onClick={() => setFontSize(s)} className={`px-4 py-2 rounded-lg ${fontSize === s ? "bg-gold-600 text-white" : "bg-dark-800 text-gray-400"}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
            ))}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-4">
          <p className="text-white font-semibold mb-2">Contrast</p>
          <div className="flex gap-2">
            {["normal", "high"].map((c) => (
              <button key={c} onClick={() => setContrast(c)} className={`px-4 py-2 rounded-lg ${contrast === c ? "bg-gold-600 text-white" : "bg-dark-800 text-gray-400"}`}>{c.charAt(0).toUpperCase() + c.slice(1)}</button>
            ))}
          </div>
        </motion.div>
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-4">
        <h2 className="text-white font-semibold mb-2">Accessibility Checklist</h2>
        {[
          { label: "Color contrast", status: "pass" },
          { label: "Keyboard navigation", status: "pass" },
          { label: "Screen reader labels", status: "warn" },
          { label: "Focus indicators", status: "pass" },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between py-2 border-b border-dark-700 last:border-0">
            <span className="text-sm text-gray-400">{item.label}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${item.status === "pass" ? "bg-emerald-500/20 text-emerald-400" : "bg-orange-500/20 text-orange-400"}`}>{item.status.toUpperCase()}</span>
          </div>
        ))}
      </motion.div>
    </section>
  );
}