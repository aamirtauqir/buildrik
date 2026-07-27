/**
 * <PanelShell> — compound component enforcing the sidebar panel grammar
 * from DESIGN.md §Sidebar Panel System.
 *
 * Survivor #1 from the editor-chrome DS rollout. Scaffold version (Week 2);
 * Week 3 migrates first tabs (Settings, Pages) onto it, Week 4 completes.
 *
 * Structure (DESIGN.md:134-189):
 *   Header (HEADER_H=44) — re-exports existing shared/ui/PanelHeader
 *   Toolbar (TOOLBAR_H=36) — optional, search/filter row
 *   Content — flex-grow, scrollable
 *   Footer (FOOTER_H=40) — optional, CTA row (use StickyFooter for primary actions)
 *
 * Widths (DESIGN.md §Layout):
 *   narrow   = SIDEBAR_W (240) — nav-mode tabs (Layers, Pages, Settings, History, Components)
 *   wide     = SIDEBAR_WIDE (320) — authoring-mode tabs (Add, Templates, Media, Build)
 *   fullpage = 100% — fullscreen tabs
 *
 * Row density is a property of Content (see density prop). Form atoms inside
 * Content may use the full radius/shadow scale per Chrome Axiom A1 (form atoms
 * are exempt from A1.3's panel-chrome ≤ 4 cap).
 *
 * Usage:
 *   <PanelShell width="narrow">
 *     <PanelShell.Header title="Pages" />
 *     <PanelShell.Toolbar><SearchBar /></PanelShell.Toolbar>
 *     <PanelShell.Content density="compact">{rows}</PanelShell.Content>
 *     <PanelShell.Footer>{cta}</PanelShell.Footer>
 *   </PanelShell>
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { PanelHeader, PanelHeaderProps } from "@/editor/ui";
import {
  SIDEBAR_W,
  SIDEBAR_WIDE,
  HEADER_H,
  TOOLBAR_H,
  FOOTER_H,
  ROW_SM,
  ROW_MD,
  ROW_LG,
} from "@shared/constants/layout";

// ============================================================================
// Root
// ============================================================================

export type PanelWidth = "narrow" | "wide" | "fullpage";

const WIDTH_PX: Record<PanelWidth, number | string> = {
  narrow: SIDEBAR_W,       // 240
  wide: SIDEBAR_WIDE,      // 320
  fullpage: "100%",
};

export interface PanelShellProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Optional width constraint. When OMITTED (default), PanelShell fills its
   * host (100% width, no min-width). This is the right choice when the host
   * already controls width via tabsConfig/grid/flex — which is true for all
   * existing editor tabs.
   *
   * Specify a value only when PanelShell is the OUTERMOST width-setting
   * element (e.g., a new standalone panel not inside a sized host).
   */
  width?: PanelWidth;
  /**
   * When true AND `width` is "narrow" or "wide", render a 1px border-right
   * separating this panel from adjacent content. Fullpage and host-sized
   * panels should NOT set this (they don't live next to other panels).
   */
  bordered?: boolean;
  children: React.ReactNode;
}

interface PanelShellComponent extends React.FC<PanelShellProps> {
  Header: typeof Header;
  Toolbar: typeof Toolbar;
  Content: typeof Content;
  Footer: typeof Footer;
}

const rootStylesBase: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  background: "var(--bk-bg-panel)",
  overflow: "hidden",
};

const PanelShellFn: React.FC<PanelShellProps> = ({
  width,
  bordered = false,
  className,
  style,
  children,
  ...rest
}) => {
  const widthStyles: React.CSSProperties = (() => {
    if (width === undefined) {
      // Host controls width — fill available space, no min-width constraint.
      return { width: "100%" };
    }
    const resolvedWidth = WIDTH_PX[width];
    if (typeof resolvedWidth === "number") {
      return { width: resolvedWidth, minWidth: resolvedWidth };
    }
    return { width: resolvedWidth };
  })();

  const borderStyles: React.CSSProperties =
    bordered && (width === "narrow" || width === "wide")
      ? { borderRight: "1px solid var(--bk-border)" }
      : {};

  return (
    <div
      className={className}
      style={{
        ...rootStylesBase,
        ...widthStyles,
        ...borderStyles,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
};

// ============================================================================
// Slot: Header — re-exports existing PanelHeader
// ============================================================================

/**
 * Panel header (HEADER_H=44). Thin wrapper around the existing
 * shared/ui/PanelHeader so migrations can drop the old import in favor of
 * <PanelShell.Header ...>.
 */
const Header: React.FC<PanelHeaderProps> = (props) => <PanelHeader {...props} />;
Header.displayName = "PanelShell.Header";

// ============================================================================
// Slot: Toolbar
// ============================================================================

export interface ToolbarProps {
  children: React.ReactNode;
  className?: string;
}

const toolbarStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  height: TOOLBAR_H,
  minHeight: TOOLBAR_H,
  padding: "0 12px",
  borderBottom: "1px solid var(--bk-border)",
  background: "var(--bk-bg-panel)",
  flexShrink: 0,
};

const Toolbar: React.FC<ToolbarProps> = ({ children, className }) => (
  <div className={className} style={toolbarStyles}>
    {children}
  </div>
);
Toolbar.displayName = "PanelShell.Toolbar";

// ============================================================================
// Slot: Content
// ============================================================================

export type ContentDensity = "compact" | "standard" | "card";

/** Row height per density. Maps to DESIGN.md §Sidebar Panel System.
 *  DESIGN.md forbids 40-pixel rows; the density enum intentionally omits that option. */
export const DENSITY_ROW_H: Record<ContentDensity, number> = {
  compact: ROW_SM,   // 28
  standard: ROW_MD,  // 32
  card: ROW_LG,      // 48
};

export interface ContentProps {
  /** Row density — drives child row-height via CSS custom property. */
  density?: ContentDensity;
  children: React.ReactNode;
  className?: string;
  /** Disable default scroll — caller provides its own scroll container. */
  noScroll?: boolean;
}

const contentStyles = (density: ContentDensity, noScroll: boolean): React.CSSProperties => ({
  flex: 1,
  minHeight: 0,
  overflowY: noScroll ? "visible" : "auto",
  overflowX: "hidden",
  // Expose row height so children can reference it without importing constants.
  // e.g. `height: var(--panel-row-h)`.
  ["--panel-row-h" as string]: `${DENSITY_ROW_H[density]}px`,
});

const Content: React.FC<ContentProps> = ({
  density = "standard",
  children,
  className,
  noScroll = false,
}) => (
  <div className={className} style={contentStyles(density, noScroll)}>
    {children}
  </div>
);
Content.displayName = "PanelShell.Content";

// ============================================================================
// Slot: Footer
// ============================================================================

export interface FooterProps {
  children: React.ReactNode;
  className?: string;
}

const footerStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  height: FOOTER_H,
  minHeight: FOOTER_H,
  padding: "0 12px",
  borderTop: "1px solid var(--bk-border)",
  background: "var(--bk-bg-panel)",
  flexShrink: 0,
};

const Footer: React.FC<FooterProps> = ({ children, className }) => (
  <div className={className} style={footerStyles}>
    {children}
  </div>
);
Footer.displayName = "PanelShell.Footer";

// ============================================================================
// Export compound
// ============================================================================

export const PanelShell = PanelShellFn as PanelShellComponent;
PanelShellFn.displayName = "PanelShell";
PanelShell.Header = Header;
PanelShell.Toolbar = Toolbar;
PanelShell.Content = Content;
PanelShell.Footer = Footer;
