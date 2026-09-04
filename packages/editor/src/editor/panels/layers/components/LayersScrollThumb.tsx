/**
 * LayersScrollThumb — board 1082:4835's persistent 4px thumb.
 *
 * Native overlay scrollbars (macOS/Chromium's default, and Chromium's own
 * `::-webkit-scrollbar-thumb` styling still rides the OS's show-on-scroll
 * timing) fade to nothing at rest — the drift a 66-row tree walked into on
 * 2026-08-31: "header/toolbar/footer pin correctly; no scrollbar drawn at
 * rest (board draws a 4px thumb)". This renders the thumb itself from
 * `scrollTop`/`scrollHeight`/`clientHeight` (computeThumbGeometry), so it is
 * on screen whether or not anyone is touching the list. The native
 * scrollbar underneath is hidden in layers-v2.css — one thumb, not two.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { computeThumbGeometry, type ScrollThumbGeometry } from "../data/scrollThumbGeometry";

export interface LayersScrollThumbProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export const LayersScrollThumb: React.FC<LayersScrollThumbProps> = ({ containerRef }) => {
  const [geometry, setGeometry] = React.useState<ScrollThumbGeometry | null>(null);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      setGeometry(
        computeThumbGeometry({
          scrollTop: el.scrollTop,
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
        }),
      );
    };

    measure();
    el.addEventListener("scroll", measure, { passive: true });
    // Row count changes (expand/collapse, search filter, add/delete) resize
    // scrollHeight without the CONTAINER itself resizing — ResizeObserver
    // alone would miss those.
    const contentObserver = new MutationObserver(measure);
    contentObserver.observe(el, { childList: true, subtree: true });
    const sizeObserver = new ResizeObserver(measure);
    sizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", measure);
      contentObserver.disconnect();
      sizeObserver.disconnect();
    };
  }, [containerRef]);

  if (!geometry) return null;

  return (
    <div
      className="tw:absolute tw:right-px tw:w-1 tw:rounded-[2px] tw:pointer-events-none tw:bg-[var(--bk-border-medium)]"
      aria-hidden="true"
      style={{ top: geometry.top, height: geometry.height }}
    />
  );
};

export default LayersScrollThumb;
