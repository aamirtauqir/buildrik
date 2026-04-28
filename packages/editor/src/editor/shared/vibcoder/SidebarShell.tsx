/**
 * Vibcoder SidebarShell — generic 2-column shell primitive.
 *
 * Renders the `bd-sidebar-shell` rule from src/themes/components/layouts/
 * sidebar-shell.css. Used for any "rail + content" pattern: asset library,
 * history panel + main view, inspector + canvas, settings sidebar.
 *
 * NOT the full editor shell — AquibraStudio.tsx remains a hand-rolled
 * 4-zone CSS Grid (rail + sidebar + main + inspector). This primitive is
 * for SIMPLER 2-pane compositions inside that grid.
 *
 * Width variants map to vendored bd-sidebar-shell--sidebar-{sm|md|lg}
 * classes (220/280/320px). Default = "md" (omits modifier — base class
 * sidebar slot already 280px).
 *
 * Side variants: "left" (default — no modifier) OR "right" (uses
 * row-reverse — visual order flips, DOM order stays sidebar-first for
 * screen-reader + tab-order correctness).
 *
 * Bordered modifier draws a hairline divider between sidebar and main.
 *
 * NOTE: do not pass `bd-sidebar-shell--*` or `bd-sidebar-shell__*` classes
 * via the className prop. Use the typed props (width, side, bordered) and
 * the named sidebar slot.
 *
 * @license BSD-3-Clause
 */
import { type HTMLAttributes, type ReactNode, forwardRef } from "react";

export type SidebarShellWidth = "sm" | "md" | "lg";
export type SidebarShellSide = "left" | "right";

export interface SidebarShellProps extends HTMLAttributes<HTMLDivElement> {
  /** Required. Content rendered in the sidebar slot. */
  sidebar: ReactNode;
  /** Required. Main content (children). */
  children: ReactNode;
  /** Sidebar width. Default = "md" (280px, no modifier — matches base). */
  width?: SidebarShellWidth;
  /** Sidebar side. Default = "left" (no modifier). */
  side?: SidebarShellSide;
  /** When true, draws hairline divider between sidebar and main. */
  bordered?: boolean;
}

export const SidebarShell = forwardRef<HTMLDivElement, SidebarShellProps>(
  (
    { sidebar, children, width = "md", side = "left", bordered = false, className, ...rest },
    ref,
  ) => {
    const classes = [
      "bd-sidebar-shell",
      width !== "md" && `bd-sidebar-shell--sidebar-${width}`,
      side === "right" && "bd-sidebar-shell--side-right",
      bordered && "bd-sidebar-shell--bordered",
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        <div className="bd-sidebar-shell__sidebar">{sidebar}</div>
        <div className="bd-sidebar-shell__main">{children}</div>
      </div>
    );
  },
);
SidebarShell.displayName = "SidebarShell";
