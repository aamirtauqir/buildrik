/**
 * LayersTab - Layers sidebar tab.
 *
 * Owns the panel frame (prototype panel-h + psearch). Delegates the
 * tree body to LayersPanel via a thin controlled-props interface.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { IconButton, Menu, MenuItem, PanelFrame, Popover, TOPBAR_CONTEXT_SEARCH_ID, Tooltip } from "@/editor/chrome-ui";
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
  /** The drawer's 700-wide view (LeftSidebar). No header button on v3 board
   *  4418:81300, so it rides in the ⋯ menu — the capability stays. */
  isExpanded?: boolean;
  onExpandToggle?: () => void;
  /** False while the drawer is closed but the tab stays mounted. */
  isOpen?: boolean;
}

const LAYERS_SEARCH_PLACEHOLDER = "Search layers…";
const DIM_SCOPE_TIP =
  "Dimming fades a layer in the editor only — it still publishes. To hide it on the site, use Visibility in the inspector.";
/* The footer's ⓘ: a 20 square ghost at the right edge of the 32 band. */
const DIM_INFO_BTN = "tw:size-5 tw:min-h-0 tw:p-0 tw:text-[var(--bk-ink-muted)]";

/* Escape closes the drawer (owner ruling 2026-09-24) — but a key meant for
   something else is not ours: a rename field or any other text field, an
   open menu or dialog, or focus on the canvas (where Escape deselects). */
function escapeIsOurs(e: KeyboardEvent): boolean {
  if (document.querySelector('[role="menu"], [role="dialog"], [role="alertdialog"]')) return false;
  const t = e.target instanceof HTMLElement ? e.target : null;
  if (!t || t === document.body) return true;
  /* The topbar Layers filter: the first Escape empties it, the next closes. */
  if (t.id === TOPBAR_CONTEXT_SEARCH_ID) return !(t instanceof HTMLInputElement && t.value);
  if (t.closest("input, textarea, select, [contenteditable='true']")) return false;
  return !t.closest("#layout-canvas");
}

export const LayersTab: React.FC<LayersTabProps> = ({
  composer,
  onElementSelect,
  canvasHoveredId,
  onAddBlockClick,
  onHelpClick,
  onClose,
  isExpanded,
  onExpandToggle,
  isOpen = true,
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

  /* The filter lives in the topbar field (board 4418:81300): announce the
     scope while mounted, take the query back on LAYERS_SEARCH. */
  React.useEffect(() => {
    if (!composer || !isOpen) return;
    const onQuery = ({ query }: { query: string }) => setSearch(query);
    composer.on(EVENTS.UI_SEARCH_QUERY, onQuery);
    composer.emit(EVENTS.UI_SEARCH_CONTEXT, { placeholder: LAYERS_SEARCH_PLACEHOLDER });
    return () => {
      composer.off(EVENTS.UI_SEARCH_QUERY, onQuery);
      composer.emit(EVENTS.UI_SEARCH_CONTEXT, null);
      setSearch("");
    };
  }, [composer, isOpen]);
  /* The no-results "clear": re-announcing the context is what empties the
     topbar field (StudioHeader resets its query on every context). */
  const clearSearch = React.useCallback(() => {
    setSearch("");
    composer?.emit(EVENTS.UI_SEARCH_CONTEXT, { placeholder: LAYERS_SEARCH_PLACEHOLDER });
  }, [composer]);

  React.useEffect(() => {
    if (!onClose || menuOpen || !isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !escapeIsOurs(e)) return;
      onClose();
    };
    /* Capture: the canvas's global shortcuts claim Escape (deselect) and
       mark it handled before a bubbling listener would ever see it. */
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose, menuOpen, isOpen]);

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
              {onExpandToggle && (
                <MenuItem data-testid="layers-wide-view" onClick={runMenu(onExpandToggle)}>
                  {isExpanded ? "Narrow panel" : "Widen panel"}
                </MenuItem>
              )}
            </Menu>
          </Popover>
        }
      />
      {/* No search band: v3 board 4418:81300 puts the filter in the topbar
          field, which reads "Search layers…" while this drawer is open. */}
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
              onSearchChange={clearSearch}
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
          {/* 4418:79546 "ⓘ · dim scope": what the row eye does — the canvas
              dims the element for you; the published site still shows it. */}
          <span className="tw:ml-auto tw:flex">
            <Tooltip content={DIM_SCOPE_TIP} placement="top" arrow={false} className="tw:max-w-[240px] tw:whitespace-normal">
              <IconButton label="About dimmed layers" data-testid="layers-dim-info" className={DIM_INFO_BTN}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
              </IconButton>
            </Tooltip>
          </span>
        </div>
      )}
    </PanelFrame>
  );
};

export default LayersTab;
