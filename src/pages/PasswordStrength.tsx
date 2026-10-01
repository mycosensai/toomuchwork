"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function PasswordStrength() {
  const [password, setPassword] = useState("");

  const strength = password.length < 6 ? "weak" : password.length < 10 ? "medium" : "strong";

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Password Strength</h1>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-6">
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Enter password..." className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-white" />
        <div className="mt-4">
          <p className="text-sm text-gray-400">Strength: <span className={`font-semibold ${strength === "strong" ? "text-emerald-400" : strength === "medium" ? "text-orange-400" : "text-red-400"}`}>{strength}</span></p>
          <div className="flex gap-2 mt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`h-2 flex-1 rounded ${i <= (strength === "weak" ? 1 : strength === "medium" ? 2 : 3) ? "bg-emerald-500" : "bg-dark-700"}`} />
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}