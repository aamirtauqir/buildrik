/**
 * BuildTab — Add tab shell.
 *
 * Layout: PanelHeader / panel-scroll. Search is the topbar field, which this
 * panel claims while it is open (board 4418:100087 "Search elements…").
 * The first-use tip (7054:78348) opens beside the panel; there is no tips
 * strip (G2-113).
 *
 * Sections mode (pre-built sections catalog + lazy chunk) was removed on
 * 2026-04-23 — the UI switch had been stripped earlier and ~1300 lines
 * across catalog/sections.ts, components/SectionsMode.tsx, and the
 * accompanying hook were unreachable dead code. Only the elements grid
 * remains.
 */

import { PasteHtmlModal } from "./PasteHtmlModal";
import * as React from "react";
import { IconButton, Menu, MenuItem, PanelFrame, Popover, TOPBAR_CONTEXT_SEARCH_ID } from "@/editor/chrome-ui";
import type { Composer } from "../../../../engine";
import type { BlockData } from "../../../../shared/types";
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
  /** False while the drawer is closed but this tab stays mounted. */
  isOpen?: boolean;
}

export const BuildTab: React.FC<BuildTabProps> = ({
  composer, onBlockClick, onHelpClick, onClose, isOpen = true,
}) => {
  // MINE (board 1069:4970): the user's own components, inline, and
  // searched with the rest (G2-111). Same load +
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
  const tab = useBuildTab(composer, onBlockClick, mine);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const panelBottomRef = React.useRef<HTMLDivElement>(null);
  const isSearching = tab.searchQuery.trim().length > 0;

  // Board 137:2 taxonomy: ELEMENTS open (▾), the rest closed (▸). A door that
  // asks for a group ("Replace with block…", Brand › Component styles) opens
  // that group ALONE and scrolls it into view — with ELEMENTS' 53 rows open
  // above it, the asked-for group sat off-screen.
  const [asked] = React.useState(() => (composer ? takePendingInsertGroup(composer) : undefined));
  const [scrollTarget, setScrollTarget] = React.useState<InsertGroupId | null>(asked ?? null);
  const [openGroups, setOpenGroups] = React.useState<Set<InsertGroupId>>(() => new Set([asked ?? "elements"]));
  React.useEffect(() => {
    if (!composer) return;
    const open = ({ group }: { group: InsertGroupId }) => {
      takePendingInsertGroup(composer);
      setOpenGroups(new Set([group]));
      setScrollTarget(group);
    };
    composer.on(EVENTS.UI_INSERT_OPEN_GROUP, open);
    return () => {
      composer.off(EVENTS.UI_INSERT_OPEN_GROUP, open);
    };
  }, [composer]);
  React.useEffect(() => {
    if (!scrollTarget) return;
    document
      .querySelector(`[data-testid="insert-section-${scrollTarget}"]`)
      ?.scrollIntoView({ block: "start" });
    setScrollTarget(null);
  }, [scrollTarget]);
  const { addToast } = useToast();


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

  // Board 6887:78320: ⋯ › Paste HTML… opens a dialog (prefilled from the
  // clipboard) and Insert sends the text down the SAME BlockData insert path
  // everything else uses — insertBlock owns the XSS boundary.
  const [pasteOpen, setPasteOpen] = React.useState(false);

  const toggleGroup = (g: (typeof groups)[number]) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(g.id)) next.delete(g.id); else next.add(g.id);
      return next;
    });
  };

  /* The topbar field searches this panel while it is open (4418:100087). */
  /* Held in a ref: setSearchQuery changes identity with every query, and
     re-running this effect would release and re-claim the field mid-typing. */
  const setSearchQueryRef = React.useRef(tab.setSearchQuery);
  setSearchQueryRef.current = tab.setSearchQuery;
  React.useEffect(() => {
    /* A closed drawer keeps this tab mounted — the topbar field must not keep
       reading "Search elements…" with nothing on screen to search. */
    if (!composer || !isOpen) return;
    const onQuery = ({ query }: { query: string }) => setSearchQueryRef.current(query);
    composer.on(EVENTS.UI_SEARCH_QUERY, onQuery);
    composer.emit(EVENTS.UI_SEARCH_CONTEXT, { placeholder: "Search elements…" });
    return () => {
      composer.off(EVENTS.UI_SEARCH_QUERY, onQuery);
      composer.emit(EVENTS.UI_SEARCH_CONTEXT, null);
    };
  }, [composer, isOpen]);

  // Search focus shortcuts: "/" (typing-context-safe) and ⌘F. G2-105: ⌘F is
  // taken only while focus is in this panel or its search field — anywhere
  // else it stays the browser's find.
  const panelRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCmdF = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f";
      if (e.key !== "/" && !isCmdF) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (isCmdF) {
        const inPanel = panelRef.current?.contains(target) || target.id === TOPBAR_CONTEXT_SEARCH_ID;
        if (!inPanel) return;
      } else {
        const tag = target.tagName;
        const inTypingContext =
          tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
        if (inTypingContext) return;
      }
      const input = document.getElementById(TOPBAR_CONTEXT_SEARCH_ID) as HTMLInputElement | null;
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
                  setPasteOpen(true);
                }}
              >
                Paste HTML…
              </MenuItem>
            </Menu>
          </Popover>
        }
      />

      <div className="bld-content" ref={panelRef}>
        {isSearching ? (
          <div className="bld-scroll">
            <SearchResults
              query={tab.searchQuery}
              hits={tab.searchResults}
              onDragStart={tab.handleDragStart}
              onBlockDragStart={tab.handleBlockDragStart}
              onElClick={tab.handleElClick}
              onBlockInsert={(b) => onBlockClick?.(b)}
              onSavedInsert={(c) => void insertMine(c)}
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
                onManageComponents={composer ? () => composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "components" }) : undefined}
              />
            ))}
          </div>
        )}

        <div ref={panelBottomRef} className="bld-panel-bottom" />
        <FirstUseTip anchorRef={panelBottomRef} />
      </div>
      <PasteHtmlModal
        open={pasteOpen}
        onClose={() => setPasteOpen(false)}
        onInsert={(content) => onBlockClick?.({ id: "pasted-html", label: "Pasted HTML", content })}
      />
    </PanelFrame>
  );
};

export default BuildTab;
