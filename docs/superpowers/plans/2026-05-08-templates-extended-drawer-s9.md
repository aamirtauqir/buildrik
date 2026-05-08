# Templates Extended Drawer (S9) — Implementation Plan

**Date:** 2026-05-08
**Source:** `~/.gstack/projects/aamirtauqir-buildrik/designs/sidebar-templates-media-engine-20260507/prototype-v3.html` §9
**CEO plan ref:** P6 (where-used) + P9 (versions placeholder)
**Goal:** Show "Used in / Versions" tabs in template detail panel — visible feature win that builds the P6 foundation reused later by §21 replace-across.

**Architecture:**
- Engine surface: extend `TemplateManager` with `getUsageMap()` aggregator + emit `template:applied` / `template:removed` on apply/detach paths
- Editor surface: `useTemplateUsageMap` hook (mirrors `useUsageMap` for media)
- UI: `TemplateUsageDrawer.tsx` with two tabs — "Used in" (live) + "Versions" (P9 placeholder)

**Tech stack:** React 18, vibcoder Modal/Tabs primitives, TestingLibrary + vitest.

---

## Inventory (verified 2026-05-08)

- `PageMeta.appliedTemplates?: Array<{templateId, version?, appliedAt}>` — exists at `shared/types/project.ts:111`
- `PageManager.recordAppliedTemplate()` — writes appliedTemplates stack, caps at 25, emits `PROJECT_CHANGED` subtype `page:updated`
- `EVENTS.TEMPLATE_APPLIED` / `EVENTS.TEMPLATE_REMOVED` declared in `shared/constants/events.ts:165-166` but **never emitted** — Task 2 fixes this
- `EVENTS.PAGE_TEMPLATE_ATTACHED` / `PAGE_TEMPLATE_DETACHED` declared with payloads at line 750-751 but never emitted
- `useUsageMap` for media at `editor/sidebar/tabs/media/hooks/useUsageMap.ts` — clean reference pattern (93 LOC, useState tick + useRef map + 3-event invalidation)
- `TemplateDetail.tsx` (112 LOC) is the inline detail panel inside TemplatesTab — drawer is a SIBLING surface (extended drawer per §9 wireframe), not a replacement
- `TemplateManager` at `engine/templates/TemplateManager.ts` (476 LOC) — has loadTemplate, applyTemplate paths but no usage aggregator yet
- `TemplatesTab.tsx:54-61` already reads `active.meta?.appliedTemplates` to hydrate appliedId — pattern to follow

---

## File Structure

**Create:**
- `packages/editor/src/editor/sidebar/tabs/templates/hooks/useTemplateUsageMap.ts` — hook
- `packages/editor/src/editor/sidebar/tabs/templates/hooks/__tests__/useTemplateUsageMap.test.ts` — hook tests
- `packages/editor/src/editor/sidebar/tabs/templates/components/TemplateUsageDrawer.tsx` — drawer
- `packages/editor/src/editor/sidebar/tabs/templates/components/__tests__/TemplateUsageDrawer.test.tsx` — drawer tests

**Modify:**
- `packages/editor/src/engine/templates/TemplateManager.ts` — add `getUsageMap()` + emit events on apply/detach
- `packages/editor/src/editor/sidebar/tabs/templates/components/TemplateDetail.tsx` — add "Used in" footer link that opens drawer

---

## Task 1: Engine — TemplateManager.getUsageMap()

**Files:**
- Modify: `packages/editor/src/engine/templates/TemplateManager.ts`

- [ ] **Step 1: Add getUsageMap() returning Map<templateId, pageEntry[]>**

