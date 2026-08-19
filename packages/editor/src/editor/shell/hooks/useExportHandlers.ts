/**
 * useExportHandlers — extracted from AquibraStudio (Phase D D2 split,
 * stage 4). Owns the complete export + publish lifecycle:
 *
 *   - handleExportHTML        → ExportEngine.downloadZip() + toasts.
 *   - handleVercelPublish     → siteId resolution → exportPublishPages() →
 *                               publishJob.publish(). Hidden behind
 *                               VITE_FEATURE_PUBLISH at the caller.
 *                               The Vercel project name is derived server-side
 *                               from the site's slug; the editor does not send one.
 *   - usePublishJob()         → instantiated inside the hook so the
 *                               returned `publishJob` is the same
 *                               instance the publish-toast effect
 *                               subscribes to.
 *   - publish-toast effect    → surfaces COMPLETED / FAILED publish
 *                               states as success / error toasts.
 *
 * Returning `publishJob` keeps the orchestrator's render path
 * (Topbar publishState/publishedUrl wiring) unchanged.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ToastInput } from "@/editor/chrome-ui";
import type { Composer } from "../../../engine";
import { ExportEngine } from "../../../engine/export";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { DASHBOARD_URL as dashboardUrlFromEnv } from "@/shared/utils/runtimeEnv";
import { usePublishJob, type UsePublishJobResult } from "./usePublishJob";
import { exportPublishPages } from "../exportPublishPages";
import { captureAndUploadThumbnail } from "../captureThumbnail";

/** Copy for each approval gate that has no over-ride path (board S5.4). */
const APPROVAL_GATE_TOASTS: Record<string, { title: string; description: string }> = {
  "no-review": {
    title: "Approval needed",
    /* "from the top bar" — the Send-for-review control lives in client view
       only (StudioHeader renders it under viewMode.clientView). */
    description:
      "This site hasn't been sent for review yet. Open client view from the Site menu and send it from there.",
  },
  "review-pending": {
    title: "Waiting on review",
    description: "This site is with its reviewer. You can publish once it's approved.",
  },
  "changes-requested": {
    title: "Changes requested",
    description:
      "The reviewer asked for changes. Resolve the open comments, then re-send for review.",
  },
};

export interface UseExportHandlersOptions {
  composer: Composer | null;
  addToast: (input: ToastInput) => string;
  setExportLoading: (v: boolean) => void;
}

export interface UseExportHandlersResult {
  handleExportHTML: () => Promise<void>;
  handleVercelPublish: () => Promise<void>;
  /**
   * Re-run publish acknowledging a stale approval (contracts §1.5) — the
   * "Publish anyway" action on the stale-approval dialog. Re-exports the
   * current pages so it ships what's on the canvas now, not a stale payload.
   */
  handlePublishAcknowledged: () => Promise<void>;
  publishJob: UsePublishJobResult;
}

