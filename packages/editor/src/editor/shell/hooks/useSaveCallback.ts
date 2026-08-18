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
import { ToastInput } from "@/editor/chrome-ui";
import type { Composer } from "../../../engine";
import type { SaveState } from "./useStudioState";
import { getSiteIdFromUrl, saveProject, SaveConflictError } from "@/services/BuildrikSyncProvider";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";

export interface UseSaveCallbackOptions {
  composer: Composer | null;
  addToast: (input: ToastInput) => string;
  setSaveState: React.Dispatch<React.SetStateAction<SaveState>>;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * What actually happened to the save — the honest outcome the exit guard
 * (F1, plan 2026-07-29) needs. "queued-offline" and "conflict" settle the
 * visible status to idle for calm UX, but they are NOT a durable save: the
 * offline queue dies on navigation, and a conflict means a newer copy exists.
 */
export type SaveOutcome = "saved" | "queued-offline" | "conflict" | "error";

export type SaveProjectFn = () => Promise<SaveOutcome>;

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
  const save = React.useCallback((): Promise<SaveOutcome> => {
    if (!composer) return Promise.resolve("error");
    setSaveState((prev) => ({ ...prev, status: "saving", error: undefined }));
    // When the editor is bound to a dashboard site, manual Save / Cmd+S must
    // persist to the dashboard (same path as autosave) — composer.saveProject()
    // alone only writes localStorage, so the "Saved" toast was a lie for
    // dashboard-backed projects.
    const siteId = getSiteIdFromUrl();
    const savePromise = siteId
      ? saveProject(siteId, composer.exportProject()).then(() => undefined)
      : composer.saveProject();
    return savePromise
      .then((): SaveOutcome => {
        setSaveState({ status: "idle", lastSavedAt: Date.now(), error: undefined });
        setIsDirty(false);
        addToast({
          title: "Saved",
          description: "Project saved successfully",
          tone: "success",
          duration: 1800,
        });
        return "saved";
      })
      .catch((err): SaveOutcome => {
        // 61-conflict: a behind-copy is handled by the conflict dialog (the
        // registered handler in BuildrikSyncProvider already opened it). Don't
        // also show a generic "save failed" toast or a Retry that would re-save
        // over the newer copy — just clear the saving spinner.
        if (err instanceof SaveConflictError) {
          /* Was "idle", which the topbar reads as Saved (or Unsaved) — the
             indicator claimed the edit had landed when it had been refused.
             "conflict" is its own status precisely so the chip can say so
             without the scary Save-failed + Retry that would re-save over the
             newer copy. */
          setSaveState((prev) => ({ ...prev, status: "conflict" }));
          return "conflict";
        }
        const errorMessage = err?.message || "Unknown error";
        // 60-save-states: a network/connection failure is NOT a lost save — the
        // edit stays in the local project and syncs on reconnect. Don't show the
        // scary "Save failed" + Retry; clear the spinner (the topbar's offline
        // indicator already says "changes queued") and nudge once, calmly.
        const isNetwork =
          (typeof navigator !== "undefined" && !navigator.onLine) ||
          /network|fetch|offline|failed to fetch|connection/i.test(errorMessage);
        if (isNetwork) {
          /* This copy used to promise, for every project, that the edit was
             "saved on this device and will sync when you're back". For a
             dashboard-backed site BOTH halves were false, and it was checked
             the only way that settles it — edit made, saveProject blocked at
             the network, tab reloaded, edit gone. With a siteId the save is a
             bare RPC (`saveProject`), so nothing this path writes is read back
             on load; and the reconnect queue in `syncRetryQueue` carries CMS,
             components, templates and versions, never the project. Only the
             siteId-less branch runs `composer.saveProject()`, which is the one
             that reaches localStorage — so only it may make the promise. */
          setSaveState((prev) =>
            siteId ? { ...prev, status: "error", error: errorMessage } : { ...prev, status: "idle" },
          );
          addToast(
            siteId
              ? {
                  title: "Offline — not saved",
                  description:
                    "Your changes are still open in this tab. Keep it open and save again once you're back online.",
                  tone: "warning",
                }
              : {
                  title: "Offline — saved on this device",
                  description: "Your edits are in this browser and will go up when you're back.",
                  tone: "info",
                },
          );
          return siteId ? "error" : "queued-offline";
        }
        /* Board S1.5b — an expired session is not a failed save to retry. The
           LOAD path already tells this case apart and offers Sign in
           (useComposerInit); the SAVE path did not, so a signed-out user got
           "Could not save project." with a Retry that could never succeed, and
           no hint that the reason was their session. The copy deliberately does
           NOT claim the work is safe on this device: with a siteId, save goes
           straight to the server (`saveProject`) and never runs the engine's
           localStorage write, so that promise is not ours to make here. */
        const isAuth = /unauthorized|forbidden|401|403|session expired|not signed in/i.test(
          errorMessage,
        );
        if (isAuth) {
          setSaveState((prev) => ({ ...prev, status: "error", error: errorMessage }));
          addToast({
            title: "Session expired",
            description: "Sign in again to save your changes. Keep this tab open.",
            tone: "warning",
            action: {
              label: "Sign in",
              onClick: () => {
                window.open(`${DASHBOARD_URL}/auth`, "_blank", "noopener");
              },
            },
          });
          return "error";
        }
        const userMessage = explainSaveError(errorMessage);
        setSaveState((prev) => ({ ...prev, status: "error", error: errorMessage }));
        addToast({
          title: "Save failed",
          description: userMessage,
          tone: "error",
          action: { label: "Retry", onClick: () => void save() },
        });
        return "error";
      });
  }, [composer, addToast, setSaveState, setIsDirty]);

  return save;
}
