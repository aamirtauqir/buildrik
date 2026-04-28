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
@/*           → ./src/*
@components/* → ./src/components/*
@shared/*     → ./src/shared/*
@features/*   → ./src/features/*
@hooks/*      → ./src/hooks/*
@utils/*      → ./src/utils/*
```

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
├── components/      # LEGACY — 371 files, DO NOT add new code here
│                    # Rule: naye features components/ mein NAHI jayenge
│                    # Migration: gradually move to editor/ when touching old code
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
├── features/        # FEATURE MODULES — Self-contained feature units
│   └── design-system/  # Design tokens (colors, typography, spacing)
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
editor/    → engine/, shared/, features/, blocks/, templates/
components/ → engine/, shared/ (LEGACY — don't add new imports)
features/  → engine/, shared/
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

// GALAT — shared importing from features
// src/shared/utils/something.ts
import { designTokens } from '../../features/design-system'; // NAHI!
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

The chrome layer (sidebar/rail/inspector/topbar/footer) is now governed by the
vibcoder bundle vendored at `src/themes/components/`. Position 3 + R2 namespace
exception: vibcoder canonical names are authoritative; `--bd-*` short aliases
remain for existing chrome JSX via the generated alias layer.

### When porting / modifying chrome

- **Source of truth:** `docs/reference/vibcoder/components/COMPONENTS.md` manifest. Do NOT invent components.
- **Vendoring pipeline:** `npm run vibcoder:vendor` (orchestrates pin + 3 codemods). Never hand-edit files in `src/themes/components/` — they're generated output.
- **Bundle pin:** `.bundle-version` artifact MUST change when bundle changes. PR diff makes "bundle drift" vs "codemod drift" visible.
- **Cascade:** `@layer tokens, components, overrides;`. Vendored CSS lands in `components`. Emotion remains unlayered (always wins) so existing styled() chrome stays authoritative through Phase 1-5 transition.
- **Tokens:** Use canonical `--buildrick-*` names in vendored CSS. Use short `--bd-*` aliases in chrome JSX. Never define new `--buildrick-color-*` shapes (vibcoder shape) in chrome — Gate 21 blocks it.

### CI gates this section enforces

- Gate 19: no `bdr-*` class leaks (codemod 1 must run cleanly)
- Gate 21: no vibcoder-shape token defs in non-vendored CSS
- `vibcoder:check-port`: every file in `components/<tier>/` has manifest entry + body class def

### Codex routing

Codex review for vibcoder ports is **advisory** during Phase 1-4 migration arc and
**blocking** post-Phase 5 (per Pass 6 scope-guardian finding — solo workflow
mid-arc tier transition is theater, single-mode is honest).

### Phase status

Phases 1-5 SHIPPED 2026-04-28 (M5 organisms, M8 chrome re-port, M9 Phase 5
shim deletion). 19 Phase 4 adapter shims deleted; 6 compositions live at
`src/shared/extensions/`. Buckets A+B (Popover/Tooltip/Toast Radix backings)
deferred upstream. See `docs/superpowers/specs/2026-04-26-vibcoder-position-3/roadmap.md`
and `poc-findings.md` Phase 5 findings section for full details.
