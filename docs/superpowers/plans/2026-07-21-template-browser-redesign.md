# Template Browser Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/dashboard/templates` into a full-width Envato-style template browser (left filter rail + grid + numbered pagination) whose cards deep-link to a new full-page `/dashboard/templates/[id]` detail with a back button and Use→clone→editor.

**Architecture:** The browser and detail are two full-width routes (sidebar hidden, like Marketplace) added to the existing `FULL_WIDTH_ROUTES` predicate. All list/get/use data comes from the existing `templates` tRPC router unchanged; the only backend change is adding a `difficulty` filter that the model already carries. Filter state lives in the URL query string via a pure, unit-tested mapper.

**Tech Stack:** Next.js 16 App Router (client components), React 19, tRPC 11, Tailwind 4, Zod, Prisma 5, Vitest + @testing-library/react.

## Global Constraints

- Single accent color `#406ED6` (`var(--color-primary)`); purple/violet/indigo banned.
- Data flow is Page → tRPC → Router → Service → Prisma. Pages never import services.
- Validation schemas live only in `packages/shared/schemas/`.
- No fabricated filters — only data-backed Category / Difficulty / Sort / Search.
- Files `kebab-case`; components `PascalCase`; functions `camelCase`.
- Path aliases only: `@/`, `@server/`, `@lib/`, `@buildrik/shared`. No `../../`.
- Commit after every task. Solo workflow: commit to `main`.
- Difficulty values are exactly `BEGINNER | INTERMEDIATE | ADVANCED` (plus `ALL` for the filter).
- Category values are exactly `ALL | PORTFOLIO | BUSINESS | BLOG | AGENCY | ECOMMERCE | RESTAURANT`.
- Sort values are exactly `popular | newest | alphabetical`.

---

### Task 1: Difficulty filter (schema + service)

**Files:**
- Modify: `packages/shared/schemas/templates.ts:3-10` (add `difficulty` to `listTemplatesSchema`)
- Modify: `server/services/template.service.ts:38-46` (`listTemplates`: destructure + `where.difficulty`)
- Test: `server/services/__tests__/template-clone.test.ts` (append difficulty tests — this file already mocks `@/lib/prisma` and exercises `listTemplates`)

**Interfaces:**
- Consumes: existing `listTemplates(input, workspaceId?)`.
- Produces: `listTemplatesSchema` now includes `difficulty: "ALL" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED"` (default `"ALL"`); when not `"ALL"`, `listTemplates` adds `where.difficulty = <value>`.

- [ ] **Step 1: Write the failing tests** (append to `server/services/__tests__/template-clone.test.ts`, inside the existing `describe` for listTemplates, or a new `describe` block at the end of the file):

```ts
describe("listTemplates difficulty filter", () => {
  beforeEach(() => {
    tplFindMany.mockReset();
    tplCount.mockReset();
    tplFindMany.mockResolvedValue([]);
    tplCount.mockResolvedValue(0);
  });

  it("adds where.difficulty when a specific level is requested", async () => {
    await listTemplates(
      { category: "ALL", page: 1, perPage: 6, sort: "popular", difficulty: "ADVANCED" },
      undefined
    );
    const where = tplFindMany.mock.calls[0][0].where;
    expect(where.difficulty).toBe("ADVANCED");
  });

  it("omits difficulty from where when ALL", async () => {
    await listTemplates(
      { category: "ALL", page: 1, perPage: 6, sort: "popular", difficulty: "ALL" },
      undefined
    );
    const where = tplFindMany.mock.calls[0][0].where;
    expect(where.difficulty).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd /Users/shahg/Desktop/pencil/buildrik && npx vitest run server/services/__tests__/template-clone.test.ts`
Expected: FAIL — the second call's `where.difficulty` is `undefined` in both cases (filter not implemented), so the first test fails. (Types may also error because `difficulty` is not yet on the input type.)

- [ ] **Step 3: Add `difficulty` to the schema**

In `packages/shared/schemas/templates.ts`, inside `listTemplatesSchema` (after the `sort` line, before `search`):

```ts
export const listTemplatesSchema = z.object({
  category: z.enum(["ALL", "PORTFOLIO", "BUSINESS", "BLOG", "AGENCY", "ECOMMERCE", "RESTAURANT"]).default("ALL"),
  page: z.number().min(1).default(1),
  perPage: z.number().min(1).max(20).default(6),
  sort: z.enum(["popular", "newest", "alphabetical"]).default("popular"),
  difficulty: z.enum(["ALL", "BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("ALL"),
  search: z.string().max(100).optional(),
});
```

