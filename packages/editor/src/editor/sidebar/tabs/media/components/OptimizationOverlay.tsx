/**
 * OptimizationOverlay — §18 prototype-v3 compress shortcut.
 *
 * Lightweight modal chrome around the existing OptimizationPanel component.
 * Mounted by MediaTab + ExpandedMediaPanel when `state.optimizeItem` is set;
 * triggered from MediaContextMenu "Optimize image" or AssetDetailOverlay's
 * "Optimize" action button (img-type only).
 *
 * onOptimized fires with the new optimized data-URL/src; caller is responsible
 * for uploading it as a new asset version (mirroring handleEditImage pattern).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/editor/shared/vibcoder/Button";
import { OptimizationPanel } from "@/editor/media/OptimizationPanel";
import type { LibraryItem } from "../data/mediaTypes";

export interface OptimizationOverlayProps {
  item: LibraryItem;
  onOptimized(optimizedSrc: string): void | Promise<void>;
  onClose(): void;
}

export function OptimizationOverlay({ item, onOptimized, onClose }: OptimizationOverlayProps) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="med-optim-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Optimize ${item.name}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="med-optim-modal">
        <header className="med-optim-header">
          <div className="med-optim-title-group">
            <h3 className="med-optim-title">Optimize {item.name}</h3>
            <p className="med-optim-sub">Save bandwidth on every page load. Original preserved.</p>
          </div>
          <Button
            type="button"
            className="med-optim-close"
            onClick={onClose}
            aria-label="Close"
            title="Close"
          >
            <X size={14} />
          </Button>
        </header>
        <div className="med-optim-body">
          <OptimizationPanel
            imageSrc={item.src}
            onOptimized={async (src) => {
              await onOptimized(src);
              onClose();
            }}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}
