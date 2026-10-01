"use client";

import { useState, useEffect } from "react";

const steps = [
  { title: "Welcome", body: "Discover rare collectibles with AI-powered verification." },
  { title: "Browse", body: "Filter by category, price, and authentication status." },
  { title: "Verify", body: "Run ProVerify for expert-backed authenticity checks." },
  { title: "Buy", body: "Checkout with card, crypto, or Apple Pay." },
];

export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem("vault_tour_seen");
    if (!seen) setOpen(true);
  }, []);

  const next = () => {
    if (step >= steps.length - 1) {
      setOpen(false);
      localStorage.setItem("vault_tour_seen", "true");
      return;
    }
    setStep((s) => s + 1);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
      <div className="max-w-md rounded-2xl border border-gold-500/30 bg-dark-900 p-6 shadow-2xl">
        <div className="flex gap-2">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-gold-500" : "bg-gray-700"}`} />
          ))}
        </div>
        <h3 className="mt-4 text-xl font-bold text-white">{steps[step].title}</h3>
        <p className="mt-2 text-gray-400">{steps[step].body}</p>
        <button onClick={next} className="mt-6 w-full rounded-xl bg-gold-500 py-2 font-semibold text-black hover:bg-gold-400">
          {step >= steps.length - 1 ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}
