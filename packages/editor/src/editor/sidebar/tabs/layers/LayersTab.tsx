import { Input } from "@/editor/shared/vibcoder/Input";
import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * LayersTab - Layers sidebar tab.
 *
 * Owns the panel frame (prototype panel-h + psearch). Delegates the
 * tree body to LayersPanel via a thin controlled-props interface.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useComposerSelection } from "../../../canvas/hooks/useComposerSelection";
import type { Composer } from "../../../../engine";
import { EVENTS } from "../../../../shared/constants/events";
import { LayersPanel } from "../../../panels/layers/index";
import type { SelectedElementInfo } from "../../../panels/layers/types";

export interface LayersTabProps {
  composer: Composer | null;
  onElementSelect?: (elementId: string) => void;
  canvasHoveredId?: string | null;
  onAddBlockClick?: () => void;
  /** Retained for call-site compat. Unused in the new-design Layers tab. */
  isPinned?: boolean;
  /** Retained for call-site compat. Unused in the new-design Layers tab. */
  onPinToggle?: () => void;
  /** Retained for call-site compat. Unused in the new-design Layers tab. */
  onHelpClick?: () => void;
  /** Retained for call-site compat. Unused in the new-design Layers tab. */
  onClose?: () => void;
}

export const LayersTab: React.FC<LayersTabProps> = ({
  composer,
  onElementSelect,
  canvasHoveredId,
  onAddBlockClick,
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

  const subText = `${stats.total} node${stats.total === 1 ? "" : "s"} · ${stats.selected} selected`;

  return (
    <section className="bdc-panel bdc-layers" aria-label="Layers">
      <div className="bdc-panel-h">
        <div className="bdc-panel-h-ttl">
          <h2>Layers</h2>
          <div className="bdc-panel-sub" aria-live="polite">{subText}</div>
        </div>
        <div className="bdc-panel-h-acts">
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
      </div>
      <label className="bdc-psearch">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <Input
          type="text"
          placeholder="Find a layer"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search layers"
        />
      </label>
      <div className="bdc-pbody bdc-pbody-scroll">
        {composer ? (
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
        ) : (
          <div className="bdc-layers-empty">
            <p>Loading layers…</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default LayersTab;
