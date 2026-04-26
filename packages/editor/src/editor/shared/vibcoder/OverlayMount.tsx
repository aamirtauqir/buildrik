/**
 * OverlayMount — single portal root for all Phase 3 overlay organisms.
 *
 * Per Contract E3 (portal discipline): every overlay organism (Modal, Drawer,
 * NotificationCenter, CommandPalette, ColorPicker, PagesDrawer, TemplatesDrawer)
 * portals through this single root, NOT directly to document.body. Stack ordering
 * managed centrally — last-mounted is on top. No z-index wars.
 *
 * Implementation note: the root <div id="vibcoder-overlay-root"> is created
 * lazily on first read (either by OverlayMount itself or by useOverlayContainer)
 * via getOrCreateOverlayRoot(). This avoids a render-order race where a child
 * overlay's portal would attach to document.body before OverlayMount's effect
 * runs to create the root. Both paths converge on the same DOM node.
 *
 * Allow-listed for E3 grep gate (Gate 22) — only OverlayMount.tsx may reference
 * document.body. All other organism files use useOverlayContainer() to read the
 * mounted root.
 *
 * @license BSD-3-Clause
 */
import { useEffect, useState, type ReactNode } from "react";

const OVERLAY_ROOT_ID = "vibcoder-overlay-root";

function getOrCreateOverlayRoot(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  let root = document.getElementById(OVERLAY_ROOT_ID);
  if (!root) {
    root = document.createElement("div");
    root.id = OVERLAY_ROOT_ID;
    // Allow-listed: this is the ONLY document.body reference per E3.
    document.body.appendChild(root);
  }
  return root;
}

/**
 * Mount this once at app root. Idempotent — multiple mounts re-use the same div.
 *
 * Usage:
 *   <OverlayMount>
 *     <App />
 *   </OverlayMount>
 */
export function OverlayMount({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = getOrCreateOverlayRoot();
    return () => {
      // Cleanup on unmount. Skip if multiple OverlayMount instances exist
      // OR an overlay portaled into the root is still present.
      if (root && !root.hasChildNodes()) {
        root.remove();
      }
    };
  }, []);
  return <>{children}</>;
}
OverlayMount.displayName = "OverlayMount";

/**
 * Read the overlay root container for use as Radix.Portal `container` prop.
 *
 * Returns the root synchronously on first render. If OverlayMount hasn't
 * committed yet (render-order race), this getter creates the root in place so
 * the portal anchors correctly on the very first mount. The root is a singleton
 * by id — OverlayMount's effect will pick up the same node when it runs.
 *
 * Returns null on the server (typeof document === "undefined").
 */
export function useOverlayContainer(): HTMLElement | null {
  const [container] = useState<HTMLElement | null>(() => getOrCreateOverlayRoot());
  return container;
}
