"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function ExportReports() {
  const [format, setFormat] = useState("csv");
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Export Reports</h1>
      <div className="flex gap-2">
        {["csv", "pdf"].map((f) => (
          <button key={f} onClick={() => setFormat(f)} className={`px-4 py-2 rounded-lg ${format === f ? "bg-gold-600 text-white" : "bg-dark-800 text-gray-400"}`}>{f.toUpperCase()}</button>
        ))}
      </div>
      <motion.button whileTap={{ scale: 0.97 }} className="px-6 py-2 bg-gold-600 text-white rounded-lg">Export</motion.button>
    </section>
  );
}