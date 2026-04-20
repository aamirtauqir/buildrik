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
import { useComposerSelection } from "../../../canvas/hooks/useComposerSelection";
import type { Composer } from "../../../../engine";
import { EVENTS } from "../../../../shared/constants/events";
import { Skeleton } from "../../../../shared/ui/Skeleton";
import { LayersPanel } from "../../../panels/layers/index";
import type { SelectedElementInfo } from "../../../panels/layers/types";
import { PanelShell } from "@shared/ui/panel";

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

  // Selection synced banner (Screen uHSyK): show briefly when canvas selects a layer
  const [selectionSynced, setSelectionSynced] = React.useState(false);
  const syncTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (!composer) return;
    const onCanvasSelect = () => {
      setSelectionSynced(true);
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => setSelectionSynced(false), 2500);
    };
    composer.on(EVENTS.ELEMENT_SELECTED, onCanvasSelect);
    return () => {
      composer.off(EVENTS.ELEMENT_SELECTED, onCanvasSelect);
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [composer]);

  if (!composer) {
    return (
      <PanelShell>
        <PanelShell.Header
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
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 42 }}>
            <Skeleton width={14} height={14} radius="sm" />
            <Skeleton width="40%" height={12} radius="sm" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 42 }}>
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
      </PanelShell>
    );
  }

  return (
    <PanelShell>
      <PanelShell.Header
        title="Layers"
        isPinned={isPinned}
        onPinToggle={onPinToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      />

      {/* Selection synced banner — Screen uHSyK */}
      {selectionSynced && (
        <div className="buildrick-sync-banner" role="status" aria-live="polite">
          Selection synced from canvas
        </div>
      )}

      {/* Tree Content - LayersPanel has its own integrated search */}
      <PanelShell.Content noScroll>
        <LayersPanel
          composer={composer}
          selectedElement={selectedElement}
          onLayerHover={handleLayerHover}
          canvasHoveredId={canvasHoveredId}
          onAddBlockClick={onAddBlockClick}
        />
      </PanelShell.Content>
    </PanelShell>
  );
};

// ============================================
// Styles
// ============================================

const containerStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  background: "var(--buildrick-surface-2)",
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
