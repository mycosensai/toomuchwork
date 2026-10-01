"use client";

import { useState } from "react";

export function AgentPersonalitySliders({ agentId }: { agentId: string }) {
  const [formality, setFormality] = useState(50);
  const [verbosity, setVerbosity] = useState(50);
  const [risk, setRisk] = useState(50);

  return (
    <div className="rounded-xl border border-gold-500/20 bg-dark-900/60 p-4">
      <h3 className="text-lg font-bold text-white">Agent Personality</h3>
      <p className="text-xs text-gray-500">Adjust tone, detail level, and risk tolerance.</p>
      <div className="mt-4 space-y-3">
        <Slider label="Formality" value={formality} onChange={setFormality} />
        <Slider label="Verbosity" value={verbosity} onChange={setVerbosity} />
        <Slider label="Risk Tolerance" value={risk} onChange={setRisk} />
      </div>
    </div>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>{label}</span>
        <span className="text-gold-400">{value}</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-[#C9A84C]"
      />
    </div>
  );
}
