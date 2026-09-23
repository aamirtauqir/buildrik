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
 * a deleted anchor → nothing is selected and the caller says so ("No longer
 * on the page"), never a silent no-op.
 *
 * @license BSD-3-Clause
 */
import type { Composer } from "@/engine";

export interface LocatableComment {
  pageId: string | null;
  /** The anchor element's id (`targetSelector` on the comment row). */
  targetSelector: string | null;
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
  const el = composer.elements.getElement(c.targetSelector);
  if (!el) return "gone";
  /* `select` takes the element, not its id — the same shape ContentTab uses. */
  composer.selection.select(el);
  return "located";
}
