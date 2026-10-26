/**
 * ConflictModal — the site changed somewhere else (2L9 B7-G14 `225:9180`,
 * G15 `225:9715`, G16 `225:10249`, G17 `225:10783`).
 *
 * Shown when the server rejects a save because the site changed in another tab
 * or device since this editor loaded it. Nothing is merged and nothing is lost
 * without the user choosing, and each choice that throws work away asks first:
 *   - Reload latest…  → "Reload the latest version?" → discard this tab's copy, reload.
 *   - Download a copy → save this tab's work as a file; the dialog stays.
 *   - Overwrite…      → "Overwrite the newer version?" → the server's copy is
 *     kept in History › Saves as "Before overwrite" FIRST, then this tab's
 *     copy replaces it. When the newer copy cannot be kept, nothing is
 *     overwritten (G17) and Retry is offered.
 *
 * The board names who changed the site and how many changes this tab holds;
 * the conflict carries only the server's time (`SAVE_CONFLICT_EVENT`), so the
 * copy says when and not who (`authority: code:conflict-no-author`).
 *
 * A brand-format conflict (`brandFormat`: the server refused this tab's
 * brand as an older format) offers no Overwrite — the same save would be
 * refused again. Reload is the way out; Download a copy keeps the local work.
 *
 * Mounted through the chrome-ui overlay primitive: OverlayMount owns the
 * portal, the focus trap and Escape. A scrim click does NOT dismiss — this
 * dialog is the only thing between the user and a lost edit, and the
 * "Conflict" pill re-opens it after an explicit Escape anyway.
 *
 * Reload discards the behind copy the conflict hold kept in
 * `bk-unsaved-v1-<site>` (`discardUnsaved`): left in place, the reload would
 * offer "Restore my edits" right after the user chose to drop them. Overwrite
 * keeps it — that copy is the one being saved — and lifts a discard left by
 * a Reload whose unload prompt was cancelled.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, ModalContent, ModalTitle, OverlayMount } from "@/editor/chrome-ui";
import { discardUnsaved, resumeKeepingUnsaved } from "@/services/unsavedRecovery";
import { SAVE_CONFLICT_EVENT } from "@/services/BuildrikSyncProvider";
import { keepBeforeOverwrite } from "@/services/versionSync";
import { currentWork, downloadProject } from "../workSnapshot";
import { CONFIRM_ACTION, DIALOG_ACTION, DIALOG_ACTIONS, DIALOG_BODY, DIALOG_FRAME, DIALOG_TITLE } from "./recoveryDialog";

export interface ConflictModalProps {
  open: boolean;
  /** The site whose kept behind copy Reload discards; null = none (demo). */
  siteId: string | null;
  onReload: () => void;
  /** Fallback for "Download a copy" when no work can be read here: the
   *  shell's own download, which then reloads. */
  onSaveBackup: () => void;
  onOverwrite: () => void;
  onClose: () => void;
  /** The server refused this tab's brand as an older format: Reload only. */
  brandFormat?: boolean;
}

const TITLE_ID = "conflict-modal-title";
const BODY = DIALOG_BODY;

const TIME = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });

type Step = "choose" | "reload" | "overwrite" | "overwriting" | "overwrite-failed";

/** The server's time on the latest conflict — the "Changed at 10:31" fact. */
function useConflictTime(): string | null {
  const [at, setAt] = React.useState<string | null>(null);
  React.useEffect(() => {
    const onConflict = (e: Event) => {
      const iso = (e as CustomEvent<{ serverLastEditedAt?: string }>).detail?.serverLastEditedAt;
      const ms = iso ? Date.parse(iso) : NaN;
      setAt(Number.isFinite(ms) ? TIME.format(ms) : null);
    };
    window.addEventListener(SAVE_CONFLICT_EVENT, onConflict);
    return () => window.removeEventListener(SAVE_CONFLICT_EVENT, onConflict);
  }, []);
  return at;
}

