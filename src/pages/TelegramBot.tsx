"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function TelegramBot() {
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [sent, setSent] = useState(false);
  const handleSend = () => setSent(true);
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Telegram Bot</h1>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-6">
        <input value={botToken} onChange={(e) => setBotToken(e.target.value)} placeholder="Bot Token..." className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-white mb-2" />
        <input value={chatId} onChange={(e) => setChatId(e.target.value)} placeholder="Chat ID..." className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-white mb-2" />
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleSend} className="px-6 py-2 bg-gold-600 text-white rounded-lg">{sent ? "Connected!" : "Send Alert"}</motion.button>
      </motion.div>
    </section>
  );
}