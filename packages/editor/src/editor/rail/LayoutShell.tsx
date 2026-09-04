/**
 * LayoutShell - Main CSS Grid container for the editor
 *
 * Grid Structure (panel mode):
 * - Columns: Rail (60px) | Drawer (variable) | Canvas (1fr) | Inspector (280px)
 * - Rows: TopBar (52px) | Main Content (1fr)
 *
 * Grid Structure (fullpage mode):
 * - Columns: Rail (60px) | FullPage (spans remaining)
 * - Canvas + Inspector hidden via visibility:hidden (preserves WebGL/iframe state)
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import "./LayoutShell.css";

// ============================================
// Types
// ============================================

export interface LayoutShellProps {
  children: React.ReactNode;
  /** Whether the drawer panel is open (panel mode only) */
  drawerOpen: boolean;
  /** Drawer width in pixels (200 or 280, per-tab) */
  drawerWidth?: number;
  /** Whether a fullpage tab is active (Templates, Settings, History) */
  fullPageMode?: boolean;
  /** Whether the inspector panel is visible */
  inspectorOpen?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// ============================================
// Slot Components
// ============================================

interface SlotProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const TopBar: React.FC<SlotProps> = ({ children, className = "", style }) => (
  <header
    className={`layout-shell__topbar ${className}`}
    style={style}
    role="banner"
    aria-label="Editor toolbar"
  >
    {children}
  </header>
);
TopBar.displayName = "LayoutShell.TopBar";

const Rail: React.FC<SlotProps> = ({ children, className = "", style }) => (
  <nav
    className={`layout-shell__rail ${className}`}
    style={style}
    role="navigation"
    aria-label="Primary navigation"
    tabIndex={0}
  >
    {children}
  </nav>
);
Rail.displayName = "LayoutShell.Rail";

interface DrawerSlotProps extends SlotProps {
  open?: boolean;
}

