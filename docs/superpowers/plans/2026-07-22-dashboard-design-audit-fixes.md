# Dashboard Design-Audit Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Close the 8 real defects from the 2026-07-22 dashboard design audit (+ one doc-drift fix), per `docs/superpowers/specs/2026-07-22-dashboard-design-audit-fixes-design.md`.

**Architecture:** Token-level visual edits + one interaction change (Sites filter merge). No new features, no data-model changes. Every value references a DESIGN.md token.

**Tech Stack:** Next.js 16 App Router (client components), React 19, Tailwind 4, DESIGN.md tokens.

## Global Constraints

- Single accent `#406ED6` = `var(--color-primary)`; red = error only; purple banned (marketplace app-tile brand data excepted).
- All colours/spacing via tokens: `--color-primary`, `--color-primary-subtle`, `--color-bg-subtle`, `--color-text-*`, `--color-border-default`.
- Files `kebab-case`; path aliases `@/`, `@lib/` only.
- Preserve functionality. F2 is the only behaviour change — deep-links (`?status=published`) + folder view must keep working.
- Commit after each task. Solo workflow → `main`.
- `mx-auto max-w-[1200px]` is the one shared ecosystem-page width (DESIGN.md allows artifact-matched pixel literals).

---

### Task 1: F1 — Constrain ecosystem pages (Resources void)

**Files:**
- Modify: `packages/dashboard/app/dashboard/marketplace/page.tsx` (root wrapper, ~line 61-62)
- Modify: `packages/dashboard/app/dashboard/learn/page.tsx` (main root wrapper, ~line 64-65)
- Modify: `packages/dashboard/app/dashboard/resources/page.tsx` (root wrapper, line 18-20)
- Modify: `packages/dashboard/app/dashboard/templates/page.tsx:71` (`max-w-[1180px]` → `max-w-[1200px]`)

**Interfaces:** none (pure layout).

- [ ] **Step 1: Wrap each ecosystem page's content in a centered max-width container.**

For **resources/page.tsx**, the outer `<div>` (line 19) becomes:
```tsx
    <div className="mx-auto max-w-[1200px] px-6 py-6">
```
(It currently renders `<PageHeader>` + the card grid directly; wrapping in the constrained container centers them.)

For **marketplace/page.tsx** and **learn/page.tsx**, find the outermost content `<div>` returned by the page component and add `mx-auto max-w-[1200px] px-6` to its className (keep existing vertical padding). If the page already has horizontal padding on the root, replace it with the `mx-auto max-w-[1200px] px-6` wrapper so content centers instead of running edge-to-edge. Read each file's return block first to place the wrapper on the true root element.

For **templates/page.tsx:71**, change only the width literal:
```tsx
    <div className="mx-auto max-w-[1200px] px-6 py-6">
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/shahg/Desktop/pencil/buildrik && npx tsc --noEmit -p packages/dashboard/tsconfig.json`
Expected: clean.

- [ ] **Step 3: Live-verify (authed browser)** — Marketplace / Learn / Resources / Templates content is centered, capped at 1200px; Resources' 2 cards no longer float in a full-bleed void.

- [ ] **Step 4: Commit**

```bash
git add packages/dashboard/app/dashboard/{marketplace,learn,resources,templates}/page.tsx
git commit -m "fix(dashboard): constrain ecosystem pages to max-w-1200 (design audit F1)"
```

---

### Task 2: F2 — Sites list: one filter bar

**Files:**
- Modify: `packages/dashboard/components/sites/folder-card-grid.tsx` (remove the Archived pill + the dashed New-folder tile)
- Modify: `packages/dashboard/app/dashboard/projects/page.tsx` (drop `showArchived` state + wiring; simplify the list query; drop `archivedQuery`)

**Interfaces:**
- Consumes: `SiteFilters` (unchanged — its `STATUS_FILTER_OPTIONS` already includes `ARCHIVED`).
- Produces: `FolderCardGrid` no longer takes `showArchived` / `archivedCount` / `onToggleArchived` / `onNewFolder`. Archived is reached only via the status filter.

