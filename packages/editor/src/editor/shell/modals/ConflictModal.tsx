/**
 * ConflictModal — "the server has newer work" resolver, at the boards'
 * geometry (2L9 B7-G14 `225:9180`, G15 `225:9715`, G16 `225:10249`), in two
 * variants that share one vocabulary (design decision 11):
 *
 *   save     — a save was refused because the site changed somewhere else
 *              since this editor loaded it (61-conflict).
 *   restore  — on load, this browser holds edits that never reached the
 *              server (BK-04 / design decisions 1 and 5). The editor shows
 *              the server's copy; this asks what to do with the kept edits.
 *
 * Nothing is merged and nothing is lost without the user choosing, and each
 * choice that throws work away asks first:
 *   - Reload latest…   (save) → "Reload the latest version?" → discard this
 *     tab's copy, reload. In the restore variant "Keep the server version"
 *     stays on the copy already on screen.
 *   - Save my edits to History → the copy at risk as a restorable named
 *     version (BD-35 — was a JSON download nothing could import); deletes
 *     nothing.
 *   - Overwrite… / Replace with mine… → "Overwrite the newer version?" → the
 *     parent keeps the server copy as a version FIRST (BK-59), then this copy
 *     replaces it. When it cannot be kept, nothing is replaced and the parent
 *     says so.
 * A restore whose server copy is still the one the edits were made on top of
 * (relation "unchanged") puts "Restore my edits" first instead: replacing
 * loses nobody's work there.
 *
 * Who saved and when come from the server (A1, O7); "Review differences"
 * lists what changed from it (decision 16, the History compare's diff).
 *
 * Discard rules (T1, O1): Keep discards the kept copy. Save to History
 * discards it only after the version was written — and in the restore variant
 * never, the dialog stays open. Replace keeps it (it is the copy being saved)
 * and lifts a discard left by a cancelled reload.
 *
 * A brand-format conflict (the server refused this tab's brand as an older
 * format) offers no Overwrite: the same save would be refused again.
 *
 * Mounted through the chrome-ui overlay primitive: OverlayMount owns the
 * portal, the focus trap and Escape. A scrim click does NOT dismiss — this
 * dialog is the only thing between the user and a lost edit, and the
 * "Conflict" pill re-opens it after an explicit Escape anyway.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, ModalContent, ModalTitle, OverlayMount } from "@/editor/chrome-ui";
import type { EditorAttribution } from "@/services/BuildrikSyncProvider";
import { discardUnsaved, resumeKeepingUnsaved, type KeptVsServer } from "@/services/unsavedRecovery";
import type { VersionChange } from "@/shared/types/versions";
import { formatRelativeTime } from "@/shared/utils/relativeTime";
import { CONFIRM_ACTION, DIALOG_ACTION, DIALOG_ACTIONS, DIALOG_BODY, DIALOG_FRAME, DIALOG_TITLE } from "./recoveryDialog";

/** What is known about the server's copy. */
export type ServerCopyInfo =
  | { status: "loading" }
  | { status: "ready"; by: EditorAttribution | null; at: string | null; differences: VersionChange[] }
  | { status: "unavailable" };

export interface ConflictModalProps {
  open: boolean;
  /** The site whose kept copy Keep / Save to History discard; null = none (demo). */
  siteId: string | null;
  variant?: "save" | "restore";
  /** restore only: how the kept edits relate to the loaded server copy. */
  relation?: KeptVsServer;
  /** restore only: when the kept edits were made (ISO). */
  keptAt?: string | null;
  server: ServerCopyInfo;
  onKeep: () => void;
  /** Saves the copy at risk as a History version. Resolves true once written;
   *  false/throw = not written. */
  onSaveToHistory: () => Promise<boolean> | boolean;
  onReplace: () => void;
  onClose: () => void;
  /** The server refused this tab's brand as an older format: no Overwrite. */
  brandFormat?: boolean;
  /** The server refused this tab because the site now uses classes (class-first): no Replace. */
  styleModel?: boolean;
}

const TITLE_ID = "conflict-modal-title";
const BODY = DIALOG_BODY;
const MAX_ROWS = 8;

const TIME = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });

type Step = "choose" | "reload" | "overwrite";

const when = (iso: string | null | undefined): string | null => {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? formatRelativeTime(t, { justNowLabel: "just now" }).toLowerCase() : null;
};

/** "Sara Khan saved changes 3 min ago." / "You saved from another tab or device …" */
function whoLine(server: ServerCopyInfo): string | null {
  if (server.status !== "ready" || !server.by) return null;
  const at = when(server.at);
  return server.by.isViewer
    ? `You saved from another tab or device${at ? ` ${at}` : ""}.`
    : `${server.by.name || "A teammate"} saved changes${at ? ` ${at}` : ""}.`;
}

