/**
 * LayersTab - Layers sidebar tab.
 *
 * Owns the panel frame (prototype panel-h + psearch). Delegates the
 * tree body to LayersPanel via a thin controlled-props interface.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { PanelFrame, Button, TextInput } from "@/editor/chrome-ui";
import { useComposerSelection } from "../../../canvas/hooks/useComposerSelection";
import type { Composer } from "../../../../engine";
import { EVENTS } from "../../../../shared/constants/events";
import { LayersPanel } from "../../../panels/layers/index";
import { LayersLoadError, LayersLoadingSkeleton } from "../../../panels/layers/components/LayersStateBlocks";
import type { SelectedElementInfo } from "../../../panels/layers/types";

/*
  Boards 781:4217 / 775:4130. A tree that throws mid-render used to blank the
  whole drawer; the board draws a scoped failure instead — "The page is fine —
  only this list failed." Retry remounts the tree (key bump), nothing else.
*/
class LayersTreeBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean; attempt: number }
> {
  state = { failed: false, attempt: 0 };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return <LayersLoadError onRetry={() => this.setState((s) => ({ failed: false, attempt: s.attempt + 1 }))} />;
    }
    return <React.Fragment key={this.state.attempt}>{this.props.children}</React.Fragment>;
  }
}

export interface LayersTabProps {
  composer: Composer | null;
  onElementSelect?: (elementId: string) => void;
  canvasHoveredId?: string | null;
  onAddBlockClick?: () => void;
  /** Retained for call-site compat. Unused in the new-design Layers tab. */
  isPinned?: boolean;
  /** Retained for call-site compat. Unused in the new-design Layers tab. */
  onPinToggle?: () => void;
  /** Header help action (board 208:191 — the 16:6 Panel header's first slot). */
  onHelpClick?: () => void;
  /** Header close action (16:6 second slot — "closing is the last thing you do"). */
  onClose?: () => void;
}

export const LayersTab: React.FC<LayersTabProps> = ({
  composer,
  onElementSelect,
  canvasHoveredId,
  onAddBlockClick,
  onHelpClick,
  onClose,
}) => {
  const { selectedElement: selectedEl, selectedId } = useComposerSelection({ composer });

  const selectedElement: SelectedElementInfo | null = React.useMemo(() => {
    if (!selectedEl) return null;
    return {
      id: selectedId || "",
      type: selectedEl.getType?.() || "element",
      tagName: selectedEl.getTagName?.() || "div",
    };
  }, [selectedEl, selectedId]);

  React.useEffect(() => {
    if (selectedId) onElementSelect?.(selectedId);
  }, [selectedId, onElementSelect]);

  // Local state (lifted from LayersPanel per spec §6)
  const [search, setSearch] = React.useState("");
  const [displaySettingsOpen, setDisplaySettingsOpen] = React.useState(false);
  const [stats, setStats] = React.useState<{ total: number; selected: number }>({ total: 0, selected: 0 });

  // Subscribe to stats event from LayersPanel
  React.useEffect(() => {
    if (!composer) return;
    const onStats = (data: unknown) => {
      const d = data as { total: number; selected: number };
      if (typeof d?.total === "number" && typeof d?.selected === "number") {
        setStats({ total: d.total, selected: d.selected });
      }
    };
    composer.on("layers:stats-change", onStats);
    return () => {
      composer.off("layers:stats-change", onStats);
    };
  }, [composer]);

  const handleLayerHover = React.useCallback(
    (id: string | null) => {
      if (composer) composer.emit(EVENTS.LAYER_HOVER, { id });
    },
    [composer]
  );

  const handleExpandAll = React.useCallback(() => {
    composer?.emit("layers:expand-all", {});
  }, [composer]);

  const handleCollapseAll = React.useCallback(() => {
    composer?.emit("layers:collapse-all", {});
  }, [composer]);

  return (
    <PanelFrame className="bdc-panel bdc-layers">
      {/* Board 142:2 — header is the bare 16:6 Panel header. Help/close come
          from PanelHeader's own props (children are silently dropped by this
          API — the old expand/cog "header buttons" never rendered at all);
          tree tools live on the toolbar row, the count in the footer. */}
      <PanelFrame.Header title="Layers" onHelpClick={onHelpClick} onClose={onClose} />
      {/* Board 142:7 Toolbar — search box + ⊞ ⊟ ⚙ on one 36-tall band. */}
      <div className="bdc-ltoolbar">
        <label className="bdc-psearch">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <TextInput
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search layers"
          />
        </label>
        <Button className="bdc-icon-btn" title="Expand all" aria-label="Expand all layers" onClick={handleExpandAll}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3v3 M16 3v3 M8 21v-3 M16 21v-3 M3 8h3 M21 8h-3 M3 16h3 M21 16h-3" />
          </svg>
        </Button>
        <Button className="bdc-icon-btn" title="Collapse all" aria-label="Collapse all layers" onClick={handleCollapseAll}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="11" width="16" height="2" rx="1" />
          </svg>
        </Button>
        <Button className="bdc-icon-btn" title="Display settings" aria-label="Layer display settings" aria-expanded={displaySettingsOpen} onClick={() => setDisplaySettingsOpen((v) => !v)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 01-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 01-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 012.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 012.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z" />
          </svg>
        </Button>
      </div>
      <div className="bdc-pbody bdc-pbody-scroll">
        {composer ? (
          <LayersTreeBoundary>
            <LayersPanel
              composer={composer}
              selectedElement={selectedElement}
              onLayerHover={handleLayerHover}
              canvasHoveredId={canvasHoveredId}
              onAddBlockClick={onAddBlockClick}
              search={search}
              displaySettingsOpen={displaySettingsOpen}
              onDisplaySettingsToggle={() => setDisplaySettingsOpen((v) => !v)}
              onSearchChange={setSearch}
            />
          </LayersTreeBoundary>
        ) : (
          <LayersLoadingSkeleton />
        )}
      </div>
      {/* Board 142:58 Count footer — the node count lives here, not in the
          header subtitle; the header stays a bare label. */}
      <div className="bdc-lcount" aria-live="polite">
        {stats.total} layer{stats.total === 1 ? "" : "s"}
        {stats.selected > 0 ? ` · ${stats.selected} selected` : ""}
      </div>
    </PanelFrame>
  );
};

export default LayersTab;
