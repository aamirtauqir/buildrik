/**
 * useDirtyPages — which pages carry unsaved edits.
 *
 * Two surfaces draw this: the page tab bar's accent dot (board 435:2368) and
 * the Pages tree's dirty ● (boards 140:21 / 1171:4729, whose caption spells the
 * row out as "checkbox · chevron · icon · name · home ⌂ · dirty ●").
 *
 * The engine has no per-page dirty flag: element events carry no page id. What
 * it does have is an active page, so an edit marks THAT page and a project save
 * clears everything.
 *
 * WHY THE STATE IS NOT IN THE HOOK. It was, and the markers were panel state
 * rather than document state: the tracking lived in a `useState` inside the
 * component that rendered it, so both halves died with the panel. Walked live
 * — edit a page, watch its ● light, click Layers, click back to Pages, and the
 * ● is gone with nothing saved. Worse, while the Pages panel was closed no
 * listener existed at all, so edits made from anywhere else were never
 * recorded. A per-composer store fixes both: it is attached to the document,
 * outlives every panel, and a remount re-reads what is already there.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../engine";
import { DOCUMENT_CHANGED_EVENTS, EVENTS, isNavigationOnlyChange } from "../../shared/constants";

interface DirtyStore {
  /** Frozen between mutations — useSyncExternalStore compares by identity. */
  snapshot: ReadonlySet<string>;
  subscribers: Set<() => void>;
}

const EMPTY: ReadonlySet<string> = new Set();
const stores = new WeakMap<Composer, DirtyStore>();

/**
 * One store per composer, wired on first use and never torn down — the
 * composer outlives every panel, and its own `destroy()` takes the listeners
 * with it. Keyed weakly so a discarded composer is still collectable.
 */
function getStore(composer: Composer): DirtyStore {
  const existing = stores.get(composer);
  if (existing) return existing;

  const store: DirtyStore = { snapshot: EMPTY, subscribers: new Set() };
  stores.set(composer, store);

  const publish = (next: ReadonlySet<string>) => {
    if (next === store.snapshot) return;
    store.snapshot = next;
    store.subscribers.forEach((fn) => fn());
  };

  const markDirty = (payload?: unknown) => {
    /* Looking at a page is not editing it. `setActivePage` emits
       `project:changed` too, so without this a plain page switch lit an
       unsaved dot on a page nothing had touched. */
    if (isNavigationOnlyChange(payload)) return;

    /* Mark the page the event is ABOUT, not whichever one is open.
       `PageManager` emits `page:updated`, `page:home`, `page:created`,
       `page:deleted`, `page:reordered` and `page:imported` with the affected
       page in the payload, and it is routinely NOT the active one — rename a
       page from the Pages tree, or set a different page as home, and the edit
       belongs to that page. Tagging the active page instead lit the dot on the
       wrong row and left the edited page looking clean. Codex caught it in the
       whole-session review; element edits carry no page, so they still fall
       back to the active page, which is correct for them. */
    const target =
      (typeof payload === "object" &&
        payload !== null &&
        (payload as { page?: { id?: unknown } }).page?.id) ||
      composer.elements.getActivePage()?.id;

    if (typeof target !== "string" || store.snapshot.has(target)) return;
    publish(new Set(store.snapshot).add(target));
  };
  const clearDirty = () => publish(EMPTY);

  /* The same four events autosave listens to, from the same constant — see
     DOCUMENT_CHANGED_EVENTS. This hook used to watch element:updated and
     element:deleted instead, which agreed with autosave on neither end:
     inserting an element never lit the dot, and an undo (which emits only
     history:undo) neither lit it nor saved it. */
  DOCUMENT_CHANGED_EVENTS.forEach((name) => composer.on(name, markDirty));
  composer.on(EVENTS.PROJECT_SAVED, clearDirty);

  return store;
}

export function useDirtyPages(composer: Composer | null): ReadonlySet<string> {
  const store = composer ? getStore(composer) : null;

  const subscribe = React.useCallback(
    (onChange: () => void) => {
      if (!store) return () => {};
      store.subscribers.add(onChange);
      return () => store.subscribers.delete(onChange);
    },
    [store]
  );
  const getSnapshot = React.useCallback(() => store?.snapshot ?? EMPTY, [store]);

  return React.useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}
