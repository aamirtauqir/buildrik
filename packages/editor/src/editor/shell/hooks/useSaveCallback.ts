/**
 * useSaveCallback — extracted from AquibraStudio (Phase D D2 split,
 * stage 2). Owns the saveProject() flow:
 *
 *   1. Bail if no composer.
 *   2. Set saveState → "saving" (preserves prior fields).
 *   3. composer.saveProject() promise:
 *      - resolved → saveState → idle + lastSavedAt, isDirty=false,
 *        success toast (1.8s).
 *      - rejected → map error message to a user-friendly hint
 *        (network/storage/permission/timeout/default), saveState →
 *        error, error toast with Retry action that re-invokes save.
 *
 * The Retry action closes over the returned `save` reference so it
 * always retries with current closure state.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import type { ToastInput } from "@/editor/shared/vibcoder/Toast";
import type { SaveState } from "./useStudioState";
import { getSiteIdFromUrl, saveProject } from "@/services/BuildrikSyncProvider";

export interface UseSaveCallbackOptions {
  composer: Composer | null;
  addToast: (input: ToastInput) => string;
  setSaveState: React.Dispatch<React.SetStateAction<SaveState>>;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
}

export type SaveProjectFn = () => void;

// Map raw composer error → user-friendly explanation. Pure helper kept
// alongside the hook so future contributors see all save-error mapping
// in one place.
function explainSaveError(rawMessage: string): string {
  if (rawMessage.includes("network") || rawMessage.includes("fetch")) {
    return "Network error — check your internet connection and try again.";
  }
  if (rawMessage.includes("storage") || rawMessage.includes("quota")) {
    return "Storage full — try clearing browser data or exporting your project.";
  }
  if (rawMessage.includes("permission") || rawMessage.includes("denied")) {
    return "Permission denied — try refreshing the page.";
  }
  if (rawMessage.includes("timeout")) {
    return "Request timed out — the server may be busy, try again shortly.";
  }
  return "Could not save project.";
}

export function useSaveCallback({
  composer,
  addToast,
  setSaveState,
  setIsDirty,
}: UseSaveCallbackOptions): SaveProjectFn {
  const save = React.useCallback(() => {
    if (!composer) return;
    setSaveState((prev) => ({ ...prev, status: "saving", error: undefined }));
    // When the editor is bound to a dashboard site, manual Save / Cmd+S must
    // persist to the dashboard (same path as autosave) — composer.saveProject()
    // alone only writes localStorage, so the "Saved" toast was a lie for
    // dashboard-backed projects.
    const siteId = getSiteIdFromUrl();
    const savePromise = siteId
      ? saveProject(siteId, composer.exportProject()).then(() => undefined)
      : composer.saveProject();
    savePromise
      .then(() => {
        setSaveState({ status: "idle", lastSavedAt: Date.now(), error: undefined });
        setIsDirty(false);
        addToast({
          title: "Saved",
          description: "Project saved successfully",
          tone: "success",
          duration: 1800,
        });
      })
      .catch((err) => {
        const errorMessage = err?.message || "Unknown error";
        const userMessage = explainSaveError(errorMessage);
        setSaveState((prev) => ({ ...prev, status: "error", error: errorMessage }));
        addToast({
          title: "Save failed",
          description: userMessage,
          tone: "error",
          action: { label: "Retry", onClick: () => save() },
        });
      });
  }, [composer, addToast, setSaveState, setIsDirty]);

  return save;
}
