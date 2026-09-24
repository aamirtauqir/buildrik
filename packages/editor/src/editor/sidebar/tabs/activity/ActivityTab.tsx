/**
 * Activity — its own right-column panel (board 4418:140587; owner ruling
 * 2026-09-25: "Activity follows Figma: its own panel, not a tab inside
 * History"). Doors: site menu "Activity log", ⌘K "Open Activity", the
 * notifications popover's "View all activity ›".
 *
 * A row opens its subject in the editor and the landing panel draws
 * "‹ Activity" to come back: comments → Review, publishes → History ›
 * Published, edits → History › Session.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { PanelFrame } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants/events";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { ActivityLogView } from "./ActivityLogView";
import { FROM_ACTIVITY } from "./BackToActivityRow";

export const ActivityTab: React.FC<{
  composer: Composer | null;
  projectId?: string | null;
  onClose?: () => void;
}> = ({ composer, projectId, onClose }) => {
  const siteId = React.useMemo(() => projectId ?? getSiteIdFromUrl(), [projectId]);
  return (
    <PanelFrame data-testid="activity-panel">
      <PanelFrame.Header title="Activity" onClose={onClose} />
      <ActivityLogView
        siteId={siteId ?? null}
        onOpenRow={(kind) =>
          composer?.emit(
            EVENTS.UI_PANEL_OPEN,
            kind === "comment"
              ? { panel: "review", screen: FROM_ACTIVITY }
              : { panel: "history", screen: `${FROM_ACTIVITY}:${kind === "publish" ? "published" : "session"}` },
          )
        }
      />
    </PanelFrame>
  );
};
