"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function AccountRecovery() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(0);

  const handleRecover = () => {
    setStep(1);
    setTimeout(() => setStep(2), 2000);
  };

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Account Recovery</h1>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-6">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email..." className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-white" />
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleRecover} className="mt-4 px-6 py-2 bg-gold-600 text-white rounded-lg">Recover Account</motion.button>
        {step === 1 && <p className="mt-4 text-gold-400 text-sm">Recovery email sent...</p>}
        {step === 2 && <p className="mt-4 text-emerald-400 text-sm">Account recovery complete!</p>}
      </motion.div>
    </section>
  );
}