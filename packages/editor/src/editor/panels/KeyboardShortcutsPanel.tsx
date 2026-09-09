/**
 * Keyboard Shortcuts Panel
 * Full reference of all keyboard shortcuts — PRD §17.2
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ModalBody, ModalClose, ModalContent, ModalRoot, ModalTitle, TextInput } from "@/editor/chrome-ui";
import { GROUPED_TABS_CONFIG } from "../rail/tabsConfig";

// =============================================================================
// SHORTCUT DATA
// =============================================================================

interface ShortcutRow {
  key: string;
  desc: string;
}

interface ShortcutGroup {
  label: string;
  shortcuts: ShortcutRow[];
}

const PANEL_SHORTCUTS: ShortcutRow[] = GROUPED_TABS_CONFIG
  .filter((t) => Boolean(t.shortcut))
  .map((t) => ({ key: t.shortcut!, desc: `Open ${t.label} panel` }));

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    label: "Panels",
    shortcuts: PANEL_SHORTCUTS,
  },
  {
    label: "Edit",
    shortcuts: [
      /* Board 815:4518 opens its General group with Save ⌘S, and the chord IS
         bound — useEditorShortcuts.ts:135 calls saveProject() on it. The sheet
         simply never advertised it, which is the one direction of drift that
         costs a user something real: a working shortcut nobody can find. */
      { key: "Ctrl+S", desc: "Save" },
      { key: "Ctrl+Z", desc: "Undo" },
      /* The handler takes Shift+Z OR Y (useEditorShortcuts:146). The sheet
         shows the convention (⇧⌘Z on Mac); Y keeps working unlisted. */
      { key: "Ctrl+Shift+Z", desc: "Redo" },
      { key: "Ctrl+C", desc: "Copy" },
      { key: "Ctrl+V", desc: "Paste" },
      { key: "Del", desc: "Delete element" },
      { key: "Ctrl+D", desc: "Duplicate" },
    ],
  },
  {
    label: "View",
    shortcuts: [
      { key: "Ctrl+P", desc: "Preview" },
      { key: "Ctrl+K", desc: "Command palette" },
      /* Two help screens, two chords — and this row used to print only "?",
         which opens the canvas cheat sheet, not this panel. Measured: "?" →
         "⌨️ Keyboard Shortcuts · SELECTION", ⌘/ → this panel. */
      { key: "Ctrl+/", desc: "This shortcuts panel" },
      { key: "?", desc: "Canvas gestures & selection" },
      /* ⌘0 was printed as "Fit to view". Measured at 1440x900: ⌘0 sets 100%,
         ⌘1 is the one that fits (100% → 98% on a page wider than the frame)
         and ⌘2 zooms to the selection — the three rows the zoom flyout itself
         binds (CanvasFooterToolbar). The fit chord was advertised under the
         wrong key and the other two were not advertised at all. */
      { key: "Ctrl+0", desc: "Zoom to 100%" },
      /* "Zoom to fit" is the board's wording (815:4518) AND the zoom flyout's
         own (StudioFooter.tsx:267) and the canvas cheat sheet's
         (KeyboardCheatSheet.tsx:88). This sheet was the only place calling the
         same chord "Fit to view". */
      { key: "Ctrl+1", desc: "Zoom to fit" },
      { key: "Ctrl+2", desc: "Zoom to selection" },
      { key: "Ctrl++", desc: "Zoom in" },
      { key: "Ctrl+-", desc: "Zoom out" },
    ],
  },
];

// =============================================================================
// KEY BADGE
// =============================================================================

/** The key as the USER sees it — ⌘ on Mac, Ctrl elsewhere. One function, used
 *  by both the badge and the search filter: the data stores "Ctrl+Z", the
 *  screen shows "⌘+Z", and a search has to match what is on the screen, not
 *  what is in the array. */
export function displayKey(key: string): string {
  const isMac =
    typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  return key
    .replace(/Ctrl/g, isMac ? "⌘" : "Ctrl")
    .replace(/Shift/g, isMac ? "⇧" : "Shift")
    .replace(/Alt/g, isMac ? "⌥" : "Alt");
}

/* Board 815:4527/4528 draws the chord as a 24-high chip on a 4 radius:
   bg-subtle inside a --color/border-medium hairline, the glyphs 12px in
   ink-soft at a 7 inset. It shipped 11px ink inside --bk-border (#E5E7EB,
   one step lighter) on 2/6 padding with no height, so a row of chips had no
   common baseline box.

   The FAMILY is deliberately NOT moved. 815:4528 draws Inter Medium; board
   2838:12148 draws the same object — a chord chip — in Geist Mono Medium, and
   DESIGN.md calls mono the data face, which is what both chips ship as today.
   Two boards, one question, neither of them `verified` in boards.json: under
   the conformance rule neither re-settles the control, so the properties the
   harness can measure move and the typeface stays where the product already
   is. Flagged for the founder rather than picked by me. */
