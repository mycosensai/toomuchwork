"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function IpWhitelist() {
  const [ips, setIps] = useState(["192.168.1.0/24", "10.0.0.1"]);
  const [newIp, setNewIp] = useState("");

  const addIp = () => {
    if (!newIp.trim()) return;
    setIps([...ips, newIp]);
    setNewIp("");
  };

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">IP Whitelist</h1>
      <div className="flex gap-2">
        <input value={newIp} onChange={(e) => setNewIp(e.target.value)} placeholder="Add IP/CIDR..." className="flex-1 bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-white" />
        <motion.button whileTap={{ scale: 0.97 }} onClick={addIp} className="px-6 py-2 bg-gold-600 text-white rounded-lg">Add</motion.button>
      </div>
      <div className="space-y-2">
        {ips.map((ip, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between rounded-xl border border-dark-600 bg-dark-900/60 p-4">
            <span className="text-white font-mono">{ip}</span>
            <button className="text-red-400 text-sm">Remove</button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}