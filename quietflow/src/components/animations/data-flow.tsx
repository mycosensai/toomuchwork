'use client';

import { useStore } from '@/store';
import { cn } from '@/lib/cn';
import { Activity, BarChart3, Eye } from 'lucide-react';

/**
 * LiveDataFlow
 * ------------
 * A compact visualization of the traffic/density data pipeline that runs
 * continuously at the bottom of the main content. It animates the journey
 * of data from camera feeds → vehicle detection → density computation →
 * map overlay, making the "trading process" of traffic intelligence visible.
 *
 * The flow pulses in sync with the DataSimulator tick interval. It reads
 * live counts from the zustand store so it reflects real numbers.
 */

interface FlowNode {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string; // tailwind color prefix
  bgClass: string;
}

const FLOW_NODES: FlowNode[] = [
  {
    id: 'cameras',
    label: 'Camera Feeds',
    icon: <Eye className="h-3.5 w-3.5" />,
    color: 'blue',
    bgClass: 'bg-blue-500/10 border-blue-200 dark:border-blue-900/30',
  },
  {
    id: 'detection',
    label: 'Vehicle Detection',
    icon: <Activity className="h-3.5 w-3.5" />,
    color: 'cyan',
    bgClass: 'bg-cyan-500/10 border-cyan-200 dark:border-cyan-900/30',
  },
  {
    id: 'density',
    label: 'Density Compute',
    icon: <BarChart3 className="h-3.5 w-3.5" />,
    color: 'emerald',
    bgClass: 'bg-emerald-500/10 border-emerald-200 dark:border-emerald-900/30',
  },
  {
    id: 'overlay',
    label: 'Map Overlay',
    icon: <Eye className="h-3.5 w-3.5" />,
    color: 'purple',
    bgClass: 'bg-purple-500/10 border-purple-200 dark:border-purple-900/30',
  },
];

export function LiveDataFlow() {
  const cameras = useStore((s) => s.cameras);
  const businesses = useStore((s) => s.businesses);
  const roadSegments = useStore((s) => s.roadSegments);
  const liveTraffic = useStore((s) => s.liveTraffic);
  const settings = useStore((s) => s.settings);

  const onlineCameras = cameras.filter((c) => c.status === 'online').length;
  const totalVehicles = cameras.reduce((sum, c) => sum + (c.vehicleCountEst || 0), 0);
  const greenBiz = businesses.filter(
    (b) => b.density?.densityLevel === 'green' || b.density?.densityLevel === 'yellow'
  ).length;
  const activeRoads = roadSegments.length;

  return (
    <div
      className={cn(
        'fixed right-4 bottom-20 z-30 hidden flex-col gap-2 md:flex',
        settings.reduceAnimations && 'hidden',
      )}
    >
      <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white/90 px-2.5 py-1.5 text-[10px] font-medium text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/90">
        <span>Data Pipeline</span>
      </div>

      <div className="flex flex-col items-center gap-1.5">
        {FLOW_NODES.map((node, idx) => {
          const isActive = true; // always visible; animation shows activity
          return (
            <div key={node.id} className="flex flex-col items-center">
              {/* Node */}
              <div
                className={cn(
                  'relative flex h-7 w-7 items-center justify-center rounded-lg border transition-all duration-300',
                  node.bgClass,
                  isActive && `animate-pulse-once`,
                )}
                style={{
                  animationDelay: `${idx * 0.2}s`,
                  animationDuration: '0.6s',
                }}
              >
                {node.icon}
                {node.id === 'cameras' && (
                  <span className="absolute -bottom-3.5 text-[8px] font-bold text-zinc-700 dark:text-zinc-200">
                    {onlineCameras}/{cameras.length}
                  </span>
                )}
                {node.id === 'detection' && (
                  <span className="absolute -bottom-3.5 text-[8px] font-bold text-zinc-700 dark:text-zinc-200">
                    {totalVehicles}
                  </span>
                )}
                {node.id === 'density' && (
                  <span className="absolute -bottom-3.5 text-[8px] font-bold text-zinc-700 dark:text-zinc-200">
                    {greenBiz}/{businesses.length}
                  </span>
                )}
                {node.id === 'overlay' && (
                  <span className="absolute -bottom-3.5 text-[8px] font-bold text-zinc-700 dark:text-zinc-200">
                    {liveTraffic.length}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className="mt-4 text-[9px] text-zinc-500 dark:text-zinc-400">{node.label}</span>

              {/* Connecting line + moving dot (except after last node) */}
              {idx < FLOW_NODES.length - 1 && (
                <div className="relative h-5 w-px -translate-y-1 bg-zinc-300 dark:bg-zinc-700">
                  <div
                    className="absolute -left-[2.5px] -top-1 h-1.5 w-1.5 rounded-full bg-emerald-500"
                    style={{
                      animation: 'flow-dot 2s ease-in-out infinite',
                      animationDelay: `${idx * 0.3 + 0.5}s`,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
