"use client";

import { useRef, MouseEvent, useState, ReactNode } from "react";
import { ShieldCheck, Sparkles } from "lucide-react";

export interface AtelierLensProps {
  children: ReactNode;
  className?: string;
  zoomLevel?: number;
  lensSize?: number;
}

export function AtelierLens({
  children,
  className = "",
  zoomLevel = 1.8,
  lensSize = 160,
}: AtelierLensProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0, bgX: 0, bgY: 0 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const bgX = (x / rect.width) * 100;
    const bgY = (y / rect.height) * 100;

    setLensPos({
      x: x - lensSize / 2,
      y: y - lensSize / 2,
      bgX,
      bgY,
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsActive(true)}
      onMouseLeave={() => setIsActive(false)}
      onMouseMove={handleMouseMove}
      className={`group relative overflow-hidden ${className}`}
    >
      {children}

      {/* Lens Overlay */}
      <div
        className={`pointer-events-none absolute z-30 rounded-full border-2 border-vanguard-primary bg-vanguard-dark-bg shadow-2xl transition-opacity duration-300 ${
          isActive ? "opacity-100 scale-100" : "opacity-0 scale-75"
        }`}
        style={{
          width: `${lensSize}px`,
          height: `${lensSize}px`,
          left: `${lensPos.x}px`,
          top: `${lensPos.y}px`,
          boxShadow: "0 0 35px rgba(212, 175, 55, 0.45)",
        }}
      >
        <div className="relative h-full w-full overflow-hidden rounded-full">
          <div
            className="absolute inset-0 bg-cover bg-no-repeat"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1200&q=80')`,
              backgroundPosition: `${lensPos.bgX}% ${lensPos.bgY}%`,
              transform: `scale(${zoomLevel})`,
              transformOrigin: `${lensPos.bgX}% ${lensPos.bgY}%`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-vanguard-primary/20 to-transparent pointer-events-none" />
        </div>

        {/* Authenticity Badge Tooltip on Lens */}
        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-v-sm border border-vanguard-primary/50 bg-vanguard-dark-bg/90 px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-wider text-vanguard-primary backdrop-blur-md">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck size={10} />
            Inspected 100%
          </span>
        </div>
      </div>
    </div>
  );
}
