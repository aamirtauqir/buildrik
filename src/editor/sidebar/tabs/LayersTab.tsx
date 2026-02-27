/**
 * LayersTab - DOM tree hierarchy (standalone tab)
 * Shows element tree with drag-drop, visibility toggles, and custom names
 *
 * Features (12 total):
 * - DOM tree view with expand/collapse
 * - Layer selection (click to select on canvas)
 * - Layer reordering (drag handles)
 * - Visibility toggle (eye icon)
 * - Lock/unlock elements
 * - Layer rename (double-click)
 * - Layer delete
 * - Layer duplicate
 * - Search/filter layers
 * - Multi-select layers (shift+click)
 * - Context menu (right-click)
 * - Keyboard navigation
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useComposerSelection } from "../../../editor/canvas/hooks/useComposerSelection";
import type { Composer } from "../../../engine";
import { EVENTS } from "../../../shared/constants/events";
import { Skeleton } from "../../../shared/ui/Skeleton";
import { LayersPanel } from "../../panels/layers/index";
import type { SelectedElementInfo } from "../../panels/layers/types";
import { PanelHeader } from "../shared/PanelHeader";

export interface LayersTabProps {
  composer: Composer | null;
  onElementSelect?: (elementId: string) => void;
  /** Currently hovered element ID on canvas (for highlighting in tree) */
  canvasHoveredId?: string | null;
  /** Callback to add a block (when tree is empty) */
  onAddBlockClick?: () => void;
  /** Panel pin state */
  isPinned?: boolean;
  /** Pin toggle callback */
  onPinToggle?: () => void;
  /** Help button callback */
  onHelpClick?: () => void;
  /** Close panel callback */
  onClose?: () => void;
}

export const LayersTab: React.FC<LayersTabProps> = ({
  composer,
  onElementSelect,
  canvasHoveredId,
  onAddBlockClick,
  isPinned,
  onPinToggle,
  onHelpClick,
  onClose,
}) => {
  // Note: Search is handled within LayersPanel component itself
  // This avoids duplicate search boxes (P0 fix from UX audit)

  // Use shared selection hook - SINGLE SOURCE OF TRUTH
  const { selectedElement: selectedEl, selectedId } = useComposerSelection({ composer });

  // Convert to the format expected by LayersPanel
  const selectedElement: SelectedElementInfo | null = React.useMemo(() => {
    if (!selectedEl) return null;
    return {
      id: selectedId || "",
      type: selectedEl.getType?.() || "element",
      tagName: selectedEl.getTagName?.() || "div",
    };
  }, [selectedEl, selectedId]);

  // Notify parent of selection changes
  React.useEffect(() => {
    if (selectedId) {
      onElementSelect?.(selectedId);
    }
  }, [selectedId, onElementSelect]);

  // Handle layer hover -> emit event for canvas highlighting
  const handleLayerHover = React.useCallback(
    (id: string | null) => {
      if (composer) {
        composer.emit(EVENTS.LAYER_HOVER, { id });
      }
    },
    [composer]
  );

  if (!composer) {
    return (
      <div style={containerStyles}>
        <PanelHeader
          title="Layers"
          isPinned={isPinned}
          onPinToggle={onPinToggle}
          onHelpClick={onHelpClick}
          onClose={onClose}
        />
        <div style={skeletonTreeStyles}>
          {/* Mimic a tree structure with indentation */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Skeleton width={14} height={14} radius="sm" />
            <Skeleton width="60%" height={12} radius="sm" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 22 }}>
            <Skeleton width={14} height={14} radius="sm" />
            <Skeleton width="50%" height={12} radius="sm" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 44 }}>
            <Skeleton width={14} height={14} radius="sm" />
            <Skeleton width="40%" height={12} radius="sm" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 44 }}>
            <Skeleton width={14} height={14} radius="sm" />
            <Skeleton width="55%" height={12} radius="sm" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 22 }}>
            <Skeleton width={14} height={14} radius="sm" />
            <Skeleton width="45%" height={12} radius="sm" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Skeleton width={14} height={14} radius="sm" />
            <Skeleton width="50%" height={12} radius="sm" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      {/* Panel Header */}
      <PanelHeader
        title="Layers"
        isPinned={isPinned}
        onPinToggle={onPinToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      />

      {/* Tree Content - LayersPanel has its own integrated search */}
      <div style={contentStyles}>
        <LayersPanel
          composer={composer}
          selectedElement={selectedElement}
          onLayerHover={handleLayerHover}
          canvasHoveredId={canvasHoveredId}
          onAddBlockClick={onAddBlockClick}
        />
      </div>
    </div>
  );
};

// ============================================
// Styles
// ============================================

const containerStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  background: "var(--aqb-surface-2)",
};

const contentStyles: React.CSSProperties = {
  flex: 1,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

const skeletonTreeStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  padding: "16px 12px",
};

export default LayersTab;