export function useExportHandlers({
  composer,
  addToast,
  setExportLoading,
}: UseExportHandlersOptions): UseExportHandlersResult {
  const publishJob = usePublishJob();

  const handleExportHTML = React.useCallback(async () => {
    if (!composer) return;
    setExportLoading(true);
    try {
      const exportEngine = new ExportEngine(composer);
      await exportEngine.downloadZip("site-export.zip");
      addToast({
        title: "Export complete",
        description: "Your site has been downloaded as a zip file.",
        tone: "success",
        duration: 3000,
      });
    } catch (err) {
      addToast({
        title: "Export failed",
        description: err instanceof Error ? err.message : "Could not export your site.",
        tone: "error",
      });
    } finally {
      setExportLoading(false);
    }
  }, [composer, addToast, setExportLoading]);

  const runPublish = React.useCallback(
    async (acknowledgeStale: boolean) => {
      const siteId = getSiteIdFromUrl();
      if (!siteId) {
        addToast({
          title: "Cannot publish",
          description: "Open this editor from a site URL with ?siteId=… to publish.",
          tone: "error",
        });
        return;
      }
      try {
        if (!composer) throw new Error("Composer not ready");
        const pages = await exportPublishPages(composer);
        if (pages.length === 0) {
          addToast({
            title: "Nothing to publish",
            description: "Add at least one page before publishing.",
            tone: "warning",
          });
          return;
        }
        // Fire-and-forget: snapshot the home page for the site's card thumbnail.
        // Runs before publish (so the preview reflects current content even if a
        // Vercel publish is blocked or fails), never awaited, and swallows its
        // own errors — it cannot delay or fail the publish the user triggered.
        void captureAndUploadThumbnail(siteId, pages[0].html);
        await publishJob.publish(siteId, pages, { acknowledgeStale });
      } catch (err) {
        addToast({
          title: "Publish failed",
          description: err instanceof Error ? err.message : "Could not start publish.",
          tone: "error",
        });
      }
    },
    [composer, publishJob, addToast],
  );

  const handleVercelPublish = React.useCallback(() => runPublish(false), [runPublish]);
  const handlePublishAcknowledged = React.useCallback(() => runPublish(true), [runPublish]);

  // The retry door below needs `runPublish`, but `runPublish` rotates identity
  // every render (`usePublishJob` returns a fresh object literal), and the
  // outcome effect fires on its deps. Depending on it directly re-toasted the
  // same outcome on every render for as long as the job sat in `published`.
  // The ref keeps the door live while the effect stays keyed on the outcome.
  const runPublishRef = React.useRef(runPublish);
  React.useEffect(() => {
    runPublishRef.current = runPublish;
  }, [runPublish]);

  // The three no-acknowledge gates (board S5.4) have no path to over-ride —
  // there is no approval yet — so each is an informational toast, not a dialog.
  // They differ only in what the user should do next, which is the entire
  // reason the board draws them apart: one sentence covering all three told
  // someone already waiting on a reviewer to go send a review.
  // (stale-approval is handled by the dialog in the shell.)
  const dismissBlock = publishJob.dismissBlock;
  React.useEffect(() => {
    const copy = publishJob.blockedReason ? APPROVAL_GATE_TOASTS[publishJob.blockedReason] : undefined;
    if (copy) {
      addToast({ ...copy, tone: "warning", duration: 6000 });
      dismissBlock();
    }
  }, [publishJob.blockedReason, dismissBlock, addToast]);

  // Surface publish completion / failure as toasts. This effect is the ONE
  // owner of outcome UX (eng D10) — the topbar renders the transient
  // "✓ Published" state and announces, but never toasts.
  React.useEffect(() => {
    if (publishJob.uiState === "published" && publishJob.publishedUrl) {
      const url = publishJob.publishedUrl;
      addToast({
        title: "Published — site is live",
        description: url,
        tone: "success",
        duration: 6000,
        // D10: the victory moment carries its own door — the live site.
        action: { label: "View live", onClick: () => window.open(url, "_blank", "noopener,noreferrer") },
      });
    } else if (publishJob.uiState === "failed" && publishJob.error) {
      const msg = publishJob.error;
      const dashboardUrl = dashboardUrlFromEnv;
      const openIntegrations = () =>
        window.open(`${dashboardUrl}/dashboard/settings/integrations`, "_blank");

      if (msg.includes("VERCEL_NOT_CONNECTED")) {
        addToast({
          title: "Vercel not connected",
          description: "Connect this workspace to Vercel before publishing.",
          tone: "error",
          action: { label: "Open settings", onClick: openIntegrations },
        });
      } else if (msg.includes("VERCEL_TOKEN_INVALID")) {
        addToast({
          title: "Vercel connection lost",
          description: "Reconnect Vercel in workspace settings to publish again.",
          tone: "error",
          action: { label: "Reconnect", onClick: openIntegrations },
        });
      } else {
        // D10: a failure without a retry door strands the user. Re-export on
        // retry so it ships what's on the canvas now, not a stale payload.
        addToast({
          title: "Publish failed",
          description: msg,
          tone: "error",
          action: { label: "Try again", onClick: () => void runPublishRef.current(false) },
        });
      }
    }
  }, [publishJob.uiState, publishJob.publishedUrl, publishJob.error, addToast]);

  return { handleExportHTML, handleVercelPublish, handlePublishAcknowledged, publishJob };
}
