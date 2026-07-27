"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

export type RevealDirection = "up" | "down" | "left" | "right" | "none";

export interface RevealProps {
  children: ReactNode;
  delay?: number;
  direction?: RevealDirection;
  duration?: number;
  className?: string;
}

export function Reveal({
  children,
  delay = 0,
  direction = "up",
  duration = 700,
  className = "",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const getInitialTransform = () => {
    switch (direction) {
      case "up":
        return "translate-y-8 scale-[0.97]";
      case "down":
        return "-translate-y-8 scale-[0.97]";
      case "left":
        return "translate-x-8 scale-[0.97]";
      case "right":
        return "-translate-x-8 scale-[0.97]";
      case "none":
        return "scale-[0.95]";
    }
  };

  return (
    <div
      ref={ref}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
      className={`transition-all ease-royal ${
        isVisible
          ? "opacity-100 translate-x-0 translate-y-0 scale-100"
          : `opacity-0 ${getInitialTransform()}`
      } ${className}`}
    >
      {children}
    </div>
  );
}
