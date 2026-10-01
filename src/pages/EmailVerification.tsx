"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function EmailVerification() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const sendCode = () => {
    setSent(true);
  };

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Email Verification</h1>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-dark-600 bg-dark-900/60 p-6">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email..." className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-white" />
        <motion.button whileTap={{ scale: 0.97 }} onClick={sendCode} className="mt-4 px-6 py-2 bg-gold-600 text-white rounded-lg">{sent ? "Resend Code" : "Send Code"}</motion.button>
        {sent && (
          <p className="mt-4 text-emerald-400 text-sm">Verification code sent to {email}</p>
        )}
      </motion.div>
    </section>
  );
}