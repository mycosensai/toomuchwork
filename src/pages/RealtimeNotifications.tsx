"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function RealtimeNotifications() {
  const [notifications, setNotifications] = useState([
    { time: "10:23", text: "New bid on your listing", read: false },
    { time: "10:15", text: "Your item sold", read: true },
  ]);
  return (
    <section className="min-h-screen bg-[#080808] text-[#E8E2D0] px-6 py-24">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[10px] tracking-[5px] uppercase text-[#C9A84C]/70 font-cinzel mb-2">
            The Vault DFW
          </p>
          <h1 className="font-cinzel text-4xl font-bold text-[#C9A84C] mb-8">
            Real-time Notifications
          </h1>
        </motion.div>
        <div className="space-y-2">
          {notifications.map((n, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center justify-between rounded-xl border p-4 ${
                n.read
                  ? "border-[#C9A84C]/10 bg-[#0d0d0d]"
                  : "border-[#C9A84C]/40 bg-[#C9A84C]/10"
              }`}
            >
              <span className="text-[#E8E2D0]">{n.text}</span>
              <span className="text-xs text-[#E8E2D0]/40">{n.time}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