const Drawer: React.FC<DrawerSlotProps> = ({
  children,
  className = "",
  style,
  open = true,
}) => (
  <aside
    data-tour-target="left-sidebar"
    className={[
      "layout-shell__drawer",
      open ? "layout-shell__drawer--open" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
    style={style}
    role="region"
    aria-label="Sidebar panel"
    aria-hidden={!open}
    tabIndex={open ? 0 : -1}
  >
    {children}
  </aside>
);
Drawer.displayName = "LayoutShell.Drawer";

const Sidebar: React.FC<SlotProps> = ({ children, className = "", style }) => (
  <aside
    data-tour-target="left-sidebar"
    className={`layout-shell__sidebar ${className}`}
    style={style}
    role="navigation"
    aria-label="Editor sidebar"
  >
    {children}
  </aside>
);
Sidebar.displayName = "LayoutShell.Sidebar";

const Canvas: React.FC<SlotProps> = ({ children, className = "", style }) => (
  <main
    id="layout-canvas"
    data-tour-target="main-canvas"
    className={`layout-shell__canvas ${className}`}
    style={style}
    role="main"
    aria-label="Design canvas"
    tabIndex={0}
  >
    {children}
  </main>
);
Canvas.displayName = "LayoutShell.Canvas";

interface InspectorSlotProps extends SlotProps {
  open?: boolean;
}

const Inspector: React.FC<InspectorSlotProps> = ({
  children,
  className = "",
  style,
  open = true,
}) => (
  <aside
    data-tour-target="properties-panel"
    className={`layout-shell__inspector ${open ? "layout-shell__inspector--open" : ""} ${className}`}
    style={style}
    role="complementary"
    aria-label="Element properties"
    aria-hidden={!open}
    tabIndex={open ? 0 : -1}
  >
    {children}
  </aside>
);
Inspector.displayName = "LayoutShell.Inspector";

/** FullPage slot — replaces Canvas+Inspector when a fullpage tab is active */
const FullPage: React.FC<SlotProps> = ({ children, className = "", style }) => (
  <div
    className={`layout-shell__fullpage ${className}`}
    style={style}
    role="region"
    aria-label="Full-page view"
  >
    {children}
  </div>
);
FullPage.displayName = "LayoutShell.FullPage";

/** Footer slot — 32px status bar at bottom */
const Footer: React.FC<SlotProps> = ({ children, className = "", style }) => (
  <footer
    className={`layout-shell__footer ${className}`}
    style={style}
    role="contentinfo"
    aria-label="Editor status"
  >
    {children}
  </footer>
);
Footer.displayName = "LayoutShell.Footer";

// ============================================
// Main Component
// ============================================

export const LayoutShell: React.FC<LayoutShellProps> & {
  TopBar: typeof TopBar;
  Rail: typeof Rail;
  Drawer: typeof Drawer;
  Sidebar: typeof Sidebar;
  Canvas: typeof Canvas;
  Inspector: typeof Inspector;
  FullPage: typeof FullPage;
  Footer: typeof Footer;
} = ({
  children,
  drawerOpen,
  drawerWidth,
  fullPageMode = false,
  inspectorOpen = true,
  className = "",
  style,
}) => {
  const slots = React.useMemo(() => {
    const result: {
      topBar: React.ReactNode | null;
      rail: React.ReactNode | null;
      drawer: React.ReactNode | null;
      sidebar: React.ReactNode | null;
      canvas: React.ReactNode | null;
      inspector: React.ReactNode | null;
      fullPage: React.ReactNode | null;
      footer: React.ReactNode | null;
      other: React.ReactNode[];
    } = {
      topBar: null,
      rail: null,
      drawer: null,
      sidebar: null,
      canvas: null,
      inspector: null,
      fullPage: null,
      footer: null,
      other: [],
    };

    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) {
        result.other.push(child);
        return;
      }

      const displayName = (child.type as React.ComponentType)?.displayName;

      switch (displayName) {
        case "LayoutShell.TopBar":
          result.topBar = child;
          break;
        case "LayoutShell.Rail":
          result.rail = child;
          break;
        case "LayoutShell.Drawer":
          result.drawer = React.cloneElement(child as React.ReactElement<DrawerSlotProps>, {
            open: drawerOpen,
          });
          break;
        case "LayoutShell.Sidebar":
          result.sidebar = child;
          break;
        case "LayoutShell.Canvas":
          result.canvas = child;
          break;
        case "LayoutShell.Inspector":
          result.inspector = React.cloneElement(child as React.ReactElement<InspectorSlotProps>, {
            open: inspectorOpen,
          });
          break;
        case "LayoutShell.FullPage":
          result.fullPage = child;
          break;
        case "LayoutShell.Footer":
          result.footer = child;
          break;
        default:
          result.other.push(child);
      }
    });

    return result;
    /* The drawer-overlay ("pin auto-released") mode that used to hang off a
       `drawerPinned` prop here is retired (2026-09-04, board 202:2 renamed).
       It had no door for its whole life: the single production caller never
       passed the prop, and every test that exercised the overlay supplied the
       trigger itself — a test that supplies the trigger proves the branch
       works, never that the feature has a door. */
  }, [children, drawerOpen, inspectorOpen]);

  const shellClass = [
    "layout-shell",
    !slots.topBar ? "layout-shell--no-topbar" : "",
    slots.sidebar ? "layout-shell--has-sidebar" : "",
    fullPageMode ? "layout-shell--fullpage" : "",
    !fullPageMode && !slots.sidebar && drawerOpen ? "layout-shell--drawer-open" : "",
    !fullPageMode && inspectorOpen ? "layout-shell--inspector-open" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  /* Only write the custom property when a caller actually overrides the width.
     This defaulted to 280 and wrote it INLINE, which beats LayoutShell.css:26's
     `--layout-drawer-width: var(--bk-size-drawer)` — so the grid TRACK was
     pinned to a hardcoded 280 while `.ls-panel` sized itself from the token.
     The panel was 320 in a 280 track and overflowed it by 40 for five months,
     and the conformance baseline recorded the overflow AS the expected value.
     Narrowing the token to 280 made the two agree by coincidence; this makes
     them agree by construction, so moving the token moves both. */
  const shellStyle = {
    ...style,
    ...(drawerWidth == null ? {} : { "--layout-drawer-width": `${drawerWidth}px` }),
  } as React.CSSProperties;

  return (
    <div className={shellClass} style={shellStyle}>
      <a href="#layout-canvas" className="bd-skip-link">
        Skip to Canvas
      </a>

      {slots.topBar}
      {slots.sidebar}
      {slots.rail}

      {/* Panel mode: Drawer + Canvas + Inspector */}
      {slots.drawer}
      {slots.canvas}
      {slots.inspector}

      {/* Fullpage mode: FullPage slot spans columns 2-4 */}
      {slots.fullPage}

      {slots.footer}

      {slots.other}
    </div>
  );
};

LayoutShell.TopBar = TopBar;
LayoutShell.Rail = Rail;
LayoutShell.Drawer = Drawer;
LayoutShell.Sidebar = Sidebar;
LayoutShell.Canvas = Canvas;
LayoutShell.Inspector = Inspector;
LayoutShell.FullPage = FullPage;
LayoutShell.Footer = Footer;

export default LayoutShell;
