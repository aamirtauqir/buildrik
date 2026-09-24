/**
 * BuildTab — Add tab shell.
 *
 * Layout: PanelHeader / SearchBar / panel-scroll / panel-bottom
 * The first-use tip (7054:78348) opens beside the panel; there is no tips
 * strip (G2-113).
 *
 * Sections mode (pre-built sections catalog + lazy chunk) was removed on
 * 2026-04-23 — the UI switch had been stripped earlier and ~1300 lines
 * across catalog/sections.ts, components/SectionsMode.tsx, and the
 * accompanying hook were unreachable dead code. Only the elements grid
 * remains.
 */

import * as React from "react";
import { IconButton, Menu, MenuItem, PanelFrame, Popover } from "@/editor/chrome-ui";
import type { Composer } from "../../../../engine";
import type { BlockData } from "../../../../shared/types";
import { SearchBar } from "../../shared/SearchBar";
import { useBuildTab } from "./hooks/useBuildTab";
import { FirstUseTip } from "./components/FirstUseTip";
import { GroupSection, Row } from "./components/GroupSection";
import { useToast } from "@/editor/chrome-ui";
import { SearchResults } from "./components/SearchResults";
import { takePendingInsertGroup } from "./insertGroupRequest";
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
  composer, onBlockClick, onHelpClick, onClose,
}) => {
  const tab = useBuildTab(composer, onBlockClick);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const panelBottomRef = React.useRef<HTMLDivElement>(null);
  const isSearching = tab.searchQuery.trim().length > 0;

  // Board 137:2 taxonomy: ELEMENTS open (▾), the rest closed (▸).
  const [openGroups, setOpenGroups] = React.useState<Set<InsertGroupId>>(() => {
    const asked = composer ? takePendingInsertGroup(composer) : undefined;
    return new Set<InsertGroupId>(asked ? ["elements", asked] : ["elements"]);
  });
  // Context menu "Replace with block…" (v3 IA Q8) opens this panel AND asks
  // for BLOCKS; without this the door lands on ELEMENTS and the user scrolls.
  React.useEffect(() => {
    if (!composer) return;
    const open = ({ group }: { group: InsertGroupId }) => {
      takePendingInsertGroup(composer);
      setOpenGroups((prev) => (prev.has(group) ? prev : new Set(prev).add(group)));
    };
    composer.on(EVENTS.UI_INSERT_OPEN_GROUP, open);
    return () => {
      composer.off(EVENTS.UI_INSERT_OPEN_GROUP, open);
    };
  }, [composer]);
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
      {/* Board 4428:140817: `Add · ⋯ · ✕` — no expand; the ⋯ holds Paste
          HTML… (7063:78846), which was a pinned row above the tips. */}
      <PanelFrame.Header
        title="Add"
        onHelpClick={onHelpClick}
        onClose={onClose}
        actions={
          <Popover
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            placement="bottom-end"
            label="Add options"
            trigger={
              <IconButton
                label="Add options"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                data-testid="add-panel-menu"
                onClick={() => setMenuOpen((v) => !v)}
              >
                ⋯
              </IconButton>
            }
          >
            <Menu label="Add options">
              <MenuItem
                data-testid="insert-paste-html"
                onClick={() => {
                  setMenuOpen(false);
                  void pasteHtml();
                }}
              >
                Paste HTML…
              </MenuItem>
            </Menu>
          </Popover>
        }
      />

      <div className="bld-content">
        <div
          className="bld-search-wrap"
          data-testid="insert-search-wrap"
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
            testId="insert-search-box"
          />
        </div>

        {/* What this panel is for. Insert opened straight onto a wall of 53
            element tiles with nothing saying what a click does.

            Every clause here is scoped to what the code actually does:
            - "Click a row" covers all four groups — clicking inserts everywhere.
            - "Drag elements" is deliberately narrow. Only the ELEMENTS group
              passes `draggable` (GroupSection.tsx:189); blocks, components and
              mine rows do not, so a blanket "drag onto the canvas" would have
              been false for most of the panel — the same defect IA-13 fixed.
            - "inside or next to … where it fits" is the smart-placement walk in
              useBlockInsertion.ts:67-80, which climbs to the nearest ancestor
              that accepts the block; "where it fits" carries the case where
              none does and it lands at the page root. */}
        {!isSearching && (
          <p data-testid="insert-purpose" className="tw:m-0 tw:w-full tw:pt-1 tw:px-3 tw:pb-2 tw:text-[length:var(--bk-text-11)] tw:leading-snug tw:text-[var(--bk-ink-soft)]">
            {tab.insertionContext
              ? `Click a row to add it inside or next to ${tab.insertionContext.label} where it fits. Drag elements onto the canvas instead.`
              : "Click a row to add it at the end of the page. Drag elements onto the canvas instead."}
          </p>
        )}

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
                onBlockDragStart={tab.handleBlockDragStart}
                onElClick={tab.handleElClick}
                onBlockInsert={(b) => onBlockClick?.(b)}
                onMineInsert={(c) => void insertMine(c)}
              />
            ))}
          </div>
        )}

        <div ref={panelBottomRef} className="bld-panel-bottom" />
        <FirstUseTip anchorRef={panelBottomRef} />
      </div>
    </PanelFrame>
  );
};

export default BuildTab;
