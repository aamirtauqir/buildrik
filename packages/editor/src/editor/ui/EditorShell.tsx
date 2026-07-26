/**
 * EditorShell — Figma 52:2, assembled once.
 *
 * Every editor surface renders THIS, with different slot payloads. The shell
 * itself never varies: same topbar height, same rail width, same footer, same
 * order. That is not a style preference — it is the mechanism that makes
 * cross-screen drift impossible. The moment a screen hand-builds its own
 * topbar, the two versions start disagreeing, which is exactly what happened to
 * the 1280 variant and the assembled variant in the design file.
 *
 * Slots are optional because surfaces differ in what they show (settings has no
 * inspector, preview has no drawer) — but what they SHARE is not a choice.
 *
 * @license BSD-3-Clause
 */
import React from "react";

export interface EditorShellProps extends React.HTMLAttributes<HTMLDivElement> {
  topbar: React.ReactNode;
  rail?: React.ReactNode;
  drawer?: React.ReactNode;
  inspector?: React.ReactNode;
  footer?: React.ReactNode;
  /** The canvas, or whatever replaces it: settings, a full-page surface. */
  children: React.ReactNode;
  canvasLabel?: string;
}

export function EditorShell({
  topbar, rail, drawer, inspector, footer, children, canvasLabel = "Canvas", className, ...rest
}: EditorShellProps) {
  return (
    <div className={["bk-shell", className].filter(Boolean).join(" ")} {...rest}>
      {topbar}
      <div className="bk-shell__band">
        {rail}
        {drawer}
        <main className="bk-shell__canvas" aria-label={canvasLabel}>
          {children}
        </main>
        {inspector}
      </div>
      {footer}
    </div>
  );
}