const KeyBadge: React.FC<{ children: string; testId?: string }> = ({ children, testId }) => {
  const display = displayKey(children);

  return (
    <span
      data-testid={testId}
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 24,
        padding: "0 7px",
        background: "var(--bk-bg-subtle)",
        border: "1px solid var(--bk-border-medium)",
        borderRadius: "var(--bk-radius-sm)",
        fontSize: 12,
        fontFamily: "var(--bk-font-mono)",
        color: "var(--bk-ink-soft)",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {display}
    </span>
  );
};

/** A stable anchor per row: the description, kebab-cased. */
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// =============================================================================
// COMPONENT
// =============================================================================

export interface KeyboardShortcutsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsPanel: React.FC<KeyboardShortcutsPanelProps> = ({
  isOpen,
  onClose,
}) => {
  /* Board 815:4518 puts "Search shortcuts…" at the top and the overlay shipped
     without it — sixty-one shortcuts in one modal and the only way to find one
     was to read them all. Filters on the description AND the key, so "undo"
     and "⌘Z" both land. Groups whose every row is filtered out disappear with
     their heading; a heading over nothing is furniture. Cleared each open —
     yesterday's query is not today's question. */
  const [query, setQuery] = React.useState("");
  React.useEffect(() => {
    if (isOpen) setQuery("");
  }, [isOpen]);
  const q = query.trim().toLowerCase();
  const visibleGroups = q
    ? SHORTCUT_GROUPS.map((g) => ({
        ...g,
        shortcuts: g.shortcuts.filter(
          (r) =>
            r.desc.toLowerCase().includes(q) ||
            /* Both spellings: the stored "Ctrl+Z" AND the rendered "⌘+Z" —
               someone on a Mac searches what the badge shows. */
            r.key.toLowerCase().includes(q) ||
            displayKey(r.key).toLowerCase().includes(q),
        ),
      })).filter((g) => g.shortcuts.length > 0)
    : SHORTCUT_GROUPS;
  return (
    <ModalRoot open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <ModalContent size="table">
        <ModalTitle>Keyboard Shortcuts</ModalTitle>
        <ModalClose aria-label="Close modal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </ModalClose>
        <ModalBody>
    <TextInput
      type="search"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search shortcuts…"
      aria-label="Search shortcuts"
      className="tw:mb-3"
      data-testid="kb-search"
    />
    {q && visibleGroups.length === 0 && (
      <p className="tw:text-[13px] tw:text-[var(--bk-ink-muted)]">
        Nothing matches &lsquo;{query.trim()}&rsquo;.
      </p>
    )}
    {/* Board 815:4518 is 640 x 934 and stacks the groups in ONE column, each
        heading over a full-width rule with its rows under it. Three columns
        at 720 packed four groups into a grid the board never draws and made
        every row 200 wide. */}
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        maxHeight: "60vh",
        overflowY: "auto",
        padding: "8px 0",
      }}
    >
      {visibleGroups.map((group) => (
        <div key={group.label}>
          {/* Group heading */}
          {/* 815:4524 draws the heading in TITLE case at 12/600 ink-muted —
              "General", not "GENERAL" — over 815:4525's 1px bg-subtle rule.
              The uppercase + 0.5 tracking came from nowhere on this board,
              and the rule was --bk-border, one step darker. */}
          <div
            data-testid={`kb-group-${slug(group.label)}`}
            style={{
              fontSize: 12,
              color: "var(--bk-ink-muted)",
              marginBottom: 8,
              paddingBottom: 6,
              borderBottom: "1px solid var(--bk-bg-subtle)",
              fontWeight: 600,
            }}
          >
            {group.label}
          </div>

          {/* Shortcut rows */}
          <div className="tw:flex tw:flex-col tw:gap-2">
            {group.shortcuts.map((row, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "3px 0",
                }}
              >
                {/* 815:4526 — the action reads at 13 in --flowbite/gray/700,
                    a step darker than the ink-soft it shipped in. */}
                <span
                  data-testid={`kb-label-${slug(row.desc)}`}
                  style={{
                    fontSize: 13,
                    color: "var(--bk-gray-700)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    minWidth: 0,
                  }}
                >
                  {row.desc}
                </span>
                <KeyBadge testId={`kb-badge-${slug(row.desc)}`}>{row.key}</KeyBadge>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>

    {/* The "On Mac, use ⌘ instead of Ctrl" footer died 2026-08-28: the badges
        have been platform-aware since displayKey, so on a Mac it explained
        symbols already shown, and on Windows it described somebody else's
        keyboard. */}
        </ModalBody>
      </ModalContent>
    </ModalRoot>
  );
};

export default KeyboardShortcutsPanel;
