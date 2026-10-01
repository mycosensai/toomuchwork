"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function SellerDashboard() {
  const [stats] = useState({ listings: 24, views: 1247, sales: 18, revenue: "$4,892" });
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Seller Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-4"><p className="text-gray-400 text-sm">Listings</p><p className="text-2xl text-white">{stats.listings}</p></motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-4"><p className="text-gray-400 text-sm">Views</p><p className="text-2xl text-white">{stats.views.toLocaleString()}</p></motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-4"><p className="text-gray-400 text-sm">Sales</p><p className="text-2xl text-white">{stats.sales}</p></motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-4"><p className="text-gray-400 text-sm">Revenue</p><p className="text-2xl text-gold-400">{stats.revenue}</p></motion.div>
      </div>
    </section>
  );
}