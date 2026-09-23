/**
 * The horizontal slice of the canvas frame the user can actually see.
 *
 * The desktop frame carries a real min-width (1024, the desktop breakpoint)
 * and can be wider than its scroll viewport — at 1440x900 with a drawer and
 * the inspector open the viewport is ~776 wide. Anything centred on the FRAME
 * then centres off-screen: the empty page's "Start blank" sat under the
 * inspector (QA, integration 5e0d47902). Returned in frame pixels (zoom
 * undone), so an overlay inside the frame can be pinned to what is visible
 * while it stays inside the frame and keeps receiving the frame's drops.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";

export interface FrameSpan {
  left: number;
  width: number;
}

export function measureVisibleFrameSpan(scroll: HTMLElement, frame: HTMLElement): FrameSpan | null {
  const view = scroll.getBoundingClientRect();
  const box = frame.getBoundingClientRect();
  const scale = frame.offsetWidth > 0 ? box.width / frame.offsetWidth : 1;
  const from = Math.max(view.left, box.left);
  const to = Math.min(view.right, box.right);
  if (to <= from || scale <= 0) return null;
  return { left: (from - box.left) / scale, width: (to - from) / scale };
}

export function useVisibleFrameSpan(
  scrollRef: React.RefObject<HTMLElement | null>,
  frameRef: React.RefObject<HTMLElement | null>,
  active: boolean,
): FrameSpan | null {
  const [span, setSpan] = React.useState<FrameSpan | null>(null);

  React.useEffect(() => {
    const scroll = scrollRef.current;
    const frame = frameRef.current;
    if (!active || !scroll || !frame) return;
    const update = () => {
      const next = measureVisibleFrameSpan(scroll, frame);
      setSpan((prev) => (prev && next && prev.left === next.left && prev.width === next.width ? prev : next));
    };
    update();
    scroll.addEventListener("scroll", update, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    ro?.observe(scroll);
    ro?.observe(frame);
    return () => {
      scroll.removeEventListener("scroll", update);
      ro?.disconnect();
    };
  }, [scrollRef, frameRef, active]);

  return active ? span : null;
}
