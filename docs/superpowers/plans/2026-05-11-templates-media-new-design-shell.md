# Templates + Media New-Design Shell — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Switch live editor's Templates + Media tabs from old full-canvas "expanded library" mode to the prototype-v3 compact 320px sidebar pattern, fix Templates IA to match S1, fix CORS on `media.checkStorageQuota`, and add missing `DialogTitle` for Radix a11y.

**Architecture:**
1. **Mode flip** — change `tabsConfig.ts` `mode: "fullpage"` → `mode: "panel"` for `templates` + `assets`. The `LeftSidebar` renders panel-mode tabs in `ls-panel` with `panelWidth` from config (already 280 for assets; add 320 for templates). MediaTab + TemplatesTab already render the right inner UI; only the container mode changes.
2. **Templates IA reshape** — replace industry-vertical `SITE_CATEGORY_PILLS` (Landing/Portfolio/SaaS/Blog/E-comm) with prototype S1 IA (All / Site Pages / Sections / My Templates), wire `templateType` defaulting so top-level pill click drills into Page-vs-Section split with existing `TEMPLATE_TYPE_PILLS` + `SUB_CATEGORY_TAGS` (already wired).
3. **Inline detail drawer (S2)** — `TemplateDetail` already renders inline; verify it fits within 320px panel after mode flip and adjust CSS grid to single-column when panel is narrow.
4. **Asset detail (S15)** — `AssetDetailOverlay` already renders on-demand; no change needed.
5. **Folders sidebar relegated to "Manage" mode (S12 expanded)** — current MediaTab in panel mode does NOT render folders sidebar, so flipping to `mode: "panel"` automatically resolves this. Optional expanded mode opens via "Manage" affordance using existing `LibraryView` (now a separate fullpage route, not the default).
6. **CORS fix** — add `Access-Control-Allow-Origin` header for `localhost:5050` to dashboard tRPC route handler.
7. **Radix DialogTitle** — add `VisuallyHidden`-wrapped `DialogTitle` to any `DialogContent` instances flagged by console.

**Tech Stack:** React 18 + TypeScript + Emotion + vibcoder Modal/Dialog + Radix Dialog primitives. Tests via Vitest + React Testing Library.

---

## File Structure

**Modify:**
- `packages/editor/src/editor/rail/tabsConfig.ts` — change `mode` for `templates` + `assets`; add `panelWidth: 320` to `templates`.
- `packages/editor/src/editor/sidebar/tabs/templates/templatesData.ts` — replace `SITE_CATEGORY_PILLS` enum + add helper to map old industry tags to new IA.
- `packages/editor/src/editor/sidebar/tabs/templates/hooks/useTemplateSelection.ts` — adapt filter logic to new IA (default `templateType="page"` when `activeFilter="site-pages"`).
- `packages/editor/src/editor/sidebar/tabs/templates/TemplatesTab.css` — verify single-column grid works at 320px; tighten breakpoints.
- `packages/editor/src/editor/sidebar/tabs/media/MediaTab.css` — verify TypePills + LibraryView grid + UploadZone fit 320px.
- `packages/dashboard/app/api/trpc/[trpc]/route.ts` — add CORS headers.
- Any `DialogContent` flagged in `grep` results — add `<DialogTitle>` (use `VisuallyHidden` if visually absent).

**Create:**
- `packages/editor/src/editor/sidebar/tabs/templates/__tests__/TemplatesTab.ia.test.tsx` — integration test for new top-level IA.
- `packages/editor/src/editor/sidebar/tabs/media/__tests__/MediaTab.panel-mode.test.tsx` — assert TypePills, LibraryView, UploadZone all render in 320px container.

**Reference (read-only — do not modify):**
- `~/.gstack/projects/aamirtauqir-buildrik/designs/sidebar-templates-media-engine-20260507/prototype-v3.html` — S1 (templates default) + S10 (media quick browse) reference design.
- `packages/editor/src/editor/sidebar/LeftSidebar.tsx:261-306` — panel-mode rendering already supports the 320px width; no change needed.

---