```ts
// Inside TemplateManager class, after applyTemplate methods.
/**
 * Aggregate which pages have which templates applied.
 *
 * Source of truth: page.meta.appliedTemplates (Phase -1). Returns a map
 * keyed by templateId, valued by an array of (pageId, pageName, appliedAt,
 * version). Latest application of a templateId on a page wins (entries are
 * de-duped per template+page).
 *
 * O(N pages × M apply records). Apply count is capped at 25/page so this
 * stays cheap.
 */
getUsageMap(): Map<string, ReadonlyArray<TemplateUsageEntry>> {
  const map = new Map<string, TemplateUsageEntry[]>();
  const pages = this.ctx.pages.getAllPages();
  for (const page of pages) {
    const stack = page.meta?.appliedTemplates ?? [];
    // Track which templateIds we've already recorded on THIS page so the
    // first occurrence wins per page (one row per page per template).
    const seenOnPage = new Set<string>();
    for (const entry of stack) {
      if (seenOnPage.has(entry.templateId)) continue;
      seenOnPage.add(entry.templateId);
      const list = map.get(entry.templateId) ?? [];
      list.push({
        pageId: page.id,
        pageName: page.name ?? "(untitled)",
        appliedAt: entry.appliedAt,
        version: entry.version,
      });
      map.set(entry.templateId, list);
    }
  }
  return map;
}
```

Add type at top of file:

```ts
export interface TemplateUsageEntry {
  pageId: string;
  pageName: string;
  appliedAt: string;
  version?: string;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep -E "TemplateManager"`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add packages/editor/src/engine/templates/TemplateManager.ts
git commit -m "feat(templates-s9): TemplateManager.getUsageMap() aggregates applied templates per page"
```

---

## Task 2: Engine — emit TEMPLATE_APPLIED + TEMPLATE_REMOVED events

**Files:**
- Modify: `packages/editor/src/engine/elements/manager/PageManager.ts` (recordAppliedTemplate)
- Find + modify: any detachTemplate path that clears appliedTemplates

- [ ] **Step 1: Locate the apply path that calls recordAppliedTemplate**

Run: `grep -rn 'recordAppliedTemplate' packages/editor/src/`
Expected: TemplatesTab.tsx + PageManager.ts

- [ ] **Step 2: Emit TEMPLATE_APPLIED inside recordAppliedTemplate after persistence**

Edit `PageManager.ts:191`:

```ts
// existing line:
this.updatePage(pageId, { meta: { appliedTemplates: stack } });
// add:
this.ctx.composer.emit(EVENTS.TEMPLATE_APPLIED, {
  templateId: entry.templateId,
  pageId,
  version: entry.version,
});
```

- [ ] **Step 3: Locate template removal path (if exists). If not, skip remove emission until §21 lands.**

Run: `grep -rn 'meta.appliedTemplates =\|removeAppliedTemplate' packages/editor/src/`

If no detach path exists, add a stub method on PageManager:

```ts
/** Remove the most recent application of templateId from this page's meta stack. */
removeAppliedTemplate(pageId: string, templateId: string): void {
  const page = this.ctx.pages.get(pageId);
  if (!page) return;
  const stack = (page.meta?.appliedTemplates ?? []).slice();
  for (let i = stack.length - 1; i >= 0; i--) {
    if (stack[i].templateId === templateId) {
      stack.splice(i, 1);
      break;
    }
  }
  this.updatePage(pageId, { meta: { appliedTemplates: stack } });
  this.ctx.composer.emit(EVENTS.TEMPLATE_REMOVED, { templateId, pageId });
}
```

- [ ] **Step 4: TSC + commit**

```bash
npx tsc --noEmit 2>&1 | grep -E "PageManager"
git add packages/editor/src/engine/elements/manager/PageManager.ts
git commit -m "feat(templates-s9): emit TEMPLATE_APPLIED/REMOVED + add removeAppliedTemplate"
```

---

## Task 3: Hook — useTemplateUsageMap

**Files:**
- Create: `packages/editor/src/editor/sidebar/tabs/templates/hooks/useTemplateUsageMap.ts`
- Test: `packages/editor/src/editor/sidebar/tabs/templates/hooks/__tests__/useTemplateUsageMap.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useTemplateUsageMap } from "../useTemplateUsageMap";
import { EVENTS } from "../../../../../../shared/constants/events";

