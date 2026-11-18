/**
 * useExportHandlers — extracted from AquibraStudio (Phase D D2 split,
 * stage 4). Owns the complete export + publish lifecycle:
 *
 *   - handleExportHTML        → the Publish panel's "Download code (ZIP)":
 *                               sites.authorizeCodeExport (Pro gate, server
 *                               side) → ExportEngine.downloadZip() + toasts.
 *   - handleVercelPublish     → siteId resolution → save unsaved edits →
 *                               exportPublishPages() → publishJob.publish()
 *                               (REA #9: publish ships the SAVED revision).
 *                               Hidden behind
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
import { ToastInput, openUpgrade } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import { ExportEngine } from "@/engine/export";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { authorizeCodeExport } from "@/services/PublishService";
import { DASHBOARD_URL as dashboardUrlFromEnv } from "@/shared/utils/runtimeEnv";
import { usePublishJob, type UsePublishJobResult } from "./usePublishJob";
import type { SaveProjectFn } from "./useSaveCallback";
import { exportPublishPages, PublishBlockedError } from "../exportPublishPages";
import { captureAndUploadThumbnail } from "../captureThumbnail";

export interface UseExportHandlersOptions {
  composer: Composer | null;
  addToast: (input: ToastInput) => string;
  setExportLoading: (v: boolean) => void;
  /** The shell's one save (useSaveCallback). Publish runs it first when the
   *  document has unsaved edits, so what ships is what is stored. */
  saveProject: SaveProjectFn;
}

export interface UseExportHandlersResult {
  handleExportHTML: () => Promise<void>;
  handleVercelPublish: () => Promise<void>;
  /**
   * Re-run publish acknowledging a stale approval (contracts §1.5) — the
   * "Publish anyway" action on the stale-approval dialog. Saves and
   * re-exports, so it ships the current saved revision, not a stale payload.
   */
  handlePublishAcknowledged: () => Promise<void>;
  publishJob: UsePublishJobResult;
}

/** A publish refused because the document is not (all) saved. */
const NOT_SAVED_TOAST: ToastInput = {
  title: "Publish blocked",
  description: "Your latest changes aren't saved, so nothing was published. Save, then publish again.",
  tone: "neutral",
};

/** The upgrade prompt for downloading code — the panel's client fast path and
 *  the server's refusal open the same one. */
export const CODE_DOWNLOAD_UPGRADE = { feature: "Downloading your site's code" };

export function useExportHandlers({
  composer,
  addToast,
  setExportLoading,
  saveProject,
}: UseExportHandlersOptions): UseExportHandlersResult {
  const publishJob = usePublishJob();

  const handleExportHTML = React.useCallback(async () => {
    if (!composer) return;
    // Code download is Pro on BOTH sides: the server has to say yes before a
    // byte of the ZIP is built. No site means no server to ask.
    const siteId = getSiteIdFromUrl();
    if (!siteId) {
      addToast({
        title: "Cannot download code",
        description: "Open this editor from a site to download its code.",
        tone: "error",
      });
      return;
    }
    setExportLoading(true);
    try {
      let access: "allowed" | "upgrade" | "forbidden";
      try {
        access = await authorizeCodeExport(siteId);
      } catch {
        addToast({
          title: "Couldn't check your plan",
          description: "Nothing was downloaded. Check your connection and try again.",
          tone: "error",
        });
        return;
      }
      if (access === "upgrade") {
        openUpgrade(CODE_DOWNLOAD_UPGRADE);
        return;
      }
      if (access === "forbidden") {
        addToast({
          title: "Only editors can download code",
          description: "Ask a workspace admin for Editor access.",
          tone: "error",
        });
        return;
      }
      const exportEngine = new ExportEngine(composer);
      // Forms post to the same submissions endpoint as Publish.
      await exportEngine.downloadZip("site-export.zip", undefined, { siteId, appOrigin: dashboardUrlFromEnv });
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
        /* REA #9: publish ships the SAVED revision, never the tab's unsaved
           state — the server checks the pages' revision token against the
           stored one. Save only when there is something to save: a save moves
           lastEditedAt, which would stale a fresh approval for nothing. A
           conflict opens its own dialog; any other failure already toasted
           why the save failed, and this says what it means for the publish. */
        if (composer.isDirty()) {
          const outcome = await saveProject();
          if (outcome !== "saved") {
            if (outcome !== "conflict") addToast(NOT_SAVED_TOAST);
            return;
          }
        }
        /* An edit that landed while the save travelled (the save leaves the
           document dirty) or while the pages render is not in the stored
           revision — the pages would not match it. */
        const savedSeq = composer.getChangeSeq();
        if (composer.isDirty()) {
          addToast(NOT_SAVED_TOAST);
          return;
        }
        const pages = await exportPublishPages(composer);
        if (composer.getChangeSeq() !== savedSeq) {
          addToast(NOT_SAVED_TOAST);
          return;
        }
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
        /* 8139:218055 — a CMS blocker is "Publish blocked", toned neutral:
           the publish never started, and the sentence names the way out. */
        const blocked = err instanceof PublishBlockedError;
        addToast({
          title: blocked ? "Publish blocked" : "Publish failed",
          description: err instanceof Error ? err.message : "Could not start publish.",
          tone: blocked ? "neutral" : "error",
        });
      }
    },
    [composer, publishJob, addToast, saveProject],
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

  /* The three no-acknowledge gates (boards 307:2193 / 307:2203 / 307:2213) are
     a MODAL now — `PublishGateModal`, rendered by StudioPanels off this same
     `blockedReason`. They used to be raised here as a warning toast that
     dismissed the block in the same breath, which had two consequences worth
     naming: the way out was described in prose ("Open the Review panel (press
     R)") rather than offered, and the reason was cleared before anything else
     could read it, so no dialog could ever have been driven from it. All three
     boards draw the door as a button. `stale-approval` keeps its own dialog —
     it is the only gate with something to over-ride. */

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
        // D10: a failure without a retry door strands the user. Save and
        // re-export on retry, so it ships the current saved revision.
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