## Task 1: Flip tabsConfig to panel mode

**Files:**
- Modify: `packages/editor/src/editor/rail/tabsConfig.ts:79-100`

- [ ] **Step 1: Open the file and confirm current state**

```bash
grep -n "mode:" packages/editor/src/editor/rail/tabsConfig.ts | head -10
```

Expected lines including:
- `mode: "fullpage",` for `templates`
- `mode: "fullpage",` for `assets`

- [ ] **Step 2: Change templates mode to panel + add panelWidth: 320**

In `tabsConfig.ts`, locate the `templates` entry (around line 78–88) and replace:

```ts
  {
    id: "templates",
    iconName: "LayoutGrid",
    label: "Templates",
    ariaLabel: "Browse page and section templates",
    section: "top",
    pattern: "standalone",
    shortcut: "T",
    mode: "fullpage",
    zone: "creation",
  },
```

With:

```ts
  {
    id: "templates",
    iconName: "LayoutGrid",
    label: "Templates",
    ariaLabel: "Browse page and section templates",
    section: "top",
    pattern: "standalone",
    shortcut: "T",
    mode: "panel",
    panelWidth: 320,
    zone: "creation",
  },
```

- [ ] **Step 3: Change assets mode to panel (panelWidth already set to 280 — bump to 320 to match prototype S10)**

Locate the `assets` entry (around line 89–100) and change:

```ts
    mode: "fullpage",
    panelWidth: 280,
```

To:

```ts
    mode: "panel",
    panelWidth: 320,
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd packages/editor && npx tsc --noEmit`
Expected: no errors.

- [x] **Step 5: Smoke test in browser** — SlimLauncher renders on-spec at 320px (see /tmp/buildrik-compare/task4c-media-slim-styled.png). SlimLauncher.css authored (was missing).

Run: ensure `npm run dev` is running on port 5050. Open `http://localhost:5050`, skip onboarding, click Templates rail icon. Panel should open at 320px (not full canvas). Click Media rail icon. Same — 320px panel, not full canvas.

- [x] **Step 6: Commit** — pending immediately after Task 5 also closed (collapsed into same fix via Maximize2 → onOpenLibrary path).

```bash
git add packages/editor/src/editor/rail/tabsConfig.ts
git commit -m "feat(editor-shell): flip Templates + Media tabs to 320px panel mode

Matches prototype-v3 S1 + S10. Old full-canvas 'Asset Library' /
'Templates gallery' shells were never the design intent — they were
expanded modes that bled into the default. tabsConfig.mode 'fullpage' →
'panel' restores the compact sidebar.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Reshape Templates top-level IA

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/templates/templatesData.ts:94-103`
- Modify: `packages/editor/src/editor/sidebar/tabs/templates/hooks/useTemplateSelection.ts`

- [ ] **Step 1: Inspect current useTemplateSelection logic**

```bash
cat packages/editor/src/editor/sidebar/tabs/templates/hooks/useTemplateSelection.ts | head -80
```

Note current state machine: `activeFilter` (SiteCategory), `templateType` (page/section), `subCategory` (string).

- [ ] **Step 2: Write failing IA test**

Create `packages/editor/src/editor/sidebar/tabs/templates/__tests__/TemplatesTab.ia.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TemplatesTab } from "../TemplatesTab";
import { describe, it, expect } from "vitest";

describe("TemplatesTab — new-design IA (S1)", () => {
  it("renders top-level pills: All, Site Pages, Sections, My Templates", () => {
    render(<TemplatesTab composer={null} />);
    expect(screen.getByRole("tab", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Site Pages" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Sections" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "My Templates" })).toBeInTheDocument();
  });

  it("clicking 'Site Pages' reveals Page Templates / Section Templates type pills", async () => {
    const user = userEvent.setup();
    render(<TemplatesTab composer={null} />);
    await user.click(screen.getByRole("tab", { name: "Site Pages" }));
    expect(screen.getByRole("tab", { name: /Page Templates/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Section Templates/ })).toBeInTheDocument();
  });

  it("does NOT show industry-vertical pills (Landing/Portfolio/SaaS/Blog/E-comm) at top level", () => {
    render(<TemplatesTab composer={null} />);
    expect(screen.queryByRole("tab", { name: "Landing" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Portfolio" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "SaaS" })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to confirm failure**

Run: `cd packages/editor && npx vitest run src/editor/sidebar/tabs/templates/__tests__/TemplatesTab.ia.test.tsx`
Expected: FAIL — "Site Pages" tab not found (current implementation uses Landing/Portfolio).

- [ ] **Step 4: Replace SITE_CATEGORY_PILLS in templatesData.ts**

Replace lines 94–103 of `templatesData.ts`:

```ts
export type SiteCategory = "all" | "site-pages" | "sections" | "my-templates";

