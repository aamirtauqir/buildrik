/**
 * useExportHandlers — extracted from AquibraStudio (Phase D D2 split,
 * stage 4). Owns the complete export + publish lifecycle:
 *
 *   - handleExportHTML        → ExportEngine.downloadZip() + toasts.
 *   - handleExportForDeploy   → ExportEngine.exportAllPages() →
 *                               { files, projectName } payload for the
 *                               Vercel deploy path (also fed into
 *                               handleVercelPublish below).
 *   - handleVercelPublish     → siteId resolution → exportForDeploy →
 *                               publishJob.publish(). Hidden behind
 *                               VITE_FEATURE_PUBLISH at the caller.
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
import type { Composer } from "../../../engine";
import { ExportEngine } from "../../../engine/export";
import type { ToastInput } from "@/editor/shared/vibcoder/Toast";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { DASHBOARD_URL as dashboardUrlFromEnv } from "@/shared/utils/runtimeEnv";
import { usePublishJob, type UsePublishJobResult } from "./usePublishJob";

export interface DeployPayload {
  files: { path: string; content: string }[];
  projectName: string;
}

export interface UseExportHandlersOptions {
  composer: Composer | null;
  addToast: (input: ToastInput) => string;
  setExportLoading: (v: boolean) => void;
}

export interface UseExportHandlersResult {
  handleExportHTML: () => Promise<void>;
  handleExportForDeploy: () => Promise<DeployPayload>;
  handleVercelPublish: () => Promise<void>;
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

  const handleExportForDeploy = React.useCallback(async (): Promise<DeployPayload> => {
    if (!composer) throw new Error("Composer not ready");
    const exportEngine = new ExportEngine(composer);
    const result = await exportEngine.exportAllPages({ format: "html", minify: true });
    const settings = composer.getProjectSettings?.();
    const projectName = settings?.seo?.siteName || "aquibra-site";
    return {
      files: result.files.map((f) => ({ path: f.name, content: f.content })),
      projectName,
    };
  }, [composer]);

  const handleVercelPublish = React.useCallback(async () => {
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
      const exported = await handleExportForDeploy();
      const pages = exported.files
        .filter((f) => f.path.endsWith(".html"))
        .map((f) => ({ path: f.path, html: f.content }));
      if (pages.length === 0) {
        addToast({
          title: "Nothing to publish",
          description: "Add at least one page before publishing.",
          tone: "warning",
        });
        return;
      }
      await publishJob.publish(siteId, pages);
    } catch (err) {
      addToast({
        title: "Publish failed",
        description: err instanceof Error ? err.message : "Could not start publish.",
        tone: "error",
      });
    }
  }, [handleExportForDeploy, publishJob, addToast]);

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

  return { handleExportHTML, handleExportForDeploy, handleVercelPublish, publishJob };
}
