/**
 * Portal — renders children into a stable overlay root on document.body.
 *
 * Distinct from OverlayMount on purpose. OverlayMount is an overlay: scrim,
 * focus trap, Escape. Portal is only an escape hatch from an overflow:hidden or
 * transformed ancestor, for surfaces that draw their own chrome. Giving those a
 * scrim they never asked for would be a visual regression dressed as a refactor.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { createPortal } from "react-dom";

const ROOT_ID = "bk-overlay-root";

function overlayRoot(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  let root = document.getElementById(ROOT_ID);
  if (!root) {
    root = document.createElement("div");
    root.id = ROOT_ID;
    document.body.appendChild(root);
  }
  return root;
}

export function Portal({ children }: { children: React.ReactNode }) {
  const [root, setRoot] = React.useState<HTMLElement | null>(null);
  React.useEffect(() => {
    setRoot(overlayRoot());
  }, []);
  if (!root) return null;
  return createPortal(children, root);
}
