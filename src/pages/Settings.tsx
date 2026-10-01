"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Settings() {
  const [theme, setTheme] = useState("dark");
  const [notifications, setNotifications] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Settings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-4">
          <p className="text-white font-semibold mb-2">Theme</p>
          <div className="flex gap-2">
            {["dark", "light"].map((t) => (
              <button key={t} onClick={() => setTheme(t)} className={`px-4 py-2 rounded-lg ${theme === t ? "bg-gold-600 text-white" : "bg-dark-800 text-gray-400"}`}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
            ))}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-4">
          <p className="text-white font-semibold mb-2">Notifications</p>
          <button onClick={() => setNotifications(!notifications)} className={`px-4 py-2 rounded-lg ${notifications ? "bg-emerald-600 text-white" : "bg-dark-800 text-gray-400"}`}>{notifications ? "On" : "Off"}</button>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-4">
          <p className="text-white font-semibold mb-2">Two-Factor Auth</p>
          <button onClick={() => setTwoFactor(!twoFactor)} className={`px-4 py-2 rounded-lg ${twoFactor ? "bg-emerald-600 text-white" : "bg-dark-800 text-gray-400"}`}>{twoFactor ? "Enabled" : "Disabled"}</button>
        </motion.div>
      </div>
    </section>
  );
}