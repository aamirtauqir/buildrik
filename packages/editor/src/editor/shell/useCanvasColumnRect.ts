/**
 * The canvas column's box, for the strips the 2L9 boards draw over the top of
 * the canvas (C05 save failed `10:2199`, G07–G09 kept work `225:5474`…).
 * They mount in the overlay root (not inside Canvas, which is not a lane
 * path), so they measure the column Canvas marks with `data-bk-toast-anchor`.
 *
 * Full-page views (Settings, Brand, Templates) squeeze the column without
 * unmounting it — to 0 in Settings, to a 48px sliver in Brand (measured
 * 2026-10-07: a strip 32px wide, one word per line). So "non-zero" is not the
 * test; "can hold the strip" (`minWidth`) is. Null = no usable column.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";

export function useCanvasColumnRect(minWidth: number): DOMRect | null {
  const [col, setCol] = React.useState<DOMRect | null>(null);
  React.useLayoutEffect(() => {
    const el = document.querySelector("[data-bk-toast-anchor]");
    const update = () => {
      const rect = el?.getBoundingClientRect() ?? null;
      setCol(rect && rect.width >= minWidth ? rect : null);
    };
    update();
    window.addEventListener("resize", update);
    const ro = typeof ResizeObserver === "undefined" || !el ? null : new ResizeObserver(update);
    if (el) ro?.observe(el);
    return () => {
      window.removeEventListener("resize", update);
      ro?.disconnect();
    };
  }, [minWidth]);
  return col;
}
