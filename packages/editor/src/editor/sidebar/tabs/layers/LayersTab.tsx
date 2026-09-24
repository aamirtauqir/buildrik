/**
 * LayersTab - Layers sidebar tab.
 *
 * Owns the panel frame (prototype panel-h + psearch). Delegates the
 * tree body to LayersPanel via a thin controlled-props interface.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { IconButton, Menu, MenuItem, PanelFrame, Popover, TextInput } from "@/editor/chrome-ui";
import { useComposerSelection } from "../../../canvas/hooks/useComposerSelection";
import type { Composer } from "../../../../engine";
import { EVENTS } from "../../../../shared/constants/events";
import { LayersPanel } from "../../../panels/layers/index";
import { LayersLoadError, LayersLoadingSkeleton } from "../../../panels/layers/components/LayersStateBlocks";
import { useProjectLoading } from "../../../shell/hooks/useProjectLoading";
import type { SelectedElementInfo } from "../../../panels/layers/types";

/*
  Boards 781:4217 / 775:4130. A tree that throws mid-render used to blank the
  whole drawer; the board draws a scoped failure instead — "The page is fine —
  only this list failed." Retry remounts the tree (key bump), nothing else.
*/
class LayersTreeBoundary extends React.Component<
  { children: React.ReactNode; onFailedChange?: (failed: boolean) => void },
  { failed: boolean; attempt: number }
> {
  state = { failed: false, attempt: 0 };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  /* The count footer is the boundary's SIBLING, so it survives the failure
     and kept reporting the last good total — "66 layers" printed under
     "Couldn't load the layer tree." Board 781:4217 draws no count in this
     state, and it should not: the tree that number described is gone. */
  componentDidCatch() {
    this.props.onFailedChange?.(true);
  }
  render() {
    if (this.state.failed) {
      return (
        <LayersLoadError
          onRetry={() => {
            this.props.onFailedChange?.(false);
            this.setState((s) => ({ failed: false, attempt: s.attempt + 1 }));
          }}
        />
      );
    }
    return <React.Fragment key={this.state.attempt}>{this.props.children}</React.Fragment>;
  }
}

export interface LayersTabProps {
  composer: Composer | null;
  onElementSelect?: (elementId: string) => void;
  canvasHoveredId?: string | null;
  onAddBlockClick?: () => void;
  /** Header help action (board 208:191 — the 16:6 Panel header's first slot). */
  onHelpClick?: () => void;
  /** Header close action (16:6 second slot — "closing is the last thing you do"). */
  onClose?: () => void;
}

/* Board 142:8: the .bdc-psearch container is the box — the flowbite input's
   own border/ring inside it reads as a second box. */
const searchInputStyles: React.CSSProperties = {
  border: "none",
  boxShadow: "none",
  background: "transparent",
  fontSize: 13,
  lineHeight: "20px",
  fontFamily: "var(--bk-font-ui)",
};

export const LayersTab: React.FC<LayersTabProps> = ({
  composer,
  onElementSelect,
  canvasHoveredId,
  onAddBlockClick,
  onHelpClick,
  onClose,
}) => {
  const { selectedElement: selectedEl, selectedId } = useComposerSelection({ composer });
  const projectLoading = useProjectLoading(composer);

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
  /* Board 7059:78962 "Layers · Panel menu (⋯)": Expand all · Collapse all ·
     Display settings…. The three used to sit as ⊞ ⊟ ⚙ glyphs on the toolbar
     row (audit G2-058: pattern, not capability). */
  const [menuOpen, setMenuOpen] = React.useState(false);
  /* Raised by the tree boundary so the count footer, which is its sibling,
     can stand down with it. */
  const [treeFailed, setTreeFailed] = React.useState(false);
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

  const runMenu = (fn: () => void) => () => {
    setMenuOpen(false);
    fn();
  };

  return (
    <PanelFrame className="bdc-panel bdc-layers">
      {/* Board 142:2 — header is the bare 16:6 Panel header; the ⋯ panel menu
          (7059:78962) rides in its actions slot — `actions`, not children,
          which PanelHeader drops. The count lives in the footer. */}
      <PanelFrame.Header
        title="Layers"
        onHelpClick={onHelpClick}
        onClose={onClose}
        actions={
          <Popover
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            placement="bottom-end"
            label="Layers options"
            trigger={
              <IconButton
                label="Layers options"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                data-testid="layers-panel-menu"
                onClick={() => setMenuOpen((v) => !v)}
              >
                ⋯
              </IconButton>
            }
          >
            <Menu label="Layers options">
              <MenuItem data-testid="layers-expand-all" onClick={runMenu(() => composer?.emit("layers:expand-all", {}))}>
                Expand all
              </MenuItem>
              <MenuItem data-testid="layers-collapse-all" onClick={runMenu(() => composer?.emit("layers:collapse-all", {}))}>
                Collapse all
              </MenuItem>
              <MenuItem
                data-testid="layers-display-settings-toggle"
                onClick={runMenu(() => setDisplaySettingsOpen((v) => !v))}
              >
                Display settings…
              </MenuItem>
            </Menu>
          </Popover>
        }
      />
      {/* Board 142:7 Toolbar — the search box on a 36-tall band. */}
      <div className="bdc-ltoolbar" data-testid="layers-toolbar">
        {/* Board 142:8: bare box — no magnifier glyph. */}
        <label className="bdc-psearch" data-testid="layers-search">
          {/* The CONTAINER (.bdc-psearch) is the box — board 142:8. The
              flowbite input's own border/ring inside it reads as a second
              box; inline style outranks the theme utilities. */}
          <TextInput
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search layers"
            style={searchInputStyles}
          />
        </label>
      </div>
      <div className="bdc-pbody bdc-pbody-scroll">
        {/* `composer` alone is not "ready": useComposerInit sets it
            synchronously in the effect body, before the site fetch even
            starts, so it is non-null on the very first render. Gating the
            skeleton on it alone showed an empty tree and a footer reading
            "0 layers" for the whole load. `projectLoading` is the flag Canvas,
            ProInspector and StudioFooter already agree on — Layers was the one
            surface not reading it (blocker A2). */}
        {composer && !projectLoading ? (
          <LayersTreeBoundary onFailedChange={setTreeFailed}>
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
          header subtitle; the header stays a bare label. Gone when the tree
          failed (781:4217), because a count of a list that did not load is
          not a fact. */}
      {!treeFailed && (
        <div className="bdc-lcount" data-testid="layers-count" aria-live="polite">
          {/* The span is the board's own second node (142:59 inside 142:58):
              the band carries the height, the run carries the type. */}
          <span data-testid="layers-count-text">
            {stats.selected >= 2
              ? `${stats.selected} selected of ${stats.total}`
              : `${stats.total} layer${stats.total === 1 ? "" : "s"}`}
          </span>
        </div>
      )}
    </PanelFrame>
  );
};

export default LayersTab;
