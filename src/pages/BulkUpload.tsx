"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function BulkUpload() {
  const [file, setFile] = useState("");
  const [count, setCount] = useState(0);

  const handleUpload = () => {
    setCount((c) => c + 1);
  };

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Bulk Upload</h1>
      <p className="text-gray-400">Upload multiple listings via CSV or JSON.</p>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-6">
        <input value={file} onChange={(e) => setFile(e.target.value)} placeholder="Paste JSON or CSV here..." className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-white h-32" />
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleUpload} className="mt-4 px-6 py-2 bg-gold-600 text-white rounded-lg">Upload {count > 0 && `(${count} items)`}</motion.button>
      </motion.div>
    </section>
  );
}