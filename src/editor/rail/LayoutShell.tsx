/**
 * LayoutShell - Main CSS Grid container for the editor
 * Implements the IA Redesign 2026 layout specification
 *
 * Grid Structure:
 * - Columns: Rail (56px) | Drawer (280px) | Canvas (1fr) | Inspector (300px)
 * - Rows: TopBar (52px) | Main Content (1fr) | Footer (40px in canvas)
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import "./LayoutShell.css";

// ============================================
// Types
// ============================================

export interface LayoutShellProps {
  /** Children to render in the layout slots */
  children: React.ReactNode;
  /** Whether the drawer panel is open */
  drawerOpen: boolean;
  /** Whether the inspector panel is visible */
  inspectorOpen?: boolean;
  /** Custom class name for the shell */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

/**
 * Slot components for named children placement
 * Usage:
 *   <LayoutShell drawerOpen={true}>
 *     <LayoutShell.TopBar>...</LayoutShell.TopBar>
 *     <LayoutShell.Rail>...</LayoutShell.Rail>
 *     <LayoutShell.Drawer>...</LayoutShell.Drawer>
 *     <LayoutShell.Canvas>...</LayoutShell.Canvas>
 *     <LayoutShell.Inspector>...</LayoutShell.Inspector>
 *   </LayoutShell>
 */

interface SlotProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

// Named slot components
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
  >
    {children}
  </nav>
);
Rail.displayName = "LayoutShell.Rail";

interface DrawerSlotProps extends SlotProps {
  open?: boolean;
}

const Drawer: React.FC<DrawerSlotProps> = ({ children, className = "", style, open = true }) => (
  <aside
    data-tour-target="left-sidebar"
    className={`layout-shell__drawer ${open ? "layout-shell__drawer--open" : ""} ${className}`}
    style={style}
    role="region"
    aria-label="Sidebar panel"
    aria-hidden={!open}
  >
    {children}
  </aside>
);
Drawer.displayName = "LayoutShell.Drawer";

const Canvas: React.FC<SlotProps> = ({ children, className = "", style }) => (
  <main
    id="layout-canvas"
    data-tour-target="main-canvas"
    className={`layout-shell__canvas ${className}`}
    style={style}
    role="main"
    aria-label="Design canvas"
    tabIndex={-1}
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
  >
    {children}
  </aside>
);
Inspector.displayName = "LayoutShell.Inspector";

// ============================================
// Main Component
// ============================================

/**
 * LayoutShell - CSS Grid based editor layout
 *
 * Implements the IA Redesign 2026 layout:
 * - 56px Left Rail (touch-optimized icon navigation)
 * - 280px Drawer (contextual panel, slides in/out)
 * - Flexible Canvas (main editing area + 40px footer toolbar)
 * - 300px Right Inspector (property panel with AI suggestions)
 */
export const LayoutShell: React.FC<LayoutShellProps> & {
  TopBar: typeof TopBar;
  Rail: typeof Rail;
  Drawer: typeof Drawer;
  Canvas: typeof Canvas;
  Inspector: typeof Inspector;
} = ({ children, drawerOpen, inspectorOpen = true, className = "", style }) => {
  // Parse children to find slot components
  const slots = React.useMemo(() => {
    const result: {
      topBar: React.ReactNode | null;
      rail: React.ReactNode | null;
      drawer: React.ReactNode | null;
      canvas: React.ReactNode | null;
      inspector: React.ReactNode | null;
      other: React.ReactNode[];
    } = {
      topBar: null,
      rail: null,
      drawer: null,
      canvas: null,
      inspector: null,
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
        case "LayoutShell.Canvas":
          result.canvas = child;
          break;
        case "LayoutShell.Inspector":
          result.inspector = React.cloneElement(child as React.ReactElement<InspectorSlotProps>, {
            open: inspectorOpen,
          });
          break;
        default:
          result.other.push(child);
      }
    });

    return result;
  }, [children, drawerOpen, inspectorOpen]);

  // Build CSS class for grid state
  const shellClass = [
    "layout-shell",
    !slots.topBar ? "layout-shell--no-topbar" : "",
    drawerOpen ? "layout-shell--drawer-open" : "",
    inspectorOpen ? "layout-shell--inspector-open" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={shellClass} style={style}>
      {/* Skip Link - WCAG 2.4.1 compliance */}
      <a href="#layout-canvas" className="aqb-skip-link">
        Skip to Canvas
      </a>

      {/* Top Bar - spans full width */}
      {slots.topBar}

      {/* Left Rail - always visible */}
      {slots.rail}

      {/* Drawer Panel - slides in/out */}
      {slots.drawer}

      {/* Canvas Area - flexible */}
      {slots.canvas}

      {/* Right Inspector - contextual properties */}
      {slots.inspector}

      {/* Any other children (modals, overlays, etc.) */}
      {slots.other}
    </div>
  );
};

// Attach slot components to LayoutShell
LayoutShell.TopBar = TopBar;
LayoutShell.Rail = Rail;
LayoutShell.Drawer = Drawer;
LayoutShell.Canvas = Canvas;
LayoutShell.Inspector = Inspector;

export default LayoutShell;