export function ConflictModal({ open, siteId, onReload, onSaveBackup, onOverwrite, onClose, brandFormat = false }: ConflictModalProps) {
  const [step, setStep] = React.useState<Step>("choose");
  const changedAt = useConflictTime();
  React.useEffect(() => {
    if (!open) setStep("choose");
  }, [open]);
  /* The focus trap places the opening focus; a step change unmounts the
     focused button, so the new step's default takes it (Reload latest… on
     the choice, Cancel on each confirm). */
  React.useEffect(() => {
    if (!open || step === "choose") return;
    document.querySelector<HTMLElement>('[data-testid="conflict-modal"] [data-autofocus]')?.focus();
  }, [open, step]);

  const reload = () => {
    if (siteId) discardUnsaved(siteId);
    onReload();
    /* The reload's unload prompt can be cancelled; the page then lives on
       and the choice is open again. */
    setStep("choose");
  };

  const download = () => {
    const work = currentWork(siteId);
    if (work) {
      downloadProject(work, "conflict-copy");
      return;
    }
    /* The shell's download reloads after it: the same discard as Reload, or
       the reload would offer the behind copy back (see header). */
    if (siteId) discardUnsaved(siteId);
    onSaveBackup();
  };

  const overwrite = async () => {
    setStep("overwriting");
    try {
      if (siteId) await keepBeforeOverwrite(siteId);
    } catch (err) {
      console.warn("[conflict] could not keep the newer version; nothing overwritten", err);
      setStep("overwrite-failed");
      return;
    }
    resumeKeepingUnsaved();
    onOverwrite();
  };

  const when = changedAt ? `Changed at ${changedAt}` : "Changed";
  const from = changedAt ? `The version from ${changedAt}` : "The newer version";

  let title = "This site changed somewhere else";
  let body: React.ReactNode;
  let actions: React.ReactNode;
  if (step === "reload") {
    title = "Reload the latest version?";
    body = <p className={BODY}>Your changes in this tab will be replaced. A download, if you started one, isn’t checked.</p>;
    actions = (
      <>
        <Button color="light" size="sm" className={CONFIRM_ACTION} onClick={() => setStep("choose")} data-autofocus>Cancel</Button>
        <Button size="sm" className={CONFIRM_ACTION} onClick={reload} data-testid="conflict-reload-confirm">Reload</Button>
      </>
    );
  } else if (step === "overwrite" || step === "overwriting" || step === "overwrite-failed") {
    title = "Overwrite the newer version?";
    body = (
      <>
        <p className={BODY}>
          {from} is kept in History › Saves as “Before overwrite” first. Then your changes replace it.
        </p>
        {step === "overwrite-failed" ? (
          <p role="alert" className="tw:mt-2 tw:mb-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-error-text)]" data-testid="conflict-overwrite-failed">
            Couldn’t keep the newer version — nothing was overwritten.
          </p>
        ) : null}
      </>
    );
    const busy = step === "overwriting";
    actions = (
      <>
        <Button color="light" size="sm" className={CONFIRM_ACTION} onClick={() => setStep("choose")} disabled={busy} data-autofocus>Cancel</Button>
        {/* 2L9 G16 draws Overwrite white: the newer version is kept first, so
            it is a decision, not a deletion. G17's Retry is the filled one. */}
        <Button
          color={step === "overwrite-failed" ? undefined : "light"}
          size="sm"
          className={CONFIRM_ACTION}
          onClick={() => void overwrite()}
          disabled={busy}
          aria-busy={busy || undefined}
          data-testid="conflict-overwrite-confirm"
        >
          {step === "overwrite-failed" ? "Retry" : busy ? "Keeping the newer version…" : "Overwrite"}
        </Button>
      </>
    );
  } else {
    body = brandFormat ? (
      <p data-testid="conflict-body" className={BODY}>
        This site&apos;s brand was upgraded to a newer format, so this tab can&apos;t save over it.
        Reload to keep editing. Download a copy first if you want your recent changes.
      </p>
    ) : (
      <p data-testid="conflict-body" className={BODY}>
        {when} in another tab or on another device. Your changes in this tab haven’t been saved.
      </p>
    );
    actions = (
      <>
        {brandFormat ? null : (
          <Button color="light" size="sm" className={DIALOG_ACTION} onClick={() => setStep("overwrite")}>Overwrite…</Button>
        )}
        <Button color="light" size="sm" className={DIALOG_ACTION} onClick={download}>Download a copy</Button>
        <Button size="sm" className={`${DIALOG_ACTION} tw:px-6`} onClick={() => setStep("reload")} data-autofocus>Reload latest…</Button>
      </>
    );
  }

  return (
    <OverlayMount open={open} onClose={onClose} dismissOnScrimClick={false} labelledBy={TITLE_ID}>
      {/* 2L9: the choice is 720 wide (G14), each confirm 480 (G15–G17). */}
      <ModalContent size={step === "choose" ? "lg" : "confirm"} data-testid="conflict-modal" data-step={step}>
        <div className={DIALOG_FRAME}>
          <ModalTitle inset={false} id={TITLE_ID} className={DIALOG_TITLE} data-testid="conflict-title">{title}</ModalTitle>
          <div>{body}</div>
          <div className={DIALOG_ACTIONS} data-testid="conflict-actions">{actions}</div>
        </div>
      </ModalContent>
    </OverlayMount>
  );
}
