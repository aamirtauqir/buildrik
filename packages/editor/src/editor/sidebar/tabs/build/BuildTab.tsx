/**
 * BuildTab — Add tab shell.
 *
 * Layout: PanelHeader / SearchBar / panel-scroll / panel-bottom
 * where panel-bottom is pinned (flex-shrink: 0) — ALWAYS, including during
 * search: board 138:53 draws Paste-HTML + TipsFooter under the results.
 *
 * Sections mode (pre-built sections catalog + lazy chunk) was removed on
 * 2026-04-23 — the UI switch had been stripped earlier and ~1300 lines
 * across catalog/sections.ts, components/SectionsMode.tsx, and the
 * accompanying hook were unreachable dead code. Only the elements grid
 * remains.
 */

import * as React from "react";
import { PanelFrame } from "@/editor/chrome-ui";
import type { Composer } from "../../../../engine";
import type { BlockData } from "../../../../shared/types";
import { SearchBar } from "../../shared/SearchBar";
import { useBuildTab } from "./hooks/useBuildTab";
import { useCallout } from "./hooks/useCallout";
import { TipsFooter } from "./components/TipsFooter";
import { GroupSection, Row } from "./components/GroupSection";
import { useToast } from "@/editor/chrome-ui";
import { SearchResults } from "./components/SearchResults";
import { TransitionCallout } from "./components/TransitionCallout";
import { buildInsertGroups, elementRows, blockRows, componentRows, type InsertGroupId } from "./catalog/groups";
import { EVENTS } from "../../../../shared/constants";
import type { ComponentDefinition } from "../../../../shared/types/components";
import "./BuildTab.css";

export interface BuildTabProps {
  composer: Composer | null;
  onBlockClick?: (data: BlockData) => void;
  isExpanded?: boolean;
  onExpandToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
}

