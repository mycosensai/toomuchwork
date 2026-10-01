import { motion } from "framer-motion";

const states = [
  { key: "idle", label: "Idle", color: "bg-gray-500" },
  { key: "active", label: "Active", color: "bg-emerald-500" },
  { key: "processing", label: "Processing", color: "bg-gold-500" },
] as const;

export function AgentStatusWidget({ status = "idle", task = "" }: { status?: typeof states[number]["key"]; task?: string }) {
  const current = states.find((s) => s.key === status) || states[0];

  return (
    <div className="fixed bottom-4 right-4 z-40 rounded-xl border border-gold-500/20 bg-dark-900/90 p-3 shadow-lg backdrop-blur">
      <div className="flex items-center gap-2">
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className={`h-2 w-2 rounded-full ${current.color}`}
        />
        <span className="text-xs text-gray-300">{current.label}</span>
      </div>
      {task && <p className="mt-1 text-[10px] text-gray-500 truncate max-w-48">{task}</p>}
    </div>
  );
}
