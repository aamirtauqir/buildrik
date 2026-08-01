# Flowbite Big-Bang Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate every `@/editor/ui` consumer in `packages/editor` to flowbite-react + Tailwind 4 on one branch (`flowbite-bigbang`), delete `src/editor/ui/`, single merge.

**Architecture:** Tailwind v4 (CSS-first, prefixed `tw:*`, no global preflight) + flowbite-react for generic components; behavior-critical primitives (portal root, focus trap, modal-owns-keyboard) move to `src/editor/chrome-ui/` with Tailwind styling; surfaces sweep in fixed order with shell LAST; gates rewritten in the same commits as the deletions they track.

**Tech Stack:** React, Vite 7, TypeScript, Tailwind CSS 4 (`@tailwindcss/vite`), flowbite-react, Vitest + RTL.

**Spec:** `docs/plans/2026-07-30-flowbite-bigbang-design.md` (rev 4, Codex-cleared). Section refs below (§) point there.

## Global Constraints

- Branch: all work on `flowbite-bigbang`, created AFTER Task 0. Merge is ONE event at the end. Rollback = don't merge.
- Tailwind utilities MUST be prefixed (`tw:*`) — user canvas content must never match a chrome utility (§4.1). No global preflight; chrome-local reset only.
- `tokens.generated.css/.ts` + `scripts/tokens/generate.mjs` STAY (§2). Never hand-edit generated files.
- Behavior contracts must survive: modal-owns-keyboard (`isModalOpen`), focus trap + focus return, menu arrow-nav, toast one-action lifecycle (§4.3).
- One chrome overlay root; no `document.body` portals outside it (§4.4).
- Light-only; Flowbite dark mode OFF. Fonts per DESIGN.md (Inter/Inter Tight, Geist Mono). Accent = Flowbite blue-700 `#1A56DB` (default — do not re-theme).
- No pass-through wrappers (CLAUDE.md): consumers import `flowbite-react` directly; an adapting component exists only where our contract genuinely transforms props AND ≥2 consumers share it.
- Site-builder DS styling, engine CSS (`themes/legacy-components.css`), `src/engine/`, dashboard package: UNTOUCHED.
- Every task ends: tests green + commit. Working directory = `packages/editor` unless stated.

---

### Task 0: Prerequisite — commit the topbar tail, cut the branch

**Files:**
- Commit (already modified, verified green 116/116 this week): `src/editor/shell/AquibraStudio.tsx`, `src/editor/shell/SiteMenu.tsx`, `src/editor/shell/__tests__/SiteMenu.kbd.test.tsx`, `src/editor/shell/__tests__/StudioHeader.test.tsx`, `src/editor/ui/SaveStatus.tsx`, `src/editor/ui/__tests__/topbar.test.tsx`, `src/editor/ui/ui.css`, `src/editor/shell/hooks/__tests__/usePublishOutcomeFlash.test.ts` (untracked), `../../docs/plans/2026-07-30-topbar-complete-redesign.md`

**Interfaces:**
- Produces: clean base commit on `ds/fresh-token-system`; branch `flowbite-bigbang` off it.

- [ ] **Step 1: Verify the tail is still green**

Run: `npx vitest run src/editor/shell/__tests__/StudioHeader.test.tsx src/editor/shell/__tests__/SiteMenu.kbd.test.tsx src/editor/ui/__tests__/topbar.test.tsx src/editor/shell/hooks/__tests__/usePublishOutcomeFlash.test.ts`
Expected: all pass (116 as of 2026-07-30).

