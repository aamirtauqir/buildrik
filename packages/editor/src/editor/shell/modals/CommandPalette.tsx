/**
 * CommandPalette — the editor's ONE command palette.
 * Triggered by Ctrl+K / ⌘+K; ⌘⇧P is an alias (audit G1-093, decision #38).
 *
 * Board 4418:141220 (v3 · "Commands · navigation and page actions (⌘K)"):
 * a 640-wide card 48px from the top with a "Search pages, layers, assets and
 * actions…" field and a "Scope: everything" chip, then five bands — NAVIGATE ·
 * EDIT · VIEW · ADD · TOOLS — in the board's order, 32px rows at 11px, and a
 * legend foot ("Click a command · Esc Close … Current editor"). The opening
 * list IS that curated set; typing searches it plus every other command the
 * editor has (the engine registry, and the page rows the Pages panel registers
 * while it is open — those band under PAGES).
 *
 * The canvas used to carry a second palette behind ⌘⇧P, and the Pages panel a
 * third behind its own ⌘K (`PageCommandPalette`). Both are gone.
 *
 * @module editor/shell/modals/CommandPalette
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { formatChord } from "@/editor/canvas/controls/keyboardSheetRows";
import { Button, Portal, TextInput, useFocusTrap } from "@/editor/chrome-ui";
import { getRecentCommandIds, recordCommandRun } from "./commandRecents";
import { buildCommands, type PaletteCommand } from "./paletteCommands";
import { useViewerChrome } from "../hooks/useEditorRole";

export interface CommandPaletteProps {
  onClose: () => void;
  composer: Composer | null;
  /** A panel's "Search everywhere for …" hand-off (G2-059) opens on its query. */
  initialQuery?: string;
  /** FB-4: server flag for the agency review layer — `null`/`false` hides the
   *  "Open Review" row. Absent prop behaves like `false` (no row) rather
   *  than assuming the layer is on. */
  reviewsEnabled?: boolean | null;
}

/** Board 4418:141220's bands, in its order. PAGES (context, Pages panel open)
 *  leads; MORE holds everything searchable that the opening list leaves out. */
const BAND_ORDER = ["Recent", "Pages", "Properties", "Navigate", "Edit", "View", "Add", "Tools", "Layers", "Assets", "Records", "Templates", "More"];
/** Bands the opening (empty-query) list shows — the board's curated set. */
const OPENING_BANDS = new Set(["Pages", "Navigate", "Edit", "View", "Add", "Tools"]);

// =============================================================================
// PARTS
// =============================================================================

/** 4418:141220 kbd chip — gray-100 on a gray-200 edge, 20 tall, 11/16 medium.
 *  Ink is ink-soft, not gray-500: gray-500 on gray-100 is 4.39:1 (WCAG AA fail). */
const Kbd: React.FC<{ shortcut: string; testId?: string }> = ({ shortcut, testId }) => {
  const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  return (
    <span
      data-testid={testId}
      className="tw:flex tw:h-5 tw:flex-none tw:items-center tw:rounded tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-subtle)] tw:px-1.5 tw:text-[11px] tw:font-medium tw:leading-4 tw:whitespace-nowrap tw:text-[var(--bk-ink-soft)]"
    >
      {/* The board prints "⌘Z", not "⌘+Z": symbols join their key directly. */}
      {formatChord(shortcut, isMac).replace(/([⌘⇧⌥⌃])\+/g, "$1")}
    </span>
  );
};

/** One id for the listbox, so the input can point at it and at its rows. */
const LIST_ID = "bk-cmdk-list";

/** Band name -> test-id suffix. */
const bandSlug = (band: string) => band.toLowerCase().replace(/\s+/g, "-");

// =============================================================================
// COMPONENT
// =============================================================================

/* The overlay root resolves in an effect (Portal), so the trap lives in the
   card, which mounts once the root exists — the ElementContextMenu pattern. */
export const CommandPalette: React.FC<CommandPaletteProps> = (props) => (
  <Portal>
    <CommandPaletteCard {...props} />
  </Portal>
);