- [ ] **Step 4: Add the `where` clause in the service**

In `server/services/template.service.ts`, `listTemplates`, change the destructure and add the clause right after the category block:

```ts
const { category, page, perPage, sort, search, difficulty } = input;
```

Then after the existing `if (category !== "ALL") { where.category = category; }`:

```ts
if (difficulty !== "ALL") {
  where.difficulty = difficulty;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd /Users/shahg/Desktop/pencil/buildrik && npx vitest run server/services/__tests__/template-clone.test.ts`
Expected: PASS (all tests in the file, including the two new ones).

- [ ] **Step 6: Typecheck**

Run: `cd /Users/shahg/Desktop/pencil/buildrik && npx tsc --noEmit -p packages/dashboard/tsconfig.json`
Expected: no new errors.

- [ ] **Step 7: Commit**

```bash
git add packages/shared/schemas/templates.ts server/services/template.service.ts server/services/__tests__/template-clone.test.ts
git commit -m "feat(templates): add difficulty filter to template list"
```

---

### Task 2: Full-width routing for the templates browser + detail

**Files:**
- Modify: `packages/dashboard/components/dashboard/shell/nav.ts:64`
- Test: `packages/dashboard/components/dashboard/shell/__tests__/nav.test.ts`

**Interfaces:**
- Consumes: `FULL_WIDTH_ROUTES`, `isFullWidthRoute(pathname)`.
- Produces: `isFullWidthRoute("/dashboard/templates")` and `isFullWidthRoute("/dashboard/templates/<id>")` both return `true`; the sidebar hides and the topbar "Dashboard" link goes inactive on those routes.

- [ ] **Step 1: Write the failing test** (append inside the existing `isFullWidthRoute` describe in `nav.test.ts`):

```ts
it("treats the templates browser and detail as full-width", () => {
  expect(isFullWidthRoute("/dashboard/templates")).toBe(true);
  expect(isFullWidthRoute("/dashboard/templates/abc123")).toBe(true);
});

it("keeps other workspace pages non-full-width", () => {
  expect(isFullWidthRoute("/dashboard/projects")).toBe(false);
  expect(isFullWidthRoute("/dashboard/media")).toBe(false);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd /Users/shahg/Desktop/pencil/buildrik && npx vitest run packages/dashboard/components/dashboard/shell/__tests__/nav.test.ts`
Expected: FAIL — `isFullWidthRoute("/dashboard/templates")` is `false`.

- [ ] **Step 3: Add the route to `FULL_WIDTH_ROUTES`**

In `nav.ts`, change line 64:

```ts
const FULL_WIDTH_ROUTES = [...ECOSYSTEM_NAV.map((n) => n.href), "/dashboard/help", "/dashboard/templates"];
```

Update the comment above it (lines 59-63) to note templates is a sidebar entry that renders full-width:

```ts
// Every route that renders FULL-WIDTH with no workspace sidebar: the ecosystem
// tabs above, plus reference pages reached from them (Help) and the Templates
// browser. Templates is a *sidebar* entry that opens a full-width Envato-style
// browser — navigating to it collapses the sidebar, mirroring the ecosystem
// pages; its own "← Dashboard" control is the way back.
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd /Users/shahg/Desktop/pencil/buildrik && npx vitest run packages/dashboard/components/dashboard/shell/__tests__/nav.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/dashboard/components/dashboard/shell/nav.ts packages/dashboard/components/dashboard/shell/__tests__/nav.test.ts
git commit -m "feat(templates): render templates browser + detail full-width"
```

---

### Task 3: URL param ⇄ filter-state helper (pure)

**Files:**
- Create: `packages/dashboard/app/dashboard/templates/filters.ts`
- Test: `packages/dashboard/app/dashboard/templates/__tests__/filters.test.ts`

**Interfaces:**
- Produces:
  - `type TemplateFilters = { category: string; difficulty: string; sort: string; search: string; page: number }`
  - `const DEFAULT_TEMPLATE_FILTERS: TemplateFilters`
  - `templateFiltersFromParams(params: URLSearchParams): TemplateFilters`
  - `templateFiltersToQuery(f: TemplateFilters): string` (returns `""` or `"?..."`)
  - `const TEMPLATE_CATEGORY_OPTIONS`, `TEMPLATE_DIFFICULTY_OPTIONS`, `TEMPLATE_SORT_OPTIONS` (arrays of `{ value, label }`)

- [ ] **Step 1: Write the failing test**