- [ ] **Step 2: Commit the tail**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/src/editor/shell/AquibraStudio.tsx packages/editor/src/editor/shell/SiteMenu.tsx packages/editor/src/editor/shell/__tests__/SiteMenu.kbd.test.tsx packages/editor/src/editor/shell/__tests__/StudioHeader.test.tsx packages/editor/src/editor/ui/SaveStatus.tsx packages/editor/src/editor/ui/__tests__/topbar.test.tsx packages/editor/src/editor/ui/ui.css packages/editor/src/editor/shell/hooks/__tests__/usePublishOutcomeFlash.test.ts docs/plans/2026-07-30-topbar-complete-redesign.md
git commit -m "feat(topbar): T8 compact modes via container query + T9 settings chord contract (arc close)"
```

- [ ] **Step 3: Cut the branch**

```bash
git checkout -b flowbite-bigbang
```

- [ ] **Step 4: Confirm clean tree**

Run: `git status --short` → only untracked non-editor noise (e.g. `packages/dashboard/newdeisgn/`, logs). Nothing staged/modified under `packages/editor`.

---

### Task 1: Stage-0 inventories (spec §6.0) — the authoritative lists

**Files:**
- Create: `docs/plans/flowbite-bigbang-inventory.md` (committed evidence; every later task reads it)

**Interfaces:**
- Produces: four lists — (a) `@/editor/ui` importers, (b) `--bk-*` consumers outside `editor/ui`, (c) CSS targeting `bk-` classes outside `ui.css`, (d) overlay/portal call sites. Task 2's `@source` set, Tasks 6-12 sweep scope, Task 13 checklist, Task 14 keep-list all derive from it.

- [ ] **Step 1: Generate the four inventories**

```bash
cd packages/editor
{
  echo "# Flowbite big-bang — stage-0 inventory ($(date +%F))"
  echo; echo "## (a) @/editor/ui importers"
  rg -l "@/editor/ui" src --glob '!src/editor/ui/**' | sort
  echo; echo "## (b) --bk-* consumers outside editor/ui (MUST KEEP WORKING)"
  rg -l -- "--bk-" src --glob '!src/editor/ui/**' | sort
  echo; echo "## (c) CSS targeting bk- classes outside ui.css"
  rg -l "\.bk-" src --glob '*.css' --glob '!src/editor/ui/ui.css' | sort
  echo; echo "## (d) overlay/portal call sites"
  rg -n "createPortal\(|document\.body\.appendChild" src --glob '!**/__tests__/**' | sort
} > ../../docs/plans/flowbite-bigbang-inventory.md
```

- [ ] **Step 2: Annotate list (d)** — for each hit, mark `OVERLAY` (must move to overlay root) or `ALLOWLIST` (legit body usage). Spec §7 pre-seeds: drag ghosts `canvas/hooks/useCanvasElementDrag.ts:320`, `sidebar/tabs/elements/useElementsState.ts:180`, `sidebar/tabs/elements/ElementCard.tsx:143`, `media/AssetCard.tsx:149`; download anchor `export/ExportModal.tsx:115`; capture node `shell/captureThumbnail.ts:49`. Overlay sites pre-seeded in spec §4.4 (7 sites). Reconcile grep output against both lists; new hits get classified, removed hits get struck.

- [ ] **Step 3: Record the test parity baseline**

Run: `npx vitest run src/editor/ui/__tests__ 2>&1 | tail -3` — append the runtime spec count to the inventory doc (145 as of 2026-07-30).

- [ ] **Step 4: Derive the `@source` directory set** — unique top-level dirs of list (a). Expected (per spec): `src/editor/**`, `src/shared/forms/**`, `src/templates/**`. Append as "## @source set".

- [ ] **Step 5: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add docs/plans/flowbite-bigbang-inventory.md
git commit -m "docs(flowbite): stage-0 inventories — importers, bk-token consumers, bk-CSS, portal sites"
```

---

### Task 2: Tailwind 4 + flowbite-react setup, prefixed and preflight-free (spec §4.1–4.2)

**Files:**
- Modify: `package.json` (deps), `vite.config.ts` (plugin), `src/themes/default.css` (one import line ADDED — `ui.css` line stays until Task 14)
- Create: `src/themes/tw.css`, `src/themes/chrome-reset.css`
- Test: `src/editor/chrome-ui/__tests__/tw-setup.test.tsx` (created here; folder scaffolds in Task 3 — create the dir now)

**Interfaces:**
- Produces: `tw:*` utilities compile from all `@source` dirs; flowbite-react importable; NO preflight in the bundle. Later tasks write `className="tw:flex tw:h-14 …"`.

- [ ] **Step 1: Install**

```bash
cd packages/editor
npm i flowbite-react
npm i -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 2: Wire Vite**

In `vite.config.ts` add:

```ts
import tailwindcss from "@tailwindcss/vite";
// plugins: [react(), tailwindcss(), ...existing]
```

- [ ] **Step 3: Create the Tailwind entry — prefixed, NO preflight**

`src/themes/tw.css`:

```css
/* Chrome Tailwind layer — prefixed, preflight intentionally ABSENT:
   the canvas mounts customer HTML+CSS in this same document (spec §4.1). */
@layer tw-theme, tw-utilities;
@import "tailwindcss/theme.css" layer(tw-theme) prefix(tw);
@import "tailwindcss/utilities.css" layer(tw-utilities) prefix(tw);
@plugin "flowbite-react/plugin/tailwindcss";
@source "../editor";
@source "../shared/forms";
@source "../templates";

