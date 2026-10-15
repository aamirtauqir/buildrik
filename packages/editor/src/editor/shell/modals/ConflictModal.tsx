/**
 * ConflictModal — "the server has newer work" resolver, in two variants that
 * share one vocabulary (design decision 11):
 *
 *   save     — a save was refused because the site changed somewhere else
 *              since this editor loaded it (61-conflict).
 *   restore  — on load, this browser holds edits that never reached the
 *              server (BK-04 / design decisions 1 and 5). The editor shows
 *              the server's copy; this asks what to do with the kept edits.
 *
 * Actions, the same in both:
 *   - Keep the server version   (primary, opening focus — the least destructive)
 *   - Download my edits         (a file of the copy at risk; deletes nothing)
 *   - Replace with mine…        (two-step; the parent keeps the server copy
 *                                as a version first, BK-59)
 * A restore whose server copy is still the one the edits were made on top of
 * (relation "unchanged") puts "Restore my edits" first instead: replacing
 * loses nobody's work there.
 *
 * Who saved and when come from the server (A1, O7); "Review differences"
 * lists what changed from it (decision 16, the History compare's diff).
 *
 * Discard rules (T1, O1): Keep the server version discards the kept copy.
 * Download discards it only after the file was written — and in the restore
 * variant never, the dialog stays open. Replace keeps it (it is the copy
 * being saved) and lifts a discard left by a cancelled reload.
 *
 * A brand-format conflict (the server refused this tab's brand as an older
 * format) offers no Replace: the same save would be refused again.
 *
 * OverlayMount owns the portal, the focus trap and Escape. A scrim click does
 * NOT dismiss: this dialog is the only thing between the user and a lost edit.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import {
  Button,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalTitle,
  OverlayMount,
} from "@/editor/chrome-ui";
import type { EditorAttribution } from "@/services/BuildrikSyncProvider";
import { discardUnsaved, resumeKeepingUnsaved, type KeptVsServer } from "@/services/unsavedRecovery";
import type { VersionChange } from "@/shared/types/versions";
import { formatRelativeTime } from "@/shared/utils/relativeTime";

/** What is known about the server's copy. */
export type ServerCopyInfo =
  | { status: "loading" }
  | { status: "ready"; by: EditorAttribution | null; at: string | null; differences: VersionChange[] }
  | { status: "unavailable" };

export interface ConflictModalProps {
  open: boolean;
  /** The site whose kept copy Keep / Download discard; null = none (demo). */
  siteId: string | null;
  variant?: "save" | "restore";
  /** restore only: how the kept edits relate to the loaded server copy. */
  relation?: KeptVsServer;
  /** restore only: when the kept edits were made (ISO). */
  keptAt?: string | null;
  server: ServerCopyInfo;
  onKeep: () => void;
  /** Writes the file. Resolves true once written; false/throw = not written. */
  onDownload: () => Promise<boolean> | boolean;
  onReplace: () => void;
  onClose: () => void;
  /** The server refused this tab's brand as an older format: no Replace. */
  brandFormat?: boolean;
}