export const SITE_CATEGORY_PILLS: { id: SiteCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "site-pages", label: "Site Pages" },
  { id: "sections", label: "Sections" },
  { id: "my-templates", label: "My Templates" },
];
```

Then update individual template `category` fields in `SITE_TEMPLATES` array (further down the file): map old industry tag → `"site-pages"` (since current templates are full-page templates). Preserve `industry` as a separate optional field on `TemplateItem` if industry filtering is needed elsewhere.

Locate `TemplateItem` interface (search top of file) and add:

```ts
export interface TemplateItem {
  // ... existing fields ...
  /** Optional industry tag used for analytics + future filters. Not part of top-level IA. */
  industry?: "landing" | "portfolio" | "saas" | "blog" | "ecommerce";
}
```

For each entry in `SITE_TEMPLATES`, change `category: "saas"` → `category: "site-pages", industry: "saas"` (and similar for other industry values).

- [ ] **Step 5: Adapt useTemplateSelection drill-in logic**

In `useTemplateSelection.ts`, where `activeFilter` is consumed:

- When `activeFilter === "site-pages"` → set `templateType = "page"` (drill straight into Page Templates by default)
- When `activeFilter === "sections"` → set `templateType = "section"`
- When `activeFilter === "my-templates"` → filter `SITE_TEMPLATES` by user-saved flag (if no flag exists yet, filter to empty array; this is a Phase-2 follow-up)
- When `activeFilter === "all"` → keep `templateType = null`, show all templates flat

Patch the `useEffect` or computed `paginatedTemplates`:

```ts
React.useEffect(() => {
  if (activeFilter === "site-pages") setTemplateType("page");
  else if (activeFilter === "sections") setTemplateType("section");
  else setTemplateType(null);
}, [activeFilter]);
```

- [ ] **Step 6: Run IA test — should pass**

Run: `cd packages/editor && npx vitest run src/editor/sidebar/tabs/templates/__tests__/TemplatesTab.ia.test.tsx`
Expected: PASS — all 3 cases.

- [ ] **Step 7: Run full templates test suite to catch regressions**

Run: `cd packages/editor && npx vitest run src/editor/sidebar/tabs/templates`
Expected: all pre-existing tests still pass. If a test asserts on old `SITE_CATEGORY_PILLS` labels, update it.

- [ ] **Step 8: Commit**

```bash
git add packages/editor/src/editor/sidebar/tabs/templates/templatesData.ts \
        packages/editor/src/editor/sidebar/tabs/templates/hooks/useTemplateSelection.ts \
        packages/editor/src/editor/sidebar/tabs/templates/__tests__/TemplatesTab.ia.test.tsx
git commit -m "feat(templates): reshape top-level IA to match prototype S1

Old: All / Landing / Portfolio / SaaS / Blog / E-comm (industry verticals).
New: All / Site Pages / Sections / My Templates (template-type IA).

Industry tag preserved as optional 'industry' field on TemplateItem for
analytics + secondary filters. Drill-in to Page/Section type pills +
sub-category tags is unchanged.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Verify Templates panel fits 320px

**Files:**
- Modify (if needed): `packages/editor/src/editor/sidebar/tabs/templates/TemplatesTab.css`

- [x] **Step 1: Smoke test panel in browser at 320px**

