# CLAUDE.md — Buildrik (Aquibra Editor L2)

## Project Overview

Visual web builder/editor. React 18 + TypeScript + Vite. Chrome styling =
generated `--bk-*` tokens + `flowbite-react` primitives + `tw:`-prefixed
Tailwind utilities, composed in `src/editor/chrome-ui/`; Emotion is RETIRED
for chrome (4 residual files pending cleanup, unrelated to the canvas).
Core engine: `src/engine/Composer.ts` — central orchestrator with 25+ managers.
Demo app: `demo/main.tsx` on port 5050.

## Tech Stack

- **React 18.3** (devDep) + **TypeScript 5.3** (strict mode)
- **Vite 7.2** (dev server + bundler)
- **Generated design tokens** (`src/themes/tokens.generated.css` from Figma) + `flowbite-react` component library, styled with `tw:`-prefixed Tailwind utilities (`src/editor/chrome-ui/`) — no CSS-in-JS for chrome
- **Lucide React** — icons
- **GSAP** — animations
- **Zod** — schema validation
- **Sentry** — error tracking
- **Vitest** — testing

## FIGMA UI REBUILD — THE LOOP (founder rules, 2026-08-06)

Full-UI rebuild in progress: every editor surface rebuilt to Figma
`g4GzQFqzNYz5sosz1QtZXC` page `1:3`. Checklist = `scripts/conformance/boards.json`
(300 active boards / 33 families as of 2026-08-07). The 2026-08-06 plan doc was
removed on founder order 2026-08-07 (superseded by
`docs/plans/2026-08-07-editor-figma-completion.md`; recovery: git history).

