"use client";

import { Children, isValidElement, cloneElement, ReactNode } from "react";
import { Reveal, RevealDirection } from "./reveal";

export interface StaggerContainerProps {
  children: ReactNode;
  staggerDelay?: number;
  baseDelay?: number;
  direction?: RevealDirection;
  className?: string;
}

export function StaggerContainer({
  children,
  staggerDelay = 100,
  baseDelay = 0,
  direction = "up",
  className = "",
}: StaggerContainerProps) {
  const childArray = Children.toArray(children);

  return (
    <div className={className}>
      {childArray.map((child, index) => {
        const itemDelay = baseDelay + index * staggerDelay;

        if (isValidElement(child)) {
          return (
            <Reveal key={child.key ?? index} delay={itemDelay} direction={direction}>
              {child}
            </Reveal>
          );
        }

        return child;
      })}
    </div>
  );
}
