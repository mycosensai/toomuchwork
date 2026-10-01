"use client";

import { useEffect, useRef, useState } from "react";

export function useAnimatedCounter(target: number, durationMs = 1200) {
  const [value, setValue] = useState(0);
  const start = useRef(0);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    start.current = 0;
    startTime.current = null;
    const tick = (ts: number) => {
      if (!startTime.current) startTime.current = ts;
      const progress = Math.min((ts - startTime.current) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [target, durationMs]);

  return value;
}