function restoreTitle(relation: KeptVsServer, server: ServerCopyInfo): string {
  if (relation === "unchanged") return "Some work never reached the server";
  if (relation === "unknown") return "We can't confirm what changed since your edits";
  return server.status === "ready" && server.by?.isViewer
    ? "You saved this site from another tab after these edits"
    : "Someone saved this site after your edits";
}

export function ConflictModal({
  open,
  siteId,
  variant = "save",
  relation = "unknown",
  keptAt,
  server,
  onKeep,
  onSaveToHistory,
  onReplace,
  onClose,
  brandFormat = false,
  styleModel = false,
}: ConflictModalProps) {
  const [step, setStep] = React.useState<Step>("choose");
  const [showDiff, setShowDiff] = React.useState(false);
  const [saveFailed, setSaveFailed] = React.useState(false);
  React.useEffect(() => {
    if (!open) {
      setStep("choose");
      setShowDiff(false);
      setSaveFailed(false);
    }
  }, [open]);
  /* The focus trap places the opening focus; a step change unmounts the
     focused button, so the new step's default takes it (Keep on the choice,
     Cancel on each confirm). */
  React.useEffect(() => {
    if (!open || step === "choose") return;
    document.querySelector<HTMLElement>('[data-testid="conflict-modal"] [data-autofocus]')?.focus();
  }, [open, step]);

  const restore = variant === "restore";
  const safeRestore = restore && relation === "unchanged";
  const canReplace = !brandFormat && !styleModel;

  const keep = () => {
    if (siteId) {
      discardUnsaved(siteId);
      /* The save variant's Keep reloads, so nothing may be kept after it.
         The restore variant stays on this page: the old copy is gone, but
         later unsaved work (offline, a held conflict) must still be kept. */
      if (restore) resumeKeepingUnsaved();
    }
    onKeep();
    /* The reload's unload prompt can be cancelled; the page then lives on
       and the choice is open again. */
    setStep("choose");
  };
  const saveToHistory = async () => {
    let written = false;
    try {
      written = (await onSaveToHistory()) === true;
    } catch {
      written = false;
    }
    setSaveFailed(!written);
    /* The save variant hands over to a reload, so its copy is spent — but
       only once the version exists. The restore variant keeps everything. */
    if (written && !restore && siteId) discardUnsaved(siteId);
  };
  const replace = () => {
    resumeKeepingUnsaved();
    onReplace();
    setStep("choose");
  };

  const who = whoLine(server);
  const keptWhen = when(keptAt);
  const serverMs = server.status === "ready" && server.at ? Date.parse(server.at) : NaN;
  const changedAt = Number.isFinite(serverMs) ? TIME.format(serverMs) : null;
  const from = changedAt ? `The version from ${changedAt}` : "The newer version";

  const saveFailedAlert = saveFailed ? (
    <p role="alert" className="tw:mt-2 tw:mb-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-error-text)]" data-testid="conflict-history-failed">
      Couldn&apos;t save your edits to History. Nothing was deleted.
    </p>
  ) : null;
  const historyButton = (
    <Button color="light" size="sm" className={DIALOG_ACTION} onClick={() => void saveToHistory()}>
      Save my edits to History
    </Button>
  );

  let title: string;
  let body: React.ReactNode;
  let actions: React.ReactNode;
  if (step === "reload") {
    title = "Reload the latest version?";
    body = <p className={BODY}>Your changes in this tab will be replaced. Save them to History first if you want a copy.</p>;
    actions = (
      <>
        <Button color="light" size="sm" className={CONFIRM_ACTION} onClick={() => setStep("choose")} data-autofocus>Cancel</Button>
        <Button size="sm" className={CONFIRM_ACTION} onClick={keep} data-testid="conflict-reload-confirm">Reload</Button>
      </>
    );
  } else if (step === "overwrite") {
    title = "Overwrite the newer version?";
    body = (
      <p className={BODY}>
        {restore
          ? "The newer version is kept in History as “Before restore” first. Then your edits replace it."
          : `${from} is kept in History as “Before overwrite” first. Then your changes replace it.`}
      </p>
    );
    actions = (
      <>
        <Button color="light" size="sm" className={CONFIRM_ACTION} onClick={() => setStep("choose")} data-autofocus>Cancel</Button>
        {/* 2L9 G16 draws Overwrite white: the newer version is kept first, so
            it is a decision, not a deletion. */}
        <Button color="light" size="sm" className={CONFIRM_ACTION} onClick={replace} data-testid="conflict-overwrite-confirm">
          Overwrite
        </Button>
      </>
    );
  } else {
    title = restore ? restoreTitle(relation, server) : "This site changed somewhere else";
    let text: string;
    if (styleModel) {
      text =
        "This site now uses classes for styling, so this tab can't save over it. " +
        "Reload to keep editing. Save your edits to History first if you want a copy of your recent changes.";
    } else if (brandFormat) {
      text =
        "This site's brand was upgraded to a newer format, so this tab can't save over it. " +
        "Reload to keep editing. Save your edits to History first if you want a copy of your recent changes.";
    } else if (safeRestore) {
      text =
        "A save failed before this page was reloaded. The version on screen is the server's. " +
        "Restoring puts your unsaved edits back so you can save them again.";
    } else if (restore) {
      text =
        `You have edits${keptWhen ? ` from ${keptWhen}` : ""} that never reached the server. ` +
        (relation === "unknown"
          ? "This site may have been saved since. Review the differences before you choose."
          : `${who ?? "The site was saved since."} Restoring your edits would replace that version.`);
    } else {
      text =
        `${who ?? `${changedAt ? `Changed at ${changedAt}` : "Changed"} in another tab or on another device.`} ` +
        "Your changes in this tab haven’t been saved.";
    }
    const differences = server.status === "ready" ? server.differences : [];
    body = (
      <>
        <p data-testid="conflict-body" className={BODY}>{text}</p>
        {canReplace && !safeRestore && (
          <div className="tw:mt-2">
            <Button
              color="light"
              size="xs"
              data-testid="conflict-review-differences"
              aria-expanded={showDiff}
              onClick={() => setShowDiff((v) => !v)}
            >
              Review differences
            </Button>
            {showDiff && (
              <div data-testid="conflict-differences" className="tw:mt-2 tw:rounded-[var(--bk-radius-sm)] tw:border tw:border-[var(--bk-border)] tw:p-2">
                {server.status === "loading" ? (
                  <p className={BODY}>Checking what changed…</p>
                ) : server.status === "unavailable" ? (
                  <p className={BODY}>Couldn&apos;t load what changed.</p>
                ) : differences.length === 0 ? (
                  <p className={BODY}>No element content differs.</p>
                ) : (
                  <ul className="tw:m-0 tw:list-none tw:p-0">
                    {differences.slice(0, MAX_ROWS).map((c, i) => (
                      <li key={i} className="tw:py-0.5 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)]">
                        <span className="tw:text-[var(--bk-ink)]">{c.property}</span>
                        {" — "}
                        {/* Row text arrives quoted from the History compare. */}
                        {`yours: ${c.before || "(none)"} / server: ${c.after || "(none)"}`}
                      </li>
                    ))}
                    {differences.length > MAX_ROWS && (
                      <li className="tw:py-0.5 tw:text-[12px] tw:text-[var(--bk-ink-muted)]">+ {differences.length - MAX_ROWS} more</li>
                    )}
                  </ul>
                )}
                <p className="tw:mt-1 tw:mb-0 tw:text-[11px] tw:text-[var(--bk-ink-muted)]">Compares element content only</p>
              </div>
            )}
          </div>
        )}
        {saveFailedAlert}
      </>
    );
    actions = safeRestore ? (
      <>
        <Button color="light" size="sm" className={DIALOG_ACTION} onClick={keep}>Keep the server version</Button>
        {historyButton}
        <Button size="sm" className={`${DIALOG_ACTION} tw:px-6`} onClick={replace} data-autofocus>Restore my edits</Button>
      </>
    ) : (
      <>
        {canReplace ? (
          <Button color="light" size="sm" className={DIALOG_ACTION} onClick={() => setStep("overwrite")}>
            {restore ? "Replace with mine…" : "Overwrite…"}
          </Button>
        ) : null}
        {historyButton}
        {restore ? (
          <Button size="sm" className={`${DIALOG_ACTION} tw:px-6`} onClick={keep} data-autofocus>Keep the server version</Button>
        ) : (
          <Button size="sm" className={`${DIALOG_ACTION} tw:px-6`} onClick={() => setStep("reload")} data-autofocus>Reload latest…</Button>
        )}
      </>
    );
  }

  return (
    <OverlayMount open={open} onClose={onClose} dismissOnScrimClick={false} labelledBy={TITLE_ID}>
      {/* 2L9: the choice is 720 wide (G14), each confirm 480 (G15–G16). */}
      <ModalContent size={step === "choose" ? "lg" : "confirm"} data-testid="conflict-modal" data-step={step} data-variant={variant}>
        <div className={DIALOG_FRAME}>
          <ModalTitle inset={false} id={TITLE_ID} className={DIALOG_TITLE} data-testid="conflict-title">{title}</ModalTitle>
          <div>{body}</div>
          <div className={DIALOG_ACTIONS} data-testid="conflict-actions">{actions}</div>
        </div>
      </ModalContent>
    </OverlayMount>
  );
}