const CommandPaletteCard: React.FC<CommandPaletteProps> = ({
  onClose,
  composer,
  initialQuery = "",
  reviewsEnabled,
}) => {
  const [query, setQuery] = React.useState(initialQuery);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  /* 263:250988: inside "Go to page" — the list is the site's pages. */
  const [nested, setNested] = React.useState<"pages" | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  /* Same predicate + same viewer computation StudioPanels' rail/ui:switch-tab
     gate and useStudioState's openLeftPanelToTab/setLeftPanelTab sink use —
     a VIEWER should not see a live-looking "Open Brand"/"Open Site settings"
     row for a tab the sink now silently no-ops on. */
  const viewerChrome = useViewerChrome();

  /* The palette unmounts on close (StudioHeader renders it conditionally), so
     this list — and every "cannot run" reason in it — is rebuilt on each open
     against the selection of that moment. */
  const commands = React.useMemo(
    () => buildCommands(composer, onClose, reviewsEnabled, viewerChrome),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [composer, reviewsEnabled, viewerChrome],
  );

  /* RECORDS — CMS records answer by their display field and open in the
     CMS workspace on that record (ui:cms-open, L4's table + side sheet).
     The store loads per collection, asynchronously, so the rows arrive a
     moment after the palette opens; searchable only. */
  const [recordCommands, setRecordCommands] = React.useState<PaletteCommand[]>([]);
  React.useEffect(() => {
    const store = composer?.cms?.collections;
    if (!store) return;
    let live = true;
    const collections = store.getAllCollections();
    void Promise.all(
      collections.map(async (col) => {
        const items = await store.getContentItems(col.id).catch(() => []);
        return items.map((item): PaletteCommand => {
          const shown = item.data[col.displayField ?? ""] ?? Object.values(item.data).find((v) => typeof v === "string");
          return {
            id: `record-${item.id}`,
            label: `${typeof shown === "string" && shown ? shown : "Untitled record"} · ${col.name}`,
            group: "Records",
            keywords: ["record", "cms", col.name],
            handler: () => {
              composer?.emit(EVENTS.UI_CMS_OPEN, { collectionId: col.id, recordId: item.id });
              onClose();
            },
          };
        });
      }),
    ).then((lists) => {
      if (live) setRecordCommands(lists.flat());
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [composer]);

  const openNested = React.useCallback((to: "pages" | null) => {
    setNested(to);
    setQuery("");
    setSelectedIndex(0);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const runCommand = React.useCallback((cmd: PaletteCommand) => {
    if (cmd.disabled) return;
    if (cmd.opens) return openNested(cmd.opens);
    recordCommandRun(cmd.id.replace(/^recent-/, ""));
    cmd.handler();
  }, [openNested]);

  /* The nested page list: every page, the one on the canvas named and inert. */
  const pageCommands = React.useMemo<PaletteCommand[]>(() => {
    if (nested !== "pages" || !composer) return [];
    const active = composer.elements.getActivePage?.()?.id;
    return composer.elements.getAllPages().map((page) => ({
      id: `goto-${page.id}`,
      label: page.name,
      group: "‹ Go to page",
      disabled: page.id === active,
      disabledReason: page.id === active ? "Already on this page" : undefined,
      handler: () => {
        composer.elements.setActivePage(page.id);
        onClose();
      },
    }));
  }, [nested, composer, onClose]);

  /* RECENT (S3.14, restored off-board — the owner's "never silently remove a
     capability"; 4418:141220 draws no strip, logged in the designer notes):
     the last five rows you ran, above the board's bands, on the empty query
     only. A copy of the live row, so its guard reflects this open. */
  const recentCommands = React.useMemo(() => {
    const byId = new Map(commands.map((c) => [c.id, c]));
    return getRecentCommandIds().flatMap((id) => {
      const cmd = byId.get(id);
      if (!cmd) return [];
      const isDoor = cmd.group === "Navigate" || cmd.group === "Pages";
      return [{ ...cmd, id: `recent-${cmd.id}`, group: "Recent", shortcut: isDoor ? undefined : cmd.shortcut }];
    });
  }, [commands]);

  React.useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(timer);
  }, []);

  /* DQ-019: chrome-ui's trap — Tab stays in the card, Escape closes it only
     when it is the topmost dialog, and focus goes back where it was. The
     palette mounts in the overlay root (Portal) like every other overlay;
     it used to render inside the topbar. The board's no-dim click catcher
     stays (4418:141220), so OverlayMount's scrim is not used. */
  const trapRef = useFocusTrap(true, onClose);

  const visibleCommands = React.useMemo(() => {
    const q = query.toLowerCase().trim();
    if (nested === "pages") return pageCommands.filter((c) => !q || c.label.toLowerCase().includes(q));
    if (!q) return [...recentCommands, ...commands.filter((c) => OPENING_BANDS.has(c.group))];
    return [...commands, ...recordCommands].filter((cmd) =>
      [cmd.label, cmd.group, ...(cmd.keywords ?? [])].join(" ").toLowerCase().includes(q),
    );
  }, [commands, recordCommands, recentCommands, query, nested, pageCommands]);

  // A query that matches nothing is never a dead end: stock photos. (No
  // "Ask AI instead" — no AI entry points in the editor UI, owner 2026-10-17.)
  const searchStock = React.useCallback(() => {
    composer?.emit(EVENTS.UI_PANEL_OPEN, { panel: "assets", screen: `stock:${query.trim()}` });
    onClose();
  }, [composer, onClose, query]);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  React.useEffect(() => {
    const item = listRef.current?.querySelector(`[data-idx="${selectedIndex}"]`) as HTMLElement | null;
    item?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const bands = React.useMemo(() => {
    const groups = new Map<string, PaletteCommand[]>();
    for (const cmd of visibleCommands) {
      const list = groups.get(cmd.group);
      if (list) list.push(cmd);
      else groups.set(cmd.group, [cmd]);
    }
    const rank = (b: string) => {
      const i = BAND_ORDER.indexOf(b);
      return i === -1 ? BAND_ORDER.length : i;
    };
    return [...groups].sort(([a], [b]) => rank(a) - rank(b));
  }, [visibleCommands]);

  /* What the arrow keys walk: the BANDED order, the list you can see. */
  const orderedCommands = React.useMemo(() => bands.flatMap(([, cmds]) => cmds), [bands]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, orderedCommands.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case "ArrowRight": {
          const cmd = orderedCommands[selectedIndex];
          if (cmd?.opens) {
            e.preventDefault();
            openNested(cmd.opens);
          }
          break;
        }
        case "ArrowLeft":
        case "Backspace":
          if (nested && !query) {
            e.preventDefault();
            openNested(null);
          }
          break;
        case "Enter":
          e.preventDefault();
          if (orderedCommands.length === 0 && query.trim()) searchStock();
          else {
            const cmd = orderedCommands[selectedIndex];
            if (cmd) runCommand(cmd);
          }
          break;
      }
    },
    [orderedCommands, selectedIndex, onClose, query, searchStock, runCommand, nested, openNested],
  );

  return (
    <>
      {/* 4418:141220 "dismiss · click outside": a click catcher, not a dim —
          the board leaves the editor at full strength behind the card. */}
      <div onClick={onClose} className="tw:fixed tw:inset-0 tw:bg-transparent tw:[z-index:calc(var(--bk-z-modal)-1)]" />
      <div
        ref={trapRef}
        role="dialog"
        aria-label="Command Palette"
        aria-modal="true"
        data-testid="cmdk-palette"
        onKeyDown={handleKeyDown}
        className="tw:fixed tw:top-12 tw:left-1/2 tw:flex tw:max-h-[800px] tw:w-160 tw:max-w-[calc(100vw-32px)] tw:-translate-x-1/2 tw:flex-col tw:overflow-hidden tw:rounded-xl tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-elevated)] tw:[box-shadow:var(--bk-shadow-overlay)] tw:[z-index:var(--bk-z-modal)]"
      >
        {/* Input row — 16/12 inset, ⌕ at 16 (the board's 15 snapped to --bk-text-16), the field at 12px, the scope chip. */}
        <div data-testid="cmdk-query" className="tw:flex tw:flex-none tw:items-center tw:gap-2 tw:px-4 tw:py-3">
          {/* The input row is the card's focus: the caret is the indicator, and
              the board draws no ring around the field. */}
          <span aria-hidden="true" className="tw:flex-none tw:text-[length:var(--bk-text-16)] tw:font-medium tw:leading-none tw:text-[var(--bk-gray-500)]">
            ⌕
          </span>
          <TextInput
            ref={inputRef}
            data-autofocus=""
            type="text"
            placeholder={nested === "pages" ? "Filter pages…" : "Search actions, pages, layers, records…"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            /* A combobox over the listbox below, so the highlight the arrow
               keys move is announced (aria-activedescendant). */
            role="combobox"
            aria-expanded
            aria-controls={LIST_ID}
            aria-autocomplete="list"
            aria-activedescendant={orderedCommands[selectedIndex] ? `${LIST_ID}-${selectedIndex}` : undefined}
            aria-label={nested === "pages" ? "Filter pages" : "Search actions, pages, layers, records"}
            data-testid="cmdk-input"
            /* a11y.css's unlayered `*:focus-visible` ring beats any layered
               utility; `style` reaches the real <input> on this wrapper. */
            style={{ outline: "none" }}
            className="tw:flex-1 tw:[&_input]:h-[18px] tw:[&_input]:border-0 tw:[&_input]:bg-transparent tw:[&_input]:p-0 tw:[&_input]:text-[12px] tw:[&_input]:leading-[18px] tw:[&_input]:text-[var(--bk-ink)] tw:[&_input]:shadow-none tw:[&_input]:ring-0 tw:[&_input]:focus:ring-0 tw:[&_input]:placeholder:text-[var(--bk-ink-muted)]"
          />
          {query && (
            <Button
              variant="ghost"
              aria-label="Clear search"
              data-testid="cmdk-clear"
              className="tw:h-5 tw:min-h-0 tw:w-5 tw:flex-none tw:rounded tw:border-0 tw:p-0 tw:text-[12px] tw:leading-none tw:text-[var(--bk-ink-muted)] tw:enabled:hover:bg-[var(--bk-bg-subtle)]"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
            >
              ✕
            </Button>
          )}
        </div>
        <div className="tw:h-px tw:flex-none tw:bg-[var(--bk-border)]" />

        <div
          ref={listRef}
          id={LIST_ID}
          role="listbox"
          aria-label="Commands"
          className="tw:min-h-0 tw:flex-1 tw:overflow-y-auto tw:py-1 tw:[scrollbar-width:thin] tw:[scrollbar-color:var(--bk-gray-200)_transparent]"
        >
          {orderedCommands.length === 0 ? (
            query.trim() ? (
              <div
                className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-1 tw:px-4 tw:py-6 tw:text-center tw:text-[12px] tw:leading-[18px]"
                data-testid="cmdk-no-results"
              >
                {/* 263:253111 */}
                <div data-testid="cmdk-no-results-line" className="tw:font-medium tw:text-[var(--bk-ink)]">
                  No results for &ldquo;{query.trim()}&rdquo;
                </div>
                <div className="tw:text-[var(--bk-ink-muted)]">Check the spelling or try a shorter word.</div>
                {nested ? null : (
                  <Button onClick={searchStock} data-idx={0} variant="link" data-testid="cmdk-no-results-stock">
                    Search stock photos for &ldquo;{query.trim()}&rdquo; ›
                  </Button>
                )}
              </div>
            ) : null
          ) : (
            bands.map(([group, cmds]) => (
              <div key={group}>
                {nested && group === "‹ Go to page" ? (
                  <Button
                    variant="link"
                    data-testid="cmdk-nested-back"
                    onClick={() => openNested(null)}
                    className="tw:h-auto tw:min-h-0 tw:px-4 tw:pt-2 tw:pb-1 tw:text-[12px] tw:font-medium tw:leading-4"
                  >
                    ‹ Go to page
                  </Button>
                ) : (
                <div
                  role="presentation"
                  data-testid={`cmdk-band-${bandSlug(group)}`}
                  className="tw:pt-2 tw:pb-1 tw:pl-4 tw:text-[11px] tw:font-medium tw:leading-4 tw:tracking-[0.88px] tw:uppercase tw:text-[var(--bk-ink-muted)]"
                >
                  {group}
                </div>
                )}
                {cmds.map((cmd) => {
                  const globalIdx = orderedCommands.indexOf(cmd);
                  const isSelected = globalIdx === selectedIndex;
                  /* A door prints no chord (NAVIGATE on the board); an action does. */
                  const showChord = cmd.shortcut && cmd.group !== "Navigate" && cmd.group !== "Pages";
                  return (
                    <Button
                      key={`${group}-${cmd.id}`}
                      id={`${LIST_ID}-${globalIdx}`}
                      data-idx={globalIdx}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => runCommand(cmd)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      aria-disabled={cmd.disabled || undefined}
                      data-testid={`cmdk-row-${cmd.id}`}
                      variant="ghost"
                      className={`tw:flex ${cmd.disabled && cmd.disabledReason ? "tw:h-11" : "tw:h-8"} tw:min-h-0 tw:w-full tw:items-center tw:justify-between tw:gap-2 tw:rounded-none tw:border-0 tw:px-4 tw:py-0 tw:text-left ${
                        isSelected
                          ? "tw:bg-[var(--bk-bg-subtle)] tw:enabled:hover:bg-[var(--bk-bg-subtle)]"
                          : "tw:bg-transparent tw:enabled:hover:bg-transparent"
                      } ${cmd.disabled ? "tw:opacity-50 tw:cursor-default" : ""}`}
                    >
                      <span
                        data-testid={`cmdk-label-${cmd.id}`}
                        className="tw:min-w-0 tw:overflow-hidden tw:text-ellipsis tw:whitespace-nowrap tw:text-[11px] tw:font-normal tw:leading-4 tw:text-[var(--bk-ink-soft)]"
                      >
                        {cmd.opens ? `${cmd.label} ›` : cmd.label}
                        {/* 263:251794: why it can't run, on its own line. */}
                        {cmd.disabled && cmd.disabledReason ? (
                          <span className="tw:block tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">{cmd.disabledReason}</span>
                        ) : null}
                      </span>
                      {showChord && cmd.shortcut ? <Kbd shortcut={cmd.shortcut} testId={`cmdk-kbd-${cmd.id}`} /> : null}
                    </Button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Legend (263:250083). */}
        <div className="tw:h-px tw:flex-none tw:bg-[var(--bk-border)]" />
        <div
          data-testid="cmdk-legend"
          className="tw:flex tw:flex-none tw:items-center tw:gap-3 tw:px-4 tw:py-2 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]"
        >
          {/* 263:250083: the keys, then "? Keys" to the shortcuts sheet. */}
          <span>↑↓ Move</span>
          <span>↵ Run</span>
          <span>→ Open</span>
          <Button
            variant="link"
            onClick={onClose}
            className="tw:h-auto tw:min-h-5 tw:-my-0.5 tw:p-0 tw:text-[11px] tw:font-normal tw:leading-4 tw:text-[var(--bk-ink-muted)]"
          >
            Esc Close
          </Button>
          <span className="tw:flex-1" />
          <Button
            variant="link"
            data-testid="cmdk-keys"
            onClick={() => {
              composer?.emit(EVENTS.UI_TOGGLE_CHEAT_SHEET, {});
              onClose();
            }}
            className="tw:h-auto tw:min-h-5 tw:-my-0.5 tw:p-0 tw:text-[11px] tw:font-medium tw:leading-4 tw:text-[var(--bk-ink)]"
          >
            ? Keys
          </Button>
        </div>
      </div>
    </>
  );
};

export default CommandPalette;