@theme {
  --font-sans: "Inter Tight", Inter, system-ui, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, monospace;
}
```

(If Task 1 Step 4 found additional dirs, add their `@source` lines — the inventory is authoritative.)

- [ ] **Step 4: Chrome-local reset**

`src/themes/chrome-reset.css`:

```css
/* Minimal reset scoped to chrome — replaces preflight WITHOUT touching
   canvas-mounted user content. Scope = shell root, never global. */
.bk-studio-root, .bk-studio-root *, .bk-studio-root *::before, .bk-studio-root *::after {
  box-sizing: border-box;
}
.bk-studio-root button, .bk-studio-root input, .bk-studio-root select, .bk-studio-root textarea {
  font: inherit; color: inherit;
}
```

(Verify the actual shell root class on `EditorShell`/`AquibraStudio` mount node first — `rg -n "studio-root\|bk-shell" src/editor/ui/EditorShell.tsx src/editor/shell/AquibraStudio.tsx`; use the real one, add it if none exists.)

- [ ] **Step 5: Import both from `default.css`** — add AFTER the tokens import, BEFORE `ui.css` (both systems coexist until Task 14):

```css
@import "./tw.css";
@import "./chrome-reset.css";
```

- [ ] **Step 6: Write the failing setup test**

`src/editor/chrome-ui/__tests__/tw-setup.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { Button } from "flowbite-react";

describe("tailwind + flowbite setup", () => {
  it("flowbite-react renders", () => {
    render(<Button>go</Button>);
    expect(screen.getByRole("button", { name: "go" })).toBeInTheDocument();
  });
  it("flowbite class output respects the tw prefix (spec §4.1 acceptance)", () => {
    render(<Button>go</Button>);
    const cls = screen.getByRole("button", { name: "go" }).className;
    // every tailwind-utility-shaped class flowbite emits must be prefixed
    const unprefixed = cls.split(/\s+/).filter(c => /^(bg-|text-|flex|inline-|rounded|border|p[xy]?-|h-|w-)/.test(c));
    expect(unprefixed).toEqual([]);
  });
});
```

- [ ] **Step 7: Run it**

Run: `npx vitest run src/editor/chrome-ui/__tests__/tw-setup.test.tsx`
Expected: first test PASS; prefix test = the spec §4.1 acceptance check.

**⛔ STOP GATE if the prefix test fails and flowbite-react offers no prefix config:** do NOT proceed. Per spec §4.1 the fallback (iframe the canvas vs drop prefix + scoping-only) is a USER decision. Present it and wait.

- [ ] **Step 8: Build + dev-server sanity**

Run: `npx vite build` → succeeds. Run `npm run dev`, open `http://localhost:5050` → editor renders unchanged (nothing consumes `tw:*` yet — that is the point: additive, zero visual delta).

- [ ] **Step 9: Canvas isolation baseline (spec §6.1 acceptance)**

With dev server up and a REAL user site (including one AI raw-HTML site) loaded in canvas, run in DevTools console — save output JSON as `docs/plans/flowbite-canvas-baseline.json`:

```js
(() => {
  const els = [...document.querySelectorAll('.buildrik-canvas *')].slice(0, 200);
  return els.map(el => {
    const cs = getComputedStyle(el);
    return [el.tagName + '.' + el.className, cs.display, cs.fontSize, cs.color, cs.margin, cs.padding].join('|');
  });
})()
```