```ts
// packages/dashboard/app/dashboard/templates/__tests__/filters.test.ts
import { describe, it, expect } from "vitest";
import {
  templateFiltersFromParams,
  templateFiltersToQuery,
  DEFAULT_TEMPLATE_FILTERS,
} from "../filters";

describe("templateFiltersFromParams", () => {
  it("returns defaults for empty params", () => {
    expect(templateFiltersFromParams(new URLSearchParams())).toEqual(DEFAULT_TEMPLATE_FILTERS);
  });

  it("reads valid values", () => {
    const f = templateFiltersFromParams(
      new URLSearchParams("category=BUSINESS&difficulty=ADVANCED&sort=newest&search=cafe&page=3")
    );
    expect(f).toEqual({ category: "BUSINESS", difficulty: "ADVANCED", sort: "newest", search: "cafe", page: 3 });
  });

  it("falls back on invalid enum values", () => {
    const f = templateFiltersFromParams(new URLSearchParams("category=NOPE&difficulty=X&sort=Y"));
    expect(f.category).toBe("ALL");
    expect(f.difficulty).toBe("ALL");
    expect(f.sort).toBe("popular");
  });

  it("clamps a bad page to 1", () => {
    expect(templateFiltersFromParams(new URLSearchParams("page=0")).page).toBe(1);
    expect(templateFiltersFromParams(new URLSearchParams("page=-4")).page).toBe(1);
    expect(templateFiltersFromParams(new URLSearchParams("page=abc")).page).toBe(1);
  });
});

describe("templateFiltersToQuery", () => {
  it("omits defaults", () => {
    expect(templateFiltersToQuery(DEFAULT_TEMPLATE_FILTERS)).toBe("");
  });

  it("serializes only non-defaults", () => {
    expect(
      templateFiltersToQuery({ category: "BLOG", difficulty: "ALL", sort: "popular", search: "  hi ", page: 2 })
    ).toBe("?category=BLOG&search=hi&page=2");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd /Users/shahg/Desktop/pencil/buildrik && npx vitest run packages/dashboard/app/dashboard/templates/__tests__/filters.test.ts`
Expected: FAIL — module `../filters` not found.

- [ ] **Step 3: Write the implementation**

```ts
// packages/dashboard/app/dashboard/templates/filters.ts
export type TemplateFilters = {
  category: string;
  difficulty: string;
  sort: string;
  search: string;
  page: number;
};

export const TEMPLATE_CATEGORY_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "PORTFOLIO", label: "Portfolio" },
  { value: "BUSINESS", label: "Business" },
  { value: "BLOG", label: "Blog" },
  { value: "AGENCY", label: "Agency" },
  { value: "ECOMMERCE", label: "E-commerce" },
  { value: "RESTAURANT", label: "Restaurant" },
] as const;

export const TEMPLATE_DIFFICULTY_OPTIONS = [
  { value: "ALL", label: "All levels" },
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
] as const;

export const TEMPLATE_SORT_OPTIONS = [
  { value: "popular", label: "Popular" },
  { value: "newest", label: "Newest" },
  { value: "alphabetical", label: "A–Z" },
] as const;

export const DEFAULT_TEMPLATE_FILTERS: TemplateFilters = {
  category: "ALL",
  difficulty: "ALL",
  sort: "popular",
  search: "",
  page: 1,
};

function pick(value: string | null, allowed: readonly string[], fallback: string): string {
  return value && allowed.includes(value) ? value : fallback;
}

export function templateFiltersFromParams(params: URLSearchParams): TemplateFilters {
  const pageRaw = Number(params.get("page"));
  const page = Number.isInteger(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
  return {
    category: pick(params.get("category"), TEMPLATE_CATEGORY_OPTIONS.map((o) => o.value), "ALL"),
    difficulty: pick(params.get("difficulty"), TEMPLATE_DIFFICULTY_OPTIONS.map((o) => o.value), "ALL"),
    sort: pick(params.get("sort"), TEMPLATE_SORT_OPTIONS.map((o) => o.value), "popular"),
    search: (params.get("search") ?? "").slice(0, 100),
    page,
  };
}

export function templateFiltersToQuery(f: TemplateFilters): string {
  const p = new URLSearchParams();
  if (f.category !== "ALL") p.set("category", f.category);
  if (f.difficulty !== "ALL") p.set("difficulty", f.difficulty);
  if (f.sort !== "popular") p.set("sort", f.sort);
  if (f.search.trim()) p.set("search", f.search.trim());
  if (f.page > 1) p.set("page", String(f.page));
  const s = p.toString();
  return s ? `?${s}` : "";
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd /Users/shahg/Desktop/pencil/buildrik && npx vitest run packages/dashboard/app/dashboard/templates/__tests__/filters.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/dashboard/app/dashboard/templates/filters.ts packages/dashboard/app/dashboard/templates/__tests__/filters.test.ts
git commit -m "feat(templates): add URL param <-> filter-state mapper"
```

