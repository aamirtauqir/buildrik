/**
 * StructurePopover — the page-structure (layers) tree as a floating panel
 * anchored at the footer ⌗, over the canvas (prototype 51-layers). Replaces the
 * old behaviour where ⌗ opened the layers tab in the left drawer — structure is
 * a transient "where am I in the tree" glance, not a persistent left-rail tool.
 *
 * Opens from the footer trigger; closes on the X, Escape, or an outside click.
 * Reuses the existing LayersPanel (only composer + selectedElement are required).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../engine";
import { Button } from "@/editor/shared/vibcoder/Button";
import { X } from "lucide-react";
import { LayersPanel } from "../panels/layers";
import type { SelectedElementInfo } from "../panels/layers";

interface StructurePopoverProps {
  open: boolean;
  onClose: () => void;
  composer: Composer | null;
  selectedElement: SelectedElementInfo | null;
}

export const StructurePopover: React.FC<StructurePopoverProps> = ({
  open,
  onClose,
  composer,
  selectedElement,
}) => {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("keydown", onKey);
    // mousedown (not click) so a drag inside the tree doesn't dismiss it
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Page structure"
      style={{
        position: "fixed",
        left: 12,
        bottom: 44,
        width: 400,
        maxHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bd-bg, #fff)",
        border: "1px solid var(--bd-border, #e5e7eb)",
        borderRadius: 8,
        boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
        zIndex: 1000,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 10px",
          borderBottom: "1px solid var(--bd-border, #e5e7eb)",
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--bd-fg, #111827)" }}>Structure</span>
        <Button
          variant="bare"
          size="sm"
          onClick={onClose}
          aria-label="Close structure"
          style={{ display: "inline-grid", placeItems: "center", width: 24, height: 24, padding: 0 }}
        >
          <X size={14} />
        </Button>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        <LayersPanel composer={composer} selectedElement={selectedElement} />
      </div>
    </div>
  );
};

export default StructurePopover;
