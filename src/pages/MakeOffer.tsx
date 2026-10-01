"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function MakeOffer() {
  const [offer, setOffer] = useState("");

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Make an Offer</h1>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-6">
        <input value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="Your offer..." className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-white" />
        <motion.button whileTap={{ scale: 0.97 }} className="mt-4 px-6 py-2 bg-gold-600 text-white rounded-lg">Submit Offer</motion.button>
      </motion.div>
    </section>
  );
}