const TITLE_ID = "conflict-modal-title";
const BODY = "tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-soft)]";
const MAX_ROWS = 8;

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
  onDownload,
  onReplace,
  onClose,
  brandFormat = false,
}: ConflictModalProps) {
  const [confirmReplace, setConfirmReplace] = React.useState(false);
  const confirmRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (confirmReplace) confirmRef.current?.focus();
  }, [confirmReplace]);
  const [showDiff, setShowDiff] = React.useState(false);
  const [downloadFailed, setDownloadFailed] = React.useState(false);
  React.useEffect(() => {
    if (!open) {
      setConfirmReplace(false);
      setShowDiff(false);
      setDownloadFailed(false);
    }
  }, [open]);

  const restore = variant === "restore";
  const safeRestore = restore && relation === "unchanged";
  const canReplace = !brandFormat;

  const keep = () => {
    if (siteId) {
      discardUnsaved(siteId);
      /* The save variant's Keep reloads, so nothing may be kept after it.
         The restore variant stays on this page: the old copy is gone, but
         later unsaved work (offline, a held conflict) must still be kept. */
      if (restore) resumeKeepingUnsaved();
    }
    onKeep();
  };
  const download = async () => {
    let written = false;
    try {
      written = (await onDownload()) === true;
    } catch {
      written = false;
    }
    setDownloadFailed(!written);
    /* The save variant hands over to a reload, so its copy is spent — but
       only once the file exists. The restore variant keeps everything. */
    if (written && !restore && siteId) discardUnsaved(siteId);
  };
  const replace = () => {
    resumeKeepingUnsaved();
    onReplace();
  };

  const who = whoLine(server);
  const keptWhen = when(keptAt);
  const title = restore ? restoreTitle(relation, server) : "This site changed somewhere else";

  let body: string;
  if (brandFormat) {
    body =
      "This site's brand was upgraded to a newer format, so this tab can't save over it. " +
      "Keep the server version to keep editing. Download your edits first if you want a copy of your recent changes.";
  } else if (safeRestore) {
    body =
      "A save failed before this page was reloaded. The version on screen is the server's. " +
      "Restoring puts your unsaved edits back so you can save them again.";
  } else if (restore) {
    body =
      `You have edits${keptWhen ? ` from ${keptWhen}` : ""} that never reached the server. ` +
      (relation === "unknown"
        ? "This site may have been saved since. Review the differences before you choose."
        : `${who ?? "The site was saved since."} Restoring your edits would replace that version.`);
  } else {
    body =
      `Your copy is behind — it was edited in another tab or device since you opened it. ${who ?? ""}`.trim() +
      " We can't auto-merge, so pick how to continue. Nothing is lost without your choice.";
  }

  const differences = server.status === "ready" ? server.differences : [];
  const diffList = (
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
  );

  return (
    <OverlayMount open={open} onClose={onClose} dismissOnScrimClick={false} labelledBy={TITLE_ID}>
      <ModalContent size="question" data-testid="conflict-modal" data-variant={variant}>
        <ModalTitle id={TITLE_ID} data-testid="conflict-title">{title}</ModalTitle>
        <ModalBody>
          <p data-testid="conflict-body" className={BODY}>{body}</p>
          {!brandFormat && !safeRestore && (
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
              {showDiff && diffList}
            </div>
          )}
          {confirmReplace && (
            <p className="tw:mt-2.5 tw:mb-0 tw:text-[13px] tw:text-[var(--bk-warning-text)]">
              Replace saves your copy over the newer one. The newer one is kept as a version in History first.
            </p>
          )}
          {downloadFailed && (
            <p role="alert" className="tw:mt-2.5 tw:mb-0 tw:text-[13px] tw:text-[var(--bk-error-text)]">
              The download didn&apos;t complete. Nothing was deleted.
            </p>
          )}
        </ModalBody>
        <ModalFooter data-testid="conflict-actions">
          {safeRestore ? (
            <>
              <Button data-autofocus onClick={replace}>Restore my edits</Button>
              <Button color="light" onClick={() => void download()}>Download my edits</Button>
              <Button color="light" onClick={keep}>Keep the server version</Button>
            </>
          ) : (
            <>
              {canReplace &&
                (confirmReplace ? (
                  /* Stays where "Replace with mine…" was, and takes its focus —
                     the clicked button unmounts. */
                  <Button ref={confirmRef} color="red" onClick={replace} className="tw:mr-auto">
                    Yes, replace
                  </Button>
                ) : (
                  <Button
                    color="light"
                    onClick={() => setConfirmReplace(true)}
                    className="tw:mr-auto tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]"
                  >
                    Replace with mine…
                  </Button>
                ))}
              <Button color="light" onClick={() => void download()}>Download my edits</Button>
              <Button data-autofocus onClick={keep}>Keep the server version</Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </OverlayMount>
  );
}
