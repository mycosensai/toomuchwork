"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function LiveChat() {
  const [messages, setMessages] = useState([
    { sender: "Seller", text: "Hi! Are you still interested?" },
    { sender: "You", text: "Yes, can you ship to CA?" },
  ]);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    setMessages([...messages, { sender: "You", text: input }]);
    setInput("");
  };

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Live Chat</h1>
      <div className="rounded-xl border border-dark-600 bg-dark-900/60 p-4 space-y-3 h-64 overflow-y-auto">
        {messages.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-lg p-3 ${m.sender === "You" ? "bg-gold-600/20" : "bg-dark-800"}`}>
            <p className="text-xs text-gray-400">{m.sender}</p>
            <p className="text-white">{m.text}</p>
          </motion.div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-white" />
        <motion.button whileTap={{ scale: 0.95 }} onClick={send} className="px-6 py-2 bg-gold-600 text-white rounded-lg">Send</motion.button>
      </div>
    </section>
  );
}