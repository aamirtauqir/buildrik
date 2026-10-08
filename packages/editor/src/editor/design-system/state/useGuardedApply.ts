/** Apply buttons run their work at most once at a time (spec D17: a
 *  double-click can never create two transactions). */
import * as React from "react";

export function useGuardedApply() {
  const running = React.useRef(false);
  const [busy, setBusy] = React.useState(false);
  const run = React.useCallback(async (work: () => Promise<boolean>) => {
    if (running.current) return false;
    running.current = true;
    setBusy(true);
    try {
      return await work();
    } finally {
      running.current = false;
      setBusy(false);
    }
  }, []);
  return { busy, run };
}