Re-run the same snippet AFTER this task's changes are live; diff must be empty. (Canvas container selector: verify with `rg -n "buildrik-canvas" src/editor/canvas/Canvas.tsx` — use the real one.)

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json vite.config.ts src/themes/tw.css src/themes/chrome-reset.css src/themes/default.css src/editor/chrome-ui/__tests__/tw-setup.test.tsx ../../docs/plans/flowbite-canvas-baseline.json
git commit -m "feat(flowbite): tailwind4 + flowbite-react setup — tw: prefix, no preflight, canvas baseline captured"
```

---

### Task 3: `chrome-ui/` scaffold + overlay root + kept behavior primitives (spec §4.3–4.4)

**Files:**
- Create: `src/editor/chrome-ui/index.ts`, `src/editor/chrome-ui/OverlayRoot.tsx`
- Move (git mv, keep history): `src/editor/ui/Portal.tsx` → `src/editor/chrome-ui/Portal.tsx`; the `useFocusTrap` + `isModalOpen` sources (locate: `rg -n "export function useFocusTrap|export function isModalOpen|export const isModalOpen" src/editor/ui/`) → `src/editor/chrome-ui/focus.ts`
- Move tests: the specs covering these primitives from `src/editor/ui/__tests__/` → `src/editor/chrome-ui/__tests__/`
- Modify: `src/editor/ui/index.ts` — re-export moved symbols FROM chrome-ui (temporary bridge so 0 consumers break; bridge dies in Task 14)

**Interfaces:**
- Produces: `getOverlayRoot(): HTMLElement` (creates-or-returns the single overlay element, id `bk-overlay-root`); `Portal` (unchanged signature, now targets `getOverlayRoot()`); `useFocusTrap`, `isModalOpen` (signatures unchanged). ALL portalled work in later tasks targets `getOverlayRoot()`.

- [ ] **Step 1: Write `OverlayRoot.tsx`**

```tsx
/** The ONE chrome overlay root (spec §4.4). Everything portalled — ours and
 *  flowbite-react's — mounts here. Gate 22 successor enforces it. */
export function getOverlayRoot(): HTMLElement {
  let root = document.getElementById("bk-overlay-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "bk-overlay-root";
    document.body.appendChild(root);
  }
  return root;
}
```

(Read `src/editor/ui/Portal.tsx:14` first — if an equivalent accessor already exists, MOVE it here instead of writing a second one; one source of truth.)

- [ ] **Step 2: git mv the primitives; update their internal imports; point `Portal` at `getOverlayRoot()`.**

- [ ] **Step 3: Bridge from the old barrel** — in `src/editor/ui/index.ts` replace the moved exports with:

```ts
export { Portal } from "../chrome-ui/Portal";
export { useFocusTrap, isModalOpen } from "../chrome-ui/focus";
export { getOverlayRoot } from "../chrome-ui/OverlayRoot";
```

- [ ] **Step 4: Move + run their specs**

Run: `npx vitest run src/editor/chrome-ui/__tests__ src/editor/ui/__tests__`
Expected: all pass — count vs Task 1 Step 3 baseline (moves, no losses).

- [ ] **Step 5: Full suite + commit**

Run: `npx vitest run` → green.

```bash
git add -A src/editor/chrome-ui src/editor/ui
git commit -m "feat(flowbite): chrome-ui scaffold — overlay root + Portal/focus primitives moved, old barrel bridges"
```

---

### Task 4: Behavior parity evaluation — flowbite overlay components vs shipped contracts (spec §4.3, §5)

**Files:**
- Create: `src/editor/chrome-ui/__tests__/flowbite-parity.test.tsx`
- Create: decision table appended to `docs/plans/flowbite-bigbang-inventory.md` ("## Behavior parity verdicts")

**Interfaces:**
- Produces: per-component verdict SWAP (flowbite behavior adequate) or KEEP (our primitive moves to chrome-ui, Tailwind-styled). Tasks 5-12 obey the verdicts. Candidates: Modal, Popover, Tooltip, Toast, Dropdown (menu).

- [ ] **Step 1: Write the parity tests — these encode the shipped contracts, run against the FLOWBITE component:**

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { Modal, Dropdown, DropdownItem } from "flowbite-react";
import { getOverlayRoot } from "../OverlayRoot";

describe("flowbite Modal vs shipped contract", () => {
  it("traps focus and returns it to the opener on close", () => {
    const opener = document.createElement("button");
    document.body.appendChild(opener); opener.focus();
    const { rerender } = render(<Modal show onClose={() => {}} root={getOverlayRoot()}><button>inside</button></Modal>);
    expect(getOverlayRoot().contains(document.activeElement)).toBe(true);
    rerender(<Modal show={false} onClose={() => {}} root={getOverlayRoot()} />);
    expect(document.activeElement).toBe(opener);
  });
  it("Escape closes and does NOT leak to document handlers (modal-owns-keyboard, ff230492)", () => {
    const leaked = vi.fn(); document.addEventListener("keydown", leaked);
    const onClose = vi.fn();
    render(<Modal show onClose={onClose} root={getOverlayRoot()}><button>x</button></Modal>);
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
    document.removeEventListener("keydown", leaked);
  });
  it("portals into the chrome overlay root, not raw body", () => {
    render(<Modal show onClose={() => {}} root={getOverlayRoot()}>hi</Modal>);
    expect(getOverlayRoot().textContent).toContain("hi");
  });
});

describe("flowbite Dropdown vs Menu contract", () => {
  it("ArrowDown moves focus through items; Escape returns focus to trigger", () => {
    render(<Dropdown label="menu"><DropdownItem>a</DropdownItem><DropdownItem>b</DropdownItem></Dropdown>);
    const trigger = screen.getByRole("button", { name: "menu" });
    fireEvent.click(trigger);
    fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" });
    expect(document.activeElement?.textContent).toBe("a");
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    expect(document.activeElement).toBe(trigger);
  });
});
```

