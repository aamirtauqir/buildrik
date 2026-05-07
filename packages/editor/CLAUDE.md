# CLAUDE.md — Buildrik (Aquibra Editor L2)

## Project Overview

Visual web builder/editor. React 18 + TypeScript + Vite + Emotion CSS-in-JS.
Core engine: `src/engine/Composer.ts` — central orchestrator with 25+ managers.
Demo app: `demo/main.tsx` on port 5050.

## Tech Stack

- **React 18.3** (devDep) + **TypeScript 5.3** (strict mode)
- **Vite 7.2** (dev server + bundler)
- **Emotion** (@emotion/react, @emotion/styled) — CSS-in-JS
- **Lucide React** — icons
- **GSAP** — animations
- **Zod** — schema validation
- **Sentry** — error tracking
- **Vitest** — testing

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

├── shared/          # SHARED — Types, utils, hooks, UI primitives
│   ├── types/       # All TypeScript interfaces/types (SSOT for types)
│   ├── constants/   # All constants (SSOT for constants)
│   ├── hooks/       # Reusable React hooks
│   ├── utils/       # Pure utility functions
│   ├── ui/          # Design system primitives (Tooltip, Toast, ContextMenu, etc.)
│   ├── extensions/  # Project-specific compositions on top of vibcoder primitives.
│   │                # NOT vendored vibcoder code (lives in editor/shared/vibcoder/).
│   │                # NOT primitives (live in shared/ui/).
│   │                # Test: "if vibcoder ever ships this exact composition upstream,
│   │                # this file deletes and consumers swap import paths."
│   │                # Examples: PanelHeader, ConfirmDialog, CopyButton, PremiumBadge,
│   │                # UpgradeModal, Skeleton compounds.
│   └── forms/       # Form field components
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
            EXCEPTION: shared/extensions/ files MAY import from
            @/editor/shared/vibcoder (the vendored vibcoder primitive
            bundle). This is the only intentional shared/→editor/ edge
            in the graph — extensions/ exists specifically to compose
            vibcoder primitives.
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

## DESIGN SYSTEM — SSOT CONTRACT

Ek concept = ek canonical home. Duplicate allowed nahi. Violation = auto-reject.

| Concept | Canonical Home | Status |
|---------|---------------|--------|
| Design tokens (color/spacing/typography/radius/shadow/motion/z-index) | `src/themes/design-system/*.css` | CANONICAL — hand-edit OK |
| Vibcoder primitive CSS (atoms/molecules/organisms/layouts) | `src/themes/components/` | CANONICAL — authored, hand-edit OK (vendor pipeline retired 2026-05-06) |
| Vibcoder primitive React wrappers | `src/editor/shared/vibcoder/` | CANONICAL — authored, hand-edit OK, 286 consumers |
| Compositions on vibcoder primitives | `src/shared/extensions/` | CANONICAL — PanelHeader, ConfirmDialog, etc. |
| Buildrik non-vibcoder primitives | `src/shared/ui/` | AUDIT COMPLETE 2026-05-02 — 4 files (SemanticBadge/ErrorState/HelpTooltip/Icons) + `panel/PanelShell` retained, 12 dead files + ds/ + broken index.tsx deleted. Badge → SemanticBadge rename 2026-05-08 (DS SSOT Phase 4). |
| Site-builder tokens (user output, not chrome) | `src/editor/design-system/` | CANONICAL — different domain, never merge with chrome DS. Moved from `src/features/design-system/` 2026-05-03. |
| Final residual class rules | `src/themes/legacy-components.css` | DRAINED 2026-05-07 (Phase Final) — 72 LOC, renamed from components.css. DO NOT add new rules. |
| ~~Legacy chrome components~~ | ~~`src/components/`~~ | DELETED 2026-05-02 — graveyard fully drained |

### SSOT decision tree (before writing any DS / UI code)