- [ ] **Step 1: Read both files fully** — `folder-card-grid.tsx` and `projects/page.tsx` — to see the exact JSX for the pill row (`All sites` / `Archived` pills, ~lines 108-118), the folder cards loop, the dashed "New folder" tile (~line 155-162), and the page's `showArchived` usages (state ~line 50, query ~lines 115/127, FolderCardGrid props ~lines 467-474, `hasActiveFilters` ~line 404).

- [ ] **Step 2: In `folder-card-grid.tsx`, remove the Archived pill and the dashed New-folder tile.**
  - Delete the `Archived · {archivedCount}` pill button (the whole `<button onClick={onToggleArchived}>…</button>`).
  - Delete the "New folder" dashed tile block (the element rendered via `onNewFolder`).
  - Keep the `All sites · {totalCount}` pill (it is the folder-clear affordance: `activeId === null`) and the folder cards.
  - Remove from the props type + destructure: `showArchived`, `archivedCount`, `onToggleArchived`, `onNewFolder`.
  - Where a folder card's `active` was `!showArchived && activeId === folder.id`, drop the `!showArchived &&` (now just `activeId === folder.id`). Same for the `All sites` pill tone: `activeId === null`.
  - Update the component's doc comment (lines ~91-92) — the "'Archived' stays as a pill" note no longer holds; Archived is a status filter now.

- [ ] **Step 3: In `projects/page.tsx`, drop `showArchived` and simplify.**
  - Remove `const [showArchived, setShowArchived] = useState(false);`.
  - List query `status`: change `status: showArchived ? "ARCHIVED" as const : status as …` → `status: status as "PUBLISHED" | "DRAFT" | "ARCHIVED" | undefined,`.
  - List query `folderId`: change `folderId: showArchived ? undefined : (folderId ?? undefined)` → `folderId: folderId ?? undefined,`.
  - Remove `showArchived` from `hasActiveFilters` (line ~404).
  - Remove the `archivedQuery` (line ~136) and any `archivedCount` it fed (no count is shown on the status chip — YAGNI).
  - `FolderCardGrid` usage: drop the `showArchived` / `archivedCount` / `onToggleArchived` / `onNewFolder` props; in `onSelect`, drop `setShowArchived(false)`.
  - Any `setShowArchived(false)` in `clearFilters` / folder-select handlers: delete those lines.

- [ ] **Step 4: Typecheck**

Run: `cd /Users/shahg/Desktop/pencil/buildrik && npx tsc --noEmit -p packages/dashboard/tsconfig.json`
Expected: clean (TS will flag any missed `showArchived`/prop reference — fix each).

- [ ] **Step 5: Live-verify (authed browser)** at `/dashboard/projects`:
  - One filter bar only: search + `Published · Draft · Archived` chips + sort. No separate "All sites / Archived" tab pair, no dashed "New folder" tile (the top-right "New folder" button remains).
  - Selecting the **Archived** status chip returns archived sites.
  - `/dashboard/projects?status=published` still auto-selects Published.
  - If folders exist, opening a folder still filters the list; the "All sites" pill clears the folder.

- [ ] **Step 6: Commit**

```bash
git add packages/dashboard/components/sites/folder-card-grid.tsx packages/dashboard/app/dashboard/projects/page.tsx
git commit -m "fix(sites): single filter bar — drop redundant Archived tab + New-folder tile (design audit F2)"
```

---

### Task 3: F3 — Marketplace app-card CTA weight

**Files:**
- Modify: `packages/dashboard/app/dashboard/marketplace/page.tsx:167` (the non-Connect `Button` variant)

**Interfaces:** none.

- [ ] **Step 1: Normalize the installable CTA to ghost.**

The app-card CTA has two branches: the Connect branch already uses `variant="ghost"`. The installable branch uses `variant={isInstalled ? "ghost" : "primary"}` — the `"primary"` is the lone filled blue that scatters focus. Change it to always ghost:

```tsx
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={busy}
```

(Keep the `isInstalled` Check icon and the onClick logic unchanged — only the visual weight changes so every grid card reads at one weight; the featured ink card keeps the single filled primary.)

- [ ] **Step 2: Typecheck + live-verify** — all Marketplace app-card CTAs are the same ghost weight; only the featured card is filled.

Run: `cd /Users/shahg/Desktop/pencil/buildrik && npx tsc --noEmit -p packages/dashboard/tsconfig.json`

