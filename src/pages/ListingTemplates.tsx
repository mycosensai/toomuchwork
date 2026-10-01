"use client";
import { useState } from "react";
import { motion } from "framer-motion";

const templates = [
  { name: "Luxury Watch", fields: ["Brand", "Model", "Condition", "Serial"] },
  { name: "Fine Jewelry", fields: ["Stone", "Carat", "Setting", "Certification"] },
  { name: "Rare Coin", fields: ["Year", "Mint", "Grade", "Mintage"] },
];

export default function ListingTemplates() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Listing Templates</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates.map((t) => (
          <motion.div key={t.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.97 }} onClick={() => setSelected(t.name)} className={`rounded-xl border p-4 cursor-pointer ${selected === t.name ? "border-gold-500 bg-gold-500/10" : "border-dark-600 bg-dark-900/60"}`}>
            <p className="text-white font-semibold">{t.name}</p>
            <ul className="mt-2 space-y-1">
              {t.fields.map((f) => (
                <li key={f} className="text-xs text-gray-400">• {f}</li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </section>
  );
}