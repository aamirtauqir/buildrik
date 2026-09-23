/**
 * ConflictModal (61-conflict) — single-writer save-conflict resolver.
 *
 * Shown when the server rejects a save because the site changed somewhere else
 * (another tab / device) since this editor loaded it. We never auto-merge, so
 * nothing is lost without the user choosing:
 *   - Reload latest   → discard local, reload the newer server copy
 *   - Save a backup   → download the local project, then reload
 *   - Overwrite       → force the local copy over the server's (with confirm)
 *
 * Implemented as a self-contained fixed overlay (not the Radix-backed vibcoder
 * Modal): the editor is dynamically imported into the dashboard, and Radix's
 * portal/focus management mis-fires there (the dialog mounts outside the body
 * container and immediately dismisses). A plain overlay renders reliably; the
 * action controls are still vibcoder Buttons (Gate-24 compliant). Static layout
 * styles are inline by necessity — this overlay must not depend on any external
 * CSS being present to render.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/chrome-ui";

export interface ConflictModalProps {
  open: boolean;
  onReload: () => void;
  onSaveBackup: () => void;
  onOverwrite: () => void;
  onClose: () => void;
}

const Z = 2147483646;

export function ConflictModal({ open, onReload, onSaveBackup, onOverwrite, onClose }: ConflictModalProps) {
  const [confirmOverwrite, setConfirmOverwrite] = React.useState(false);
  React.useEffect(() => { if (!open) setConfirmOverwrite(false); }, [open]);
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="This site changed somewhere else"
      style={{ position: "fixed", inset: 0, zIndex: Z, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", padding: 16 }}
      data-testid="conflict-scrim"
      onClick={onClose}
    >
      {/* Board 66:840 — 440 wide on --color/bg-card at --radius/lg (8). The
          radius was 12, which is no step on the scale this file's own board
          uses. Colours stay literal hex on purpose: this overlay renders when
          the editor is dynamically imported into the dashboard and must not
          depend on any external stylesheet, which is why the @lint-hex-policy
          exception exists. The literals below are the board's own values. */}
      <div
        onClick={(e) => e.stopPropagation()}
        data-testid="conflict-modal"
        style={{ width: "100%", maxWidth: 440, background: /* @lint-hex-policy: ConflictModal self-themed state colors (documented component-theme exception) */ "#fff", borderRadius: 8, boxShadow: "0 12px 32px rgba(15,23,41,0.16)", padding: 24, fontFamily: "var(--bk-font-ui)" }}
      >
        {/* 66:842 — 16 on a 24px line box in --color/ink. It carried no
            line-height at all, so the title sat on Inter's own ~19. */}
        <h2 data-testid="conflict-title" style={{ margin: 0, fontSize: 16, lineHeight: "24px", fontWeight: 700, color: /* @lint-hex-policy: ConflictModal self-themed state colors (documented component-theme exception) */ "#111827" }}>This site changed somewhere else</h2>
        {/* 66:844 — 13 on 20 in --color/ink-soft. Was 14/1.5 on #555. */}
        <p data-testid="conflict-body" style={{ marginTop: 8, marginBottom: 0, fontSize: 13, lineHeight: "20px", color: /* @lint-hex-policy: ConflictModal self-themed state colors (documented component-theme exception) */ "#4b5563" }}>
          Your copy is behind — it was edited in another tab or device since you opened it.
          We can&apos;t auto-merge, so pick how to continue. Nothing is lost without your choice.
        </p>
        {confirmOverwrite && (
          <p style={{ marginTop: 10, marginBottom: 0, fontSize: 13, color: /* @lint-hex-policy: ConflictModal self-themed state colors (documented component-theme exception) */ "#B45309" }}>
            Overwrite replaces the newer copy with yours. The other changes will be gone.
          </p>
        )}
        {/* 66:845 spaces the actions 12 apart, right-aligned. */}
        <div data-testid="conflict-actions" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 20, justifyContent: "flex-end" }}>
          <Button onClick={onReload}>Reload latest</Button>
          <Button color="light" onClick={onSaveBackup}>Save a backup</Button>
          {confirmOverwrite ? (
            <Button color="red" onClick={onOverwrite}>Yes, overwrite</Button>
          ) : (
            <Button color="light" onClick={() => setConfirmOverwrite(true)} className="tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]">Overwrite…</Button>
          )}
        </div>
      </div>
    </div>
  );
}
