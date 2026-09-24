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
import type { Composer } from "../../../engine";
import { EVENTS } from "../../../shared/constants/events";
import { getSiteIdFromUrl } from "../../../services/BuildrikSyncProvider";
import { isFeatureEnabled } from "../../../shared/utils/featureFlags";
import { formatChord } from "../../canvas/controls/keyboardSheetRows";
import { Button, TextInput } from "@/editor/chrome-ui";

// =============================================================================
// TYPES
// =============================================================================

interface PaletteCommand {
  id: string;
  label: string;
  group: string;
  shortcut?: string;
  /** Registry `keywords` — matched by the filter beside the label. */
  keywords?: string[];
  handler: () => void;
  /** A command you cannot run is still worth seeing: disabled rows render
   *  muted as "Label · reason" and don't close the palette. */
  disabled?: boolean;
  disabledReason?: string;
}

export interface CommandPaletteProps {
  onClose: () => void;
  composer: Composer | null;
  /** A panel's "Search everywhere for …" hand-off (G2-059) opens on its query. */
  initialQuery?: string;
}

/** Board 4418:141220's bands, in its order. PAGES (context, Pages panel open)
 *  leads; MORE holds everything searchable that the opening list leaves out. */
const BAND_ORDER = ["Pages", "Navigate", "Edit", "View", "Add", "Tools", "More"];
/** Bands the opening (empty-query) list shows — the board's curated set. */
const OPENING_BANDS = new Set(["Pages", "Navigate", "Edit", "View", "Add", "Tools"]);

// =============================================================================
// COMMANDS
// =============================================================================