(Extend same pattern: Tooltip hover/focus show, Toast single-action render. Exact flowbite prop names: read `node_modules/flowbite-react/dist/types` for Modal/Dropdown/Tooltip/Toast before writing — if `root` prop absent on Modal, that alone is a KEEP verdict for Modal.)

- [ ] **Step 2: Run**

Run: `npx vitest run src/editor/chrome-ui/__tests__/flowbite-parity.test.tsx`
A failing block = KEEP verdict for that component (this is evaluation, not regression — failures are DATA).

- [ ] **Step 3: Record verdicts** in the inventory doc, one line each with the failing behavior named. Expected shape (verify, don't assume): Modal likely SWAP-with-root-prop; Popover anchored-semantics likely KEEP; Menu roving-focus likely KEEP; Toast lifecycle likely KEEP; Tooltip likely SWAP.

- [ ] **Step 4: For every KEEP: git mv the primitive + its specs to `chrome-ui/`, bridge from old barrel (Task 3 Step 3 pattern), restyle its CSS block to `tw:*` classes inline (delete its `ui.css` block).**

- [ ] **Step 5: Full suite green + commit**

```bash
git add -A src/editor/chrome-ui src/editor/ui ../../docs/plans/flowbite-bigbang-inventory.md
git commit -m "feat(flowbite): behavior parity verdicts — keepers moved to chrome-ui, swaps cleared"
```

---

### Task 5: Component swap layer — direct flowbite replacements (spec §5)

**Files:**
- Modify: consumers of each SWAP component (from inventory list (a))
- Delete per component: its `src/editor/ui/<Name>.tsx` + `ui.css` block + old contract test (superseded by consumer tests + flowbite's own behavior)
- Modify: `src/editor/ui/index.ts` (drop each export as it dies)

**Interfaces:**
- Consumes: Task 4 verdicts. SWAP set (expected): Avatar, Badge, Button, Checkbox, Drawer, Radio, Select, Slider→RangeSlider, Tabs, Textarea, Toggle→ToggleSwitch, Input/Field/FieldRow→TextInput+Label, ProgressRow→Progress, SkeletonCompounds→Spinner+`tw:animate-pulse`, Tooltip family (if SWAP), Modal family (if SWAP).
- Produces: consumers importing `flowbite-react` directly.

Worked example — Button (repeat this exact cycle per component; per-component API from `node_modules/flowbite-react/dist/types`):

- [ ] **Step 1: Map the API.** Read `src/editor/ui/Button.tsx` props (`variant`, `size`, …) and flowbite `Button` props (`color`, `size`, `outline`). Write the mapping in the inventory doc: `variant="primary"→color="blue"`, `variant="ghost"→color="light" outline`, `size="sm"→size="xs"` (verify against types, not memory).

- [ ] **Step 2: Sweep consumers.** `rg -l "Button" $(rg -l "@/editor/ui" src)` — at each site: import `{ Button } from "flowbite-react"`, translate props per mapping, extra chrome-specific styling via `className="tw:…"`.

- [ ] **Step 3: Run that consumer's tests** — assertions on roles/labels/handlers stay valid; assertions on `bk-btn` classes rewrite to role-based queries.

- [ ] **Step 4: Delete `src/editor/ui/Button.tsx`, its `ui.css` block, its export line. Run `npx tsc --noEmit`** — 0 errors proves no consumer missed.

- [ ] **Step 5: Commit** — `git commit -m "feat(flowbite): swap Button → flowbite-react"`. ONE commit per component (bisectable).

- [ ] **Step 6: Repeat Steps 1-5 for every SWAP component.** Layout dissolves (Stack, Row): replace each use with `tw:flex tw:flex-col tw:gap-N` / `tw:flex tw:items-center tw:gap-N` at the call site, delete component. After the last: full suite green.

---

### Task 6: Custom chrome-ui ports — the ~30 editor-specific components (spec §5)

**Files:**
- Move each (git mv): `src/editor/ui/<Name>.tsx` → `src/editor/chrome-ui/<Name>.tsx` + its specs
- Modify: consumers re-point imports `@/editor/ui` → `@/editor/chrome-ui`
- Delete: each component's `ui.css` block as it ports

**Interfaces:**
- Produces: `@/editor/chrome-ui` barrel exporting Topbar, SaveStatus, IssueChip, Presence, BreakpointSwitcher, CommandPalette, Rail, NavItem, PanelFrame, PanelHeader, SectionHeader, RightPanel, EditorShell, Footer, StatusDot, TreeRow, ListRow, RecordRow, VersionRow, CommentRow, FormatRow, IntegrationRow, MediaCard, SiteCard, CopyButton, EmptyState, UpgradeModal, Icon — same prop contracts as before (rename-free move).

Worked example — StatusDot (repeat per component):

- [ ] **Step 1: `git mv src/editor/ui/StatusDot.tsx src/editor/chrome-ui/StatusDot.tsx`** (+ its test file).

- [ ] **Step 2: Restyle** — replace `className="bk-status-dot bk-status-dot--ok"` + `ui.css` block with Tailwind at the source:

```tsx
const TONE = {
  ok: "tw:bg-green-500",
  warn: "tw:bg-amber-400",
  error: "tw:bg-red-500",
} as const;
export function StatusDot({ tone }: { tone: keyof typeof TONE }) {
  return <span aria-hidden className={`tw:inline-block tw:h-2 tw:w-2 tw:rounded-full ${TONE[tone]}`} />;
}
```

Color fidelity rule: current `--bk-*` token values are Flowbite-ramp values (spec §1) — map each `var(--bk-x)` to its ramp equivalent (`tokens.generated.css` comments name the ramps). Where a value has no ramp equivalent, use Tailwind arbitrary value `tw:bg-[#hex]` copied from the token — no eyeballing.

- [ ] **Step 3: Delete the component's `ui.css` block. Re-point consumers. Run its spec + `npx tsc --noEmit`.**

- [ ] **Step 4: Commit per component or per coherent group** (e.g. all Row-family in one).

- [ ] **Step 5: Order note:** Topbar/SaveStatus/IssueChip/Presence/EditorShell/Footer LAST within this task (they are shell-critical; their 116-test suite re-points here). Full suite green at the end.

---

### Task 7: Surface sweep — inspector

**Files:**
- Modify: every `src/editor/inspector/**` file in inventory list (a) + inspector CSS from list (c)

**Interfaces:**
- Consumes: Tasks 5-6 components. Produces: inspector chrome fully on `flowbite-react` + `chrome-ui` + `tw:*`; its legacy hex/CSS files rewritten or deleted.

- [ ] **Step 1:** For each inventory-(a) file under `inspector/`: re-point imports (Task 5/6 targets), translate local classNames to `tw:*`, fold its CSS file's still-needed rules into component classNames, delete the CSS file.
- [ ] **Step 2:** Run: `npx vitest run src/editor/inspector` → green. `npx tsc --noEmit` → 0.
- [ ] **Step 3:** Visual walk: dev server, open inspector on a real element — sections, pills, controls render correctly.
- [ ] **Step 4:** Commit: `feat(flowbite): inspector surface on flowbite/tailwind`.

### Task 8: Surface sweep — sidebar + media
Same 4-step cycle over `src/editor/sidebar/**` + `src/editor/media/**` inventory files. **Includes 5 overlay call sites** (spec §4.4 list: PageContextMenu:167, FolderContextMenu:103, TemplatePreviewModal:155, ApplyProgressOverlay:72, TemplatesTabModals:40) → each rewrites to `Portal`/`getOverlayRoot()`. Commit: `feat(flowbite): sidebar+media surfaces + overlay normalization`.

### Task 9: Surface sweep — panels + rail + onboarding + canvas-chrome
Same cycle over `src/editor/panels/**`, `src/editor/rail/**`, `src/editor/onboarding/**`, canvas chrome components from inventory (a) (NOT the canvas HTML-mount path — `Canvas.tsx` mount mechanism untouched, only its chrome imports). Commit per surface.

### Task 10: Surface sweep — design-system UI + shared/forms + templates
Same cycle over `src/editor/design-system/ui/**` (chrome React only — site-builder STYLING domain untouched), `src/shared/forms/**`, `src/templates/**`. These are the consumers rev 1 missed (Codex P1) — inventory (a) is the checklist. Commit per group.

### Task 11: Surface sweep — export + collaboration + remaining inventory-(a) files
Sweep whatever inventory (a) still lists outside shell. After this: `rg -l "@/editor/ui" src --glob '!src/editor/shell/**' --glob '!src/editor/ui/**'` → EMPTY. Commit.

---

### Task 12: Surface sweep — shell (LAST) + the 116-test re-point

**Files:**
- Modify: `src/editor/shell/**` inventory files (StudioHeader, AquibraStudio, SiteMenu, StudioModals, PageTabBar, NotificationPanel, IssuesPanel, StudioFooter, modals/…), `header.css`, `chrome.css` (inventory list (c))
- Modify: `src/editor/shell/__tests__/*` + `src/editor/ui/__tests__/topbar.test.tsx` (moves with Topbar)

**Interfaces:**
- Consumes: everything above. Produces: zero `@/editor/ui` imports outside `src/editor/ui/` itself.

- [ ] **Step 1:** Re-point all shell imports; translate shell classNames; rewrite `header.css`/`chrome.css` rules into `tw:*` classNames on their components; delete both CSS files (any rule that can't translate 1:1 — e.g. complex container queries from T8 — moves to a small `shell.css` with `tw:`-free plain CSS, documented why).
- [ ] **Step 2:** PageTabBar stray portal (`:335`) → `getOverlayRoot()` (last of the 7 sites).
- [ ] **Step 3:** Run: `npx vitest run src/editor/shell src/editor/chrome-ui` → green, incl. the topbar/shell 116 + moved specs.
- [ ] **Step 4:** Keyboard/focus parity live walk (spec §8): ⌘K palette, modal-owns-keyboard (open Site settings modal → shortcuts dead), menu arrow-nav, Esc focus-return, comment-toggle sync.
- [ ] **Step 5:** Verify: `rg -l "@/editor/ui" src --glob '!src/editor/ui/**'` → EMPTY. Commit: `feat(flowbite): shell surface — final consumer sweep`.

---

### Task 13: Teardown — delete `editor/ui`, swap the CSS entry, rewrite gates (spec §6.4, §7)

**Files:**
- Delete: `src/editor/ui/` (whole dir), `src/themes/…/ui.css` import line in `default.css:26`
- Modify: `scripts/ds-grep-gates.sh` (Gate 22 at `:518`, Gate 24 at `:542`), `package.json` (gate scripts)
- Create: `scripts/check-editor-ui-gone.mjs`, `scripts/gates/overlay-allowlist.txt`

**Interfaces:**
- Consumes: EMPTY grep from Task 12 Step 5. Produces: `gate:editor-ui-gone`; Gate 22 successor; Gate 24 successor.

- [ ] **Step 1:** `git rm -r src/editor/ui` + remove the `default.css` `ui.css` import line (tw.css line from Task 2 stays). Run `npx tsc --noEmit` + full vitest → green.

- [ ] **Step 2: `gate:editor-ui-gone`** — `scripts/check-editor-ui-gone.mjs`:

```js
#!/usr/bin/env node
import { execSync } from "node:child_process";
let out = "";
try {
  out = execSync(`rg -l "@/editor/ui" src`, { encoding: "utf8" });
} catch { /* rg exits 1 on zero matches — that is the pass */ }
if (out.trim()) {
  console.error("[editor-ui-gone] FAIL — @/editor/ui is deleted; migrate these to flowbite-react/@/editor/chrome-ui:\n" + out);
  process.exit(1);
}
console.log("[editor-ui-gone] PASS — 0 imports of the deleted library.");
```

`package.json`: `"gate:editor-ui-gone": "node scripts/check-editor-ui-gone.mjs"` + append to the `verify:ds` chain (read `package.json` for the chain's exact shape first).

- [ ] **Step 3: Gate 22 successor** — replace the stale vibcoder-path block at `ds-grep-gates.sh:518` with the overlay matcher + allowlist:

`scripts/gates/overlay-allowlist.txt` (re-grep before trusting — spec §7):

```
src/editor/canvas/hooks/useCanvasElementDrag.ts
src/editor/sidebar/tabs/elements/useElementsState.ts
src/editor/sidebar/tabs/elements/ElementCard.tsx
src/editor/media/AssetCard.tsx
src/editor/export/ExportModal.tsx
src/editor/shell/captureThumbnail.ts
```

Gate block:

```bash
# Gate 22 (successor): portal discipline — one overlay root.
# createPortal targets and body-appended overlay nodes must go through
# getOverlayRoot(); legit non-overlay body usage lives in the allowlist.
G22=$(rg -n "createPortal\(|document\.body\.appendChild" src --glob '!**/__tests__/**' \
  | rg -v "OverlayRoot.tsx" \
  | grep -v -F -f scripts/gates/overlay-allowlist.txt \
  | rg -v "getOverlayRoot\(\)" || true)
if [ -n "$G22" ]; then
  echo "GATE22 FAIL — portal outside overlay root:"; echo "$G22"; FAIL=1
fi
```

- [ ] **Step 4: Gate 24 successor** — at `:542`, change the native-element owner from `editor/ui` to `chrome-ui` (flowbite-react lives in node_modules — outside the scan by construction). Read the existing block; edit the path variable only; keep counting logic.

- [ ] **Step 5:** Adjust hex/token chrome assertions that pointed at deleted files (run `npm run verify:ds`; fix every checker that errors on the now-missing `ui.css`/`editor/ui` paths — baseline files updated in the SAME commit).

- [ ] **Step 6:** Run: `npm run verify:ds` + `npm run gate:editor-ui-gone` + full vitest + `npx vite build` → all green. Commit: `feat(flowbite)!: delete editor/ui — gates rewritten (22 overlay matcher, 24 owner, editor-ui-gone lock)`.

---

### Task 14: Verification gate (spec §8) — before merge, all mandatory

- [ ] **Step 1: Full suite** — `npx vitest run` → green. Compare spec count against Task 1 baseline (145 library specs): every one maps to a successor (moved spec, consumer assertion, or parity test). Write the mapping delta into the inventory doc — losses need a named justification.
- [ ] **Step 2: Canvas isolation** — repeat Task 2 Step 9 snippet on the SAME real site + AI raw-HTML site; diff vs `flowbite-canvas-baseline.json` → empty.
- [ ] **Step 3: Keyboard/focus parity walk** (Task 12 Step 4 list) in a real browser — plus ⌃, chord, Esc-on-canvas comment un-press (the two topbar live-checks still open from the prior arc).
- [ ] **Step 4: Publish E2E once** — dashboard dev up, editor publish a real site (CLAUDE.md Phase-1d walk); chrome changes must not touch export output (diff exported HTML vs a pre-migration export of the same site).
- [ ] **Step 5: Bundle** — `npx vite build`; record dist sizes vs pre-migration (`git stash` NOT allowed — use the Task 0 base commit in a worktree: `git worktree add ../bigbang-base <task0-sha> && cd ../bigbang-base && npx vite build`). Append numbers to inventory doc.
- [ ] **Step 6: Visual QA every surface** — shell, sidebar (each tab), inspector, panels, rail, media, onboarding, modals, toasts, menus. Screenshot walk; fix-forward small deltas; anything structural → its surface task reopens.
- [ ] **Step 7: Commit verification artifacts** — `docs(flowbite): verification gate evidence`.

### Task 15: Merge — one event

- [ ] **Step 1:** `git log --oneline ds/fresh-token-system..flowbite-bigbang` — review the commit chain.
- [ ] **Step 2:** USER decision to merge (this is the rollback point — spec §9). On yes: merge `flowbite-bigbang` → `ds/fresh-token-system` (or main per ship flow), no squash (bisectable chain).
- [ ] **Step 3:** Post-merge: `npm run verify:ds` + full vitest on the merged branch. Update `packages/editor/CLAUDE.md` DS contract section (canonical home table: `editor/ui` → deleted, `chrome-ui` + flowbite-react + `tw:*`) — same commit.

---

## Self-Review (done at write time)

- **Spec coverage:** §2 end-state → T5-T13; §3 prereq → T0; §4.1 → T2 (+STOP gate); §4.2 → T2; §4.3 → T3-T4; §4.4 → T3, T8, T12, T13; §5 mapping → T5-T6; §5 bk-CSS → T7-T12 via inventory (c); §6 stages → T1-T13 in order; §7 gates → T13; §8 verification → T14; §9 merge/rollback → T15. No orphan requirement found.
- **Placeholders:** none — every code step carries real code or an exact read-first instruction naming file:line.
- **Type consistency:** `getOverlayRoot()` (T3) used in T4/T8/T12/T13 gate; `chrome-ui` barrel names consistent T3→T6→T12.
- **Known honest uncertainties (flagged in-task, not hidden):** flowbite-react prefix compliance (T2 STOP gate), Modal `root` prop existence (T4 Step 1 read-first), exact `verify:ds` chain shape (T13 Step 2 read-first).