---

### Task 4: TemplateFilterRail component

**Files:**
- Create: `packages/dashboard/components/templates/template-filter-rail.tsx`
- Test: `packages/dashboard/components/templates/__tests__/template-filter-rail.test.tsx`

**Interfaces:**
- Consumes: `TemplateFilters`, and the option arrays from Task 3.
- Produces: `TemplateFilterRail({ filters, onChange })` where `onChange: (patch: Partial<TemplateFilters>) => void`. Selecting any Category/Difficulty/Sort option calls `onChange` with that field AND `page: 1`.

- [ ] **Step 1: Write the failing test**

```tsx
// packages/dashboard/components/templates/__tests__/template-filter-rail.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TemplateFilterRail } from "../template-filter-rail";
import { DEFAULT_TEMPLATE_FILTERS } from "@/app/dashboard/templates/filters";

describe("TemplateFilterRail", () => {
  it("renders all category options", () => {
    render(<TemplateFilterRail filters={DEFAULT_TEMPLATE_FILTERS} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Portfolio" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Restaurant" })).toBeTruthy();
  });

  it("emits the field and resets page to 1 on select", () => {
    const onChange = vi.fn();
    render(<TemplateFilterRail filters={{ ...DEFAULT_TEMPLATE_FILTERS, page: 4 }} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Business" }));
    expect(onChange).toHaveBeenCalledWith({ category: "BUSINESS", page: 1 });
  });

  it("emits difficulty selection", () => {
    const onChange = vi.fn();
    render(<TemplateFilterRail filters={DEFAULT_TEMPLATE_FILTERS} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Advanced" }));
    expect(onChange).toHaveBeenCalledWith({ difficulty: "ADVANCED", page: 1 });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd /Users/shahg/Desktop/pencil/buildrik && npx vitest run packages/dashboard/components/templates/__tests__/template-filter-rail.test.tsx`
Expected: FAIL — module `../template-filter-rail` not found.

- [ ] **Step 3: Write the component**

```tsx
// packages/dashboard/components/templates/template-filter-rail.tsx
"use client";

import { cn } from "@lib/utils";
import {
  type TemplateFilters,
  TEMPLATE_CATEGORY_OPTIONS,
  TEMPLATE_DIFFICULTY_OPTIONS,
  TEMPLATE_SORT_OPTIONS,
} from "@/app/dashboard/templates/filters";

type Props = {
  filters: TemplateFilters;
  onChange: (patch: Partial<TemplateFilters>) => void;
};

function Section({
  title,
  options,
  active,
  onPick,
}: {
  title: string;
  options: readonly { value: string; label: string }[];
  active: string;
  onPick: (value: string) => void;
}) {
  return (
    <div className="mb-6">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.11em]" style={{ color: "var(--color-text-muted)" }}>
        {title}
      </p>
      <div className="flex flex-col gap-0.5">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onPick(o.value)}
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-left text-[13px] font-medium transition-colors",
              active === o.value ? "bg-[var(--color-primary-subtle)]" : "hover:bg-[var(--color-bg-subtle)]"
            )}
            style={{ color: active === o.value ? "var(--color-primary)" : "var(--color-text-secondary)" }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TemplateFilterRail({ filters, onChange }: Props) {
  return (
    <aside className="w-[220px] shrink-0">
      <Section
        title="Category"
        options={TEMPLATE_CATEGORY_OPTIONS}
        active={filters.category}
        onPick={(value) => onChange({ category: value, page: 1 })}
      />
      <Section
        title="Difficulty"
        options={TEMPLATE_DIFFICULTY_OPTIONS}
        active={filters.difficulty}
        onPick={(value) => onChange({ difficulty: value, page: 1 })}
      />
      <Section
        title="Sort by"
        options={TEMPLATE_SORT_OPTIONS}
        active={filters.sort}
        onPick={(value) => onChange({ sort: value, page: 1 })}
      />
    </aside>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd /Users/shahg/Desktop/pencil/buildrik && npx vitest run packages/dashboard/components/templates/__tests__/template-filter-rail.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/dashboard/components/templates/template-filter-rail.tsx packages/dashboard/components/templates/__tests__/template-filter-rail.test.tsx
git commit -m "feat(templates): add filter rail component"
```

