/**
 * useServerConflict — the state behind ConflictModal's two variants (design
 * decision 11, eng re-review D21):
 *
 *   save     — SAVE_CONFLICT_EVENT: a save was refused because the server
 *              moved. The server's copy is fetched fresh (O7) for who/when
 *              and "Review differences".
 *   restore  — RESTORE_OFFER_EVENT: the load found edits that never reached
 *              the server (BK-04). The server's copy is the one on screen.
 *
 * What each action does (O1, BK-59, R1):
 *   save · Keep      reload (the dialog already discarded the kept copy)
 *   save · History   the tab's copy as a "Before reload — <time>" version,
 *                    then reload — only once written (BD-35)
 *   save · Replace   keep the server copy as a "Before overwrite" version,
 *                    adopt its token, save this tab's copy over it
 *   restore · Keep      stay on the server copy (the kept copy is discarded)
 *   restore · History   the kept copy as an "Unsaved edits — <time>"
 *                       version; nothing deleted, stays open (BD-35)
 *   restore · Restore   keep the server copy as a version unless the kept
 *                       edits were made on it, then put the edits on screen
 *                       and save them
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine/Composer";
import type { ToastInput } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants/events";
import type { ProjectData } from "@shared/types";
import {
  getBaselineLastEditedAt,
  getLoadedLastEditedBy,
  readServerCopy,
  SAVE_CONFLICT_EVENT,
  setBaselineLastEditedAt,
} from "@/services/BuildrikSyncProvider";
import {
  compareKeptToServer,
  onOffScreenSettled,
  peekOffScreenUnsaved,
  RESTORE_OFFER_EVENT,
  takeOffScreenUnsaved,
  type KeptVsServer,
} from "@/services/unsavedRecovery";
import { trackEvent } from "@/shared/utils/errorTracking";
import type { ConflictModalProps, ServerCopyInfo } from "../modals/ConflictModal";
import { navigateBypassingUnloadGuard } from "../unloadGuardBypass";
import type { SaveState } from "./useStudioState";

type Dialog =
  | { variant: "save"; serverToken: string; brandFormat: boolean; open: boolean }
  | { variant: "restore"; relation: KeptVsServer; keptAt: string | null; open: boolean };

export interface UseServerConflictOptions {
  composer: Composer | null;
  siteId: string | null;
  addToast: (input: ToastInput) => string;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  setSaveState: React.Dispatch<React.SetStateAction<SaveState>>;
  saveProject: () => unknown;
}

/* Long enough to read the "Saved to History" toast before the save variant
   reloads; the version itself is already in History (IndexedDB). */
const RELOAD_AFTER_SAVE_MS = 1200;

const clockTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const UNSAVED_OFF_SCREEN = "This site has edits that never reached the server.";

const reload = () => navigateBypassingUnloadGuard(() => window.location.reload());

