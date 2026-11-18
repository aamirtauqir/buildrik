/**
 * useCompactWidth — true below the boards' 1440 frame, where an area's
 * navigation column no longer fits beside its list and summary (2L9 B6-K27
 * Components at 1280 × 640; Brand B6-B51 draws the same fold).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";

export const COMPACT_QUERY = "(max-width: 1439px)";

function query(): MediaQueryList | null {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia(COMPACT_QUERY) : null;
}

export function useCompactWidth(): boolean {
  const [compact, setCompact] = React.useState(() => query()?.matches ?? false);
  React.useEffect(() => {
    const mq = query();
    if (!mq) return;
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);
  return compact;
}