function buildCommands(composer: Composer | null, onClose: () => void): PaletteCommand[] {
  const commands: PaletteCommand[] = [];
  const run = (fn: () => void) => () => {
    fn();
    onClose();
  };
  const openPanel = (panel: string, screen?: string) =>
    composer?.emit(EVENTS.UI_PANEL_OPEN, screen ? { panel, screen } : { panel });

  // NAVIGATE — board order. Each is a door, so none prints a chord.
  const nav: Array<[string, string, () => void, string[]?]> = [
    ["pages", "Open Pages", () => openPanel("pages")],
    ["add", "Open Add", () => openPanel("add")],
    ["layers", "Open Layers", () => openPanel("layers")],
    ["assets", "Open Assets", () => openPanel("assets")],
    ["asset-library", "Open Asset library", () => composer?.emit(EVENTS.UI_SWITCH_TAB, { tab: "assets", fullPage: true }), ["media", "files"]],
    ["content", "Open CMS", () => openPanel("content"), ["collections", "records"]],
    ["design", "Open Brand", () => openPanel("design"), ["tokens", "colours", "fonts"]],
    ["publish", "Open Publish", () => openPanel("publish")],
    ["ai", "Open AI assistant", () => composer?.emit(EVENTS.UI_SWITCH_TAB, { tab: "ai" })],
    ["templates", "Browse Templates", () => openPanel("templates")],
    ["review", "Open Review", () => openPanel("review")],
    ["activity", "Open Activity", () => openPanel("history", "activity")],
    ["issues", "Open Issues", () => composer?.emit(EVENTS.UI_OPEN_ISSUES, undefined), ["problems", "errors", "warnings", "checks"]],
    ["settings", "Open Site settings", () => openPanel("settings")],
    ["components", "Open Components", () => openPanel("components")],
    ["shortcuts", "Keyboard shortcuts", () => composer?.emit(EVENTS.UI_TOGGLE_CHEAT_SHEET, {})],
  ];
  for (const [id, label, fn, keywords] of nav) {
    commands.push({ id: `nav-${id}`, label, group: "Navigate", keywords, handler: run(fn) });
  }

  if (!composer) return commands;

  const selectedCount = composer.selection?.getSelectedIds?.().length ?? 0;
  const selectedType = composer.selection?.getSelected?.()?.getType?.();
  const registry = composer.commands?.getAll?.() ?? [];
  const reg = (id: string) => registry.find((c) => c.id === id);
  /* Registry commands that quietly return when the selection is wrong. The
     engine cannot carry this — its list is built once at startup while the
     selection changes under it — so the reason is computed here, each open. */
  const guard = (cmd: { id: string; requiresSelection?: boolean }): string | undefined => {
    if (cmd.id === "group") return selectedCount < 2 ? "select two or more" : undefined;
    if (cmd.id === "ungroup") return selectedType !== "container" ? "select a group" : undefined;
    if (cmd.id === "paste") return composer.clipboard?.length ? undefined : "nothing copied";
    if (cmd.requiresSelection) return selectedCount === 0 ? "Select an element first" : undefined;
    return undefined;
  };
  const used = new Set<string>();
  /** A registry command placed in one of the board's bands. */
  const fromRegistry = (id: string, group: string, label?: string) => {
    const cmd = reg(id);
    if (!cmd) return;
    used.add(id);
    const reason = guard(cmd);
    commands.push({
      id: `cmd-${id}`,
      label: label ?? cmd.label ?? id,
      group,
      shortcut: cmd.shortcut,
      keywords: cmd.keywords,
      disabled: reason !== undefined,
      disabledReason: reason,
      handler: run(() => composer.commands.run(id)),
    });
  };

  // EDIT
  commands.push({
    id: "edit-undo",
    label: "Undo",
    group: "Edit",
    shortcut: "Ctrl+Z",
    disabled: !composer.history.canUndo(),
    disabledReason: "No changes to undo",
    handler: run(() => composer.history.undo()),
  });
  used.add("undo");
  fromRegistry("duplicate", "Edit");
  fromRegistry("replace-media", "Edit");

  // VIEW
  const pageName = composer.elements?.getActivePage?.()?.name;
  commands.push(
    { id: "view-zoom-50", label: "Zoom to 50%", group: "View", handler: run(() => composer.setZoom(50)) },
    {
      id: "view-preview",
      label: pageName ? `Preview ${pageName} page` : "Preview",
      group: "View",
      shortcut: "Ctrl+P",
      keywords: ["preview"],
      handler: run(() => composer.emit(EVENTS.UI_TOGGLE_PREVIEW, {})),
    },
  );

  // ADD
  fromRegistry("add-text", "Add");
  fromRegistry("add-container", "Add");
  commands.push({
    id: "add-ai-block",
    label: "Generate a block with AI…",
    group: "Add",
    keywords: ["ai", "generate", "section", "block"],
    /* The AI assistant plans and runs changes (decision #23); it is where a
       generated block comes from. */
    handler: run(() => composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "ai" })),
  });

  // TOOLS
  fromRegistry("cms-records", "Tools");
  fromRegistry("save-template", "Tools");
  commands.push(
    {
      id: "templates-replace-layout",
      label: "Replace layout with template…",
      group: "Tools",
      handler: run(() => composer.emit(EVENTS.UI_BROWSE_TEMPLATES, {})),
    },
    { id: "tools-history", label: "Open History", group: "Tools", handler: run(() => openPanel("history")) },
    {
      id: "tools-stock",
      label: "Search stock photos",
      group: "Tools",
      keywords: ["unsplash", "pexels", "image", "photo"],
      handler: run(() => openPanel("assets", "stock")),
    },
  );

  // MORE — searchable, not in the opening list.
  commands.push(
    {
      id: "edit-redo",
      label: "Redo",
      group: "More",
      shortcut: "Ctrl+Y",
      disabled: !composer.history.canRedo(),
      disabledReason: "nothing to redo",
      handler: run(() => composer.history.redo()),
    },
    { id: "view-zoom-in", label: "Zoom in", group: "More", shortcut: "Ctrl++", handler: run(() => composer.emit(EVENTS.ZOOM_IN, {})) },
    { id: "view-zoom-out", label: "Zoom out", group: "More", shortcut: "Ctrl+-", handler: run(() => composer.emit(EVENTS.ZOOM_OUT, {})) },
    /* Ctrl+1 is fit (CanvasFooterToolbar binds ⌘1 to fit, ⌘0 to 100%). */
    { id: "view-fit", label: "Zoom to fit", group: "More", shortcut: "Ctrl+1", handler: run(() => composer.emit(EVENTS.ZOOM_FIT, {})) },
    { id: "history-clear", label: "Clear history", group: "More", handler: run(() => composer.emit(EVENTS.HISTORY_CLEARED, undefined)) },
  );
  used.add("redo");

  /* Carried over from the canvas palette, flag-gated the same way StudioHeader
     gates the Collaborate CTA. Not a registry command: it needs the site id
     from the URL, which lives in services/ and engine/ may not import. */
  if (isFeatureEnabled("collab")) {
    commands.push({
      id: "start-collab",
      label: "Start collaboration session",
      group: "More",
      keywords: ["collaborate", "team", "real-time", "multiplayer", "share"],
      handler: run(() => {
        const siteId = getSiteIdFromUrl();
        if (siteId) void composer.collab.manager.startSession(siteId, "Editor").catch(() => {});
      }),
    });
  }

  /* Everything else the registry holds (Export HTML/JSON, devices, nudges…) —
     searchable under MORE. The Pages panel's rows keep their PAGES band. Dedup
     by id AND label: a registry row the board list already carries is not
     printed twice. */
  const seenLabels = new Set(commands.map((c) => c.label.toLowerCase()));
  for (const cmd of registry) {
    if (used.has(cmd.id)) continue;
    const label = cmd.label ?? cmd.id;
    if (seenLabels.has(label.toLowerCase())) continue;
    seenLabels.add(label.toLowerCase());
    const reason = guard(cmd);
    commands.push({
      id: `cmd-${cmd.id}`,
      label,
      group: cmd.group === "Pages" ? "Pages" : "More",
      shortcut: cmd.shortcut,
      keywords: cmd.keywords,
      disabled: reason !== undefined,
      disabledReason: reason,
      handler: run(() => composer.commands.run(cmd.id)),
    });
  }

  return commands;
}