**Precedence (founder, final):** behaviour → the CODE contract (Zod schemas,
service returns — proof: the 8-row pre-checks board was corrected TO the code).
Everything VISUAL — layout, colour, type, copy on screen — → the BOARD.
Board sample data ("Bella Cucina", "In review · 3 open", "Nothing matches
'hero'") is never conformed to literally; the SHAPE is the contract.

**The build loop, per board — Figma's official skill, not homegrown tooling:**
1. Load `figma:figma-design-to-code`, then `get_design_context(board)` —
   reference code + screenshot + component docs.
2. Build from the reference, adapted to chrome-ui + `tw:` + `--bk-*` tokens.
3. **Verify = board screenshot vs live screenshot, side by side, by eye.**
   Live at 1440×900, element selected where the board shows selection.
   Not matching → keep fixing. This is the acceptance, nothing else.
4. Tests protecting the OLD design get rewritten in the same commit
   (`PageList.test.tsx:55` asserted drifted copy for months).

**The conformance harness (`scripts/conformance/`) is a REGRESSION NET ONLY.**
Property probes are thermometers — they answer only what they are asked and
went silent while the inspector body diverged wholesale from its board. A
probe result is never accepted as visual verification. (Founder call,
2026-08-06, after exactly that failure.)

Traps already hit: `.layout-shell__*` classes reused inside `.bd-studio` (flex
host) lose their grid-area sizing — set explicit heights. `AquibraStudio.tsx`
mid-edit in the founder's tree → never stage it from an agent session.

## Path Aliases

```
@/*       → ./src/*
@shared/* → ./src/shared/*
@hooks/*  → ./src/hooks/*
@utils/*  → ./src/utils/*
```

(`@components/*` removed 2026-05-02 with src/components/ deletion.)
(`@features/*` removed 2026-05-03 with single-tenant src/features/ deletion — design-system folded into editor/design-system/.)

---

## ARCHITECTURE RULES — YEH CHEEZEIN MAT KARO

Jab bhi code mein changes karo, yeh anti-patterns STRICTLY avoid karo:

### 1. Pass-through wrapper functions NAHI

```ts
// GALAT — wrapper jo kuch nahi karta
function getElements() {
  return composer.elements.getAll();
}

// SAHI — direct access karo
composer.elements.getAll();
```

Agar function sirf doosri function call kar raha hai bina koi logic add kiye — DELETE karo. Direct import karo source se.

### 2. Middle-man classes/functions NAHI

```ts
// GALAT — class jo sirf delegate karti hai
class ElementService {
  constructor(private manager: ElementManager) {}
  getById(id: string) { return this.manager.getById(id); }
  delete(id: string) { return this.manager.delete(id); }
}

// SAHI — ElementManager directly use karo
```

Agar class/function ka har method doosre object ko call karta hai without adding logic, validation, or transformation — it's a middle-man. Remove it.

### 3. Duplicate logic / Semantic duplication NAHI

```ts
// GALAT — same logic do jagah
// file1.ts
const isVisible = element.styles.display !== 'none' && element.styles.visibility !== 'hidden';
// file2.ts
const isElementVisible = el.styles.display !== 'none' && el.styles.visibility !== 'hidden';

// SAHI — ek jagah likho, import karo
// shared/utils/visibility.ts
export const isElementVisible = (el: Element) =>
  el.styles.display !== 'none' && el.styles.visibility !== 'hidden';
```

Same concept, same calculation, same check = ek function, ek jagah.

### 4. Single Source of Truth (SSOT) violations NAHI

```ts
// GALAT — same data do jagah define
const PANEL_WIDTH = 280; // in sidebar component
const SIDEBAR_W = 280;   // in layout component

// SAHI — constants ek file mein
// shared/constants/layout.ts
export const PANEL_WIDTH = 280;
```

Types, constants, configs = ek canonical file. Baaki sab import karte hain. Koi bhi value do jagah hardcode mat karo.

### 5. Mixed responsibility files NAHI

```ts
// GALAT — ek file mein UI + API + state + validation sab kuch
export function PageSettings() {
  const [data, setData] = useState(null);
  const validate = (d) => { /* validation logic */ };
  const save = async () => { /* API call */ };
  return <form>...</form>;
}

// SAHI — alag karo
// hooks/usePageSettings.ts — state + API
// utils/validatePage.ts — validation
// components/PageSettings.tsx — sirf UI rendering
```

Ek file = ek kaam. Agar file mein 2+ unrelated concerns hain — split karo.

### 6. Dead code / Unused exports NAHI

Agar koi function, component, type, ya constant kahi bhi import nahi ho raha — DELETE karo. Comments mein mat chhodo, `_unused` prefix mat lagao. Git history mein hai agar wapas chahiye.

### 7. Over-fragmented flow NAHI

```ts
// GALAT — itni files ke flow trace karna impossible
// handleClick → calls actionCreator → calls dispatcher → calls middleware → calls reducer → calls selector → updates component

// SAHI — minimum indirection
// handleClick → calls composer.method() → state updates → component re-renders
```

Agar koi action ko trace karne ke liye 5+ files kholni padein — flow over-fragmented hai. Maximum 3 hops: trigger → logic → effect.

### 8. Hidden side effects NAHI

```ts
// GALAT — function naam se lagta hai read-only hai but secretly mutate karta hai
function getElementStyles(el: Element) {
  el.markAsAccessed(); // HIDDEN SIDE EFFECT
  return el.styles;
}

// SAHI — naam mein clear karo ya alag karo
function getElementStyles(el: Element) {
  return el.styles; // pure read
}
function accessElement(el: Element) {
  el.markAsAccessed(); // explicit mutation
}
```

Function jo "get" ya "compute" kehti hai woh mutate nahi karni chahiye. Side effects explicit hone chahiye — naam se, return type se, ya documentation se.

### 9. High coupling / Low cohesion NAHI

```ts
// GALAT — Canvas component directly Media panel ki internal state access karta hai
import { mediaStore } from '../panels/media/store';
// Canvas mein: mediaStore.selectedFile

// SAHI — well-defined interface through composer
composer.media.getSelected();
```

Modules apne peers ki internals directly access nahi karenge. Communication = events ya Composer methods se. Agar do modules ek doosre ke internal files import karte hain — yeh coupling problem hai.

---

## FOLDER STRUCTURE RULES

### Ownership & Boundaries

```
src/
├── engine/          # CORE — Pure logic, no React, no UI
│                    # Owner: Composer.ts + managers
│                    # Rule: engine/ KABHI bhi editor/ ya components/ import nahi karega
│
├── editor/          # NEW UI — Production refactored components (USE THIS)
│   ├── shell/       # AquibraStudio main shell + top bar
│   ├── canvas/      # Canvas rendering, selection, drag
│   ├── sidebar/     # Left sidebar panels (templates, pages, build, media, design, settings, history)
│   ├── inspector/   # Right panel — element properties
│   ├── panels/      # Shared panel components (layers)
│   ├── rail/        # Left icon rail navigation
│   ├── media/       # Media library feature
│   ├── onboarding/  # Onboarding flow
│   ├── collaboration/ # Real-time collaboration
│   ├── ecommerce/   # E-commerce features
│   ├── export/      # Export functionality
│   ├── sync/        # Sync features
│   └── animation/   # Animation components
│
│                    # NOTE: src/components/ DELETED 2026-05-02 (graveyard cleanup).
│                    # Was 219 files (95% redirect shims to canonical editor/ paths,
│                    # plus 2 L0-stub files + a few barrels). Public API at src/index.ts
│                    # simplified to canonical-only exports. tsconfig + vite.config
│                    # `@components/*` alias removed. ESLint Survivor #6 ban-rule retired.
│

├── shared/          # SHARED — Types, utils, hooks (leaf dependency)
│   ├── types/       # All TypeScript interfaces/types (SSOT for types)
│   ├── constants/   # All constants (SSOT for constants)
│   ├── hooks/       # Reusable React hooks
│   ├── utils/       # Pure utility functions
│   └── forms/       # Form field compositions (label/hint/error wiring on
│                    # @/editor/chrome-ui controls — the one shared/→editor edge)
│
│                    # NOTE: shared/ui/ + shared/extensions/ DELETED 2026-07-28
│                    # (stage 6 of ds/fresh-token-system). Their survivors were
│                    # ported into src/editor/ui/ (CopyButton, SkeletonCompounds,
│                    # UpgradeModal, HelpTooltip, PanelHeaderActions) or
│                    # src/editor/shared/elementIcons.tsx (element glyph map).
│
│                    # NOTE: src/features/ DELETED 2026-05-03. Held only
│                    # `design-system/` (site-builder tokens). Single-tenant
│                    # top-level dir = smell — folded into `editor/design-system/`
│                    # alongside peer domains (editor/media/, editor/animation/,
│                    # editor/onboarding/, etc.). 18 bridge shims at
│                    # `editor/sidebar/tabs/design/` deleted in same PR.
│
├── blocks/          # BLOCKS — Pre-built element templates (read-only data)
├── templates/       # TEMPLATES — Page templates (read-only data)
├── services/        # EXTERNAL — Third-party API integrations
├── ai/              # AI — AI-related utilities
├── themes/          # THEMES — CSS variables, theme configs, global styles
└── styles/          # STYLES — Global CSS, tokens
```

### Import Direction Rules (STRICT)

```
engine/    → shared/ (ONLY)
editor/    → engine/, shared/, blocks/, templates/
services/  → shared/ (ONLY)
shared/    → NOTHING from other src/ folders (leaf dependency).
            EXCEPTION: shared/forms/ files MAY import from @/editor/chrome-ui
            (the component library). This is the only intentional
            shared/→editor/ edge in the graph — forms/ exists
            specifically to compose library controls with field wiring.
blocks/    → shared/ (ONLY)
templates/ → shared/ (ONLY)
themes/    → shared/ (ONLY)
```

**VIOLATION EXAMPLE:**
```ts
// GALAT — engine importing from editor
// src/engine/SomeManager.ts
import { SomePanel } from '../editor/sidebar/tabs/SomePanel'; // NAHI!

// GALAT — shared importing from editor
// src/shared/utils/something.ts
import { designTokens } from '../../editor/design-system'; // NAHI!
```

### New Code = editor/ folder

- Naya feature? `editor/` mein banao
- Legacy `components/` file edit karni hai? Socho kya `editor/` mein move karna better hai
- Naya shared utility? `shared/` mein daalo
- Naya type? `shared/types/` mein daalo
- New constant? `shared/constants/` mein daalo
- Pure business logic (no React)? `engine/` mein daalo

### File Naming

- Components: `PascalCase.tsx` (e.g., `PageSettings.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `usePageSettings.ts`)
- Utils: `camelCase.ts` (e.g., `validatePage.ts`)
- Types: `PascalCase.ts` or inside `types/` folder (e.g., `PageTypes.ts`)
- Constants: `UPPER_SNAKE_CASE` exports, `camelCase.ts` files
- Tests: `__tests__/ComponentName.test.tsx` (co-located with source)
- Index files: barrel exports only — NO logic in index.ts

---

## DESIGN SYSTEM — SSOT CONTRACT (rewritten 2026-07-31, flowbite-bigbang Task 13)

Ek concept = ek canonical home. Duplicate allowed nahi. Violation = auto-reject.

| Concept | Canonical Home | Status |
|---------|---------------|--------|
| Chrome design tokens (`--bk-*`, ONE flat tier) | `src/themes/tokens.generated.css` + `.ts` | GENERATED from Figma (`scripts/tokens/figma-tokens.json` → `scripts/tokens/generate.mjs`). Hand-edit = build failure (`gate:tokens-generated`). Change a value in Figma, re-export, regenerate. Still the SSOT for chrome tokens post-flowbite — non-chrome consumers depend on it too (`styles/tokens/canvas.tokens.ts`, `legacy-components.css`, site-builder DS). |
| Component library | `src/editor/chrome-ui/` (React) + `flowbite-react` (behavior/primitives, from `node_modules`) | CANONICAL — every chrome component composes flowbite-react primitives styled with `tw:`-prefixed Tailwind utility classes (no separate CSS bundle). Mirrors a Figma node where one exists. 0 hex, 0 fallbacks. Contract tests in `chrome-ui/__tests__/` (incl. `flowbite-parity.test.tsx`, which documents behavior deltas against flowbite's built-ins). |
| Tailwind class-list pipeline | `.flowbite-react/class-list.json` (repo root) via `pnpm flowbite:classlist` (`flowbite-react build`) | flowbite-react's own component theme files live in `node_modules`, invisible to Tailwind's `@source` globs. The generated class-list is the literal-string source Tailwind's JIT needs to compile those classes. Regenerate whenever a new flowbite-react component is imported. Prefix is `tw` everywhere — must match `flowbiteStore.ts`'s `setStore({prefix: "tw"})` exactly, or classes compile unprefixed and collide with canvas-mounted customer CSS (spec §4.1). |
| a11y rules (focus-visible, reduced-motion) | `src/themes/design-system/a11y.css` | CANONICAL — real rules, not tokens. Only file allowed `@media (prefers-*)`. |
| Site-builder tokens (user output, not chrome) | `src/editor/design-system/` + `themes/design-system/design.css` | CANONICAL — different domain, never merge with chrome DS, never regenerate from Figma (would restyle customers' published sites). |
| Final residual engine selectors | `src/themes/legacy-components.css` | Canvas container, drag cursor, selection ring, vendor pseudo-elements. DO NOT add new rules. |
| ~~Vibcoder library~~ | ~~`editor/shared/vibcoder/` + `themes/components/`~~ | DELETED 2026-07-28 (stage 6) — 70 primitives, 76 CSS files, 54 galleries. `shared/extensions/` + `shared/ui/` deleted same day. |
| ~~`editor/ui/` (ds/fresh-token-system component library)~~ | ~~`src/editor/ui/` + `ui.css`~~ | DELETED 2026-07-31 (flowbite-bigbang Task 13) — its own successor, `editor/chrome-ui/`, absorbed every consumer across Tasks 2-12 first. `gate:editor-ui-gone` locks the import path at zero. |

### SSOT decision tree (before writing any DS / UI code)

1. Naya token? → change it in Figma, re-export `figma-tokens.json`, run `node scripts/tokens/generate.mjs`. NEVER hand-edit `tokens.generated.*`, never define a chrome token anywhere else.
2. Naya primitive/component? → check `src/editor/chrome-ui/index.ts` first, then flowbite-react's own exports. Already hai? Use it.
3. Nahi hai? → Add to `src/editor/chrome-ui/<Name>.tsx`, composing a flowbite-react primitive where one fits and styling it with `tw:`-prefixed Tailwind utilities (`--bk-*` tokens via `var(--bk-*)` inside those utilities, weights ≤600, focus `var(--bk-shadow-focus)`) + export from `index.ts` + contract tests. New flowbite-react component import? Run `pnpm flowbite:classlist` so its classes land in the class-list Tailwind compiles from.
4. Naya chrome layout / panel / view? → `editor/[domain]/`, composed from `@/editor/chrome-ui` + `flowbite-react`. No raw `<button>/<input>/<select>/<textarea>` in chrome (Gate 24; `editor/chrome-ui/` itself is the one exempt owner of native elements — flowbite-react's own internals live in `node_modules`, outside the scan by construction).

### Forbidden moves

- Import from `editor/shared/vibcoder`, `shared/extensions`, `shared/ui`, or `editor/ui` → REJECT — `gate:vibcoder-ratchet` is locked at **0** for the first three; `gate:editor-ui-gone` locks `@/editor/ui` at zero (Task 13, all four paths are deleted).
- Defining `--bd-*` or `--buildrick-*` chrome tokens anywhere → REJECT (Gate 15 — dead namespaces; Gate 17 catches ghost refs).
- Hand-editing `tokens.generated.css/.ts` → REJECT (`gate:tokens-generated` checksum).
- Hex literal in chrome → Gate 16 hex-ratchet (may only go down; current drain target: 49 CSS + 143 TSX).
- Raw box-shadow/gradient in chrome → Gates 11/12 baselines (shadows via `var(--bk-shadow-*)` or `none`).
- Duplicate `@keyframes` / selector duplicates → `gate:ds-ssot` locks.
- `createPortal(...)` / `document.body.appendChild(...)` outside chrome-ui's overlay-root primitives (`OverlayMount`, `OverlayRoot`/`getOverlayRoot()`, `Portal`, `Toast`) or `scripts/gates/overlay-allowlist.txt` → REJECT (Gate 22).

### Why this contract exists

Memory: 4 prior architecture attempts (V1 spec, V2 spec, axioms draft, editor-v2 folder) died because rules didn't bind. Inventory before architecture is hard rule (`feedback_inventory_before_architecture.md`). Deletion targets + canonical-home table = enforceable; "we should clean up" = not.

### Cleanup history (live record)

- **2026-05-09 — SSOT scanner hardening shipped**:
  - Per audit Appendix #1-#4. Stripped /* */ comments before selector matching, anchored selectorDuplicates on single-simple-selector heads (skip wrapped rules), added basename-symbol validation to componentDuplicates, walked barrel re-export chains in dead-export check.
  - selectorDuplicates baseline ratchet: 11 → 4 (real concerns only — `bd-dragging`, `bd-depth-badge`, `bd-topbar`, `bd-topbar__brand` canonical chrome residuals).
  - antiPatterns dead-export: ~3186 → 510 (~84% drop) after barrel-chain reachability.
  - Gate retains ERROR-mode locks on cats 1, 2, 3. Cat 4 stays WARN with new lower baseline.
  - Audit Appendix #5 (generalized doc-drift detector) remains documented limitation — manual review is SSOT.
- **2026-05-08 — DS SSOT audit + fix arc shipped** (commits `8c0b1327`..Phase Final):
  - Phase 0: re-runnable scanner `scripts/audit/ssot-scan.mjs` (8 categories) + audit doc `docs/audits/2026-05-08-ds-ssot-audit.md`. 86 real fixable violations identified (62 Important, 24 Minor; 10 scanner false-positives confirmed).
  - Phase 1: CI gate `scripts/check-ds-ssot.mjs` wired to `pnpm run gate:ds-ssot` and `editor-ci.yml`. Pattern mirrors prior `gate:buildrick`.
  - Phase 2 (token aliases): drained 54 `--bd-*` overlaps from `_aliases.css`. Canonical home is `bd-aliases.css` (62 vibcoder-atom-unique tokens kept in `_aliases.css`).
  - Phase 3 (keyframes): drained `pulse`/`spin` bare-name keyframes; renamed `fadeIn` (× 2 distinct bodies) to `bd-history-fade-in` + `bd-uxfix-fade-in`; renamed `buildrick-flash` → `bd-element-flash`. 7 cross-file consumers updated in lockstep.
  - Phase 4 (Badge + Skeleton): rename-not-delete because APIs disjoint. `shared/ui/Badge.tsx` → `SemanticBadge.tsx` (semantic palette domain). `shared/extensions/Skeleton.tsx` → `SkeletonCompounds.tsx` (silences scanner false positive). 5 + 3 consumers updated.
  - Phase 5 (anti-patterns): 8 of 12 pass-through wrappers drained (5 dead-export, 3 inlined). 4 predicate-named wrappers kept (`isInteractiveType`, `isLandmarkType`, `canHaveChildren`, `getTabConfig`) per audit caveat — names document intent at call sites. 3197-row dead-export tail deferred to separate arc.
  - Phase 6 (legacy residuals): 12 inline `/* keep: <reason> */` annotations in `legacy-components.css`. 0 deletes (post-Task-5 keyframe drain handled the deletable rows).
  - Phase Final: gate locked to ERROR mode for componentDuplicates / keyframeDuplicates / tokenAliasSSOT (no new violations allowed). selectorDuplicates stays WARN with grandfathered baseline (3 real concerns + 9 scanner false positives).
  - Net: structural SSOT compliance enforced. Categories 5-8 (judgment-heavy) remain re-runnable via `node scripts/audit/ssot-scan.mjs`. 6th DS-simplification arc this quarter.
- **2026-05-07 — Vibcoder-finish arc CLOSED** (commits `9f6a2e86`..Phase Final):
  - Original spec target was "drain 1622 .buildrick-* refs to 0." After Phase 0 audit + Task 1 gate-regex tightening, real chrome scope was 202 (vs 1622 broad-match overcount including 1291 `--buildrick-*` tokens + 159 `data-buildrick-*` DOM attrs). 7 drain PRs landed against the real scope.
  - Drained 137 refs (202 → 65). Final baseline 65 reflects legitimate residuals: 24 site-builder DS (out-of-scope domain), 13-14 canonical engine `.buildrick-canvas` refs, ~27 storage keys (Decision 1A — user data risk), 1 cssPrefix config.
  - Phase Final lock 2026-05-07: drained 4 cross-folder animation refs (StatusIndicators + PresenceIndicators `buildrick-spin`/`buildrick-pulse` → `bd-spin`/`bd-status-pulse`; Skeleton internal `buildrick-spin` → `bd-skeleton-spin`).
  - `themes/components.css` drained 274 → 72 LOC (-74%) and renamed `legacy-components.css`. Dead rules deleted: `.bd-layers-tree` (used as `id`, never as className), `@keyframes buildrick-spin`/`buildrick-pulse` (drained), `@keyframes bd-modal-in` (moved to `themes/components/organisms/modal.css`), legacy `.pill` mobile media query, redundant `.buildrick-slider` thumb rules.
  - CI gate (`scripts/check-buildrick-baseline.mjs`) extended: ALL panels locked at current count (not just 0-locks). Any growth = build failure.
  - Spec §1 done #4 amendment: "ERROR-at-0" replaced with "WARN-at-baseline + per-panel growth lock" because original 0 target was based on overcounted scope. The lock semantics deliver equivalent regression protection.
  - 5 panels at 0: animation, collaboration, export, onboarding, rail.
  - 5th SSOT-cleanup arc this quarter.
- **2026-05-02 — Folder structure cleanup (Approach A surgical)**:
  - Deleted `src/project/` (467 files) — was byte-identical duplicate of `docs/reference/`. Canonical was already at `docs/reference/vibcoder/` per `check-vibcoder-port.sh` + `vibcoder-bundle-pin.mjs`.
  - Deleted `src/react/` (1 file) — dead L0 stub (`export {};`), 0 consumers.
  - Moved `src/editor-live.jpeg` → `docs/screenshots/`.
  - Deleted 12 dead `shared/ui/` files (Accordion, ColorSwatch, EmptyState, ErrorMessage, FormInput, Grid, InfoBanner, NumericStepper, QuickSwitcher + 3 deps, Resizable, TreeView, UpgradeGate) + `shared/ui/ds/` subfolder + broken `shared/ui/index.tsx` barrel — all 0-consumer verified.
  - Deleted `src/components/ui/` (2-file redirect barrel) — pure transition shim.
  - Trimmed `shared/ui/index.ts` to surviving exports only (Badge, ErrorState, HelpTooltip).
  - Net: **-485+ files removed from `src/`**, top-level dirs 15 → 13.
- **2026-07-28 — `src/preview/` DELETED** (stage 6): all 54 vibcoder galleries + index + `_lib` removed with the library they previewed. (Supersedes the 2026-05-02 "STAYS" decision — the ESLint rules that pinned it were retired with the vibcoder-fork.)
- **2026-05-02 — `src/components/` GRAVEYARD KILLED** (Phase 1-5 of "kill-the-graveyard" arc):
  - Phase 1 inventory: only 2 active import lines (`demo/main.tsx` AquibraStudio + Canvas.css). 95% of 219 files were 7-line redirect shims; 2 were L0 stubs returning null; rest were barrels.
  - Phase 2: `demo/main.tsx` redirected to canonical `src/editor/shell/AquibraStudio` + canonical Canvas.css now loads via `editor/canvas/Canvas.tsx` import (the legacy components/Canvas/Canvas.css duplicated styles that canonical overrode anyway).
  - Phase 3: zero real-code files needed migration — implementations had already moved to `editor/` years prior; only shims/barrels/stubs remained.
  - Phase 4: `src/index.ts` (public API barrel) trimmed to canonical-only exports. `@buildrik/editor` package has no `main`/`module`/`exports` field — not published, no external consumers.
  - Phase 5: `rm -rf src/components/` (-219 files). Removed `@components/*` alias from `tsconfig.json` + `vite.config.ts`. Retired ESLint Survivor #6 ban-rule (had nothing left to enforce).
  - Net: top-level `src/` from 13 → 12 dirs. Combined with project/+react/ deletions earlier this session: **15 → 12 dirs, ~707 files removed from src/**.
- **2026-05-03 — `src/features/` KILLED** (single-tenant top-level dir collapse):
  - Inventory: `src/features/` held only `design-system/` (29 files). 1 entry, never grew.
  - 18 bridge shim files at `src/editor/sidebar/tabs/design{,/components,/hooks,/utils,/modals}/` re-exported from `features/design-system/` — same anti-pattern as the components/ graveyard (95% redirect shims).
  - Moved `src/features/design-system/` → `src/editor/design-system/` via `git mv` (preserves history). Now sits alongside peer domains: `editor/media/`, `editor/animation/`, `editor/onboarding/`, `editor/ecommerce/`, `editor/export/`, `editor/sync/`.
  - 3 real cross-folder consumers re-pointed: `editor/sidebar/FullPageRouter.tsx`, `editor/shell/StudioPanels.tsx`, `editor/inspector/sections/SizeSection.tsx`.
  - 18 bridge shims deleted. 3 bridge tests (smoke tests for re-export pattern) moved to canonical `state/__tests__/`, with `useSpacingTokens.test.ts` renamed to `.redo.test.ts` to avoid collision with existing preset tests.
  - 3 build scripts updated: `find-inline-hex-v2.mjs`, `verify-design-baselines.mjs`, `migrate-inline-hex.mjs`.
  - `@features/*` alias dropped from `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`.
  - 1 CSS file (`design-tokens.css`, 283 lines) restored from `tabs/design/styles/` to `editor/design-system/styles/`; LeftSidebar.css `@import` rewritten.
  - Net: top-level `src/` from 12 → 11 dirs. Single-tenant containers deleted. 4th architecture-style cleanup of "code lives in wrong place; consumers vote with imports."

---

## KEY ARCHITECTURAL DECISIONS

### Composer is the single gateway to engine

All state mutations go through `Composer` instance methods. Components NEVER directly mutate engine internals.

```ts
// SAHI
composer.elements.add(elementData);
composer.styles.update(elementId, styles);
composer.history.undo();

// GALAT — direct internal access
composer.state.elements.push(newElement);
```

### Events for cross-concern communication

```ts
// Composer emits events, UI subscribes
composer.on('element:selected', (element) => { /* update UI */ });
composer.on('project:saved', () => { /* show toast */ });
```

UI components subscribe to Composer events. They do NOT poll state.

### Styling: generated tokens + chrome-ui + flowbite-react (flowbite-bigbang, Task 13 — 2026-07-31)

- Tokens: `src/themes/tokens.generated.css` (`--bk-*`, generated from Figma) — loaded via `themes/default.css`
- Component styles: `tw:`-prefixed Tailwind utility classes inline on each component in `src/editor/chrome-ui/` (no companion CSS file); `--bk-*` tokens reach in via `var(--bk-*)` inside those utilities. Chrome composes `@/editor/chrome-ui` components + `flowbite-react` primitives directly.
- Feature-level CSS files (e.g. `LeftSidebar.css`) style layout/domain chrome with `var(--bk-*)` only
- NO inline style objects except dynamic computed values (e.g., position from drag)
- Tailwind IS used for chrome now (via the `tw:` prefix + `.flowbite-react/class-list.json` pipeline — see DS SSOT table) — this reverses the pre-Task-13 "NO Tailwind" rule. NO CSS modules, NO new Emotion — Emotion is retired for chrome (4 residual files pending cleanup, unrelated to the canvas)

---

## TESTING

- Framework: Vitest + React Testing Library
- Test location: `__tests__/` folders co-located with source
- Run: `npx vitest` or `npx vitest run`
- Convention: `ComponentName.test.tsx`, `useHook.test.ts`

---

## BUILD & DEV

```bash
npm run dev          # Start dev server (port 5050)
npx vite build       # Production build → dist/
npx vitest           # Run tests
npx tsc --noEmit     # Type check
```

### Pre-push gate hook (BLOCKING)

Once per clone:

```bash
pnpm run hooks:install
```

Installs `.git/hooks/pre-push`, which runs `pnpm run verify:ds` (editor +
dashboard gates) and **refuses the push if any gate fails** —
`BLOCK_ON_FAIL=true` in `scripts/hooks/pre-push:27`, flipped 2026-05-18 once
verify:ds ran green end to end.

This section said "WARN-only — does not block" until 2026-08-03, which was
wrong for two and a half months and is the likely explanation for pushes that
appear to hang: the hook is running the full gate suite (~2 min), not
stalling. If you genuinely need to bypass it, `git push --no-verify` — and say
so, because the gates exist to catch what tests do not.

---

## ENV VARIABLES (Vite — `import.meta.env.*`)

All editor-runtime env vars must be prefixed `VITE_` so Vite inlines them at
build time. Dev-time defaults live in `.env.local`. Production values must be
set in the host platform (Vercel project settings → Environment Variables).

| Var | Purpose | Dev default | Production value |
|-----|---------|-------------|-----------------|
| `VITE_DASHBOARD_URL` | tRPC API base for dashboard package (publish jobs, BuildrikSyncProvider) | `http://localhost:3000` | `https://app.buildrick.io` — the live dashboard host. This row said `app.buildrik.com` until 2026-08-03; that domain is not what production runs (see root `CLAUDE.md` `NEXT_PUBLIC_APP_URL`, and the deploy target `app.buildrick.io`). Only needed for a STANDALONE editor build — when the editor is bundled into the dashboard (`NEXT_PUBLIC_UNIFIED_EDITOR`), `runtimeEnv.ts` falls back to the dashboard's own origin. |
| `VITE_SENTRY_DSN` | Sentry error reporting DSN | unset → console-only | Sentry project DSN (required) |
| `VITE_FEATURE_PUBLISH` | Gate for Publish dropdown + publish flow | `false` | `true` once Vercel pipeline live |

