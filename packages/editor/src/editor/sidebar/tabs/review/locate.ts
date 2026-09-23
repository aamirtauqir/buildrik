/**
 * locateComment — put a review comment's element on screen.
 *
 * Extracted from the retired ReviewBar's "Next ›" (C2, decision #39): the
 * one behaviour that bar owned which nothing else did — switch page when the
 * comment lives on another page, then select its anchor so the canvas scrolls
 * to it. The Review panel's per-row "Locate ›" (B3) and its banner walk both
 * call this; it is the REGRESSION-guarded seam.
 *
 * Decision #27: cross-page → the page switches FIRST, then the selection;
 * a deleted anchor → nothing is selected and the caller says so, never a
 * silent no-op. The `?el=&page=` deep link (useDeepLink) is the same act on
 * load and calls this too.
 *
 * @license BSD-3-Clause
 */
import type { Composer } from "@/engine";
import { getDOMElement } from "@/engine/canvas/resize/utils";
import { elementIdFromSelector } from "@/editor/canvas/comments/commentAnchors";

export interface LocatableComment {
  pageId: string | null;
  /** The anchor: a stored pin selector (`[data-buildrick-id="…"]`, what
   *  CommentLayer writes) or a bare element id (the `?el=` deep link). */
  targetSelector: string | null;
}

/** The engine id behind an anchor — the selector's id, or the id itself. */
export function anchorId(targetSelector: string): string {
  return elementIdFromSelector(targetSelector) ?? targetSelector;
}

/**
 * `located`   the page is current and the anchor is selected
 * `page-only` the comment has no anchor (the board's "unpinned" case): the
 *             page switched, nothing to select
 * `gone`      the anchor was deleted — nothing is selected; the row is the
 *             one that reports it (#27)
 */
export type LocateOutcome = "located" | "page-only" | "gone";

export function locateComment(composer: Composer, c: LocatableComment): LocateOutcome {
  /* The page first, then the anchor: the element registry is looked up after
     the switch so a page-scoped registry cannot report a live anchor on
     another page as gone. */
  if (c.pageId && composer.elements.getActivePage()?.id !== c.pageId) {
    composer.elements.setActivePage(c.pageId);
  }
  if (!c.targetSelector) return "page-only";
  /* The comment row stores a SELECTOR; the registry is keyed by id. Looking
     the selector up as an id (what the retired ReviewBar did) found nothing
     for every real pin. */
  const id = anchorId(c.targetSelector);
  const el = composer.elements.getElement(id);
  if (!el) return "gone";
  /* `select` takes the element, not its id — the same shape ContentTab uses. */
  composer.selection.select(el);
  /* Selecting does not move the canvas; on a long page the anchor stays off
     screen. A page switch re-renders the canvas first, so the scroll waits a
     beat for the node to exist. */
  window.setTimeout(() => getDOMElement(id)?.scrollIntoView({ block: "center" }), 60);
  return "located";
}