function makeFakeComposer(usage = new Map<string, any[]>()) {
  const listeners = new Map<string, Function[]>();
  return {
    on: vi.fn((evt: string, cb: Function) => {
      const arr = listeners.get(evt) ?? [];
      arr.push(cb);
      listeners.set(evt, arr);
    }),
    off: vi.fn((evt: string, cb: Function) => {
      const arr = listeners.get(evt) ?? [];
      listeners.set(evt, arr.filter((x) => x !== cb));
    }),
    emit: (evt: string, payload?: unknown) => {
      (listeners.get(evt) ?? []).forEach((c) => c(payload));
    },
    templates: { getUsageMap: vi.fn(() => usage) },
  };
}

describe("useTemplateUsageMap", () => {
  it("returns empty map when composer is null", () => {
    const { result } = renderHook(() => useTemplateUsageMap(null));
    expect(result.current.has("t1")).toBe(false);
    expect(result.current.get("t1")).toEqual([]);
  });

  it("builds map on mount via composer.templates.getUsageMap()", () => {
    const usage = new Map([["t1", [{ pageId: "p1", pageName: "Home", appliedAt: "2026-05-08" }]]]);
    const composer = makeFakeComposer(usage);
    const { result } = renderHook(() => useTemplateUsageMap(composer as any));
    expect(result.current.has("t1")).toBe(true);
    expect(result.current.get("t1")).toHaveLength(1);
  });

  it("invalidates on TEMPLATE_APPLIED", () => {
    const initial = new Map<string, any[]>();
    const after = new Map([["t1", [{ pageId: "p1", pageName: "Home", appliedAt: "2026-05-08" }]]]);
    let usage = initial;
    const composer = makeFakeComposer();
    composer.templates.getUsageMap = vi.fn(() => usage);
    const { result } = renderHook(() => useTemplateUsageMap(composer as any));
    expect(result.current.has("t1")).toBe(false);
    usage = after;
    act(() => composer.emit(EVENTS.TEMPLATE_APPLIED, { templateId: "t1", pageId: "p1" }));
    expect(result.current.has("t1")).toBe(true);
  });

  it("subscribes/unsubscribes correctly", () => {
    const composer = makeFakeComposer();
    const { unmount } = renderHook(() => useTemplateUsageMap(composer as any));
    expect(composer.on).toHaveBeenCalledWith(EVENTS.TEMPLATE_APPLIED, expect.any(Function));
    expect(composer.on).toHaveBeenCalledWith(EVENTS.TEMPLATE_REMOVED, expect.any(Function));
    expect(composer.on).toHaveBeenCalledWith(EVENTS.PAGE_CREATED, expect.any(Function));
    unmount();
    expect(composer.off).toHaveBeenCalledWith(EVENTS.TEMPLATE_APPLIED, expect.any(Function));
  });
});
```

- [ ] **Step 2: Run test to verify FAIL**

Run: `npx vitest run src/editor/sidebar/tabs/templates/hooks/__tests__/useTemplateUsageMap.test.ts`
Expected: 4 tests fail with module-not-found

- [ ] **Step 3: Implement hook**

```ts
import { useEffect, useMemo, useRef, useState } from "react";
import type { Composer } from "../../../../../engine/Composer";
import type { TemplateUsageEntry } from "../../../../../engine/templates/TemplateManager";
import { EVENTS } from "../../../../../shared/constants/events";

export interface TemplateUsageMap {
  get(templateId: string): ReadonlyArray<TemplateUsageEntry>;
  has(templateId: string): boolean;
  readonly raw: ReadonlyMap<string, ReadonlyArray<TemplateUsageEntry>>;
}