1. Naya token (color/space/etc.)? → `themes/design-system/` only. Never inline hex in chrome CSS (Gate 24).
2. Naya primitive component? → check `editor/shared/vibcoder/` first. Already hai? Use it.
3. Composition chahiye (multiple primitives wrapped together)? → `shared/extensions/`.
4. Vibcoder mein nahi hai aur composition bhi nahi? → Add new primitive directly to `editor/shared/vibcoder/` + matching CSS in `themes/components/<tier>/`. Vibcoder is Buildrik-owned now — extend it, don't fork around it.
5. Naya chrome layout / panel / view? → `editor/[domain]/` only. Never `components/`.

### Forbidden moves

- New file in `src/components/` → REJECT.
- New `.buildrick-*` className in editor JSX (`src/editor/`) → REJECT — gate `scripts/check-buildrick-baseline.mjs` per-panel growth lock catches.
- Component duplicating vibcoder primitive in `shared/ui/` → REJECT — gate `gate:ds-ssot` (`scripts/check-ds-ssot.mjs`) ERROR-locks componentDuplicates at zero.
- Duplicate `@keyframes` across CSS files → REJECT — `gate:ds-ssot` ERROR-locks keyframeDuplicates at zero.
- Same `--bd-*` token defined in two alias files → REJECT — `gate:ds-ssot` ERROR-locks tokenAliasSSOT at zero.
- Hex literal in chrome CSS → blocked by Gate 24 (zero-tolerance).

### Retirement targets (deletion mandates)

- ~~`themes/components.css`: <300 lines target, then rename to `legacy-components.css`~~ DONE 2026-05-07 (Phase Final): 274 → 72 LOC, renamed `legacy-components.css`. Contains only canonical engine selectors + 1 single-consumer chrome class + generic input element styling.
- `src/components/` (371 files): file count must DECREASE per PR touching it. Touch a legacy file? → migrate to `editor/`.
- `shared/ui/` overlap audit: every primitive checked against `editor/shared/vibcoder/`. Duplicate = delete + redirect imports.

### Why this contract exists

Memory: 4 prior architecture attempts (V1 spec, V2 spec, axioms draft, editor-v2 folder) died because rules didn't bind. Inventory before architecture is hard rule (`feedback_inventory_before_architecture.md`). Deletion targets + canonical-home table = enforceable; "we should clean up" = not.

### Cleanup history (live record)

- **2026-05-09 — SSOT scanner hardening shipped**:
  - Per audit Appendix #1-#4. Stripped /* */ comments before selector matching, anchored selectorDuplicates on right-most simple selector, added basename-symbol validation to componentDuplicates, walked barrel re-export chains in dead-export check.
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
- **2026-05-02 — Decision: `src/preview/` STAYS in `src/`** despite "dev-only" appearance. ESLint rules (`no-gallery-shadow.cjs`, `no-hardcoded-open-prop`) target `src/preview/vibcoder-*.tsx` for drift detection. TypeScript tsconfig `include: ["src", "demo"]` type-checks galleries against vibcoder primitive types. Moving = silent regression on both fronts. Galleries are dev-only at runtime (Vite root=demo/) but **dev-time-active** as type-checked artifacts. If ever moved, must update eslint config + skip-rules.ts + memory.
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

### Styling: Emotion + CSS Variables

- Global tokens: `src/themes/default.css` (CSS custom properties)
- Component styles: Emotion `styled()` or `css` prop
- NO inline style objects except for dynamic computed values (e.g., position from drag)
- NO Tailwind, NO CSS modules — Emotion only

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

---

## ENV VARIABLES (Vite — `import.meta.env.*`)

All editor-runtime env vars must be prefixed `VITE_` so Vite inlines them at
build time. Dev-time defaults live in `.env.local`. Production values must be
set in the host platform (Vercel project settings → Environment Variables).