Confirm dev server live on port 5050. Open editor. Click Templates rail icon. Verify:
- Header "Templates" + search + close icons fit on one row
- Top-level pills (All / Site Pages / Sections / My Templates) wrap cleanly within 320px
- After clicking "Site Pages", Page/Section type pills + sub-category tags fit
- Card grid renders single-column (not 4-col) inside 320px
- Pagination row fits

Take screenshot:

```bash
B=/Users/shahg/.claude/skills/gstack/browse/dist/browse
$B goto http://localhost:5050
sleep 2
$B js "Array.from(document.querySelectorAll('button,a')).find(b => b.textContent.toLowerCase().includes('blank canvas'))?.click(); 'blank'"
sleep 2
$B click '[data-tab="templates"]'
sleep 1
$B screenshot /tmp/buildrik-compare/task3-templates-320.png
```

Read `/tmp/buildrik-compare/task3-templates-320.png` and compare to `/tmp/buildrik-compare/05-proto-s1.png`.

- [x] **Step 2: If grid not single-column at 320px, fix CSS** — N/A, grid already 1-col via auto-fill minmax(130px).

Open `TemplatesTab.css` and locate `.tpl-grid` rule. Replace with:

```css
.tpl-grid {
  display: grid;
  grid-template-columns: 1fr 1fr; /* default 2-col for narrow panel */
  gap: var(--bd-space-3);
  padding: var(--bd-space-3);
}

@media (min-width: 600px) {
  /* Only widen to 4-col when panel is in expanded/manage mode */
  .tpl-shell--expanded .tpl-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

- [x] **Step 3: Re-screenshot + diff against prototype** — single screenshot at /tmp/buildrik-compare/task3-templates-320.png, 1-col layout confirmed.

Repeat Step 1's screenshot. Visually confirm 2-col grid + tight spacing.

- [x] **Step 4: Commit (only if CSS changed)** — skipped, no CSS changes required.

```bash
git add packages/editor/src/editor/sidebar/tabs/templates/TemplatesTab.css
git commit -m "fix(templates): 2-col grid at 320px panel width

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

If no CSS changes were needed, skip this commit and note in task summary.

---

## Task 4: Verify Media panel fits 320px

**Files:**
- Modify (if needed): `packages/editor/src/editor/sidebar/tabs/media/MediaTab.css`

- [x] **Step 1: Write failing panel-mode integration test** — adapted for SlimLauncher (Path A); plan §1.4 premise was wrong.

Create `packages/editor/src/editor/sidebar/tabs/media/__tests__/MediaTab.panel-mode.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { MediaTab } from "../MediaTab";
import { describe, it, expect } from "vitest";

describe("MediaTab — 320px panel mode (S10)", () => {
  it("renders TypePills, LibraryView, and UploadZone in narrow panel", () => {
    const fakeComposer = makeFakeComposer();
    render(
      <div style={{ width: 320 }}>
        <MediaTab composer={fakeComposer} />
      </div>
    );
    // S10 hallmarks
    expect(screen.getByRole("button", { name: /Add from Stock/i })).toBeInTheDocument();
    expect(screen.getByText(/Drop or click to upload/i)).toBeInTheDocument();
    // No folders sidebar at default 320px panel mode
    expect(screen.queryByText(/MY FOLDERS/i)).not.toBeInTheDocument();
  });
});

function makeFakeComposer() {
  // Minimal stub — tests only assert presence of UI primitives, not media ops
  return {
    media: { getAssets: () => [], getFolders: () => [], on: () => {}, off: () => {} },
    mediaOps: { insertMedia: () => null },
    elements: { getActivePage: () => null, on: () => {}, off: () => {} },
    on: () => {},
    off: () => {},
  } as any;
}
```

- [x] **Step 2: Run test — expect failure** — initial fail: useToast/composer media surface gaps; fixed via ToastProvider + richer fake composer.