---

### Task 5: Pagination range helper + browser page rewrite

**Files:**
- Create: `packages/dashboard/components/templates/pagination-range.ts`
- Test: `packages/dashboard/components/templates/__tests__/pagination-range.test.ts`
- Modify (full rewrite): `packages/dashboard/app/dashboard/templates/page.tsx`

**Interfaces:**
- Consumes: `TemplateFilters`, `templateFiltersFromParams`, `templateFiltersToQuery` (Task 3); `TemplateFilterRail` (Task 4); `trpc.templates.list` (Task 1 schema).
- Produces: `paginationRange(current: number, total: number): (number | "…")[]`. The page reads filters from the URL, renders the rail + a responsive grid of `<Link>` cards to `/dashboard/templates/<id>`, a search box, and numbered pagination; every filter change calls `router.replace(pathname + templateFiltersToQuery(next))`.

- [ ] **Step 1: Write the failing test for `paginationRange`**

```ts
// packages/dashboard/components/templates/__tests__/pagination-range.test.ts
import { describe, it, expect } from "vitest";
import { paginationRange } from "../pagination-range";

describe("paginationRange", () => {
  it("lists every page when total is small", () => {
    expect(paginationRange(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("caps with ellipses in the middle", () => {
    expect(paginationRange(6, 12)).toEqual([1, "…", 5, 6, 7, "…", 12]);
  });

  it("does not add a left ellipsis near the start", () => {
    expect(paginationRange(2, 12)).toEqual([1, 2, 3, "…", 12]);
  });

  it("does not add a right ellipsis near the end", () => {
    expect(paginationRange(11, 12)).toEqual([1, "…", 10, 11, 12]);
  });

  it("returns [1] for a single page", () => {
    expect(paginationRange(1, 1)).toEqual([1]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd /Users/shahg/Desktop/pencil/buildrik && npx vitest run packages/dashboard/components/templates/__tests__/pagination-range.test.ts`
Expected: FAIL — module `../pagination-range` not found.

- [ ] **Step 3: Implement `paginationRange`**

```ts
// packages/dashboard/components/templates/pagination-range.ts
/** Envato-style page list: first, last, current ±1, ellipses for gaps. */
export function paginationRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push("…");
  for (let p = start; p <= end; p++) out.push(p);
  if (end < total - 1) out.push("…");
  out.push(total);
  return out;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd /Users/shahg/Desktop/pencil/buildrik && npx vitest run packages/dashboard/components/templates/__tests__/pagination-range.test.ts`
Expected: PASS.

- [ ] **Step 5: Rewrite the browser page**

Replace the entire contents of `packages/dashboard/app/dashboard/templates/page.tsx`:

