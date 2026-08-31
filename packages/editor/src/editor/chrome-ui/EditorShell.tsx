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
    <div
      className={[
        "tw:flex tw:flex-col tw:h-full tw:min-h-0 tw:bg-[var(--bk-gray-100)] tw:[font-family:var(--bk-font-ui)] tw:text-[var(--bk-ink)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {topbar}
      <div className="tw:flex-1 tw:flex tw:min-h-0">
        {rail}
        {drawer}
        <main className="tw:flex-1 tw:min-w-0 tw:flex tw:flex-col tw:bg-[var(--bk-gray-100)] tw:overflow-hidden" aria-label={canvasLabel}>
          {children}
        </main>
        {inspector}
      </div>
      {footer}
    </div>
  );
}