Run: `cd packages/editor && npx vitest run src/editor/sidebar/tabs/media/__tests__/MediaTab.panel-mode.test.tsx`
Expected: FAIL — likely "MY FOLDERS" text matched (LibraryView's left rail still rendering even at 320px) OR composer stub mismatch.

- [x] **Step 3: Inspect LibraryView rendering inside narrow panel** — LibraryView CSS missing entirely. Switched to SlimLauncher path: TabRouter `case "assets"` now threads `onOpenLibrary` from StudioPanels through LeftSidebar.

```bash
grep -n "MY FOLDERS\|FOLDERS" packages/editor/src/editor/sidebar/tabs/media/components/LibraryView.tsx | head -5
```

If LibraryView always renders folders sidebar, gate it behind a prop:

```tsx
// LibraryView.tsx
interface LibraryViewProps {
  // ... existing props ...
  /** When true, renders the folders sidebar. Default false (panel mode). */
  showFolders?: boolean;
}

// In render:
{showFolders && (
  <aside className="lib-folders">
    {/* ... existing folder rail ... */}
  </aside>
)}
```

In `MediaTab.tsx` LibraryView call (around line 198), do NOT pass `showFolders` (defaults to false). Folders are part of S12 expanded mode only.

- [x] **Step 4: Run test — should pass** — 2/2 pass; broader media+templates suite 122/122 green.

Run: `cd packages/editor && npx vitest run src/editor/sidebar/tabs/media/__tests__/MediaTab.panel-mode.test.tsx`
Expected: PASS.

- [x] **Step 5: Smoke test in browser** — SlimLauncher renders on-spec at 320px (see /tmp/buildrik-compare/task4c-media-slim-styled.png). SlimLauncher.css authored (was missing).

```bash
B=/Users/shahg/.claude/skills/gstack/browse/dist/browse
$B goto http://localhost:5050
sleep 2
$B js "Array.from(document.querySelectorAll('button,a')).find(b => b.textContent.toLowerCase().includes('blank canvas'))?.click(); 'blank'"
sleep 2
$B click '[data-tab="assets"]'
sleep 1
$B screenshot /tmp/buildrik-compare/task4-media-320.png
```

Read `/tmp/buildrik-compare/task4-media-320.png` and compare to `/tmp/buildrik-compare/06-proto-s10.png`.

- [x] **Step 6: Commit** — pending immediately after Task 5 also closed (collapsed into same fix via Maximize2 → onOpenLibrary path).

```bash
git add packages/editor/src/editor/sidebar/tabs/media/components/LibraryView.tsx \
        packages/editor/src/editor/sidebar/tabs/media/__tests__/MediaTab.panel-mode.test.tsx
git commit -m "feat(media): gate folders sidebar behind showFolders prop (panel mode default off)

Folders rail belongs to S12 expanded/manage mode per prototype-v3. Default
320px panel only shows TypePills + grid + UploadZone.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Wire "Manage" affordance to expanded mode

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/media/MediaTab.tsx`
- Modify: `packages/editor/src/editor/shell/StudioPanels.tsx` (or wherever the fullpage Media route lives)

- [ ] **Step 1: Find current expanded mode mount path**

```bash
grep -rn "onOpenLibrary\|FullPageMedia\|MediaManager" packages/editor/src/editor/shell packages/editor/src/editor/sidebar 2>/dev/null | head -10
```

- [ ] **Step 2: Add "Manage" button to MediaTab header**

In `MediaTab.tsx` header section (around line 174), add a "Manage" button next to "Add from Stock" that fires the same `onOpenLibrary` callback the SlimLauncher uses:

```tsx
<Button className="med-manage-btn" onClick={() => onOpenLibrary?.({})}>
  Manage
</Button>
```

`onOpenLibrary` is already in `MediaTabProps`. When clicked, AquibraStudio (or whichever shell owns the route) opens the full-page library overlay with `showFolders=true`. The compact panel stays mounted underneath.

- [ ] **Step 3: Wire fullpage handler in shell**

Find where `MediaTab` is rendered in TabRouter (`packages/editor/src/editor/sidebar/TabRouter.tsx:134`). Pass `onOpenLibrary`:

```tsx
return (
  <MediaTab
    composer={composer}
    {...commonTabProps}
    onOpenLibrary={(opts) => commonTabProps.onOpenFullpageMedia?.(opts)}
  />
);
```

If `onOpenFullpageMedia` doesn't exist on `commonTabProps`, plumb it from `LeftSidebar` props upward to the shell, where it triggers a modal/route showing `LibraryView` with `showFolders={true}` at full width.

- [ ] **Step 4: Smoke test the expanded mode toggle**

In browser:
1. Click Media rail → 320px compact panel opens
2. Click "Manage" button → fullpage Asset Library overlay opens (with folders, search, big grid)
3. Close fullpage → back to 320px panel

Screenshot both states.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/editor/sidebar/tabs/media/MediaTab.tsx \
        packages/editor/src/editor/sidebar/TabRouter.tsx \
        packages/editor/src/editor/shell/*.tsx
git commit -m "feat(media): Manage affordance opens expanded library route

Restores S12 expanded mode as on-demand state, not the default. Compact
320px panel remains the home shell.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Fix CORS for media.checkStorageQuota

**Files:**
- Modify: `packages/dashboard/app/api/trpc/[trpc]/route.ts`

- [ ] **Step 1: Locate current CORS config**

```bash
grep -n "Access-Control\|cors\|CORS" packages/dashboard/app/api/trpc/[trpc]/route.ts 2>/dev/null
```

- [ ] **Step 2: Add CORS headers**

If no CORS handling exists, add:

```ts
// route.ts
const ALLOWED_ORIGINS = new Set([
  "http://localhost:5050", // editor dev
  "http://localhost:3000", // dashboard dev
  process.env.NEXT_PUBLIC_EDITOR_URL,
  process.env.NEXT_PUBLIC_DASHBOARD_URL,
].filter(Boolean));

function corsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get("origin") ?? "";
  if (ALLOWED_ORIGINS.has(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "content-type, authorization",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    };
  }
  return {};
}

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}
```

Then in the existing `GET` and `POST` handlers, merge `corsHeaders(req)` into the response headers.

- [ ] **Step 3: Restart dashboard dev server + verify**

```bash
# In separate terminal — kill + restart dashboard
lsof -ti:3000 | xargs kill -9
cd packages/dashboard && npm run dev &
sleep 5
```

Open editor at http://localhost:5050, click Media rail, open browser DevTools → Network tab, look for `media.checkStorageQuota` request. It should return 200 OK, not CORS error.

```bash
B=/Users/shahg/.claude/skills/gstack/browse/dist/browse
$B goto http://localhost:5050
sleep 2
$B console --errors | grep -i "cors\|checkStorageQuota" | head -5
```

Expected: empty (no CORS errors).

- [ ] **Step 4: Commit**

```bash
git add packages/dashboard/app/api/trpc/[trpc]/route.ts
git commit -m "fix(dashboard): allow editor origin for tRPC media.checkStorageQuota

http://localhost:5050 + production editor URL added to CORS allowlist.
Quota strip in MediaTab UploadZone now reflects real server data.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Add DialogTitle to flagged DialogContent instances

**Files:**
- Modify: any `*.tsx` rendering `<DialogContent>` without a `<DialogTitle>` child

- [ ] **Step 1: Find offending DialogContent instances**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
grep -rln "DialogContent" packages/editor/src 2>/dev/null | xargs grep -L "DialogTitle" 2>/dev/null | head -10
```

Each file in this list has DialogContent without a sibling DialogTitle and trips the Radix a11y warning.

- [ ] **Step 2: For each file, add VisuallyHidden DialogTitle**

Pattern for each offender:

```tsx
import { DialogTitle } from "@/editor/shared/vibcoder/Dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

// Inside <DialogContent>:
<VisuallyHidden>
  <DialogTitle>{/* describe the dialog purpose */}</DialogTitle>