- [ ] **Step 3: Commit** (fold F4 + F5 into this commit — same file)

Defer the commit to Task 5 (F4/F5 touch the same file; one marketplace commit).

---

### Task 4: F4 + F5 — Marketplace featured tile (flat) + eyebrow (off amber)

**Files:**
- Modify: `packages/dashboard/app/dashboard/marketplace/page.tsx:102` (eyebrow colour), `:115` (tile background)

**Interfaces:** none.

- [ ] **Step 1: Flatten the featured tile gradient (F4).**

Line 115 currently:
```tsx
          style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)" }}
```
Change to a solid fill:
```tsx
          style={{ backgroundColor: "var(--color-primary)" }}
```

- [ ] **Step 2: Move the "FEATURED" eyebrow off amber (F5).**

Line 102 currently uses `color: "var(--color-amber)"`. Change to an on-ink muted white so the card stays monochromatic-on-ink and amber is reserved for warnings:
```tsx
          <span className="text-eyebrow font-bold uppercase" style={{ color: "rgba(255,255,255,0.6)", letterSpacing: "0.66px" }}>Featured</span>
```

- [ ] **Step 3: Typecheck + live-verify** — featured tile is a flat accent block; "FEATURED" eyebrow is muted white, not amber.

Run: `cd /Users/shahg/Desktop/pencil/buildrik && npx tsc --noEmit -p packages/dashboard/tsconfig.json`

- [ ] **Step 4: Commit (F3 + F4 + F5 together — one marketplace file)**

```bash
git add packages/dashboard/app/dashboard/marketplace/page.tsx
git commit -m "fix(marketplace): flat featured tile, neutral eyebrow, uniform card CTA weight (design audit F3/F4/F5)"
```

---

### Task 5: F6 — Confirm Learn "Continue learning" surface is a flat tint

**Files:**
- Inspect (modify only if a gradient): `packages/dashboard/app/dashboard/learn/page.tsx` (the "Continue learning" card, ~line 40-64)

- [ ] **Step 1: Read the "Continue learning" card's background style.** If it uses `linear-gradient(...)`, replace with a flat `backgroundColor: "var(--color-primary-subtle)"`. If it is already a flat tint (`--color-primary-subtle` / `#EBF1FF`), no change — record "already flat" and skip the commit.

- [ ] **Step 2 (only if changed): Typecheck + commit**

```bash
git add packages/dashboard/app/dashboard/learn/page.tsx
git commit -m "fix(learn): flatten continue-learning card tint (design audit F6)"
```

---

### Task 6: F7 — Media empty state gets an Upload CTA

**Files:**
- Modify: `packages/dashboard/components/media/media-library.tsx` (empty state, ~lines 283-287)

**Interfaces:** reuse the existing upload trigger (the same handler behind the top-right "Upload" button at line ~169; likely a hidden `<input type="file">` + a ref, or `handleUpload`).

- [ ] **Step 1: Read lines ~160-175 and ~280-330** to find how the top-right Upload button triggers the file picker (ref to a hidden input, or an `onClick`). Reuse that exact trigger.