Notes:
- Feature flags read via `shared/utils/featureFlags.ts` — never read
  `import.meta.env.VITE_FEATURE_*` directly elsewhere.
- Dashboard URL is consumed by `services/PublishService.ts`,
  `services/BuildrikSyncProvider.ts`, and `editor/shell/Topbar.tsx` —
  fallback `http://localhost:3000` is dev-only.
- Sentry DSN absent in dev is intentional — `errorTracking.ts` no-ops when
  unset so we don't spam Sentry from local runs.
- Vite reads `.env.local` from the **monorepo root** (configured via
  `envDir` in `vite.config.ts`) so the same file serves Next.js
  (dashboard) and Vite (editor). Only `VITE_*`-prefixed vars are exposed
  to the editor bundle.

---

## Phase 1d — Local publish smoke test (real Vercel)

Phases 1a/b/c shipped the publish backend + editor wiring. To smoke-test
real Vercel deploys end-to-end (instead of the dev simulation):

1. **Add Vercel creds to `.env.local` (monorepo root):**
   ```
   VERCEL_TOKEN=<from vercel.com/account/tokens — use a team token>
   VERCEL_TEAM_ID=<optional, omit if personal token>
   VERCEL_PROJECT_PREFIX=buildrik-site-
   ```

2. **Flip the editor flag in the same file:**
   ```
   VITE_FEATURE_PUBLISH=true
   ```