```tsx
"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Globe, Search } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { cn } from "@lib/utils";
import { LoadingSkeleton, ErrorState, StateEmpty } from "@/components/states";
import { TemplateFilterRail } from "@/components/templates/template-filter-rail";
import { paginationRange } from "@/components/templates/pagination-range";
import {
  type TemplateFilters,
  templateFiltersFromParams,
  templateFiltersToQuery,
} from "./filters";

const PER_PAGE = 12;

const DIFFICULTY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  BEGINNER: { bg: "#DCFCE7", text: "#166534", label: "Beginner" },
  INTERMEDIATE: { bg: "#DBEAFE", text: "#1E40AF", label: "Intermediate" },
  ADVANCED: { bg: "#FEF3C7", text: "#92400E", label: "Advanced" },
};

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

export default function TemplatesBrowserPage() {
  return (
    <Suspense fallback={null}>
      <TemplatesBrowserInner />
    </Suspense>
  );
}

function TemplatesBrowserInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo<TemplateFilters>(
    () => templateFiltersFromParams(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  function applyFilters(patch: Partial<TemplateFilters>) {
    const next = { ...filters, ...patch };
    router.replace(pathname + templateFiltersToQuery(next), { scroll: false });
  }

  const list = trpc.templates.list.useQuery(
    {
      category: filters.category as "ALL" | "PORTFOLIO" | "BUSINESS" | "BLOG" | "AGENCY" | "ECOMMERCE" | "RESTAURANT",
      difficulty: filters.difficulty as "ALL" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
      sort: filters.sort as "popular" | "newest" | "alphabetical",
      search: filters.search || undefined,
      page: filters.page,
      perPage: PER_PAGE,
    },
    { staleTime: 30_000 }
  );

  const items = list.data?.data ?? [];
  const totalPages = list.data?.totalPages ?? 0;
  const pages = paginationRange(filters.page, totalPages);

  return (
    <div className="mx-auto max-w-[1180px] px-6 py-6">
      {/* Top row */}
      <div className="mb-5 flex items-center gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-[13px] font-medium transition-colors hover:text-[var(--color-text-primary)]"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <h1 className="text-[19px] font-[680] tracking-tight" style={{ color: "var(--color-text-primary)" }}>
          Templates
        </h1>
        <div className="ml-auto flex h-9 w-[280px] items-center gap-2 rounded-lg border px-3"
          style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}>
          <Search className="h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
          <input
            value={filters.search}
            onChange={(e) => applyFilters({ search: e.target.value, page: 1 })}
            placeholder="Search templates…"
            className="w-full bg-transparent text-[13px] outline-none"
            style={{ color: "var(--color-text-primary)" }}
          />
        </div>
      </div>

      <div className="flex gap-8">
        <TemplateFilterRail filters={filters} onChange={applyFilters} />

        <div className="flex-1">
          {list.isLoading ? (
            <LoadingSkeleton rows={3} variant="card" />
          ) : list.isError ? (
            <ErrorState
              title="Couldn't load templates"
              description="Something went wrong on our end. Refresh to try again."
              onRetry={() => list.refetch()}
            />
          ) : items.length === 0 ? (
            <StateEmpty
              title="No templates match these filters"
              description="Try clearing a filter or searching for something else."
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((t) => {
                  const diff = DIFFICULTY_STYLES[t.difficulty] ?? DIFFICULTY_STYLES.BEGINNER;
                  return (
                    <Link
                      key={t.id}
                      href={`/dashboard/templates/${t.id}`}
                      className="group overflow-hidden rounded-xl border shadow-card transition-shadow hover:shadow-md"
                      style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}
                    >
                      <div className="flex h-[172px] items-center justify-center" style={{ backgroundColor: "var(--color-bg-subtle)" }}>
                        <Globe className="h-9 w-9" style={{ color: "var(--color-text-muted)" }} />
                      </div>
                      <div className="px-3.5 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <h2 className="text-[13.5px] font-semibold" style={{ color: "var(--color-text-primary)" }}>{t.name}</h2>
                          <span className="shrink-0 text-body-sm font-semibold opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "var(--color-primary)" }}>
                            View →
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: "var(--color-bg-subtle)", color: "var(--color-text-secondary)" }}>
                            {t.category.toLowerCase()}
                          </span>
                          <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: diff.bg, color: diff.text }}>
                            {diff.label}
                          </span>
                          <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{formatCount(t.usageCount)} sites</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-1">
                  {pages.map((p, i) =>
                    p === "…" ? (
                      <span key={`gap-${i}`} className="px-2 text-[13px]" style={{ color: "var(--color-text-muted)" }}>…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => applyFilters({ page: p })}
                        className={cn(
                          "min-w-8 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                          p === filters.page ? "bg-[var(--color-primary)] text-white" : "hover:bg-[var(--color-bg-subtle)]"
                        )}
                        style={p === filters.page ? undefined : { color: "var(--color-text-secondary)" }}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

> Note: this rewrite drops the old "Templates | Libraries" tabs. Libraries had only an empty-state placeholder; folding it in here would clutter the browser. If Libraries must stay reachable, it becomes its own follow-up — out of scope for this plan. (Recorded here so the removal is a decision, not an accident.)

- [ ] **Step 6: Typecheck**

Run: `cd /Users/shahg/Desktop/pencil/buildrik && npx tsc --noEmit -p packages/dashboard/tsconfig.json`
Expected: no errors. (If `trpc.templates.list` input type errors on `difficulty`, Task 1 was not applied — fix Task 1 first.)

- [ ] **Step 7: Run the pagination test again + shell tests**

Run: `cd /Users/shahg/Desktop/pencil/buildrik && npx vitest run packages/dashboard/components/templates packages/dashboard/app/dashboard/templates`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/dashboard/components/templates/pagination-range.ts packages/dashboard/components/templates/__tests__/pagination-range.test.ts packages/dashboard/app/dashboard/templates/page.tsx
git commit -m "feat(templates): full-width Envato-style browser with filter rail + pagination"
```

---

### Task 6: Template detail page

**Files:**
- Create: `packages/dashboard/app/dashboard/templates/[id]/page.tsx`