- [ ] **Step 2: Add a primary Upload button inside the empty state**, only for the no-assets case (not the "no search results" case — searching shouldn't prompt an upload). After the empty-state description (line ~286), when `!search`:

```tsx
              {!search && (
                <div className="mt-4">
                  <Button onClick={/* the same trigger the top-right Upload uses */}>
                    <Upload size={15} /> Upload
                  </Button>
                </div>
              )}
```

Wire `onClick` to the existing upload trigger (ref.current?.click() or the handler). Use the `Button` primitive already imported in the file; `Upload` icon is already imported (line 4).

- [ ] **Step 3: Typecheck + live-verify** — `/dashboard/media` empty state shows a working Upload button that opens the file picker (same as the top-right button). The "no search results" state does NOT show it.

Run: `cd /Users/shahg/Desktop/pencil/buildrik && npx tsc --noEmit -p packages/dashboard/tsconfig.json`

- [ ] **Step 4: Commit**

```bash
git add packages/dashboard/components/media/media-library.tsx
git commit -m "fix(media): add Upload CTA to the empty state (design audit F7)"
```

---

### Task 7: F8 — Sites card thumbnail placeholder

**Files:**
- Modify: the site card component (find with `grep -rl "aspect\|thumbnail\|preview" packages/dashboard/components/sites/`; likely `site-card.tsx` or within the grid item)

- [ ] **Step 1: Find the site-card thumbnail block.** `grep -rn "thumbnail\|preview\|bg-\[var(--color-primary-subtle)\]\|aspect-" packages/dashboard/components/sites/*.tsx` to locate where a site with no preview renders a flat coloured rectangle.

- [ ] **Step 2: Replace the bare fill with a typographic placeholder** matching the template-card pattern (centered muted icon on `--color-bg-subtle`). Use the site's first initial or a muted `Globe`/`FileText` icon (lucide, already used elsewhere) centered on `backgroundColor: "var(--color-bg-subtle)"`, with `color: "var(--color-text-muted)"`:

```tsx
              <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: "var(--color-bg-subtle)" }}>
                <Globe className="h-8 w-8" style={{ color: "var(--color-text-muted)" }} />
              </div>
```

(Keep the real thumbnail path when a preview URL exists; only the no-preview fallback changes. Import `Globe` from `lucide-react` if not already imported.)

- [ ] **Step 3: Typecheck + live-verify** — a site with no preview shows the muted-icon placeholder, not a flat blue rectangle.

Run: `cd /Users/shahg/Desktop/pencil/buildrik && npx tsc --noEmit -p packages/dashboard/tsconfig.json`

- [ ] **Step 4: Commit**

```bash
git add packages/dashboard/components/sites/
git commit -m "fix(sites): typographic placeholder for site cards with no preview (design audit F8)"
```

---

### Task 8: F9 — Update DESIGN.md stale IA (doc-drift)

**Files:**
- Modify: `DESIGN.md` §"Dashboard Shell + Design System (2026-07-12)" — the two-level shell bullets (~lines 70-71)

- [ ] **Step 1: Correct the IA description to match shipped IA.**
  - Top nav: `Dashboard · Marketplace · Learn · Resources · Templates` (Templates moved to the ecosystem top nav 2026-07-21).
  - Sidebar: `Home · Getting started · Sites · Agency (agency-only) · Media · Settings` — no "Support group", Help is not a sidebar item (Help moved into Resources 2026-07-21), "Projects" label is "Sites".
  - Add a one-line note in the Decisions Log (or inline) that Templates→ecosystem, Help→Resources, Projects→Sites landed 2026-07-21 (IA v2 follow-up / Codex audit).

- [ ] **Step 2: Commit**

```bash
git add DESIGN.md
git commit -m "docs(design): update DESIGN.md dashboard IA to shipped state (design audit F9)"
```

---

### Task 9: Final gate + full live sweep

- [ ] **Step 1: Typecheck + affected tests**

```bash
cd /Users/shahg/Desktop/pencil/buildrik && npx tsc --noEmit -p packages/dashboard/tsconfig.json && npx vitest run __tests__/dashboard-layout.test.ts __tests__/dashboard-components.test.ts packages/dashboard/components/dashboard/shell
```
Expected: tsc clean, suites green. (No fix has unit-testable logic; the sweep guards against regressions.)

- [ ] **Step 2: Before/after live sweep (authed browser)** — walk Marketplace, Learn, Resources, Templates, Sites, Media at desktop and confirm each fix landed and nothing regressed (single accent intact, no new 500s).

---

## Self-Review

**Spec coverage:** F1→Task1, F2→Task2, F3→Task3, F4/F5→Task4, F6→Task5, F7→Task6, F8→Task7, F9→Task8, final gate→Task9. Non-goals (buildrik.io URL, section-nav consistency) correctly absent. ✓

**Placeholder scan:** F2/F6/F7/F8 say "read the file first" because they touch code not fully quoted here — each names the exact file, the exact block, and the exact change. No "TBD"/"handle appropriately". The one soft spot (F7 upload trigger, F8 card file) is bounded by an explicit grep + the reuse target. Acceptable for edits this small; the implementer confirms the trigger by reading ~15 lines. ✓

**Type/name consistency:** `showArchived` removal is enumerated across both F2 files (state, query ×2, props ×4, hasActiveFilters, handlers) so TS catches any miss. `max-w-[1200px]` is the single shared literal across Task 1. ✓