3. **Restart both dev servers** — Vite caches env at startup, so a
   running `npm run dev` won't see the new flag until restarted.

4. **Walk through the flow:**
   - Sign in to dashboard at `http://localhost:3000`
   - Create or pick an existing site
   - Click "Open in Editor" — redirects to
     `http://localhost:5050/?siteId=<id>`
   - The Topbar should now show a real Publish dropdown (gated on
     `VITE_FEATURE_PUBLISH`)
   - Click **Publish** → editor exports all pages → POSTs to dashboard
     tRPC `sites.publish` → creates publish job → worker route picks
     up the job → calls Vercel `/v13/deployments`
   - Editor polls every 2s → toast on completion shows the live URL

5. **What "real" looks like vs sim:**
   - Real path (`isVercelConfigured() && pages.length > 0`): worker
     calls `runVercelDeploy`, `lib/vercel.ts:createVercelDeployment`,
     poll for ready, return `https://<projectName>.vercel.app`
   - Sim path (no `VERCEL_TOKEN` or zero pages): worker calls
     `runSimulation` → 10-second fake delay → returns
     `https://<siteId>.vercel.app` placeholder

6. **Debug checklist if it 'silently' fails:**
   - DevTools network tab → `sites.publish` should return a `jobId`
     (not an error)
   - Worker logs (Next.js dev server stdout) should show
     `[publish-worker] job=… site=… pages=N mode=vercel`
     (`mode=simulation` means it fell through — see next bullet)
   - If sim runs anyway, `process.env.VERCEL_TOKEN` is undefined in
     the dashboard process — check `.env.local` is at monorepo root,
     not nested

