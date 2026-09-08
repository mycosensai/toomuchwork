'use client';

import * as React from 'react';

interface SliderProps {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

export function Slider({ min, max, step, value, onChange }: SliderProps) {
  const range = max - min;
  const pct = (v: number) => ((v - min) / range) * 100;

  return (
    <div className="relative h-6">
      {/* Track */}
      <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-zinc-200 dark:bg-zinc-700" />
      {/* Active range */}
      <div
        className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-emerald-500"
        style={{ left: `${pct(value[0])}%`, width: `${pct(value[1]) - pct(value[0])}%` }}
      />
      {/* Thumb start */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value[0]}
        onChange={(e) => {
          const v = parseInt(e.target.value);
          if (v <= value[1]) onChange([v, value[1]]);
        }}
        className="pointer-events-none absolute inset-0 z-10 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:ring-1 [&::-webkit-slider-thumb]:ring-zinc-300"
      />
      {/* Thumb end */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value[1]}
        onChange={(e) => {
          const v = parseInt(e.target.value);
          if (v >= value[0]) onChange([value[0], v]);
        }}
        className="pointer-events-none absolute inset-0 z-20 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:ring-1 [&::-webkit-slider-thumb]:ring-zinc-300"
      />
    </div>
  );
}
