"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function OrderTracking() {
  const [orders, setOrders] = useState([
    { id: "#1001", status: "shipped", eta: "3 days" },
    { id: "#1002", status: "processing", eta: "5 days" },
  ]);

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Order Tracking</h1>
      <div className="space-y-2">
        {orders.map((o) => (
          <motion.div key={o.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between rounded-xl border border-dark-600 bg-dark-900/60 p-4">
            <span className="text-white">{o.id}</span>
            <span className="text-emerald-400">{o.status}</span>
            <span className="text-xs text-gray-400">ETA: {o.eta}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}