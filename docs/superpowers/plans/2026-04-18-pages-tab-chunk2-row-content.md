# Pages Tab — Phase 2 Chunk 2: Row Content Port

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the `pg-row-thumb` + inline `pg-row-slug` + `pg-row-updated` + `pg-row-grip` + refreshed status chips from `prototype.html` into `PageRow.tsx` and `PagesTab.css`, matching the dark-chrome Chunk 1 baseline.

**Architecture:** Read-only visual port — no engine changes, no reorder logic, no presence/collab, no thumbnail snapshotting. Thumbnails use deterministic gradient placeholders keyed to page status (prototype's `t-hero / t-about / t-blog / t-contact / t-pricing / t-ext` classes). Drag grip is rendered but wired to the existing `draggable={...}` prop — no new reorder code. "Updated" time reads existing `PageData.updatedAt` (ISO8601) via a new pure `relativeTime()` util.

**Tech Stack:** React 18, Emotion-free (raw CSS in `PagesTab.css`), Vitest for the util.

**Out of scope (other chunks):**
- Presence avatars (Chunk 4, needs collab engine)
- Real thumbnail snapshots (needs canvas capture API)
- "Scheduled" status (needs backend scheduling model)
- Reorder logic (Chunk 5)
- Settings drawer visuals (Chunk 3)
- Bulk toolbar restyle (Chunk 6)

---

## File Structure

| File | Role | Action |
|---|---|---|
| `packages/editor/src/editor/sidebar/tabs/pages/utils/relativeTime.ts` | Pure util: ISO8601 → "2m ago" / "yesterday" / "Fri 10:00" / "1w ago" | Create |
| `packages/editor/src/editor/sidebar/tabs/pages/utils/__tests__/relativeTime.test.ts` | Vitest coverage for buckets + edge cases | Create |
| `packages/editor/src/editor/sidebar/tabs/pages/utils/thumbnailKey.ts` | Map `PageItem` → CSS class (`t-hero` / `t-about` / ...) | Create |
| `packages/editor/src/editor/sidebar/tabs/pages/types.ts` | Add `updatedAt?: string` to `PageItem` | Modify |
| `packages/editor/src/editor/sidebar/tabs/pages/usePages.ts` | Wire `updatedAt` through sync (line ~91-108) | Modify |
| `packages/editor/src/editor/sidebar/tabs/pages/components/PageRow.tsx` | Render grip + thumb + inline slug + updated-time spans | Modify |
| `packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css` | Append "Chunk 2" block with prototype row CSS | Modify |

---

## Task 1: Add `updatedAt` to `PageItem`

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/pages/types.ts`

- [ ] **Step 1: Add the field**

Insert inside `PageItem` (after `head?: string;`):

```ts
  /** ISO8601 timestamp from engine PageData.updatedAt — used for row "2m ago" label */
  updatedAt?: string;
```

- [ ] **Step 2: Typecheck**

Run: `cd packages/editor && npx tsc --noEmit 2>&1 | grep "sidebar/tabs/pages" || echo "OK"`
Expected: `OK`

---

## Task 2: Wire `updatedAt` through `usePages` sync

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/pages/usePages.ts:91-108`

- [ ] **Step 1: Add mapping**

Inside the `setPages(raw.map((p) => ({ ... })))` block, add after `head: p.settings?.head,`:

```ts
            updatedAt: p.updatedAt,
```

- [ ] **Step 2: Typecheck + pages tests**

Run: `cd packages/editor && npx tsc --noEmit 2>&1 | grep "sidebar/tabs/pages" || echo "OK"`
Expected: `OK`
Run: `cd packages/editor && npx vitest run src/editor/sidebar/tabs/pages`
Expected: 24/24 pass (or more if tests added).

- [ ] **Step 3: Commit**

```bash
git add packages/editor/src/editor/sidebar/tabs/pages/types.ts packages/editor/src/editor/sidebar/tabs/pages/usePages.ts
git commit -m "feat(pages): expose updatedAt on PageItem for Chunk 2 row content"
```

---

## Task 3: `relativeTime` util (TDD)

**Files:**
- Create: `packages/editor/src/editor/sidebar/tabs/pages/utils/relativeTime.ts`
- Create: `packages/editor/src/editor/sidebar/tabs/pages/utils/__tests__/relativeTime.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { relativeTime } from "../relativeTime";

const NOW = new Date("2026-04-18T12:00:00Z").getTime();

describe("relativeTime", () => {
  it("returns 'just now' for <60s", () => {
    expect(relativeTime(new Date(NOW - 10_000).toISOString(), NOW)).toBe("just now");
  });
  it("returns minutes for <60m", () => {
    expect(relativeTime(new Date(NOW - 2 * 60_000).toISOString(), NOW)).toBe("2m ago");
  });
  it("returns hours for <24h", () => {
    expect(relativeTime(new Date(NOW - 3 * 3600_000).toISOString(), NOW)).toBe("3h ago");
  });
  it("returns 'yesterday' for 1-2 day range", () => {
    expect(relativeTime(new Date(NOW - 26 * 3600_000).toISOString(), NOW)).toBe("yesterday");
  });
  it("returns days for 2-7d", () => {
    expect(relativeTime(new Date(NOW - 3 * 86400_000).toISOString(), NOW)).toBe("3d ago");
  });
  it("returns weeks for >=7d", () => {
    expect(relativeTime(new Date(NOW - 10 * 86400_000).toISOString(), NOW)).toBe("1w ago");
  });
  it("returns empty string for undefined or invalid input", () => {
    expect(relativeTime(undefined, NOW)).toBe("");
    expect(relativeTime("not-a-date", NOW)).toBe("");
  });
});
```

- [ ] **Step 2: Run — expect fail**

Run: `cd packages/editor && npx vitest run src/editor/sidebar/tabs/pages/utils/__tests__/relativeTime.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Write `packages/editor/src/editor/sidebar/tabs/pages/utils/relativeTime.ts`:

```ts
/**
 * relativeTime — ISO8601 → short human string.
 * Buckets: just now (<60s) / Nm ago (<60m) / Nh ago (<24h) / yesterday (24-48h) /
 * Nd ago (<7d) / Nw ago (>=7d). Empty string on invalid/undefined input.
 *
 * @license BSD-3-Clause
 */

export function relativeTime(iso: string | undefined, nowMs: number = Date.now()): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const diff = Math.max(0, nowMs - t);
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 2) return "yesterday";
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  return `${w}w ago`;
}
```

- [ ] **Step 4: Run — expect pass**

Run: `cd packages/editor && npx vitest run src/editor/sidebar/tabs/pages/utils/__tests__/relativeTime.test.ts`
Expected: 7/7 pass.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/editor/sidebar/tabs/pages/utils/relativeTime.ts packages/editor/src/editor/sidebar/tabs/pages/utils/__tests__/relativeTime.test.ts
git commit -m "feat(pages): relativeTime util for row 'updated' label"
```

