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
import { fetchMyRole, invalidateMyRole, roleAtLeast } from "@/services/RoleService";
import { clearUnsaved, keepUnsaved } from "@/services/unsavedRecovery";
import { navigateBypassingUnloadGuard } from "../unloadGuardBypass";

export interface UseSaveCallbackOptions {
  composer: Composer | null;
  addToast: (input: ToastInput) => string;
  setSaveState: React.Dispatch<React.SetStateAction<SaveState>>;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  /** Board 813:4870: a mid-session 401 opens the blocking recovery surface.
   *  When wired, it replaces the session-expired toast; omitted keeps the
   *  toast (back-compat, same shape as onLoadError). */
  onAuthExpired?: () => void;
}

/** A 401-shaped save failure — the session is gone and a re-login fixes it.
 *  FORBIDDEN/403 is deliberately NOT here: that is a role problem a sign-in
 *  cannot fix, and it gets its own copy. One regex pair, two consumers
 *  (manual save here, autosave in useComposerInit). */
export function isAuthSaveError(message: string): boolean {
  return /unauthorized|401|session expired|not signed in/i.test(message);
}

/** A role refusal. Decided on the STRUCTURED tRPC error: the server's
 *  FORBIDDEN carries human text ("Insufficient permissions" from
 *  checkSiteRole) with neither "forbidden" nor "403" in it, so matching the
 *  message sent a real mid-edit demotion (C-9) to the generic "Save failed"
 *  and skipped keepUnsaved. Duck-typed on `data` rather than `instanceof
 *  TRPCClientError`, which a second bundled copy of @trpc/client would fail.
 *  The message test stays for errors that are not tRPC's. */
export function isForbiddenSaveError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const data = (err as { data?: { code?: unknown; httpStatus?: unknown } | null }).data;
  if (data?.code === "FORBIDDEN" || data?.httpStatus === 403) return true;
  return err instanceof Error && /forbidden|403/i.test(err.message);
}

/**
 * A save refused FORBIDDEN mid-session (A15-9 / C-9) — one handler for the
 * manual save and autosave. The refused edit existed only in this tab, so it
 * is kept for the reload (a role can come back). The cached role that offered
 * the edit is dropped and asked for again; if it is now below EDITOR, the
 * editor opens the view mode a VIEWER is sent to (`?view=readonly`: the
 * VIEWER rail, Publish disabled with its reason, and no autosave). Before
 * this the chrome stayed editable and every autosave retried into another
 * 403, repainting the generic "check your connection" banner.
 *
 * Before navigating, the editor is marked clean — the edits are already in
 * keepUnsaved — so the beforeunload guard does not put a Leave/Stay prompt
 * over the switch (review #5). The navigation waits a frame and a task, so
 * the guard has re-read the clean state. The explanation survives the reload
 * through that kept record: the view-mode load shows "Your role no longer
 * allows editing … the edits are kept in this browser" (useComposerInit).
 */
export function refuseForbiddenSave(opts: {
  siteId: string | null;
  composer: Composer;
  addToast: (input: ToastInput) => string;
  setIsDirty: (dirty: boolean) => void;
  setSaveState: React.Dispatch<React.SetStateAction<SaveState>>;
  /** Injectable for tests; the real one replaces the location. */
  navigate?: (url: string) => void;
}): void {
  const { siteId, composer, addToast, setIsDirty, setSaveState } = opts;
  const navigate = opts.navigate ?? ((url: string) => window.location.replace(url));
  if (siteId) keepUnsaved(siteId, composer.exportProject());
  invalidateMyRole();
  addToast({
    title: "You don't have access to save this site",
    description: "Your role changed, or the site isn't yours to edit. Ask the owner.",
    tone: "warning",
  });
  void fetchMyRole().then((role) => {
    if (roleAtLeast(role, "EDITOR") !== false || !siteId) return;
    setIsDirty(false);
    setSaveState({ status: "idle", error: undefined });
    const url = new URL(window.location.href);
    url.searchParams.set("view", "readonly");
    /* L-2: through the unload guard's bypass — clearing isDirty alone left
       its other reasons (shell-dirty surfaces, a save in flight, queued
       mirrors) to put "Leave site?" over the switch. */
    requestAnimationFrame(() =>
      window.setTimeout(() => navigateBypassingUnloadGuard(() => navigate(url.toString())), 0),
    );
  });
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
  onAuthExpired,
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
        /* On the server now, so the recovery copy is no longer missing work.
           Left behind it would offer a stale restore on the next load. */
        if (siteId) clearUnsaved(siteId);
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
        /* Two facts, not one. `isNetwork` says the save died in transport;
           `isOffline` says WHY. They were conflated, so a server that refused
           while the browser was online (error text "Failed to fetch", which
           this regex matches) produced the toast "Offline — not saved" beside
           a pill reading "Save failed — retry" — one event, two causes named,
           and the named one was false. Only navigator can answer "offline". */
        const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
        const isNetwork =
          isOffline || /network|fetch|offline|failed to fetch|connection/i.test(errorMessage);
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
          /* With a siteId nothing local is written, so this edit lives only
             in this tab and a reload discards it. Keep it, so the reload can
             offer it back instead of seeding "Saved · just now" over the gap.
             The siteId-less branch already reaches localStorage. */
          if (siteId) keepUnsaved(siteId, composer.exportProject());
          setSaveState((prev) =>
            siteId ? { ...prev, status: "error", error: errorMessage } : { ...prev, status: "idle" },
          );
          addToast(
            siteId
              ? {
                  title: isOffline ? "Offline — not saved" : "Couldn't reach the server — not saved",
                  description: isOffline
                    ? "Your changes are still open in this tab. Keep it open and save again once you're back online."
                    : "Your changes are still open in this tab. Keep it open and try saving again.",
                  tone: "warning",
                }
              : {
                  title: isOffline
                    ? "Offline — saved on this device"
                    : "Couldn't reach the server — saved on this device",
                  description: "Your edits are in this browser and will go up when they can.",
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
        /* FORBIDDEN used to ride the same regex as 401, so a role revocation
           read as "Session expired" and sent the user to sign in — which would
           change nothing. Different truths, different surfaces. */
        if (isForbiddenSaveError(err)) {
          setSaveState((prev) => ({ ...prev, status: "error", error: errorMessage }));
          refuseForbiddenSave({ siteId, composer, addToast, setIsDirty, setSaveState });
          return "error";
        }
        if (isAuthSaveError(errorMessage)) {
          /* KEEP THE SNAPSHOT. The network branch above already does this, and
             `unsavedRecovery`'s own header says why: with a siteId nothing
             local is written, the topbar reads "Save failed — retry", and on
             the next load the seed puts "Saved just now" over work the product
             discarded. A 401 lands in exactly that state — the modal below
             even says so, "they live in this tab" — and it was the ONE
             recoverable failure that kept nothing, so closing the tab (or the
             reload the user is nudged toward) lost the work a network blip
             would have preserved. `missing` is deliberately NOT given this:
             nothing can ever be saved to a deleted site, and offering a
             restore later would be the lie this module exists to stop.
             `forbidden` IS (A15-9, above): a role can change back. */
          if (siteId) keepUnsaved(siteId, composer.exportProject());
          setSaveState((prev) => ({ ...prev, status: "error", error: errorMessage }));
          if (onAuthExpired) {
            // The blocking surface (board 813:4870) owns the story now.
            onAuthExpired();
          } else {
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
          }
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
  }, [composer, addToast, setSaveState, setIsDirty, onAuthExpired]);

  return save;
}
