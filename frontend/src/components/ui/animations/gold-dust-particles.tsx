"use client";

import { useMemo } from "react";

export interface GoldDustParticlesProps {
  count?: number;
  className?: string;
}

export function GoldDustParticles({
  count = 20,
  className = "",
}: GoldDustParticlesProps) {
  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: `${(Math.random() * 100).toFixed(1)}%`,
      top: `${(Math.random() * 100).toFixed(1)}%`,
      size: `${(Math.random() * 3 + 1.5).toFixed(1)}px`,
      duration: `${(Math.random() * 8 + 7).toFixed(1)}s`,
      delay: `${(Math.random() * 5).toFixed(1)}s`,
      opacity: (Math.random() * 0.4 + 0.2).toFixed(2),
    }));
  }, [count]);

  return (
    <div className={`pointer-events-none absolute inset-0 z-30 overflow-hidden ${className}`}>
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full bg-vanguard-primary blur-[0.5px]"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animation: `vanguardGoldDust ${p.duration} ease-in-out infinite ${p.delay}`,
          }}
        />
      ))}
    </div>
  );
}