**Interfaces:**
- Consumes: `trpc.templates.get({ id })`, `trpc.templates.use({ templateId, siteName })`; `getEditorHref`, `useUnifiedEditorFlag` from `@/components/editor-route/unified-flag`; `useToast` from `@/components/dashboard/toast-provider`; `LoadingSkeleton`, `ErrorState` from `@/components/states`.
- Produces: the route `/dashboard/templates/[id]`. "Use this template" sends `siteName = template.name`.

- [ ] **Step 1: Write the page**

```tsx
// packages/dashboard/app/dashboard/templates/[id]/page.tsx
"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Globe } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { LoadingSkeleton, ErrorState } from "@/components/states";
import { getEditorHref, useUnifiedEditorFlag } from "@/components/editor-route/unified-flag";

const DIFFICULTY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  BEGINNER: { bg: "#DCFCE7", text: "#166534", label: "Beginner" },
  INTERMEDIATE: { bg: "#DBEAFE", text: "#1E40AF", label: "Intermediate" },
  ADVANCED: { bg: "#FEF3C7", text: "#92400E", label: "Advanced" },
};

export default function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addToast } = useToast();
  const unified = useUnifiedEditorFlag();

  const query = trpc.templates.get.useQuery({ id }, { staleTime: 30_000 });

  const useMutation = trpc.templates.use.useMutation({
    onSuccess: (site) => {
      addToast("success", "Site created from template");
      const href = getEditorHref(site.id, unified);
      if (unified) router.push(href);
      else window.location.href = href;
    },
    onError: (err) => addToast("error", "Couldn't create site", err.message),
  });

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push("/dashboard/templates");
  }

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-6">
      <button
        onClick={goBack}
        className="mb-5 flex items-center gap-1.5 text-[13px] font-medium transition-colors hover:text-[var(--color-text-primary)]"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <ArrowLeft className="h-4 w-4" /> Back to templates
      </button>

      {query.isLoading ? (
        <LoadingSkeleton rows={3} variant="card" />
      ) : query.isError || !query.data ? (
        <ErrorState
          title="Couldn't load that template"
          description="It may have been removed. Browse the full gallery instead."
          retryLabel="Browse templates"
          onRetry={() => router.push("/dashboard/templates")}
        />
      ) : (
        (() => {
          const t = query.data;
          const diff = DIFFICULTY_STYLES[t.difficulty] ?? DIFFICULTY_STYLES.BEGINNER;
          return (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
              <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-subtle)" }}>
                {t.previewUrl ? (
                  <iframe src={t.previewUrl} title={t.name} className="h-[520px] w-full" />
                ) : (
                  <div className="flex h-[520px] items-center justify-center">
                    <Globe className="h-12 w-12" style={{ color: "var(--color-text-muted)" }} />
                  </div>
                )}
              </div>

              <div>
                <h1 className="text-[22px] font-[680] tracking-tight" style={{ color: "var(--color-text-primary)" }}>{t.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full px-2.5 py-0.5 text-[12px] font-medium" style={{ backgroundColor: "var(--color-bg-subtle)", color: "var(--color-text-secondary)" }}>
                    {t.category.toLowerCase()}
                  </span>
                  <span className="rounded-full px-2.5 py-0.5 text-[12px] font-medium" style={{ backgroundColor: diff.bg, color: diff.text }}>
                    {diff.label}
                  </span>
                  <span className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>{t.usageCount} sites</span>
                </div>

                {t.description && (
                  <p className="mt-4 text-[13.5px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{t.description}</p>
                )}

                <div className="mt-6 flex flex-col gap-2.5">
                  <button
                    onClick={() => useMutation.mutate({ templateId: t.id, siteName: t.name })}
                    disabled={useMutation.isPending}
                    className="flex h-11 items-center justify-center rounded-lg text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    {useMutation.isPending ? "Creating…" : "Use this template →"}
                  </button>
                  {t.previewUrl && (
                    <a
                      href={t.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-11 items-center justify-center gap-1.5 rounded-lg border text-[14px] font-medium transition-colors hover:bg-[var(--color-bg-subtle)]"
                      style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
                    >
                      Live preview <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/shahg/Desktop/pencil/buildrik && npx tsc --noEmit -p packages/dashboard/tsconfig.json`
Expected: no errors. (Confirm `getEditorHref`, `useUnifiedEditorFlag`, `useToast`, `LoadingSkeleton`, `ErrorState` import paths resolve — they are the same ones `sites/new/page.tsx` uses.)

- [ ] **Step 3: Commit**

```bash
git add "packages/dashboard/app/dashboard/templates/[id]/page.tsx"
git commit -m "feat(templates): full-page template detail with Use + live preview"
```

