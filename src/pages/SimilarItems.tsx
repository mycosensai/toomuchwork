"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function SimilarItems() {
  const [items, setItems] = useState([
    { name: "Rolex Submariner", price: "$5,200" },
    { name: "Omega Speedmaster", price: "$3,800" },
    { name: "Cartier Tank", price: "$2,900" },
  ]);

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Similar Items</h1>
      <div className="space-y-2">
        {items.map((item) => (
          <motion.div key={item.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between rounded-xl border border-dark-600 bg-dark-900/60 p-4">
            <span className="text-white">{item.name}</span>
            <span className="text-gold-400">{item.price}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}