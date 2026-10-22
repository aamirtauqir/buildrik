/**
 * usePageCommands — the Pages panel's rows in the ONE ⌘K palette.
 *
 * Decision #38 (2026-09-21): the panel's own ⌘K palette (`PageCommandPalette`,
 * TODOS.md:393) is gone; jump-to-page and New page are commands in the
 * engine registry.
 *
 * v3 FC-2 (2026-09-25): this used to be called from PagesTab, so the guard
 * on "which rows exist" was registration LIFETIME — the panel registers on
 * mount and unregisters on unmount, TabRouter mounts only the active tab —
 * which meant "Go to <page>" only showed up in ⌘K while the Pages drawer
 * happened to be open, unlike Layers/Assets/Records/Templates rows, all of
 * which register from something always-mounted. The shell's own page list
 * (`shell/usePageSummaries`, which also feeds the bottom-bar page switcher —
 * none of usePages' rename/duplicate/delete/settings state, which the shell
 * has no business owning) lets the SHELL call this hook once,
 * unconditionally. PagesTab no longer calls it.
 *
 * Re-registered whenever the page list changes, so a page renamed or added
 * shows up on the next ⌘K.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";

export const PAGE_COMMAND_GROUP = "Pages";
export const NEW_PAGE_COMMAND_ID = "page-new";
const SWITCH_PAGE_COMMAND_ID = "page-switcher";
export const goToPageCommandId = (pageId: string) => `page-go-${pageId}`;

/** The slice of a page a ⌘K row needs. The shell passes its PageSummary
 *  list (`usePageSummaries`), which is a superset. */
export interface PageJumpEntry {
  id: string;
  name: string;
  isHome?: boolean;
}

export function usePageCommands(
  composer: Composer | null,
  pages: readonly PageJumpEntry[],
  selectPage: (pageId: string) => void,
  addPage: () => void,
): void {
  /* Refs, so a new callback identity from usePages does not tear the rows
     down and re-register them on every render. The registry runs whatever
     the ref holds at the time the row is chosen. */
  const selectRef = React.useRef(selectPage);
  const addRef = React.useRef(addPage);
  selectRef.current = selectPage;
  addRef.current = addPage;

  /* One string per page list, not the array identity — usePages hands out a
     fresh array on every sync and the rows only change when a page is added,
     removed or renamed. */
  const signature = pages.map((pg) => `${pg.id}\u0000${pg.name}\u0000${pg.isHome ? 1 : 0}`).join("\u0001");

  React.useEffect(() => {
    if (!composer) return;
    const ids: string[] = [];
    const register = (id: string, label: string, run: () => void) => {
      composer.commands.register({ id, label, group: PAGE_COMMAND_GROUP, run });
      ids.push(id);
    };
    register(NEW_PAGE_COMMAND_ID, "New page", () => addRef.current());
    /* The bottom bar's page switcher (⇧⌘O / Ctrl+Alt+O). */
    register(SWITCH_PAGE_COMMAND_ID, "Switch page…", () => composer.emit(EVENTS.UI_TOGGLE_PAGE_SWITCHER, {}));
    for (const pg of pages) {
      register(goToPageCommandId(pg.id), `Go to ${pg.name}${pg.isHome ? " (home)" : ""}`, () =>
        selectRef.current(pg.id),
      );
    }
    return () => {
      for (const id of ids) composer.commands.unregister(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `signature` stands in for `pages`
  }, [composer, signature]);
}