const EMPTY_LIST: ReadonlyArray<TemplateUsageEntry> = [];

export function useTemplateUsageMap(composer: Composer | null): TemplateUsageMap {
  const [tick, setTick] = useState(0);
  const mapRef = useRef<ReadonlyMap<string, ReadonlyArray<TemplateUsageEntry>>>(new Map());

  useEffect(() => {
    if (!composer) {
      mapRef.current = new Map();
      return;
    }
    const rebuild = () => {
      mapRef.current = composer.templates.getUsageMap();
      setTick((t) => t + 1);
    };
    rebuild();
    composer.on(EVENTS.TEMPLATE_APPLIED, rebuild);
    composer.on(EVENTS.TEMPLATE_REMOVED, rebuild);
    composer.on(EVENTS.PAGE_CREATED, rebuild);
    composer.on(EVENTS.PROJECT_CHANGED, rebuild); // catches page:deleted + page:updated
    return () => {
      composer.off(EVENTS.TEMPLATE_APPLIED, rebuild);
      composer.off(EVENTS.TEMPLATE_REMOVED, rebuild);
      composer.off(EVENTS.PAGE_CREATED, rebuild);
      composer.off(EVENTS.PROJECT_CHANGED, rebuild);
    };
  }, [composer]);

  return useMemo<TemplateUsageMap>(() => {
    const map = mapRef.current;
    return {
      get: (id: string) => map.get(id) ?? EMPTY_LIST,
      has: (id: string) => map.has(id),
      raw: map,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);
}
```

- [ ] **Step 4: Run test PASS**

```bash
npx vitest run src/editor/sidebar/tabs/templates/hooks/__tests__/useTemplateUsageMap.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/editor/sidebar/tabs/templates/hooks/useTemplateUsageMap.ts packages/editor/src/editor/sidebar/tabs/templates/hooks/__tests__/useTemplateUsageMap.test.ts
git commit -m "feat(templates-s9): useTemplateUsageMap hook + 4 path-scoped tests"
```

---

## Task 4: UI — TemplateUsageDrawer

**Files:**
- Create: `packages/editor/src/editor/sidebar/tabs/templates/components/TemplateUsageDrawer.tsx`
- Test: `packages/editor/src/editor/sidebar/tabs/templates/components/__tests__/TemplateUsageDrawer.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { TemplateUsageDrawer } from "../TemplateUsageDrawer";

const sampleUsage = [
  { pageId: "p1", pageName: "Home", appliedAt: "2026-05-08T10:00:00Z" },
  { pageId: "p2", pageName: "About", appliedAt: "2026-05-07T09:00:00Z", version: "1.2.0" },
];

describe("TemplateUsageDrawer", () => {
  it("renders nothing when not open", () => {
    const { container } = render(
      <TemplateUsageDrawer open={false} onOpenChange={() => {}} templateId="t1" templateName="Hero" usage={[]} />
    );
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it("shows 'Used in' tab by default with the usage list", () => {
    const { getByText } = render(
      <TemplateUsageDrawer open onOpenChange={() => {}} templateId="t1" templateName="Hero" usage={sampleUsage} />
    );
    expect(getByText("Used in")).toBeTruthy();
    expect(getByText("Home")).toBeTruthy();
    expect(getByText("About")).toBeTruthy();
  });

  it("shows version chip when a usage has a version", () => {
    const { getByText } = render(
      <TemplateUsageDrawer open onOpenChange={() => {}} templateId="t1" templateName="Hero" usage={sampleUsage} />
    );
    expect(getByText(/1\.2\.0/)).toBeTruthy();
  });

  it("shows empty state when usage list is empty", () => {
    const { getByText } = render(
      <TemplateUsageDrawer open onOpenChange={() => {}} templateId="t1" templateName="Hero" usage={[]} />
    );
    expect(getByText(/not applied to any page/i)).toBeTruthy();
  });

  it("clicking a page row calls onJumpToPage with pageId", () => {
    const onJumpToPage = vi.fn();
    const { getByText } = render(
      <TemplateUsageDrawer
        open
        onOpenChange={() => {}}
        templateId="t1"
        templateName="Hero"
        usage={sampleUsage}
        onJumpToPage={onJumpToPage}
      />
    );
    fireEvent.click(getByText("Home"));
    expect(onJumpToPage).toHaveBeenCalledWith("p1");
  });

  it("Versions tab renders the P9-pending placeholder", () => {
    const { getByText } = render(
      <TemplateUsageDrawer open onOpenChange={() => {}} templateId="t1" templateName="Hero" usage={[]} />
    );
    fireEvent.click(getByText("Versions"));
    expect(getByText(/version pinning is coming/i)).toBeTruthy();
  });

  it("close button calls onOpenChange(false)", () => {
    const onOpenChange = vi.fn();
    const { getByLabelText } = render(
      <TemplateUsageDrawer open onOpenChange={onOpenChange} templateId="t1" templateName="Hero" usage={[]} />
    );
    fireEvent.click(getByLabelText(/close/i));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
```

- [ ] **Step 2: Run test FAIL** — module not found

- [ ] **Step 3: Implement drawer**

```tsx
import * as React from "react";
import { Modal, ModalContent, ModalTitle, ModalDescription } from "@/editor/shared/vibcoder";
import type { TemplateUsageEntry } from "../../../../../engine/templates/TemplateManager";

type Tab = "used" | "versions";

export interface TemplateUsageDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  templateName: string;
  usage: ReadonlyArray<TemplateUsageEntry>;
  /** Optional: jump to page when user clicks a usage row. */
  onJumpToPage?: (pageId: string) => void;
}

function formatRelative(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export const TemplateUsageDrawer: React.FC<TemplateUsageDrawerProps> = ({
  open,
  onOpenChange,
  templateId,
  templateName,
  usage,
  onJumpToPage,
}) => {
  const [tab, setTab] = React.useState<Tab>("used");

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="md" aria-labelledby={`tpl-usage-title-${templateId}`}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--bd-border, #e2e8f0)" }}>
          <ModalTitle id={`tpl-usage-title-${templateId}`} style={{ fontSize: 16, fontWeight: 600 }}>
            {templateName}
          </ModalTitle>
          <ModalDescription style={{ fontSize: 12, color: "var(--bd-fg-muted, #64748b)", marginTop: 2 }}>
            Where this template is in use across pages
          </ModalDescription>
        </div>

        <div role="tablist" aria-label="Drawer sections" style={{ display: "flex", gap: 4, padding: "8px 12px", borderBottom: "1px solid var(--bd-border, #e2e8f0)" }}>
          {(["used", "versions"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              style={{
                all: "unset",
                cursor: "pointer",
                padding: "6px 12px",
                borderRadius: 4,
                fontSize: 13,
                fontWeight: tab === t ? 600 : 500,
                color: tab === t ? "var(--bd-fg, #0f172a)" : "var(--bd-fg-muted, #64748b)",
                borderBottom: tab === t ? "2px solid var(--bd-accent, #2D6DFF)" : "2px solid transparent",
              }}
            >
              {t === "used" ? "Used in" : "Versions"}
            </button>
          ))}
        </div>

        <div role="tabpanel" style={{ padding: "16px 24px", maxHeight: 360, overflow: "auto" }}>
          {tab === "used" && (
            usage.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--bd-fg-muted, #64748b)", padding: "32px 0", textAlign: "center" }}>
                Not applied to any page yet
              </div>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                {usage.map((entry) => (
                  <li key={entry.pageId}>
                    <button
                      type="button"
                      onClick={() => onJumpToPage?.(entry.pageId)}
                      disabled={!onJumpToPage}
                      style={{
                        all: "unset",
                        cursor: onJumpToPage ? "pointer" : "default",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 4,
                        fontSize: 13,
                        color: "var(--bd-fg, #0f172a)",
                      }}
                    >
                      <span style={{ flex: 1 }}>{entry.pageName}</span>
                      {entry.version && (
                        <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 3, background: "var(--bd-bg-subtle, #f1f5f9)", color: "var(--bd-fg-muted, #64748b)" }}>
                          v{entry.version}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: "var(--bd-fg-muted, #64748b)" }}>
                        {formatRelative(entry.appliedAt)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )
          )}

          {tab === "versions" && (
            <div style={{ fontSize: 13, color: "var(--bd-fg-muted, #64748b)", padding: "32px 0", textAlign: "center" }}>
              Version pinning is coming in a follow-up release.
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 24px", borderTop: "1px solid var(--bd-border, #e2e8f0)" }}>
          <button
            type="button"
            aria-label="Close drawer"
            onClick={() => onOpenChange(false)}
            className="bd-btn bd-btn--ghost"
          >
            Close
          </button>
        </div>
      </ModalContent>
    </Modal>
  );
};
```

- [ ] **Step 4: Run test PASS**

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/editor/sidebar/tabs/templates/components/TemplateUsageDrawer.tsx packages/editor/src/editor/sidebar/tabs/templates/components/__tests__/TemplateUsageDrawer.test.tsx
git commit -m "feat(templates-s9): TemplateUsageDrawer (Used in + Versions tabs) + 7 path-scoped tests"
```

---

## Task 5: Wire TemplateDetail → drawer trigger

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/templates/components/TemplateDetail.tsx`
- Modify: `packages/editor/src/editor/sidebar/tabs/templates/TemplatesTab.tsx` — open drawer on demand

- [ ] **Step 1: Add "Used in N pages" link to TemplateDetail when usage > 0**

Read existing TemplateDetail.tsx, add an optional `usageCount: number` prop + `onShowUsage: () => void` prop, render a "Used in N pages →" affordance.

- [ ] **Step 2: TemplatesTab plumbs useTemplateUsageMap → TemplateDetail**

In TemplatesTab.tsx:
- import useTemplateUsageMap
- get usageMap = useTemplateUsageMap(composer)
- pass usageCount = usageMap.get(detailTemplate.id).length to TemplateDetail
- maintain `usageDrawerOpen` state + render <TemplateUsageDrawer> at panel root
- pass `onShowUsage = () => setUsageDrawerOpen(true)` to TemplateDetail
- onJumpToPage prop on drawer: use composer.pages.setActivePage(pageId) + close drawer

- [ ] **Step 3: TSC check + smoke run full templates suite**

```bash
npx tsc --noEmit 2>&1 | grep -E "templates" | head -10
npx vitest run src/editor/sidebar/tabs/templates/
```

- [ ] **Step 4: Commit**

```bash
git add packages/editor/src/editor/sidebar/tabs/templates/components/TemplateDetail.tsx packages/editor/src/editor/sidebar/tabs/templates/TemplatesTab.tsx
git commit -m "feat(templates-s9): wire TemplateDetail 'Used in N pages' link → TemplateUsageDrawer"
```

---

## Task 6: Tag + memory

- [ ] Tag local: `git tag s9-templates-extended-drawer-complete`
- [ ] Update MEMORY.md with project entry: shipped commits + open items (P9 versions placeholder, onJumpToPage wiring)

---

## Self-review checklist

- ☐ Spec coverage: §9 wireframe — Used in tab ✓ + Versions tab placeholder ✓
- ☐ No placeholders: every code block above is concrete
- ☐ Type consistency: `TemplateUsageEntry` shape matches between engine + hook + drawer
- ☐ TDD discipline: tests written before each implementation
- ☐ Commit boundaries: 6 commits, each independently green
- ☐ Memory rule applied: explicit path-scoped staging per `feedback_no_stash`
