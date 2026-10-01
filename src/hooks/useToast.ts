"use client";

import { useState, useCallback } from "react";

type Toast = {
  id: string;
  message: string;
  type: "success" | "error" | "info";
};

const listeners = new Set<(toasts: Toast[]) => void>() as Set<(toasts: Toast[]) => void>;
let toasts: Toast[] = [];

function notify() {
  listeners.forEach((fn) => fn([...toasts]));
}

export function useToast() {
  const [, setTick] = useState(0);

  const subscribe = useCallback((fn: (toasts: Toast[]) => void) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);

  const push = useCallback((toast: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    toasts = [...toasts, { ...toast, id }];
    notify();
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      notify();
    }, 3500);
  }, []);

  return { toasts: [] as Toast[], subscribe, push };
}