</VisuallyHidden>
{/* ... existing children ... */}
```

If the dialog already has a visible heading, prefer wrapping that heading in `<DialogTitle>` instead of adding a separate VisuallyHidden one — that's the canonical fix. Only use `VisuallyHidden` when the design has no visible title.

- [ ] **Step 3: Reload editor + check console**

```bash
B=/Users/shahg/.claude/skills/gstack/browse/dist/browse
$B goto http://localhost:5050
sleep 2
$B console --errors | grep -i "DialogContent\|DialogTitle" | head -5
```

Expected: empty.

- [ ] **Step 4: Commit**

```bash
git add packages/editor/src/**/*.tsx
git commit -m "fix(editor-a11y): add VisuallyHidden DialogTitle to flagged DialogContent instances

Radix Dialog requires a DialogTitle for screen reader users. Each instance
got either a visible DialogTitle (preferred) or a VisuallyHidden wrapper.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: End-to-end visual diff vs prototype-v3

**Files:** none (verification only)

- [ ] **Step 1: Capture all 22 sections from prototype**

```bash
B=/Users/shahg/.claude/skills/gstack/browse/dist/browse
$B newtab "file:///tmp/buildrik-compare/prototype-v3.html"
sleep 2
mkdir -p /tmp/buildrik-compare/proto
for n in 1 2 3 9 10 11 12 13 14 15 16 17 18 19 20 21 22; do
  $B screenshot /tmp/buildrik-compare/proto/s${n}.png --selector "section:nth-of-type(${n})"
done
```

