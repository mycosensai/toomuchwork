"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function AgentFeedback() {
  const [rating, setRating] = useState(0);
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Agent Feedback</h1>
      <p className="text-gray-400">Help agents improve by rating their responses.</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button key={star} whileTap={{ scale: 0.9 }} onClick={() => setRating(star)} className={`text-3xl ${rating >= star ? "text-gold-400" : "text-gray-600"}`}>★</motion.button>
        ))}
      </div>
      <textarea placeholder="Additional feedback..." className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-white h-24" />
      <motion.button whileTap={{ scale: 0.95 }} className="px-6 py-2 bg-gold-600 text-white rounded-lg">Submit Feedback</motion.button>
    </section>
  );
}