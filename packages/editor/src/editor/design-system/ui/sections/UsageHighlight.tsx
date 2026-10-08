/**
 * UsageHighlight — board BRP1-M5 "Token usage · highlight" (8224:230857).
 *
 * A click on a token's "Used by N" highlights the elements that use it. The
 * workspace covers the canvas, so the highlight is drawn in the live
 * preview's page (BrandLivePreview `highlightIds`); this module owns what the
 * board writes around it:
 *  - under the table, an accent notice: "Primary · Used by 14 elements
 *    across 3 pages";
 *  - in the right column, the page's card: "Home · 6 matches", Next page
 *    (the next page that has matches — the preview follows the active page)
 *    and Clear highlight.
 *
 * The highlighted ids are exactly the usage tracker's element breakdown for
 * the token (every token resolving through it included), re-read on
 * "tokenUsage:changed". Connect to tokens' preview (BRP1-M7) reuses the
 * preview highlight with its own ids.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine/Composer";
import { EVENTS } from "@/shared/constants/events";
import { Button } from "@/editor/chrome-ui";

export interface HighlightPage {
  id: string;
  name: string;
  count: number;
}

interface TreeNode {
  id: string;
  children?: readonly unknown[];
}
interface PageLike {
  id: string;
  name: string;
  root: TreeNode;
}

const isTreeNode = (n: unknown): n is TreeNode =>
  typeof n === "object" && n !== null && typeof (n as { id?: unknown }).id === "string";

/** Highlighted elements per page, in page order; pages with none are left out. */
export function highlightPages(pages: readonly PageLike[], ids: ReadonlySet<string>): HighlightPage[] {
  const out: HighlightPage[] = [];
  for (const page of pages) {
    let count = 0;
    const walk = (n: TreeNode) => {
      if (ids.has(n.id)) count++;
      for (const c of n.children ?? []) if (isTreeNode(c)) walk(c);
    };
    walk(page.root);
    if (count > 0) out.push({ id: page.id, name: page.name, count });
  }
  return out;
}

/** The distinct element ids the tracker's breakdown names for `tokenId`. */
export function useTokenBreakdownIds(composer: Composer | null | undefined, tokenId: string | null): readonly string[] {
  const tracker = composer?.designSystem?.tokenUsage;
  const read = React.useCallback(
    (): string[] => (tracker && tokenId ? [...new Set(tracker.getBreakdown(tokenId).map((r) => r.elementId))] : []),
    [tracker, tokenId],
  );
  const [ids, setIds] = React.useState<readonly string[]>(read);
  React.useEffect(() => {
    setIds(read());
    if (!tracker || !tokenId) return;
    const handler = () => setIds(read());
    tracker.on("tokenUsage:changed", handler);
    return () => {
      tracker.off("tokenUsage:changed", handler);
    };
  }, [tracker, tokenId, read]);
  return ids;
}

/** Where the highlighted elements are, the active page's share, and a way to the next page. */
export function useUsageHighlight(
  composer: Composer | null | undefined,
  elementIds: readonly string[],
): { pages: HighlightPage[]; active: HighlightPage | null; nextPage: () => void } {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    if (!composer || typeof composer.on !== "function") return;
    const bump = () => setTick((t) => t + 1);
    composer.on(EVENTS.PAGE_CHANGED, bump);
    composer.on(EVENTS.PROJECT_CHANGED, bump);
    return () => {
      composer.off(EVENTS.PAGE_CHANGED, bump);
      composer.off(EVENTS.PROJECT_CHANGED, bump);
    };
  }, [composer]);

  const { pages, active } = React.useMemo(() => {
    const all = composer?.elements?.exportPages?.() ?? [];
    const found = highlightPages(all, new Set(elementIds));
    const current = composer?.elements?.getActivePage?.();
    const activePage = current
      ? (found.find((p) => p.id === current.id) ?? { id: current.id, name: current.name, count: 0 })
      : null;
    return { pages: found, active: activePage };
    // `tick` re-reads the active page after a page switch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [composer, elementIds, tick]);

  const nextPage = React.useCallback(() => {
    if (pages.length === 0) return;
    const at = pages.findIndex((p) => p.id === active?.id);
    const next = pages[(at + 1) % pages.length];
    if (next.id !== active?.id) composer?.elements?.setActivePage(next.id);
  }, [pages, active, composer]);

  return { pages, active, nextPage };
}

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? "" : "s"}`;

/* 8224:231539 "Notice · accent": 12 in, 12/18 ink on the accent tint, square. */
export const NOTICE = "tw:m-0 tw:p-3 tw:text-[length:var(--bk-text-12)] tw:leading-[18px] tw:text-[var(--bk-ink)]";

/** The site-wide count also reaches shared styles, saved components and
 *  presets, which no page draws: when no element binds the token directly
 *  there is nothing to outline, and the notice says where the uses are. */
export const UsageHighlightNotice: React.FC<{ tokenName: string; elements: number; pages: number; references?: number }> = ({
  tokenName,
  elements,
  pages,
  references = 0,
}) => (
  <p role="status" data-testid="brand-usage-highlight-notice" className={`${NOTICE} tw:bg-[var(--bk-accent-tint)]`}>
    {elements > 0
      ? `${tokenName} · Used by ${plural(elements, "element")} across ${plural(pages, "page")}`
      : `${tokenName} · Used by ${plural(references, "reference")} in shared styles or components — no element on a page uses it directly`}
  </p>
);

/* 8224:231541 "Card · Matching elements": 16 in, 12 between, radius-md. */
export const SIDE_CARD =
  "tw:flex tw:flex-col tw:gap-3 tw:rounded-[var(--bk-radius-md)] tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-card)] tw:p-4";
export const SIDE_CARD_TITLE = "tw:m-0 tw:text-[length:var(--bk-text-14)] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]";
export const SIDE_CARD_BODY = "tw:m-0 tw:text-[length:var(--bk-text-12)] tw:leading-[18px] tw:text-[var(--bk-ink-soft)]";
/* The board's 28-tall actions: 12 in, 13/20 medium, gray-700. */
export const SMALL_ACTION =
  "tw:h-7 tw:min-h-0 tw:rounded-[var(--bk-radius-md)] tw:px-3 tw:py-1 tw:text-[length:var(--bk-text-13)] tw:font-medium tw:leading-5";

export const UsageHighlightCard: React.FC<{
  active: HighlightPage;
  tokenName: string;
  /** Pages with matches — Next page only shows when there is another to go to. */
  pageCount: number;
  onNext: () => void;
  onClear: () => void;
}> = ({ active, tokenName, pageCount, onNext, onClear }) => (
  <section aria-label="Matching elements" data-testid="brand-usage-highlight-card" className={SIDE_CARD}>
    <p className={SIDE_CARD_TITLE}>
      {active.name} · {active.count} {active.count === 1 ? "match" : "matches"}
    </p>
    <p className={SIDE_CARD_BODY}>Elements using {tokenName} are highlighted in the live preview.</p>
    <div className="tw:flex tw:items-center tw:gap-2">
      {pageCount > 1 || (pageCount === 1 && active.count === 0) ? (
        <Button type="button" variant="secondary" size="xs" className={`${SMALL_ACTION} tw:text-[var(--bk-gray-700)]`} onClick={onNext}>
          Next page
        </Button>
      ) : null}
      <Button type="button" variant="ghost" size="xs" className={`${SMALL_ACTION} tw:text-[var(--bk-gray-700)]`} onClick={onClear}>
        Clear highlight
      </Button>
    </div>
  </section>
);