---

## Task 4: `thumbnailKey` util (deterministic gradient class)

**Files:**
- Create: `packages/editor/src/editor/sidebar/tabs/pages/utils/thumbnailKey.ts`

- [ ] **Step 1: Implement**

```ts
/**
 * thumbnailKey — pick a deterministic gradient class for the row thumbnail
 * placeholder. Real thumbnail snapshots are a separate feature; until then,
 * the class is chosen by page shape so the same page always looks the same.
 *
 * @license BSD-3-Clause
 */

import type { PageItem } from "../types";

const PALETTE = ["t-hero", "t-about", "t-blog", "t-contact", "t-pricing", "t-ext"] as const;
export type ThumbClass = typeof PALETTE[number];

export function thumbnailKey(page: PageItem): ThumbClass {
  if (page.status === "external") return "t-ext";
  if (page.isHome) return "t-hero";
  // Deterministic pick for the remaining pages — stable across renders.
  let h = 0;
  for (let i = 0; i < page.id.length; i++) h = (h * 31 + page.id.charCodeAt(i)) | 0;
  const bucket = PALETTE.slice(1, PALETTE.length - 1); // exclude t-hero, t-ext
  return bucket[Math.abs(h) % bucket.length];
}
```

- [ ] **Step 2: Typecheck**

Run: `cd packages/editor && npx tsc --noEmit 2>&1 | grep "sidebar/tabs/pages" || echo "OK"`
Expected: `OK`

