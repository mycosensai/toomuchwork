"use client";

import { useEffect, useRef } from "react";

export function CursorTrail() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let x = 0,
      y = 0;
    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      const dot = document.createElement("span");
      dot.className = "pointer-events-none fixed z-[60] h-1 w-1 rounded-full bg-[#C9A84C]";
      dot.style.left = `${x}px`;
      dot.style.top = `${y}px`;
      dot.style.transition = "transform 0.6s ease-out, opacity 0.6s ease-out";
      document.body.appendChild(dot);
      requestAnimationFrame(() => {
        dot.style.transform = `translate(${(Math.random() - 0.5) * 30}px, ${(Math.random() - 0.5) * 30}px)`;
        dot.style.opacity = "0";
      });
      setTimeout(() => dot.remove(), 700);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return <div ref={ref} className="hidden" />;
}
