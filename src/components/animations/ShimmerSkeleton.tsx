import { motion } from "framer-motion";

export function ShimmerSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-dark-800/80 ${className}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-500/10 to-transparent"
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-gold-500/10 bg-dark-900/60 p-4 space-y-3">
      <ShimmerSkeleton className="h-48 w-full" />
      <ShimmerSkeleton className="h-4 w-3/4" />
      <ShimmerSkeleton className="h-4 w-1/2" />
    </div>
  );
}
