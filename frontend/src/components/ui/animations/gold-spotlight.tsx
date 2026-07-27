"use client";

import { useRef, MouseEvent, useState, useEffect, ReactNode, useCallback } from "react";

export interface GoldSpotlightProps {
  children: ReactNode;
  className?: string;
  radius?: number;
}

type CanvasStar = {
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
};

export function GoldSpotlight({
  children,
  className = "",
  radius = 340,
}: GoldSpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const particlesRef = useRef<CanvasStar[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const lastSpawnPosRef = useRef<{ x: number; y: number }>({ x: -999, y: -999 });

  // Handle Resize for Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      if (!canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);
    return () => ro.disconnect();
  }, []);

  // Animation Loop for Ultra-Smooth Canvas Stars
  const startLoop = useCallback(() => {
    if (animFrameRef.current) return;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animFrameRef.current = null;
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animFrameRef.current = null;
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const remaining: CanvasStar[] = [];
      const particles = particlesRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life += 1;
        if (p.life >= p.maxLife) continue;

        const progress = p.life / p.maxLife; // 0 to 1
        // Smooth sine wave twinkle fade: starts at 0, peaks gracefully at ~0.85, fades to 0
        const alpha = Math.sin(progress * Math.PI) * 0.85;

        // Silky physics update
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.size *= 0.995; // subtle shrink

        // Draw 4-point Star on Canvas
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = alpha;

        ctx.shadowColor = "rgba(212, 175, 55, 0.5)";
        ctx.shadowBlur = 5;
        ctx.fillStyle = p.color;

        const r = p.size;
        const innerR = r * 0.35;
        ctx.beginPath();
        for (let j = 0; j < 8; j++) {
          const angle = (j * Math.PI) / 4;
          const dist = j % 2 === 0 ? r : innerR;
          const px = Math.cos(angle) * dist;
          const py = Math.sin(angle) * dist;
          if (j === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        ctx.restore();
        remaining.push(p);
      }

      particlesRef.current = remaining;

      if (remaining.length > 0) {
        animFrameRef.current = requestAnimationFrame(render);
      } else {
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(render);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      el.style.setProperty("--spotlight-x", `${x}px`);
      el.style.setProperty("--spotlight-y", `${y}px`);

      const dist = Math.hypot(x - lastSpawnPosRef.current.x, y - lastSpawnPosRef.current.y);

      // Spawn smooth star particle when cursor moves > 12px
      if (dist > 12) {
        lastSpawnPosRef.current = { x, y };

        const colors = ["#D4AF37", "#F5E18C", "#AA7C11", "#FFF5DC"];
        const newStar: CanvasStar = {
          x: x + (Math.random() * 20 - 10),
          y: y + (Math.random() * 14 - 7),
          size: Math.random() * 4 + 5, // 5px to 9px delicate stars
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 2.2,
          vx: (Math.random() - 0.5) * 0.7, // gentle horizontal drift
          vy: Math.random() * 0.6 + 0.5, // silky downward float
          life: 0,
          maxLife: Math.floor(Math.random() * 25 + 45), // ~45-70 frames (~0.8s-1.2s)
          color: colors[Math.floor(Math.random() * colors.length)],
        };

        particlesRef.current.push(newStar);
        startLoop();
      }
    },
    [startLoop]
  );

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
      onMouseMove={handleMouseMove}
      className={`group relative ${className}`}
      style={
        {
          "--spotlight-x": "50%",
          "--spotlight-y": "50%",
        } as React.CSSProperties
      }
    >
      {/* Outer Soft Aura Spotlight */}
      <div
        className={`pointer-events-none absolute inset-0 z-0 transition-opacity duration-700 ease-out ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background: `radial-gradient(${radius}px circle at var(--spotlight-x) var(--spotlight-y), rgba(212, 175, 55, 0.07) 0%, rgba(212, 175, 55, 0.015) 60%, transparent 85%)`,
        }}
      />

      {/* Inner Focused Soft Core Spotlight */}
      <div
        className={`pointer-events-none absolute inset-0 z-0 transition-opacity duration-500 ease-out ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background: `radial-gradient(130px circle at var(--spotlight-x) var(--spotlight-y), rgba(245, 225, 140, 0.12) 0%, rgba(212, 175, 55, 0.02) 70%, transparent 100%)`,
        }}
      />

      {/* Micro Specular Point Highlight */}
      <div
        className={`pointer-events-none absolute inset-0 z-0 transition-opacity duration-300 ease-out ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background: `radial-gradient(35px circle at var(--spotlight-x) var(--spotlight-y), rgba(255, 250, 220, 0.22) 0%, transparent 100%)`,
        }}
      />

      {/* Ultra-Smooth 60FPS Canvas Stars Layer */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-10 block h-full w-full"
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
