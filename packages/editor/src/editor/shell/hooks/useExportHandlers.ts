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
import { ToastInput } from "@/editor/ui";
import type { Composer } from "../../../engine";
import { ExportEngine } from "../../../engine/export";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { DASHBOARD_URL as dashboardUrlFromEnv } from "@/shared/utils/runtimeEnv";
import { usePublishJob, type UsePublishJobResult } from "./usePublishJob";
import { exportPublishPages } from "../exportPublishPages";
import { captureAndUploadThumbnail } from "../captureThumbnail";

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

  // needs-approval has no acknowledge path — there is no review to over-ride —
  // so surface it as an informational toast, not a dialog. Clear the block after
  // so it doesn't re-fire. (stale-approval is handled by the dialog in the shell.)
  const dismissBlock = publishJob.dismissBlock;
  React.useEffect(() => {
    if (publishJob.blockedReason === "needs-approval") {
      addToast({
        title: "Approval needed",
        description:
          "This site needs an approved review before it can be published. Send it for review from the top bar.",
        tone: "warning",
        duration: 6000,
      });
      dismissBlock();
    }
  }, [publishJob.blockedReason, dismissBlock, addToast]);

  // Surface publish completion / failure as toasts.
  React.useEffect(() => {
    if (publishJob.uiState === "published" && publishJob.publishedUrl) {
      addToast({
        title: "Site published",
        description: publishJob.publishedUrl,
        tone: "success",
        duration: 6000,
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
        addToast({ title: "Publish failed", description: msg, tone: "error" });
      }
    }
  }, [publishJob.uiState, publishJob.publishedUrl, publishJob.error, addToast]);

  return { handleExportHTML, handleVercelPublish, handlePublishAcknowledged, publishJob };
}