---

## QUICK REFERENCE: BEFORE WRITING ANY CODE

1. Kya yeh change `components/` mein ja rahi hai? → `editor/` mein daalo instead
2. Kya naya wrapper/middle-man ban raha hai? → Direct use karo
3. Kya same logic already kahi exist karti hai? → Import karo, duplicate mat karo
4. Kya constant/type do jagah define ho rahi hai? → `shared/` mein ek jagah rakho
5. Kya file mein 2+ unrelated concerns hain? → Split karo
6. Kya import direction rules follow ho rahe hain? → Check karo `engine/ → shared/` only
7. Kya action trace karne ke liye 5+ files kholni padein? → Over-fragmented hai, simplify karo
8. Kya function secretly state mutate karti hai? → Naam se clear karo
9. Kya do modules ek doosre ke internal files import karte hain? → Coupling fix karo
10. Kya dead code / unused exports hain? → Delete karo

---

## GSTACK

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

### Available gstack skills

- /office-hours
- /plan-ceo-review
- /plan-eng-review
- /plan-design-review
- /design-consultation
- /review
- /ship
- /land-and-deploy
- /canary
- /benchmark
- /browse
- /qa
- /qa-only
- /design-review
- /setup-browser-cookies
- /setup-deploy
- /retro
- /investigate
- /document-release
- /codex
- /cso
- /autoplan
- /careful
- /freeze
- /guard
- /unfreeze
- /gstack-upgrade

