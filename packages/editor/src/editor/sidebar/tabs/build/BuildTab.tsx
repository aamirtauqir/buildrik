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
import { Button, IconButton, Menu, MenuItem, PanelFrame, Popover, TOPBAR_CONTEXT_SEARCH_ID } from "@/editor/chrome-ui";
import type { Composer } from "../../../../engine";
import type { BlockData } from "../../../../shared/types";
import { useBuildTab } from "./hooks/useBuildTab";
import { FirstUseTip } from "./components/FirstUseTip";
import { GroupSection, Row } from "./components/GroupSection";
import { useToast } from "@/editor/chrome-ui";
import { SearchResults } from "./components/SearchResults";
import { useInsertDrag } from "@/editor/canvas/insertDrag";
import { takePendingGenerate, takePendingInsertGroup, takePendingPasteHtml } from "./insertGroupRequest";
import { GenerateBlockScreen } from "./components/GenerateBlockScreen";
import { buildInsertGroups, elementRows, blockRows, componentRows, type InsertGroupId } from "./catalog/groups";
import { EVENTS } from "../../../../shared/constants";
import type { ComponentDefinition } from "../../../../shared/types/components";
import { useComponentList } from "../component-library/useComponentList";
import { fetchLibraryComponent } from "@/services/componentSync";
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
  // MINE (board 1069:4970): the user's own components, inline, and searched
  // with the rest (G2-111). v3 FC-10: load + subscribe lives once, in
  // useComponentList — the same hook useComponentsState (Components tab) uses.
  /* G2-118: only masters in scope on the OPEN page (site-wide + "This page"
     ones for it), and not the library-linked ones — board 4418:99857 lists
     those under FROM LIBRARY instead. */
  const { components: allMine, library } = useComponentList(composer);
  const mine = React.useMemo(() => {
    const linked = new Set(library.filter((l) => l.onThisSite).map((l) => l.componentId));
    return allMine.filter((c) => !linked.has(c.id));
  }, [allMine, library]);
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
  const [openGroups, setOpenGroups] = React.useState<Set<InsertGroupId>>(() =>
    new Set<InsertGroupId>(asked ? [asked] : ["favourites", "elements"]),
  );
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
  // G2-117: the "Generate a block" screen, opened by the row or a door.
  const [generating, setGenerating] = React.useState(() => (composer ? takePendingGenerate(composer) : false));
  React.useEffect(() => {
    if (!composer) return;
    const open = () => {
      takePendingGenerate(composer);
      setGenerating(true);
    };
    composer.on(EVENTS.UI_INSERT_OPEN_GENERATE, open);
    return () => {
      composer.off(EVENTS.UI_INSERT_OPEN_GENERATE, open);
    };
  }, [composer]);
  const { addToast } = useToast();
  const insertDrag = useInsertDrag(composer);


  const groups = React.useMemo(
    () => buildInsertGroups(composer?.components ? mine.length + library.length : null, tab.favs.size, tab.recents.length),
    [composer, mine.length, library.length, tab.favs.size, tab.recents.length],
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

  /* FROM LIBRARY: bring the workspace master onto this site under its shared
     id (ComponentManager.adoptLibraryComponent — mirrored as this site's copy,
     which is what "linked" means), then insert it like a saved one. */
  const insertFromLibrary = React.useCallback(async (componentId: string) => {
    if (!composer) return;
    try {
      const existing = composer.components.getComponent(componentId);
      const definition = existing ?? (await fetchLibraryComponent(componentId));
      if (!definition) {
        addToast({ description: "That component is no longer in the library.", tone: "warning" });
        return;
      }
      const adopted = existing ?? (await composer.components.adoptLibraryComponent(definition));
      await insertMine(adopted);
    } catch {
      addToast({ description: "Couldn't add component. Try again.", tone: "error" });
    }
  }, [composer, addToast, insertMine]);

  // Board 6887:78320: ⋯ › Paste HTML… opens a dialog (prefilled from the
  // clipboard) and Insert sends the text down the SAME BlockData insert path
  // everything else uses — insertBlock owns the XSS boundary.
  const [pasteOpen, setPasteOpen] = React.useState(() => (composer ? takePendingPasteHtml(composer) : false));
  React.useEffect(() => {
    if (!composer) return;
    const open = () => {
      takePendingPasteHtml(composer);
      setPasteOpen(true);
    };
    composer.on(EVENTS.UI_INSERT_OPEN_PASTE_HTML, open);
    return () => {
      composer.off(EVENTS.UI_INSERT_OPEN_PASTE_HTML, open);
    };
  }, [composer]);

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

  if (generating && composer) {
    return (
      <PanelFrame className="bld-container">
        <GenerateBlockScreen composer={composer} onBack={() => setGenerating(false)} />
      </PanelFrame>
    );
  }

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
                kbd="⌘⇧V"
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
              <React.Fragment key={g.id}>
              {/* Boards 4418:100299 / 102121: "✦  Generate a block with AI…"
                  follows the open ELEMENTS rows, right above BLOCKS; with
                  ELEMENTS collapsed (6887:79760) it is not drawn (G2-117). */}
              {g.id === "blocks" && composer && openGroups.has("elements") && (
                <div
                  role="button"
                  tabIndex={0}
                  data-testid="insert-generate-block"
                  className="tw:flex tw:items-center tw:h-8 tw:px-4 tw:rounded-[4px] tw:cursor-pointer tw:select-none tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)] hover:tw:bg-[var(--bk-bg-subtle)]"
                  onClick={() => setGenerating(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setGenerating(true); }
                  }}
                >
                  ✦&nbsp;&nbsp;Generate a block with AI…
                </div>
              )}
              <GroupSection
                group={g}
                isOpen={openGroups.has(g.id)}
                onToggle={() => toggleGroup(g)}
                elements={
                  g.id === "elements"
                    ? elementRows
                    : g.id === "favourites"
                      ? elementRows.filter((el) => tab.favs.has(el.name))
                      : g.id === "recent"
                        ? tab.recents.flatMap((n) => elementRows.find((el) => el.name === n) ?? [])
                        : undefined
                }
                favs={tab.favs}
                onToggleFav={tab.toggleFav}
                blocks={g.id === "blocks" ? blockRows : undefined}
                components={g.id === "components" ? componentRows : undefined}
                mine={g.id === "mine" ? mine : undefined}
                library={g.id === "mine" ? library : undefined}
                onLibraryInsert={(id) => void insertFromLibrary(id)}
                onDragStart={tab.handleDragStart}
                onBlockDragStart={tab.handleBlockDragStart}
                onElClick={tab.handleElClick}
                insertPath={insertDrag.target?.path ?? null}
                onBlockInsert={(b) => onBlockClick?.(b)}
                onMineInsert={(c) => void insertMine(c)}
                onManageComponents={composer ? () => composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "components" }) : undefined}
              />
              </React.Fragment>
            ))}
            {/* Boards 6887:79760 / 4418:102121: "Page templates ›" closes the
                list — whole-page layouts live in Templates. */}
            {composer && (
              <Button
                color="light"
                data-testid="insert-page-templates"
                onClick={() => composer.emit(EVENTS.UI_PANEL_OPEN, { panel: "templates" })}
                className="tw:mt-2 tw:h-7 tw:justify-start tw:border-0 tw:bg-transparent tw:px-4 tw:text-[11px] tw:font-normal tw:text-[var(--bk-ink-muted)] tw:hover:text-[var(--bk-ink)] tw:focus:ring-0"
              >
                Page templates ›
              </Button>
            )}
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
