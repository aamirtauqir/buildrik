/**
 * useReducedMotion — Reactive hook for prefers-reduced-motion
 * Returns true when the user has requested reduced motion
 *
 * @license BSD-3-Clause
 */

import { useState, useEffect } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function getMatchMedia(): ((q: string) => MediaQueryList) | null {
  if (typeof window === "undefined") return null;
  // jsdom and some legacy environments don't implement matchMedia.
  return typeof window.matchMedia === "function" ? window.matchMedia.bind(window) : null;
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    const mm = getMatchMedia();
    return mm ? mm(QUERY).matches : false;
  });

  useEffect(() => {
    const mm = getMatchMedia();
    if (!mm) return;
    const mq = mm(QUERY);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}