## Chrome Routing Rules — chrome-ui is the single public surface (2026-07-31)

The chrome layer (sidebar/rail/inspector/topbar/footer) is built exclusively
from `src/editor/chrome-ui/` composing `flowbite-react` primitives, styled
with `tw:`-prefixed Tailwind utility classes and generated `--bk-*` tokens —
no separate chrome CSS bundle. Two prior libraries are fully gone: the
vibcoder system (React wrappers, 76-file CSS bundle, `--bd-*` alias layers,
shared/extensions compositions, shared/ui primitives, preview galleries) was
deleted at stage 6 of `docs/plans/2026-07-27-ui-library-roadmap.md`; its own
successor, `src/editor/ui/` (the ds/fresh-token-system component library),
was itself deleted at Task 13 of the flowbite big-bang migration
(`docs/plans/flowbite-bigbang-inventory.md`) once every consumer was
re-pointed to `chrome-ui/` and flowbite-react across Tasks 2-12.

**`chrome-ui/index.ts` is the single import surface for everything
flowbite-sourced** (chrome-ui-single-surface spec,
`docs/plans/2026-07-31-chrome-ui-single-surface.md`). Every file under
`packages/editor/src` outside `chrome-ui/` itself imports Button, TextInput,
Select, Badge, etc. — and the `BK_*` theme constants, and the
`CustomFlowbiteTheme` type — from `@/editor/chrome-ui`, never directly from
`flowbite-react` (bare or subpath, e.g. `flowbite-react/types`) and never from
a deep `@/editor/chrome-ui/<file>` path (e.g. `chrome-ui/selectTheme`). The
barrel aggregates three kinds of export: pure `export { X } from
"flowbite-react"` re-exports (Button, Badge, Avatar, AvatarGroup, Checkbox,
Radio, ToggleSwitch, Tooltip, Textarea, Label, HelperText, RangeSlider,
Progress, Card), the 47 editor-specific components already canonical here
(Topbar, IssueChip, Modal, Toast, etc.), and the closed 2-wrapper set below.
The B3 sweep (task report:
`.superpowers/sdd/2026-07-30-flowbite-bigbang-implementation/task-B-report.md`)
re-pointed all 249 pre-existing direct imports across 6 surface-sized commits.