export const BuildTab: React.FC<BuildTabProps> = ({
  composer, onBlockClick, isExpanded, onExpandToggle, onHelpClick, onClose,
}) => {
  const tab = useBuildTab(composer, onBlockClick);
  const callout = useCallout();
  const isSearching = tab.searchQuery.trim().length > 0;

  // Board 137:2 taxonomy: ELEMENTS open (▾), the rest closed (▸).
  const [openGroups, setOpenGroups] = React.useState<Set<InsertGroupId>>(
    () => new Set<InsertGroupId>(["elements"]),
  );
  const { addToast } = useToast();

  // MINE (board 1069:4970): the user's own components, inline. Same load +
  // subscribe shape useComponentsState uses.
  const [mine, setMine] = React.useState<ComponentDefinition[]>([]);
  React.useEffect(() => {
    if (!composer?.components) return;
    const load = () => setMine(composer.components?.getAllComponents() ?? []);
    load();
    composer.on(EVENTS.COMPONENT_LIST_UPDATED, load);
    return () => {
      composer.off(EVENTS.COMPONENT_LIST_UPDATED, load);
    };
  }, [composer]);

  const groups = React.useMemo(
    () => buildInsertGroups(composer?.components ? mine.length : null),
    [composer, mine.length],
  );

  // MINE row click — the same instantiate contract the Components surface
  // uses: selected element is the parent, else the active page root.
  const insertMine = React.useCallback(async (c: ComponentDefinition) => {
    if (!composer) return;
    let parentId = composer.selection.getSelectedIds()[0];
    if (!parentId) parentId = composer.elements.getActivePage()?.root?.id ?? "";
    if (!parentId) {
      addToast({ description: "Open a page first to add this component.", tone: "warning" });
      return;
    }
    try {
      await composer.components.instantiateComponent(c.id, parentId);
      addToast({ description: "Component added to canvas", tone: "success" });
    } catch {
      addToast({ description: "Couldn't add component. Try again.", tone: "error" });
    }
  }, [composer, addToast]);

  // Board 233:1123 "⌥ Paste HTML…": clipboard → the SAME BlockData insert path
  // everything else uses. useBlockInsertion sanitizes (insertBlock owns the
  // XSS boundary) and gives the transaction/smart-placement/select/flash.
  const pasteHtml = React.useCallback(async () => {
    let text = "";
    try {
      text = await navigator.clipboard.readText();
    } catch {
      addToast({ description: "Clipboard is not readable — allow clipboard access and try again.", tone: "warning" });
      return;
    }
    if (!text.trim()) {
      addToast({ description: "Clipboard is empty — copy some HTML first.", tone: "warning" });
      return;
    }
    onBlockClick?.({ id: "pasted-html", label: "Pasted HTML", content: text });
  }, [addToast, onBlockClick]);

  const toggleGroup = (g: (typeof groups)[number]) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(g.id)) next.delete(g.id); else next.add(g.id);
      return next;
    });
  };

  // Search focus shortcuts: "/" (typing-context-safe) and ⌘F (board 137:10 —
  // hijacks browser find while the Insert panel is mounted, same as Figma).
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCmdF = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f";
      if (e.key !== "/" && !isCmdF) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (!isCmdF) {
        const tag = target.tagName;
        const inTypingContext =
          tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
        if (inTypingContext) return;
      }
      const input = document.getElementById("bld-search-input") as HTMLInputElement | null;
      if (!input) return;
      e.preventDefault();
      input.focus();
      input.select();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <PanelFrame className="bld-container">
      {/* Board 137:2 header: title alone (the "N blocks · N categories"
          subtitle is not on the board), EXPAND before CLOSE — 16:6's first
          action is the corner-brackets expand (founder-confirmed 2026-08-06;
          the component description's "Pin" text is stale). */}
      <PanelFrame.Header
        title="Insert"
        isExpanded={isExpanded}
        onExpandToggle={onExpandToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      />

      <div className="bld-content">
        <div
          className="bld-search-wrap"
          onKeyDown={(e) => {
            if (e.key === "Escape" && tab.searchQuery.length > 0) {
              e.stopPropagation();
              tab.setSearchQuery("");
            }
          }}
        >
          <SearchBar
            id="bld-search-input"
            value={tab.searchQuery}
            onChange={tab.setSearchQuery}
            placeholder="Search elements"
            debounceMs={150}
            kbdHint="⌘F"
          />
        </div>

        {isSearching ? (
          <div className="bld-scroll">
            <SearchResults
              query={tab.searchQuery}
              hits={tab.searchResults}
              onDragStart={tab.handleDragStart}
              onElClick={tab.handleElClick}
              onBlockInsert={(b) => onBlockClick?.(b)}
              onClearSearch={() => tab.setSearchQuery("")}
            />
          </div>
        ) : (
          <div className="bld-scroll">
            {callout.visible && <TransitionCallout />}

            {/* Board 137:2: source taxonomy, not element-type categories.
                ELEMENTS/BLOCKS render inline; the navigate groups open their
                owning tabs. Blocks insert through the SAME onBlockClick path
                elements use — BlockDefinition extends BlockData. */}
            {groups.map((g) => (
              <GroupSection
                key={g.id}
                group={g}
                isOpen={openGroups.has(g.id)}
                onToggle={() => toggleGroup(g)}
                elements={g.id === "elements" ? elementRows : undefined}
                blocks={g.id === "blocks" ? blockRows : undefined}
                components={g.id === "components" ? componentRows : undefined}
                mine={g.id === "mine" ? mine : undefined}
                onDragStart={tab.handleDragStart}
                onElClick={tab.handleElClick}
                onBlockInsert={(b) => onBlockClick?.(b)}
                onMineInsert={(c) => void insertMine(c)}
              />
            ))}
          </div>
        )}

        {/* Board 138:53: the pinned bottom stays up DURING search too. */}
        <div className="bld-panel-bottom">
          {/* Board 233:1123 — pinned above the tips band, no icon slot. */}
          <Row label={"⌥  Paste HTML…"} noIcon testId="insert-paste-html" onClick={() => void pasteHtml()} />
          <TipsFooter
            tipIdx={tab.tipIdx}
            onPrev={tab.tipPrev}
            onNext={tab.tipNext}
            onDotClick={tab.tipSetAt}
            dismissed={tab.tipDismissed}
            onDismiss={tab.dismissTip}
          />
        </div>
      </div>
    </PanelFrame>
  );
};

export default BuildTab;
