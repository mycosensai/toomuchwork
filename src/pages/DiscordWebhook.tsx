"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function DiscordWebhook() {
  const [url, setUrl] = useState("");
  const [sent, setSent] = useState(false);
  const handleSend = () => setSent(true);
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Discord Webhook</h1>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-6">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Webhook URL..." className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-white" />
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleSend} className="mt-4 px-6 py-2 bg-gold-600 text-white rounded-lg">{sent ? "Sent!" : "Send Test"}</motion.button>
      </motion.div>
    </section>
  );
}