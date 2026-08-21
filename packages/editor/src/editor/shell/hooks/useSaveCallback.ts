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
import {
  getSiteIdFromUrl,
  saveProject,
  SaveConflictError,
  SETTINGS_MIRROR_ERROR_EVENT,
} from "@/services/BuildrikSyncProvider";
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
  /* The pages and the site-column mirror ride in one batch. A refused mirror
     used to reject the whole save, so "Save failed — retry" appeared over
     pages that were already on the server. The page save now answers for
     itself; this says the smaller true thing about the other half. */
  React.useEffect(() => {
    const onMirrorError = (e: Event) => {
      const message = (e as CustomEvent<{ message: string }>).detail?.message ?? "";
      addToast({
        title: "Saved — site settings didn't",
        description: `Your pages are on the server. The site-level settings were refused: ${message}`,
        tone: "warning",
      });
    };
    window.addEventListener(SETTINGS_MIRROR_ERROR_EVENT, onMirrorError);
    return () => window.removeEventListener(SETTINGS_MIRROR_ERROR_EVENT, onMirrorError);
  }, [addToast]);

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
        /* The save was refused before it left the browser, because this
           site's project never loaded — saving now would replace the stored
           pages with whatever the fallback put on screen. Reload is the fix,
           and it is the ONLY thing to offer: a Retry would repeat the
           overwrite. */
        if (errorMessage.includes("PROJECT_NOT_LOADED")) {
          setSaveState((prev) => ({ ...prev, status: "error", error: errorMessage }));
          /* A deleted site gets a different story and a different action:
             Reload cannot bring it back, so offering it sends the user round a
             loop that ends where it started. */
          const gone = errorMessage.includes("SITE_MISSING");
          addToast({
            title: gone ? "This site isn't there anymore" : "Not saved — this site never loaded",
            description: gone
              ? "It was deleted, or it isn't yours to open — either way nothing can be saved to it."
              : "Saving now would overwrite the stored pages with what's on screen. Reload to get the real site first.",
            tone: "warning",
            action: gone
              ? {
                  label: "Go to dashboard",
                  onClick: () => {
                    window.location.href = `${DASHBOARD_URL}/dashboard`;
                  },
                }
              : { label: "Reload", onClick: () => window.location.reload() },
          });
          return "error";
        }
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