| Var | Purpose | Dev default | Production value |
|-----|---------|-------------|-----------------|
| `VITE_DASHBOARD_URL` | tRPC API base for dashboard package (publish jobs, BuildrikSyncProvider) | `http://localhost:3000` | `https://app.buildrik.com` (or canonical dashboard host) |
| `VITE_SENTRY_DSN` | Sentry error reporting DSN | unset → console-only | Sentry project DSN (required) |
| `VITE_FEATURE_PUBLISH` | Gate for Publish dropdown + publish flow | `false` | `true` once Vercel pipeline live |
| `VITE_FEATURE_ACCOUNT` | Gate for AccountModal | `false` | `true` once account UI is real |
| `VITE_FEATURE_INVITE` | Gate for InviteModal | `false` | `true` once invite flow ships |

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

## Vibcoder Position 3 — Chrome Routing Rules

The chrome layer (sidebar/rail/inspector/topbar/footer) is governed by the
vibcoder primitives at `src/themes/components/` (CSS) and
`src/editor/shared/vibcoder/` (React wrappers). Position 3 + R2 namespace
exception: vibcoder canonical names are authoritative; `--bd-*` short aliases
remain for existing chrome JSX via the single canonical alias layer at
`src/themes/design-system/bd-aliases.css` (vibcoder-atom-unique tokens
live in `src/themes/components/_aliases.css`).

**Status (2026-05-06):** vibcoder-fork shipped. Vendor pipeline (codemods,
bundle pin, manifest enforcement) retired. Vibcoder is Buildrik-owned canonical
authored code, not vendored generated output. Files at `themes/components/` and
`editor/shared/vibcoder/` may be hand-edited freely.

### When modifying chrome

- **Existing primitive:** edit the file at `editor/shared/vibcoder/<Name>.tsx` and/or matching CSS at `themes/components/<tier>/<name>.css` directly. No codemod cycle. Tests live next to the source.
- **New primitive:** add to `editor/shared/vibcoder/` + matching CSS in `themes/components/<tier>/`. Add the CSS `@import` line to `themes/default.css`. Add a preview at `src/preview/vibcoder-<name>.html` if useful for visual QA.
- **Cascade:** `@layer tokens, components, overrides;`. Component CSS lands in `components`. Emotion remains unlayered (always wins) so existing `styled()` chrome stays authoritative.
- **Tokens:** Use canonical `--buildrick-*` names in CSS. Use short `--bd-*` aliases in chrome JSX. Single canonical alias map is at `themes/design-system/bd-aliases.css` — extend it for new chrome-wide aliases. `themes/components/_aliases.css` retains 62 vibcoder-atom-unique tokens; do not add chrome-wide aliases there.

### CI gates relevant to vibcoder

- Gate 15: `--bd-*` SSOT — alias tokens defined only in `bd-aliases.css` and `_aliases.css`
- Gate 22: portal discipline — no `document.body` in vibcoder wrappers (except `OverlayMount`)
- Gate 23: shim layer is gate-keeper for mapped primitives
- Gate 24: zero-tolerance inline `<button>/<input>/<select>/<textarea>` in editor chrome

(Retired with vibcoder-fork on 2026-05-06: Gate 19 `bdr-*` class leak detection, Gate 21 vibcoder-shape token defs, `vibcoder:check-port` manifest validator, ESLint `no-gallery-shadow` and `no-hardcoded-open-prop`.)

### Architecture reference

`docs/architecture/vibcoder-spec/` (untracked, local-only) contains the original
design rationale + reference CSS + manifest from when vibcoder was treated as
external. Preserved for future contributors who need to understand the naming
conventions, component scope decisions, and original tier breakdown. Not loaded
at runtime; not a source of truth — Buildrik's own `themes/components/` and
`editor/shared/vibcoder/` are canonical.

### Phase status

Phases 1-5 SHIPPED 2026-04-28 (M5 organisms, M8 chrome re-port, M9 Phase 5
shim deletion). 19 Phase 4 adapter shims deleted; 6 compositions live at
`src/shared/extensions/`. Buckets A+B (Popover/Tooltip/Toast Radix backings)
shipped 2026-04-30 (B1+B2+B3, completes Phase 5 chrome arc).
**Vibcoder-fork** shipped 2026-05-06: vendor ceremony retired, primitives
become Buildrik-authored.