**The closed 2-wrapper set — never a 3rd without amending both
`chrome-ui/index.ts` and the gate's `WRAPPER_FILES` in the same commit:**

| Wrapper | Default theme | File |
|---|---|---|
| `TextInput` | `BK_TEXT_INPUT_THEME` | `chrome-ui/TextInput.tsx` |
| `Select` | `BK_SELECT_BASE_THEME` | `chrome-ui/Select.tsx` |

Both are `forwardRef` (ref reaches the real `<input>`/`<select>` — load-bearing
for rename/search focus and hidden file-input clicks) and deep-merge
(`chrome-ui/mergeTheme.ts`) a caller-supplied `theme` prop on top of the
default — caller key wins per leaf, untouched default keys survive. Passing
`theme={BK_TEXT_INPUT_THEME}` / `theme={BK_SELECT_BASE_THEME}` at a call site
is now redundant (the wrapper already applies it) and should be omitted;
`theme={BK_SELECT_BARE_UNIT_THEME}` / `theme={BK_SELECT_BARE_VALUE_THEME}`
and other genuinely different overrides still need the explicit prop — the
wrapper composes it on top of the base, it does not replace it. `Label` has no
wrapper (its contract is `className`-based — `BK_LABEL_CLASS`/
`BK_HELPER_CLASS`/`BK_HELPER_ERROR_CLASS`, plain re-export).

