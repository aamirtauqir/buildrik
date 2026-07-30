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
import { Button } from "flowbite-react";

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
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 440, background: /* @lint-hex-policy: ConflictModal self-themed state colors (documented component-theme exception) */ "#fff", borderRadius: 12, boxShadow: "0 10px 40px rgba(0,0,0,0.25)", padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}
      >
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: /* @lint-hex-policy: ConflictModal self-themed state colors (documented component-theme exception) */ "#111" }}>This site changed somewhere else</h2>
        <p style={{ marginTop: 8, marginBottom: 0, fontSize: 14, lineHeight: 1.5, color: /* @lint-hex-policy: ConflictModal self-themed state colors (documented component-theme exception) */ "#555" }}>
          Your copy is behind — it was edited in another tab or device since you opened it.
          We can&apos;t auto-merge, so pick how to continue. Nothing is lost without your choice.
        </p>
        {confirmOverwrite && (
          <p style={{ marginTop: 10, marginBottom: 0, fontSize: 13, color: /* @lint-hex-policy: ConflictModal self-themed state colors (documented component-theme exception) */ "#B45309" }}>
            Overwrite replaces the newer copy with yours. The other changes will be gone.
          </p>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
          <Button onClick={onReload}>Reload latest</Button>
          <Button color="light" onClick={onSaveBackup}>Save a backup</Button>
          {confirmOverwrite ? (
            <Button color="red" onClick={onOverwrite}>Yes, overwrite</Button>
          ) : (
            <Button color="light" onClick={() => setConfirmOverwrite(true)} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">Overwrite…</Button>
          )}
        </div>
      </div>
    </div>
  );
}