---

## Task 5: Port row DOM in `PageRow.tsx`

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/pages/components/PageRow.tsx`

- [ ] **Step 1: Add imports** (top of file, after existing imports)

```ts
import { relativeTime } from "../utils/relativeTime";
import { thumbnailKey } from "../utils/thumbnailKey";
```

- [ ] **Step 2: Add row-level computed values** inside the component body, right after `const committedRef = React.useRef(false);`:

```ts
    const updatedLabel = relativeTime(page.updatedAt);
    const thumbClass = thumbnailKey(page);
```

- [ ] **Step 3: Insert grip + thumb + inline slug + updated span**

Inside the `.pg-row` div, right AFTER the `{/* Selection indicator... */}` block and BEFORE `{/* Page icon */}`, insert the grip:

```tsx
          {/* Drag grip — visible on hover, activates browser drag when parent draggable=true */}
          <span className="pg-row__grip" aria-hidden="true" title="Drag to reorder">
            <svg viewBox="0 0 10 14" width="10" height="14" fill="currentColor" aria-hidden="true">
              <circle cx="3" cy="3" r="1" /><circle cx="3" cy="7" r="1" /><circle cx="3" cy="11" r="1" />
              <circle cx="7" cy="3" r="1" /><circle cx="7" cy="7" r="1" /><circle cx="7" cy="11" r="1" />
            </svg>
          </span>
```

Right AFTER the existing `{/* Page icon */}` block and BEFORE the name block, insert the thumbnail:

```tsx
          {/* Thumbnail placeholder — gradient by page status until real snapshots ship */}
          <div className={`pg-row__thumb pg-row__thumb--${thumbClass}`} aria-hidden="true">
            <span className="pg-row__thumb-ghost" />
            <span className="pg-row__thumb-ghost" />
          </div>
```

Replace the existing `<div className="pg-row__name" ...>{page.name}</div>` block with:

```tsx
            <div
              className="pg-row__name"
              title={page.name}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onRenameStart();
              }}
            >
              {page.name}
              {page.slug && (
                <span className="pg-row__slug">
                  {page.slug.startsWith("/") ? page.slug : `/${page.slug}`}
                </span>
              )}
            </div>
```

Right AFTER the name block (after the closing of the rename/name conditional) and BEFORE `{/* Homepage pill ... */}`, insert the updated label:

```tsx
          {updatedLabel && <span className="pg-row__updated">{updatedLabel}</span>}
```

- [ ] **Step 4: Typecheck**

Run: `cd packages/editor && npx tsc --noEmit 2>&1 | grep "sidebar/tabs/pages" || echo "OK"`
Expected: `OK`

- [ ] **Step 5: Run tests**

Run: `cd packages/editor && npx vitest run src/editor/sidebar/tabs/pages`
Expected: all pass.

---

## Task 6: Append Chunk 2 CSS to `PagesTab.css`

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css`

- [ ] **Step 1: Append at end of file**