### When modifying chrome

- **Existing component:** edit `src/editor/chrome-ui/<Name>.tsx` — styles are inline `tw:` utility classes on the component itself, no companion CSS file to keep in sync. Contract tests in `src/editor/chrome-ui/__tests__/`.
- **New component:** compose a flowbite-react primitive where one fits; mirror a Figma node where one exists; `--bk-*` tokens via `var(--bk-*)` inside `tw:` utilities, weights ≤600, focus `var(--bk-shadow-focus)`; export from `index.ts`; add contract tests. Importing a flowbite-react component for the first time? Run `pnpm flowbite:classlist` (see DS SSOT table above) so its classes reach the Tailwind build.
- **Cascade:** `@layer reset, components, overrides;` (declared in `themes/default.css`). `tw.css` (Tailwind utilities, `tw` prefix) + `chrome-reset.css` (preflight replacement, scoped to `.bd-studio` and excluding the canvas subtree) load unlayered before `legacy-components.css`; tokens + engine selectors win over all layers per CSS spec.
- **Tokens:** `var(--bk-*)` only, values changed in Figma → re-export → `node scripts/tokens/generate.mjs`.

### CI gates relevant to the library

- `gate:chrome-ui-surface` — **ERROR mode**, locked at **0**: (1) no `flowbite-react` import (bare or subpath) outside `chrome-ui/`, (2) barrel purity — every flowbite-sourced export in `chrome-ui/index.ts` is a pure re-export, never a component definition, (3) closed wrapper set is exactly `[TextInput.tsx, Select.tsx]`. Checks 2/3 have been ERROR since the gate shipped; check 1 flipped from WARN once the B3 sweep drained the count to 0.
- `gate:tokens-generated` — generated files current, zero legacy chrome tokens
- `gate:vibcoder-ratchet` — locked at **0**: any import of the deleted vibcoder/shared-ui paths fails the build
- `gate:editor-ui-gone` — locked at **0**: any import of the deleted `@/editor/ui` path fails the build
- Gate 15 — `--bd-*` definitions banned (dead namespace) · Gate 17 — ghost `--bd-*` refs
- Gate 18 — banned Tailwind/indigo/violet/purple bleed (the Flowbite purple ramp is allowlisted for PRO badge + avatar identity tones only — see DESIGN.md §Color, founder-confirmed 2026-07-29 — never as an accent, CTA, link, or gradient)
- Gate 22 — portal discipline: `createPortal`/`document.body` must route through chrome-ui's overlay-root primitives (`OverlayMount`, `OverlayRoot`, `Portal`, `Toast`) or be listed in `scripts/gates/overlay-allowlist.txt`
- Gate 24 — zero inline `<button>/<input>/<select>/<textarea>` in chrome (`editor/chrome-ui/` is the exempt owner of native elements)
- Gates 11/12/13/14 — chrome-axiom ratchets (gradients, tokenized shadows, radius, layout literals)

(Retired: Gate 19/21/23, Gate 20 barrel guard, `vibcoder:check-port`, gallery ESLint rules — their subjects no longer exist.)
