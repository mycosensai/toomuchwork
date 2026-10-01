"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function SocialSharing() {
  const [platform, setPlatform] = useState("twitter");
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Social Sharing</h1>
      <div className="flex gap-2">
        {["twitter", "reddit", "facebook"].map((p) => (
          <button key={p} onClick={() => setPlatform(p)} className={`px-4 py-2 rounded-lg ${platform === p ? "bg-gold-600 text-white" : "bg-dark-800 text-gray-400"}`}>{p.charAt(0).toUpperCase() + p.slice(1)}</button>
        ))}
      </div>
      <motion.button whileTap={{ scale: 0.97 }} className="px-6 py-2 bg-gold-600 text-white rounded-lg">Share</motion.button>
    </section>
  );
}