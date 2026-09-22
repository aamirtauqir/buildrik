/**
 * useHistoryChip — single boolean "does this site have history worth
 * showing a chip for?" used by the rail and ToolSubNav to mark the
 * History tab. B8 plan.
 *
 * Signal: at least one NAMED saved version (B2's save pill creates them).
 * Publish history is per-job and already represented inside the History
 * tab's Published sub-view and ComparePicker — surfacing a chip for it
 * too would mean a one-shot fetch on every LeftSidebar mount, and the
 * named-versions signal flips the chip on for the exact sites where the
 * History tab has anything to compare against.
 *
 * Reactive: subscribes to VERSION_LIST_UPDATED so the chip appears the
 * instant a save lands and disappears when the last version is deleted,
 * without re-mounting LeftSidebar.
 */
import * as React from "react";
import type { Composer } from "../../engine";
import { EVENTS } from "../constants/events";

export interface UseHistoryChipReturn {
  /** True iff the site has at least one named saved version. */
  hasHistory: boolean;
}

export function useHistoryChip(composer: Composer | null): UseHistoryChipReturn {
  const [hasHistory, setHasHistory] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!composer?.versions) {
      setHasHistory(false);
      return;
    }

    const refresh = () => {
      const versions = composer.versions?.getVersions() ?? [];
      setHasHistory(versions.length > 0);
    };

    // Seed read (the manager's storage read is async; events fire when it
    // settles, but we want the chip correct on first paint too).
    refresh();

    composer.on(EVENTS.VERSION_LIST_UPDATED, refresh);
    return () => {
      composer.off(EVENTS.VERSION_LIST_UPDATED, refresh);
    };
  }, [composer]);

  return { hasHistory };
}
