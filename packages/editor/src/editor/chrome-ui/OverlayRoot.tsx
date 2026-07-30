/**
 * OverlayRoot — the ONE chrome overlay mount point (spec §4.4).
 *
 * Everything portalled — ours (Portal, Modal, CommandPalette, Drawer) and
 * flowbite-react's — mounts here instead of racing separate document.body
 * portals with independent stacking contexts. Gate 22 successor enforces it.
 *
 * @license BSD-3-Clause
 */
const ROOT_ID = "bk-overlay-root";

export function getOverlayRoot(): HTMLElement {
  let root = document.getElementById(ROOT_ID);
  if (!root) {
    root = document.createElement("div");
    root.id = ROOT_ID;
    document.body.appendChild(root);
  }
  return root;
}
