/**
 * useSelectionAnimation - GSAP hook for smooth selection box transitions
 * Animates the selection box rectangle with spring-like physics
 *
 * @license BSD-3-Clause
 */

import gsap from "gsap";
import * as React from "react";

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function useSelectionAnimation(
  targetRef: React.RefObject<HTMLDivElement | null>,
  rect: Rect | null
) {
  const lastRectRef = React.useRef<Rect | null>(null);

  React.useEffect(() => {
    if (!targetRef.current || !rect) {
      lastRectRef.current = rect;
      return;
    }

    const { left, top, width, height } = rect;

    // If no previous rect, perform entrance animation
    if (!lastRectRef.current) {
      gsap.fromTo(
        targetRef.current,
        {
          opacity: 0,
          scale: 0.95,
          left: left - 1,
          top: top - 1,
          width: width + 2,
          height: height + 2,
        },
        {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          ease: "elastic.out(1, 0.75)",
        }
      );
    } else {
      // Transition from previous rect
      gsap.to(targetRef.current, {
        left: left - 1,
        top: top - 1,
        width: width + 2,
        height: height + 2,
        duration: 0.5,
        ease: "power4.out", // Smooth deceleration
        overwrite: "auto",
      });
    }

    lastRectRef.current = rect;
  }, [rect, targetRef]);
}