// =============================================================================
// PARTS
// =============================================================================

/** 4418:141220 kbd chip — gray-100 on a gray-200 edge, 20 tall, 11/16 medium. */
const Kbd: React.FC<{ shortcut: string; testId?: string }> = ({ shortcut, testId }) => {
  const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  return (
    <span
      data-testid={testId}
      className="tw:flex tw:h-5 tw:flex-none tw:items-center tw:rounded tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-subtle)] tw:px-1.5 tw:text-[11px] tw:font-medium tw:leading-4 tw:whitespace-nowrap tw:text-[var(--bk-gray-500)]"
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

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onClose, composer, initialQuery = "" }) => {
  const [query, setQuery] = React.useState(initialQuery);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  /* The palette unmounts on close (StudioHeader renders it conditionally), so
     this list — and every "cannot run" reason in it — is rebuilt on each open
     against the selection of that moment. */
  const commands = React.useMemo(
    () => buildCommands(composer, onClose),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [composer],
  );

  const runCommand = React.useCallback((cmd: PaletteCommand) => {
    if (cmd.disabled) return;
    cmd.handler();
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(timer);
  }, []);

  const visibleCommands = React.useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return commands.filter((c) => OPENING_BANDS.has(c.group));
    return commands.filter((cmd) =>
      [cmd.label, cmd.group, ...(cmd.keywords ?? [])].join(" ").toLowerCase().includes(q),
    );
  }, [commands, query]);

  // A query that matches nothing is never a dead end: AI, or stock photos.
  const askAI = React.useCallback(() => {
    composer?.emit(EVENTS.UI_SWITCH_TAB, { tab: "ai" });
    onClose();
  }, [composer, onClose]);
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
        case "Enter":
          e.preventDefault();
          if (orderedCommands.length === 0 && query.trim()) askAI();
          else {
            const cmd = orderedCommands[selectedIndex];
            if (cmd) runCommand(cmd);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [orderedCommands, selectedIndex, onClose, query, askAI, runCommand],
  );

  return (
    <>
      {/* 4418:141220 "dismiss · click outside": a click catcher, not a dim —
          the board leaves the editor at full strength behind the card. */}
      <div onClick={onClose} className="tw:fixed tw:inset-0 tw:bg-transparent tw:[z-index:calc(var(--bk-z-modal)-1)]" />
      <div
        role="dialog"
        aria-label="Command Palette"
        aria-modal="true"
        data-testid="cmdk-palette"
        onKeyDown={handleKeyDown}
        className="tw:fixed tw:top-12 tw:left-1/2 tw:flex tw:max-h-[800px] tw:w-160 tw:max-w-[calc(100vw-32px)] tw:-translate-x-1/2 tw:flex-col tw:overflow-hidden tw:rounded-xl tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-elevated)] tw:[box-shadow:var(--bk-shadow-overlay)] tw:[z-index:var(--bk-z-modal)]"
      >
        {/* Input row — 16/12 inset, ⌕ at 15px, the field at 12px, the scope chip. */}
        <div data-testid="cmdk-query" className="tw:flex tw:flex-none tw:items-center tw:gap-2 tw:px-4 tw:py-3">
          {/* The input row is the card's focus: the caret is the indicator, and
              the board draws no ring around the field. */}
          <span aria-hidden="true" className="tw:flex-none tw:text-[15px] tw:font-medium tw:leading-none tw:text-[var(--bk-gray-500)]">
            ⌕
          </span>
          <TextInput
            ref={inputRef}
            type="text"
            placeholder="Search pages, layers, assets and actions…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            /* A combobox over the listbox below, so the highlight the arrow
               keys move is announced (aria-activedescendant). */
            role="combobox"
            aria-expanded
            aria-controls={LIST_ID}
            aria-autocomplete="list"
            aria-activedescendant={orderedCommands[selectedIndex] ? `${LIST_ID}-${selectedIndex}` : undefined}
            aria-label="Search pages, layers, assets and actions"
            data-testid="cmdk-input"
            /* a11y.css's unlayered `*:focus-visible` ring beats any layered
               utility; `style` reaches the real <input> on this wrapper. */
            style={{ outline: "none" }}
            className="tw:flex-1 tw:[&_input]:h-[18px] tw:[&_input]:border-0 tw:[&_input]:bg-transparent tw:[&_input]:p-0 tw:[&_input]:text-[12px] tw:[&_input]:leading-[18px] tw:[&_input]:text-[var(--bk-ink)] tw:[&_input]:shadow-none tw:[&_input]:ring-0 tw:[&_input]:focus:ring-0 tw:[&_input]:placeholder:text-[var(--bk-ink-muted)]"
          />
          <span
            data-testid="cmdk-scope"
            className="tw:flex-none tw:rounded tw:bg-[var(--bk-bg-subtle)] tw:px-1.5 tw:py-0.5 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-soft)]"
          >
            Scope: everything
          </span>
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
                <div data-testid="cmdk-no-results-line" className="tw:text-[var(--bk-ink-muted)]">
                  Nothing matches &lsquo;{query.trim()}&rsquo;.
                </div>
                <Button onClick={searchStock} data-idx={0} variant="link" data-testid="cmdk-no-results-stock">
                  Search stock photos for &lsquo;{query.trim()}&rsquo;
                </Button>
                <Button onClick={askAI} variant="link" data-testid="cmdk-no-results-ai">
                  Ask AI instead ›
                </Button>
              </div>
            ) : null
          ) : (
            bands.map(([group, cmds]) => (
              <div key={group}>
                <div
                  role="presentation"
                  data-testid={`cmdk-band-${bandSlug(group)}`}
                  className="tw:pt-2 tw:pb-1 tw:pl-4 tw:text-[11px] tw:font-medium tw:leading-4 tw:tracking-[0.88px] tw:uppercase tw:text-[var(--bk-ink-muted)]"
                >
                  {group}
                </div>
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
                      className={`tw:flex tw:h-8 tw:min-h-0 tw:w-full tw:items-center tw:justify-between tw:gap-2 tw:rounded-none tw:border-0 tw:px-4 tw:py-0 tw:text-left ${
                        isSelected
                          ? "tw:bg-[var(--bk-bg-subtle)] tw:enabled:hover:bg-[var(--bk-bg-subtle)]"
                          : "tw:bg-transparent tw:enabled:hover:bg-transparent"
                      } ${cmd.disabled ? "tw:opacity-50 tw:cursor-default" : ""}`}
                    >
                      <span
                        data-testid={`cmdk-label-${cmd.id}`}
                        className="tw:min-w-0 tw:overflow-hidden tw:text-ellipsis tw:whitespace-nowrap tw:text-[11px] tw:font-normal tw:leading-4 tw:text-[var(--bk-ink-soft)]"
                      >
                        {cmd.disabled && cmd.disabledReason ? `${cmd.label} · ${cmd.disabledReason}` : cmd.label}
                      </span>
                      {showChord && cmd.shortcut ? <Kbd shortcut={cmd.shortcut} testId={`cmdk-kbd-${cmd.id}`} /> : null}
                    </Button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Legend — "Click a command · Esc Close … Current editor". */}
        <div className="tw:h-px tw:flex-none tw:bg-[var(--bk-border)]" />
        <div
          data-testid="cmdk-legend"
          className="tw:flex tw:flex-none tw:items-center tw:gap-3 tw:px-4 tw:py-2 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]"
        >
          <span>Click a command</span>
          <Button
            variant="link"
            onClick={onClose}
            className="tw:h-auto tw:min-h-0 tw:p-0 tw:text-[11px] tw:font-normal tw:leading-4 tw:text-[var(--bk-ink-muted)]"
          >
            Esc Close
          </Button>
          <span className="tw:flex-1" />
          <span>Current editor</span>
        </div>
      </div>
    </>
  );
};

export default CommandPalette;