- [ ] **Step 2: Capture matching live sections**

For each section, navigate to the equivalent live state and screenshot. Templates: S1 default, S2 click a card (inline detail), S3 click Preview, S9 click "Used in" link. Media: S10 default, S11 select-image-for-canvas mode, S14 multi-select, S15 asset detail open, S16 right-click, S17 image editor, S18 optimize, S19 stock modal, S20 icon picker, S21 replace-across, S22 upload state.

- [ ] **Step 3: Compile gap report**

For each section:
- Match: 100% / partial / mismatch
- Missing pieces: bulleted list
- Action: "ship as-is" / "polish CSS" / "rewrite component" / "deferred"

Write to `docs/superpowers/audits/2026-05-11-templates-media-shell-parity.md`.

- [ ] **Step 4: Commit audit**

```bash
git add docs/superpowers/audits/2026-05-11-templates-media-shell-parity.md
git commit -m "docs(audit): templates+media shell parity vs prototype-v3 post-arc

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review Checklist

Before declaring this plan ready:

- [ ] Spec coverage: every recommendation from the original status review (320px Media panel, Templates IA reshape, on-demand asset detail, expanded-mode-only folders, CORS fix, DialogTitle a11y) maps to a task above.
- [ ] No placeholders: every code block contains real code; no "TODO" or "TBD".
- [ ] Type consistency: `SiteCategory` redefined in Task 2 must match the `templateType` derivation logic in `useTemplateSelection.ts` updates.
- [ ] Test IDs match: tests in Task 2 + Task 4 reference roles/labels that the actual rendered components produce.
- [ ] Existing components reused — Tasks 1, 3, 5 don't create new components; they flip config + tweak CSS + thread props.

---

## Risks + Notes

- **Templates IA test (Task 2 Step 2)** assumes vibcoder Button uses `role="tab"` when inside `tablist`. If it doesn't, change `getByRole("tab", ...)` to `getByText(...)` and assert text presence + className.
- **CORS fix (Task 6)** requires dashboard restart. Production needs the editor's prod URL added to `ALLOWED_ORIGINS` via env var — call this out in the commit message.
- **My Templates filter (Task 2 Step 5)** is empty until user-saved-templates persistence ships. That's a separate arc; this plan only wires the IA pill.
- **Risk: panel width breakpoints in CSS** — many files probably hardcode `min-width: 800px` for grids. Task 3 + Task 4 cover the two big ones; if other panels regress, audit `*.css` for `min-width` rules referencing 600/700/800 values.
- **AquibraStudio onOpenFullpageMedia plumbing (Task 5 Step 3)** is the riskiest single step — if shell already routes Media via a separate fullpage modal, that path stays; if not, adds ~30 lines of state lift. Inspect first; if the wiring is non-trivial, ship Task 5 as a follow-up PR.