---

### Task 7: Live verification (authed browser)

**Files:** none (verification only).

This task has no unit test; its deliverable is a verified end-to-end flow. Do not mark the plan complete until every check passes.

- [ ] **Step 1: Ensure the dev server is running and clear stale SSR**

Because `nav.ts` changed, Turbopack SSR can serve a stale sidebar. Run:

```bash
cd /Users/shahg/Desktop/pencil/buildrik && rm -rf packages/dashboard/.next
```

Then confirm `npm run dev` (or the existing dev server) is up on `http://localhost:3000`.

- [ ] **Step 2: Mint a dev login token** (magic-link; no email in dev)

```bash
cd /Users/shahg/Desktop/pencil/buildrik && npx tsx /tmp/mint-login.ts
```

(If `/tmp/mint-login.ts` is gone, recreate it per memory `reference_dev_login_magic_link`: `generateToken("magic_link", <ownerUserId>, 15)` and navigate to `/auth/callback?token=<raw>`.)

- [ ] **Step 3: Verify the browser page** — navigate to `http://localhost:3000/dashboard/templates` and confirm:
  - The **workspace sidebar is hidden** (full-width); a "← Dashboard" control is present.
  - The **left filter rail** shows Category, Difficulty, Sort sections.
  - Selecting a category/difficulty/sort **updates the URL** (`?category=…`) and narrows the grid.
  - Typing in **Search** filters the grid and sets `?search=`.
  - **Numbered pagination** appears when `totalPages > 1` and switching pages updates `?page=` and the grid.

- [ ] **Step 4: Verify the detail flow** — click a card and confirm:
  - URL becomes `/dashboard/templates/<id>`, still full-width, "← Back to templates" present.
  - Preview (iframe or placeholder), name, category, difficulty, usage, description render.
  - **← Back to templates** returns to the browser with the previous filters intact.
  - **Live preview** (if the template has `previewUrl`) opens a new tab.

- [ ] **Step 5: Verify Use → editor** — on a detail page click **Use this template →** and confirm a success toast, then landing in the editor for the new site.

- [ ] **Step 6: Verify the bad-id error state** — navigate to `http://localhost:3000/dashboard/templates/does-not-exist` and confirm the error state ("Couldn't load that template" + "Browse templates"), **not** a blank screen.

- [ ] **Step 7: Full affected suite + typecheck (final gate)**

```bash
cd /Users/shahg/Desktop/pencil/buildrik && npx tsc --noEmit -p packages/dashboard/tsconfig.json && npx vitest run packages/dashboard/components/templates packages/dashboard/app/dashboard/templates packages/dashboard/components/dashboard/shell/__tests__/nav.test.ts server/services/__tests__/template-clone.test.ts
```

Expected: typecheck clean, all suites pass.

- [ ] **Step 8: Commit any verification-driven fixes** (only if Steps 3–6 surfaced defects; otherwise skip).

---

## Self-Review

**Spec coverage:**
- Full-width browser + detail routes → Task 2 (routing), Task 5 (browser), Task 6 (detail). ✓
- Left filter rail (Category/Difficulty/Sort/Search) → Task 4 (rail) + Task 5 (search box). ✓
- Difficulty filter data gap → Task 1. ✓
- Numbered pagination → Task 5 (`paginationRange` + UI). ✓
- Card → detail deep-link → Task 5 (`<Link href={/dashboard/templates/${t.id}}>`). ✓
- Detail back button + Use→clone→editor + Live preview + cold-load states → Task 6. ✓
- Filters in URL (shareable/back) → Task 3 + Task 5 (`router.replace`). ✓
- sites/new untouched, no fabricated filters → respected (no task modifies `sites/new`; only 4 data-backed filters). ✓
- Libraries tab: spec said keep as a toggle; Task 5 drops it and records the deviation as an explicit decision (empty-state only). Flagged for user confirmation. ⚠

**Placeholder scan:** No TBD/TODO; every code step shows full code; every command shows expected output. ✓

**Type consistency:** `TemplateFilters` shape identical across Tasks 3/4/5; `templateFiltersFromParams`/`templateFiltersToQuery`/`paginationRange`/`TemplateFilterRail({filters,onChange})` names match between definition and use; `difficulty` enum values identical in schema (Task 1), filters (Task 3), and query cast (Task 5). ✓

**One flagged deviation for the user:** Task 5 removes the Libraries tab (placeholder-only). Confirm that is acceptable, or it becomes a small follow-up task.