export function useServerConflict(opts: UseServerConflictOptions): {
  /** The dialog is up for a save conflict (the save pill reopens it). */
  reopenSaveConflict: () => void;
  modalProps: Omit<ConflictModalProps, "open"> & { open: boolean };
} {
  const { composer, siteId, addToast, setIsDirty, setSaveState, saveProject } = opts;
  const [dialog, setDialog] = React.useState<Dialog | null>(null);
  const [server, setServer] = React.useState<ServerCopyInfo>({ status: "loading" });
  /* The server copy the save variant showed — what Replace keeps as a version. */
  const serverCopy = React.useRef<{ project: ProjectData; lastEditedAt: string | null } | null>(null);

  React.useEffect(() => {
    const onConflict = (e: Event) => {
      const detail = (e as CustomEvent<{ serverLastEditedAt: string; brandFormat?: boolean }>).detail;
      const token = detail?.serverLastEditedAt;
      if (!token) return;
      /* Idempotent while open: repeated autosave conflicts don't restack. */
      setDialog((d) => {
        if (d?.open) return d;
        trackEvent("save.conflict", { brandFormat: detail.brandFormat === true });
        return { variant: "save", serverToken: token, brandFormat: detail.brandFormat === true, open: true };
      });
    };
    window.addEventListener(SAVE_CONFLICT_EVENT, onConflict);
    return () => window.removeEventListener(SAVE_CONFLICT_EVENT, onConflict);
  }, []);

  React.useEffect(() => {
    const onOffer = (e: Event) => {
      const offered = (e as CustomEvent<{ siteId: string }>).detail?.siteId;
      if (!offered || offered !== siteId) return;
      const kept = peekOffScreenUnsaved(offered);
      if (!kept) return;
      setDialog((d) =>
        d?.open && d.variant === "save"
          ? d
          : { variant: "restore", relation: compareKeptToServer(kept, getBaselineLastEditedAt()), keptAt: kept.at, open: true },
      );
    };
    window.addEventListener(RESTORE_OFFER_EVENT, onOffer);
    return () => window.removeEventListener(RESTORE_OFFER_EVENT, onOffer);
  }, [siteId]);

  /* The offer is spent once the kept copy is handed over (a Retry that took
     an unchanged-base copy) or discarded — the dialog goes with it. */
  const restoreOpen = dialog?.variant === "restore" && dialog.open;
  React.useEffect(() => {
    if (!restoreOpen || !siteId) return;
    return onOffScreenSettled(siteId, () => setDialog((d) => (d?.variant === "restore" ? null : d)));
  }, [restoreOpen, siteId]);

  /* What the server holds, for who/when and the differences. */
  const saveOpen = dialog?.variant === "save" && dialog.open;
  React.useEffect(() => {
    if (!dialog?.open || !composer) return;
    if (dialog.variant === "restore") {
      const kept = siteId ? peekOffScreenUnsaved(siteId) : null;
      setServer({
        status: "ready",
        by: getLoadedLastEditedBy(),
        at: getBaselineLastEditedAt(),
        differences: kept
          ? composer.versions.compareSnapshots(kept.project, composer.exportProject(), "Your edits", "Server").changes
          : [],
      });
      return;
    }
    if (!siteId) {
      setServer({ status: "unavailable" });
      return;
    }
    let live = true;
    setServer({ status: "loading" });
    readServerCopy(siteId).then(
      (copy) => {
        if (!live) return;
        serverCopy.current = copy;
        setServer({
          status: "ready",
          by: copy.lastEditedBy,
          at: copy.lastEditedAt,
          differences: composer.versions.compareSnapshots(composer.exportProject(), copy.project, "Your copy", "Server")
            .changes,
        });
      },
      () => live && setServer({ status: "unavailable" }),
    );
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch per opening, not per dialog object
  }, [saveOpen, restoreOpen, composer, siteId]);

  const close = React.useCallback(() => {
    /* A restore closed unanswered leaves the edits off screen: the save
       state says so, and its Retry brings this dialog back (useSaveCallback). */
    if (dialog?.variant === "restore") {
      setSaveState({ status: "error", error: UNSAVED_OFF_SCREEN });
    }
    setDialog((d) => (d ? { ...d, open: false } : d));
  }, [dialog?.variant, setSaveState]);

  /* D8: which way people resolve kept edits a later save overtook. */
  const trackRestoreChoice = (choice: "keep" | "history" | "replace") => {
    if (dialog?.variant === "restore" && dialog.relation !== "unchanged") {
      trackEvent("restore.stale_choice", { choice, relation: dialog.relation });
    }
  };

  const onKeep = React.useCallback(() => {
    trackRestoreChoice("keep");
    if (dialog?.variant === "save") {
      reload();
      return;
    }
    setDialog(null);
    setSaveState({ status: "idle", lastSavedAt: Date.now(), error: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- trackRestoreChoice reads `dialog`
  }, [dialog, setSaveState]);

  /* BD-35: the copy at risk becomes a named version History can restore —
     it used to download a JSON file nothing in the editor could import. */
  const onSaveToHistory = React.useCallback(async (): Promise<boolean> => {
    if (!composer) return false;
    trackRestoreChoice("history");
    const restoring = dialog?.variant === "restore";
    const project = restoring ? (siteId ? peekOffScreenUnsaved(siteId)?.project : null) : composer.exportProject();
    if (!project) return false;
    const name = `${restoring ? "Unsaved edits" : "Before reload"} — ${clockTime()}`;
    try {
      await composer.versions.createVersion(
        name,
        restoring
          ? "Edits that never reached the server, kept from the conflict dialog."
          : "This tab's copy, kept from the conflict dialog before reloading.",
        project,
      );
    } catch {
      return false;
    }
    addToast({ tone: "success", title: "Saved to History", description: `Your edits are saved as "${name}". Restore them from History.` });
    /* After the dialog has discarded the kept copy for this written version. */
    if (!restoring) window.setTimeout(reload, RELOAD_AFTER_SAVE_MS);
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- trackRestoreChoice reads `dialog`
  }, [addToast, composer, dialog, siteId]);

  const onReplace = React.useCallback(async () => {
    if (!composer || !dialog) return;
    trackRestoreChoice("replace");
    /* The server's version is kept as a version before anything replaces it;
       when that write fails, nothing is replaced and the user is told — it
       used to reject unhandled and leave the dialog sitting there. */
    const keepServerVersion = async (name: string, description: string, project: ProjectData) => {
      try {
        await composer.versions.createVersion(name, description, project);
        return true;
      } catch {
        addToast({
          tone: "error",
          title: "Couldn't keep the server version first",
          description: "Nothing was replaced. Try again.",
        });
        return false;
      }
    };
    if (dialog.variant === "restore") {
      if (!siteId) return;
      if (
        dialog.relation !== "unchanged" &&
        !(await keepServerVersion(
          "Before restore",
          "The server's version, kept before your unsaved edits replaced it.",
          composer.exportProject(),
        ))
      ) {
        return;
      }
      setDialog(null);
      const kept = takeOffScreenUnsaved(siteId);
      if (!kept) return;
      composer.importProject(kept.project);
      setIsDirty(true);
      setSaveState({ status: "idle", error: undefined });
      /* The import emits only PROJECT_LOADED, which autosave does not follow
         (L5-075): this schedules the restored edits' save. */
      composer.emit(EVENTS.PROJECT_CHANGED, { reason: "restore-unsaved" });
      return;
    }
    let copy = serverCopy.current;
    if (siteId && !copy) copy = await readServerCopy(siteId).catch(() => null);
    if (siteId && !copy) {
      addToast({
        tone: "error",
        title: "Couldn't keep the server version first",
        description: "Nothing was replaced. Check your connection and try again.",
      });
      return;
    }
    if (
      copy &&
      !(await keepServerVersion(
        "Before overwrite",
        "The server's version, kept before your copy replaced it.",
        copy.project,
      ))
    ) {
      return;
    }
    /* Adopt the token of the copy kept as a version: if the server moved
       again since, this save is refused again rather than losing that. */
    setBaselineLastEditedAt(copy?.lastEditedAt ?? dialog.serverToken);
    setDialog(null);
    saveProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- trackRestoreChoice reads `dialog`
  }, [addToast, composer, dialog, saveProject, setIsDirty, setSaveState, siteId]);

  const reopenSaveConflict = React.useCallback(
    () => setDialog((d) => (d?.variant === "save" ? { ...d, open: true } : d)),
    [],
  );

  return {
    reopenSaveConflict,
    modalProps: {
      open: !!dialog?.open,
      siteId,
      variant: dialog?.variant ?? "save",
      relation: dialog?.variant === "restore" ? dialog.relation : undefined,
      keptAt: dialog?.variant === "restore" ? dialog.keptAt : undefined,
      brandFormat: dialog?.variant === "save" ? dialog.brandFormat : false,
      server,
      onKeep,
      onSaveToHistory,
      onReplace: () => void onReplace(),
      onClose: close,
    },
  };
}
