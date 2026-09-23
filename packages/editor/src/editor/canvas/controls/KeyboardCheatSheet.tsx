/**
 * KeyboardCheatSheet — the editor's ONE keyboard sheet.
 *
 * Board 7575:195538 "CURRENT DESIGN · Keyboard shortcuts · full" (640×934,
 * cloned from the parked 4418:139807 overlay): a search field over ONE column
 * of groups — Selection · Edit · View · Panels · Regions — each heading over a
 * hairline with its rows under it, the chord as a 24-high mono chip.
 *
 * Doors: `?` and ⌘/ (useEditorShortcuts), the ⌘K "Keyboard shortcuts" row and
 * the site-menu row (both emit UI_TOGGLE_CHEAT_SHEET → useEditorEventListeners),
 * the footer's help button. All of them flip `useGlobalModals.showShortcuts`,
 * and StudioModals mounts this once — there is no second state to drift.
 *
 * Rows come from `keyboardSheetRows.ts`: the command registry first (a chord
 * change there changes the sheet), then the chords chrome binds outside it.
 * Two sheets with two hand-written tables shipped until 2026-09-22
 * (`panels/KeyboardShortcutsPanel` behind ⌘/ and this one behind `?`;
 * TODOS.md:512 recorded that they contradicted each other).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ModalBody, ModalClose, ModalContent, ModalRoot, ModalTitle, TextInput } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import { buildSheetGroups, formatKeys, type SheetGroup } from "./keyboardSheetRows";

export interface KeyboardCheatSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Source of the registry rows. Without one only the chrome-bound chords show. */
  composer: Composer | null;
}

const isMacPlatform = () =>
  typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

/** A stable anchor per row: the description, kebab-cased — the recipe
 *  `s3-10-keyboard-shortcuts-overlay` measures `kb-label-undo`,
 *  `kb-badge-copy` and friends by this scheme. */
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* Board 815:4527/4528 (the parked overlay this board was cloned from) draws
   the chord as a 24-high chip on a 4 radius: bg-subtle inside a
   --color/border-medium hairline, the glyphs 12px mono in ink-soft at a 7
   inset. */
const KeyChip: React.FC<{ keys: string; testId: string; isMac: boolean }> = ({ keys, testId, isMac }) => (
  <span
    data-testid={testId}
    className="tw:inline-flex tw:h-6 tw:shrink-0 tw:items-center tw:whitespace-nowrap tw:rounded-[var(--bk-radius-sm)] tw:border tw:border-[var(--bk-border-medium)] tw:bg-[var(--bk-bg-subtle)] tw:px-[7px] tw:text-xs tw:text-[var(--bk-ink-soft)] tw:[font-family:var(--bk-font-mono)]"
  >
    {formatKeys(keys, isMac)}
  </span>
);

/** Rows whose description, stored chord or DISPLAYED chord contains the query
 *  — someone on a Mac searches the ⌘ the chip shows, not the "ctrl" the
 *  registry stores. Groups whose every row is filtered out take their heading
 *  with them. */
function filterGroups(groups: SheetGroup[], query: string, isMac: boolean): SheetGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return groups;
  return groups
    .map((g) => ({
      ...g,
      rows: g.rows.filter(
        (r) =>
          r.description.toLowerCase().includes(q) ||
          r.keys.toLowerCase().includes(q) ||
          formatKeys(r.keys, isMac).toLowerCase().includes(q) ||
          g.title.toLowerCase().includes(q),
      ),
    }))
    .filter((g) => g.rows.length > 0);
}

export const KeyboardCheatSheet: React.FC<KeyboardCheatSheetProps> = ({ isOpen, onClose, composer }) => {
  const isMac = isMacPlatform();
  const [query, setQuery] = React.useState("");
  /* Cleared each open — yesterday's query is not today's question. */
  React.useEffect(() => {
    if (isOpen) setQuery("");
  }, [isOpen]);

  /* Read on every open: the registry changes while panels mount and unmount
     (the Pages panel registers its rows only while it is open). */
  const groups = React.useMemo(
    () => (isOpen ? buildSheetGroups(composer?.commands.getAll() ?? []) : []),
    [isOpen, composer],
  );
  const visible = filterGroups(groups, query, isMac);

  // Escape, focus trap and the overlay come from the shared Modal substrate.
  // '?' also closes — the toggle key mirrors open/close.
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.tagName === "INPUT") return;
      if (e.key === "?") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <ModalRoot open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <ModalContent size="table" data-testid="keyboard-sheet">
        <ModalTitle>Keyboard shortcuts</ModalTitle>
        <ModalClose aria-label="Close keyboard shortcuts">
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
          {query.trim() && visible.length === 0 && (
            <p className="tw:text-[13px] tw:text-[var(--bk-ink-muted)]">
              Nothing matches &lsquo;{query.trim()}&rsquo;.
            </p>
          )}
          {/* ONE column, 24 between groups — the board stacks them; a grid
              packed four groups side by side and made every row 200 wide. */}
          <div className="tw:flex tw:max-h-[60vh] tw:flex-col tw:gap-6 tw:overflow-y-auto tw:py-2">
            {visible.map((group) => (
              <div key={group.title}>
                {/* Heading in Title case at 12/600 ink-muted over a 1px
                    bg-subtle rule (815:4524/4525). */}
                <div
                  data-testid={`kb-group-${slug(group.title)}`}
                  className="tw:mb-2 tw:border-b tw:border-[var(--bk-bg-subtle)] tw:pb-1.5 tw:text-xs tw:font-semibold tw:text-[var(--bk-ink-muted)]"
                >
                  {group.title}
                </div>
                <div className="tw:flex tw:flex-col tw:gap-2">
                  {group.rows.map((row) => (
                    <div
                      key={row.id}
                      data-testid={`kb-row-${row.id}`}
                      className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:py-[3px]"
                    >
                      {/* 13 in gray-700 (815:4526). */}
                      <span
                        data-testid={`kb-label-${slug(row.description)}`}
                        className="tw:min-w-0 tw:overflow-hidden tw:text-ellipsis tw:whitespace-nowrap tw:text-[13px] tw:text-[var(--bk-gray-700)]"
                      >
                        {row.description}
                      </span>
                      <KeyChip keys={row.keys} testId={`kb-badge-${slug(row.description)}`} isMac={isMac} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ModalBody>
      </ModalContent>
    </ModalRoot>
  );
};

export default KeyboardCheatSheet;
