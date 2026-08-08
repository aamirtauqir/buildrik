/**
 * useDirtyPages — which pages carry unsaved edits.
 *
 * Two surfaces draw this: the page tab bar's accent dot (board 435:2368) and
 * the Pages tree's dirty ● (boards 140:21 / 1171:4729, whose caption spells the
 * row out as "checkbox · chevron · icon · name · home ⌂ · dirty ●"). The
 * tracking lived inside PageTabBar, so the tree had no way to read it and the
 * dot was deferred as "no per-page unsaved-state source" — there was one, it
 * just was not shared.
 *
 * The engine has no per-page dirty flag: element events carry no page id. What
 * it does have is an active page, so an edit marks THAT page and a project save
 * clears everything.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../engine";
import { EVENTS } from "../../shared/constants";

export function useDirtyPages(composer: Composer | null): ReadonlySet<string> {
  const [dirtyPages, setDirtyPages] = React.useState<ReadonlySet<string>>(() => new Set());

  React.useEffect(() => {
    if (!composer) return;
    const markDirty = () => {
      const active = composer.elements.getActivePage();
      if (!active) return;
      setDirtyPages((prev) => {
        if (prev.has(active.id)) return prev;
        const next = new Set(prev);
        next.add(active.id);
        return next;
      });
    };
    const clearDirty = () => setDirtyPages((prev) => (prev.size === 0 ? prev : new Set()));

    composer.on(EVENTS.ELEMENT_UPDATED, markDirty);
    composer.on(EVENTS.ELEMENT_DELETED, markDirty);
    composer.on(EVENTS.PROJECT_SAVED, clearDirty);
    return () => {
      composer.off(EVENTS.ELEMENT_UPDATED, markDirty);
      composer.off(EVENTS.ELEMENT_DELETED, markDirty);
      composer.off(EVENTS.PROJECT_SAVED, clearDirty);
    };
  }, [composer]);

  return dirtyPages;
}