```css

/* ==========================================================================
   Phase 2 Chunk 2 — Row content port (grip, thumb, slug, updated)
   Spec: prototype.html (.pg-row-*) at designs/page-tab-premium-20260417/
   ========================================================================== */

.pages-panel .pg-row { gap: 8px; }

/* Drag grip — hidden by default, shown on row hover when row is draggable */
.pages-panel .pg-row__grip {
  display: none;
  width: 10px;
  color: var(--aqb-text-muted, #908d85);
  margin-right: -4px;
  cursor: grab;
  flex-shrink: 0;
}
.pages-panel .pg-row-wrap[draggable="true"] .pg-row:hover .pg-row__grip { display: block; }
.pages-panel .pg-row__grip:active { cursor: grabbing; }

/* Thumbnail placeholder — 32x20 gradient by page type */
.pages-panel .pg-row__thumb {
  position: relative;
  width: 32px;
  height: 20px;
  border: 1px solid var(--aqb-border, rgba(255,255,255,0.08));
  border-radius: 3px;
  flex-shrink: 0;
  overflow: hidden;
  background-image: linear-gradient(135deg, #252531 0%, #1e1e28 55%, #17171f 100%);
}
.pages-panel .pg-row__thumb--t-hero    { background: linear-gradient(180deg, #1b2950, #223070 40%, #0c0c14 100%); }
.pages-panel .pg-row__thumb--t-about   { background: linear-gradient(180deg, #222833, #13151a 60%); }
.pages-panel .pg-row__thumb--t-blog    { background: linear-gradient(180deg, #191721, #221f2b 70%); }
.pages-panel .pg-row__thumb--t-contact { background: linear-gradient(180deg, #0f1a2e, #0a1424); }
.pages-panel .pg-row__thumb--t-pricing { background: linear-gradient(180deg, #1a1f14, #131509); }
.pages-panel .pg-row__thumb--t-ext     { background: linear-gradient(135deg, #222, #111); }
.pages-panel .pg-row__thumb-ghost {
  position: absolute;
  top: 4px;
  left: 4px;
  right: 4px;
  height: 2px;
  background: rgba(255,255,255,0.25);
  border-radius: 1px;
}
.pages-panel .pg-row__thumb-ghost + .pg-row__thumb-ghost {
  top: 9px;
  width: 70%;
  background: rgba(255,255,255,0.15);
}

/* Inline monospace slug next to page name */
.pages-panel .pg-row__slug {
  margin-left: 6px;
  font-family: "Geist Mono", ui-monospace, monospace;
  font-size: 10.5px;
  color: var(--aqb-text-muted, #908d85);
  font-weight: 400;
}

/* "Updated" time — right-aligned, tabular */
.pages-panel .pg-row__updated {
  flex-shrink: 0;
  min-width: 50px;
  text-align: right;
  font-size: 10.5px;
  color: var(--aqb-text-muted, #908d85);
  font-variant-numeric: tabular-nums;
}

/* Hide the "updated" label when the hover action mini-toolbar is visible so
   the row doesn't double-fill its right edge */
.pages-panel .pg-row:hover .pg-row__updated { opacity: 0.5; }
```

- [ ] **Step 2: Visual sanity**

Hard-refresh the editor. A page row should now show: `[grip][select][icon][thumb] Name /slug   2m ago   HOME Live`. Grip appears only on hover inside folders (where `draggable` is `true`). On ungrouped rows, grip stays hidden (consistent with the prototype's behavior where top-level pages are grip-hidden until we wire real reorder).

---

## Task 7: Commit row port

- [ ] **Step 1: Commit**

```bash
git add packages/editor/src/editor/sidebar/tabs/pages/components/PageRow.tsx \
        packages/editor/src/editor/sidebar/tabs/pages/utils/thumbnailKey.ts \
        packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css
git commit -m "feat(pages): Chunk 2 — row thumb, inline slug, updated time, drag grip"
```

---

## Task 8: Browser verification checklist

Manual, not automated. Run after dev server restart.

- [ ] Home row shows gradient thumb (blue-ish `t-hero`), inline `/` slug, "just now"/"2m ago", `HOME` pill, `Live` chip.
- [ ] Non-home row shows deterministic gradient thumb, inline `/about`, "Xh ago"/"Xd ago", `Live/Draft/Hidden/Password/External` chip.
- [ ] Hovering a row inside a folder shows the drag grip on the left.
- [ ] Hovering a row dims the `updated` label (hover-state polish) so the action buttons don't feel crowded.
- [ ] Truncation: a long page name ellipsizes while the slug/updated/chip stay right-pinned.
- [ ] External page shows `t-ext` gradient.
- [ ] Row without `updatedAt` (legacy) shows no "updated" span — no empty-box gap.
- [ ] Nothing above the row (sidebar header, search bar, add-page CTA) visibly moved.

---

## Self-review

- **Spec coverage:** ✅ grip, thumb, inline slug, updated time, status chip (unchanged — already Chunk 1 dot-chip). Deferred items explicitly listed in "Out of scope".
- **Placeholder scan:** no TODOs, no "fill in", no "similar to". Every step has code or exact command.
- **Type consistency:** `updatedAt?: string` added in Task 1, consumed in Task 2 (usePages map), read in Task 5 via `relativeTime(page.updatedAt)`. `ThumbClass` type is defined and used.
- **Data shape:** verified `PageData.updatedAt` exists (project.ts:108-109, ISO8601) and is populated (`PageManager.test.ts:115`).
