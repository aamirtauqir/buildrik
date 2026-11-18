/**
 * Raise "This workspace will be deleted on …" (2L9 B7-G20 `227:8473` for the
 * owner, with Cancel deletion; B7-G21 `227:9003` for everyone else, who can
 * only ask the owner). The date is the server's `deletionScheduledAt`, read
 * once with the site; publishing is already refused while it is set.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { fetchSitePublishState } from "@/services/PublishService";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { useEditorRole } from "./hooks/useEditorRole";
import { BANNER_ID, clearGlobalBanner, showWorkspaceDeletionBanner } from "./globalBanners";

export function useWorkspaceDeletionBanner(): void {
  const role = useEditorRole();
  const [at, setAt] = React.useState<Date | null>(null);
  React.useEffect(() => {
    const siteId = getSiteIdFromUrl();
    if (!siteId) return;
    let alive = true;
    fetchSitePublishState(siteId)
      .then((s) => {
        if (alive && s.workspaceDeletionAt) setAt(new Date(s.workspaceDeletionAt));
      })
      .catch(() => {
        /* Unknown is not scheduled: the load-failure surfaces own a dead server. */
      });
    return () => {
      alive = false;
    };
  }, []);
  React.useEffect(() => {
    if (!at) return;
    const cancel =
      role === "OWNER" ? () => window.open(`${DASHBOARD_URL}/dashboard`, "_blank", "noopener") : null;
    showWorkspaceDeletionBanner(at, cancel);
    return () => clearGlobalBanner(BANNER_ID.workspaceDeletion);
  }, [at, role]);
}
