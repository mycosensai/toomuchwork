"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function TokenizePage() {
  const [step, setStep] = useState(0);
  const [txid, setTxid] = useState("");
  const [listingId, setListingId] = useState("");

  const handleTokenize = async () => {
    setStep(1);
    try {
      const res = await fetch("/api/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "tokenize", listingId }),
      });
      const data = await res.json();
      setTxid(data.txid || "");
      setStep(2);
    } catch {
      setStep(3);
    }
  };

  return (
    <section className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white">Tokenize Your Item</h1>
      <p className="text-gray-400">Convert your listing into a blockchain-verified token.</p>

      <div className="rounded-xl border border-dark-600 bg-dark-900/60 p-6 space-y-4">
        <label className="text-white text-sm font-semibold">Listing ID</label>
        <input
          value={listingId}
          onChange={(e) => setListingId(e.target.value)}
          placeholder="Enter listing ID..."
          className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-white"
        />
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleTokenize}
          className="px-6 py-2 bg-gold-600 text-white rounded-lg font-semibold"
        >
          Tokenize on Blockchain
        </motion.button>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.p key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-gold-400 text-sm">
              Minting token on Solana blockchain...
            </motion.p>
          )}
          {step === 2 && txid && (
            <motion.p key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-emerald-400 text-sm">
              Token minted! TXID: {txid}
            </motion.p>
          )}
          {step === 3 && (
            <motion.p key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-red-400 text-sm">
              Tokenization failed. Please try again.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}