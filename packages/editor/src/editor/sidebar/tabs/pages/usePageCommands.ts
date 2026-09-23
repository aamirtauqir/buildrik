/**
 * usePageCommands — the Pages panel's rows in the ONE ⌘K palette.
 *
 * Decision #38 (2026-09-21): the panel's own ⌘K palette (`PageCommandPalette`,
 * TODOS.md:393) is gone; jump-to-page and New page are commands in the
 * engine registry, guarded on "Pages is active". The registry cannot know
 * which left tab is open — `ComposerState` carries no chrome state and the
 * Composer API is consumed, not extended — so the guard is registration
 * lifetime: the panel registers on mount and unregisters on unmount, and
 * TabRouter mounts only the active tab. The palette bands `group: "Pages"`
 * rows under PAGES.
 *
 * Re-registered whenever the page list changes, so a page renamed or added
 * while the panel is open shows up on the next ⌘K.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import type { PageItem } from "./types";

export const PAGE_COMMAND_GROUP = "Pages";
export const NEW_PAGE_COMMAND_ID = "page-new";
export const goToPageCommandId = (pageId: string) => `page-go-${pageId}`;

export function usePageCommands(
  composer: Composer | null,
  pages: readonly PageItem[],
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
