"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function AgentAdaptation() {
  const [tone, setTone] = useState(50);
  const [verbosity, setVerbosity] = useState(50);
  const [risk, setRisk] = useState(50);

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Agent Adaptation</h1>
      <p className="text-gray-400">Fine-tune how each agent behaves for your preferences.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-4">
          <label className="text-white text-sm">Formality</label>
          <input type="range" min="0" max="100" value={tone} onChange={(e) => setTone(Number(e.target.value))} className="w-full mt-2" />
          <p className="text-xs text-gray-400 mt-1">{tone < 33 ? "Casual" : tone < 66 ? "Balanced" : "Formal"}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-4">
          <label className="text-white text-sm">Verbosity</label>
          <input type="range" min="0" max="100" value={verbosity} onChange={(e) => setVerbosity(Number(e.target.value))} className="w-full mt-2" />
          <p className="text-xs text-gray-400 mt-1">{verbosity < 33 ? "Brief" : verbosity < 66 ? "Moderate" : "Detailed"}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-4">
          <label className="text-white text-sm">Risk Tolerance</label>
          <input type="range" min="0" max="100" value={risk} onChange={(e) => setRisk(Number(e.target.value))} className="w-full mt-2" />
          <p className="text-xs text-gray-400 mt-1">{risk < 33 ? "Conservative" : risk < 66 ? "Moderate" : "Aggressive"}</p>
        </motion.div>
      </div>
    </section>
  );
}