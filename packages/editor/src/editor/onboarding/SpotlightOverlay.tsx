/**
 * SpotlightOverlay — dims the entire screen except one highlighted element.
 *
 * Uses the CSS box-shadow cutout technique:
 *   A positioned div sits exactly over the target element.
 *   A massive box-shadow spills out and covers the rest of the screen.
 *   Pointer events are disabled so the user can still interact normally.
 *
 * z-index: 1100 — above the editor (< 1200 checklist, < 1300 modals).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface SpotlightOverlayProps {
  /** DOM id of the element to spotlight. Null/undefined = overlay hidden. */
  targetId: string | null | undefined;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const SpotlightOverlay: React.FC<SpotlightOverlayProps> = ({ targetId }) => {
  const [rect, setRect] = React.useState<Rect | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    if (!targetId) {
      setMounted(false);
      // Delay clearing rect so the fade-out animation plays
      const t = setTimeout(() => setRect(null), 300);
      return () => clearTimeout(t);
    }

    const measure = () => {
      const el = document.getElementById(targetId);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      setMounted(true);
    };

    measure();

    const ro = new ResizeObserver(measure);
    const el = document.getElementById(targetId);
    if (el) ro.observe(el);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [targetId]);

  if (!rect) return null;

  const pad = 8; // breathing room around the target

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
        borderRadius: 10,
        // The massive shadow IS the dimmed overlay — nothing else needed
        boxShadow: "0 0 0 9999px rgba(0,0,0,0.58)",
        // Subtle blue ring to draw the eye
        outline: "2px solid rgba(99,133,255,0.7)",
        outlineOffset: 1,
        pointerEvents: "none",
        zIndex: 1100,
        opacity: mounted ? 1 : 0,
        transition:
          "top 280ms cubic-bezier(0.4,0,0.2,1), " +
          "left 280ms cubic-bezier(0.4,0,0.2,1), " +
          "width 280ms cubic-bezier(0.4,0,0.2,1), " +
          "height 280ms cubic-bezier(0.4,0,0.2,1), " +
          "opacity 200ms ease",
      }}
    />
  );
};

export default SpotlightOverlay;
