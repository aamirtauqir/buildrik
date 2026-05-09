# Stock Modal Hardening (S19) — Implementation Plan

**Date:** 2026-05-09
**Source:** prototype-v3.html §19 + §25 critical contract #4 ("Stock query stale results discarded mid-fetch")
**CEO plan ref:** P5 finish (engine→services event-bridge already shipped 2026-05-07; this slice adds source switching + stale-discard + quota strip)

**Goal:** Close the prototype gap: source pills (Unsplash / Pexels / Pixabay), AbortController-based stale-discard, quota strip UI.

---

## Inventory

- `services/stock/StockService.ts` — stub interface, no signal/source params
- `editor/sidebar/tabs/media/hooks/useDiscoveryState.ts` — has discSearchAll + loadMoreDisc, **no AbortController, no source switching**
- `editor/sidebar/tabs/media/components/StockSourceModal.tsx` — has tabs + search + filters, **no source pills, no quota strip**
- Memory: `feedback_check_git_log_before_assuming_uncleaned` — verify P5 status. Confirmed via `MediaManager.ts:34` comment that engine→services leak deleted 2026-05-07.

---

## File Structure

**Modify:**
- `packages/editor/src/services/stock/StockService.ts` — extend interface with `signal` + `source` opts
- `packages/editor/src/editor/sidebar/tabs/media/hooks/useDiscoveryState.ts` — AbortController per search + source state
- `packages/editor/src/editor/sidebar/tabs/media/components/StockSourceModal.tsx` — source pills + quota strip
- `packages/editor/src/editor/sidebar/tabs/media/data/mediaTypes.ts` — extend DiscoveryViewProps with source / setSource

**Create:**
- `packages/editor/src/editor/sidebar/tabs/media/hooks/__tests__/useDiscoveryState.stale.test.ts` — stale-discard contract test
- `packages/editor/src/editor/sidebar/tabs/media/components/__tests__/StockSourceModal.test.tsx` — source pills + quota strip rendering

---

## Task 1: Extend StockService — signal + source params

```ts
export type StockSource = "unsplash" | "pexels" | "pixabay";

export interface StockSearchOptions {
  page?: number;
  orientation?: StockOrientation;
  color?: StockColor;
  source?: StockSource;
  signal?: AbortSignal;
}

export interface StockService {
  searchPhotos(query: string, options: StockSearchOptions): Promise<StockPhoto[]>;
  searchVideos(query: string, options: StockSearchOptions): Promise<StockVideo[]>;
}
```

Stub implementation respects signal — throws AbortError when aborted (so consumers can rely on abort semantics in tests).

## Task 2: useDiscoveryState — AbortController per search

State adds: `discSource: StockSource`, `setDiscSource(s)`. Internal: `searchAbortRef = useRef<AbortController | null>(null)`.

Behavior:
- Every `discSearchAll` call: abort previous controller, create new one, pass signal
- Aborted resolution: silent (no toast, no setState)
- Source change: triggers re-search with new source
- Unmount: abort outstanding request

## Task 3: StockSourceModal — source pills + quota strip

Source pill row (3 buttons: Unsplash / Pexels / Pixabay) added beside search input.

Quota strip (above tabs): "Stock searches: N/M this month" + "Upgrade for unlimited →" link. Data comes from prop `quota?: { used: number; limit: number; upgradeHref?: string }`. When prop absent, strip is hidden (Phase 1 ship can omit until tRPC wires real quota).

## Task 4: Tests

- Stale discard: fire 2 searches in quick succession; second resolves first → only second result lands in state
- Source pill: click Pexels → setDiscSource called → next search uses pexels
- Quota strip: renders when prop present, hidden when absent

---

## Self-review

- ☐ Engine boundary preserved: stock search stays in editor (P5 decision)
- ☐ Abort-on-stale closes prototype §25 contract #4
- ☐ Source pill state lives in hook so modal stays presentational
- ☐ Quota strip data flow keeps real-quota wiring deferrable
- ☐ All existing useDiscoveryState consumers continue working (additive change)
