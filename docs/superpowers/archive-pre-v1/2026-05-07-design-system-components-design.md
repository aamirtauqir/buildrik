# Design System + Components — design spec

**Date:** 2026-05-07
**Author:** saqib (brainstormed with Claude/superpowers)
**Status:** Design approved · ready for implementation plan
**Target window:** ~12 weeks (fits Phase 4-5 of 5-month editor roadmap)

---

## 1. Summary

Buildrik's editor today has two parallel features — a `Design` tab (token editor for Color/Type/Spacing) and a `Comps` tab (user-saved element compositions). The two are technically separate, semantically unlinked, and don't feel useful in the sidebar.

This spec restructures them into a coherent **Design System** product:

- **Design tab** expands from 3 token kinds to a 4-section workspace covering 14 token kinds, 11 style preset categories, a Components summary, and an import/export pane.
- **Components panel** stops being a generic save-shelf and becomes a hybrid catalog: a Buildrik-shipped pre-built library of typed components ("Button", "Card", "Hero", etc.) on top, and the user's own saved compositions ("Your symbols") below. Both auto-bind to the active Design System.
- **MyTemplates** dies as a concept. The `Templates` tab is renamed `Starters` and becomes a read-only Buildrik-shipped page library. Existing user-saved templates migrate into the unified Components store.
- A **tiered UX** (beginner default + pro mode toggle) hides token IDs and empty foundation slots from beginners while exposing full power to designers and agencies.

The result is an editor where the sentence "components are for the design system" is true at every level — engine, data, UI, and migration.

---

## 2. Goals

1. Make the `Design` and `Components` features feel like one coherent Design System product.
2. Allow users to define a custom Design System at project start (typography, colors, spacing, sizes, radii, shadows, motion, etc.) and have all components reflect those choices automatically.
3. Ship a pre-built component catalog (Button, Card, Hero, etc.) styled by the active DS.
4. Allow users to save their own compositions as DS-bound components with master/instance live-link semantics.
5. Allow users to import existing design tokens from Tokens Studio JSON, Tailwind config, and Figma Variables JSON, and export their DS to those formats.
6. Serve three audience tiers — solo pro designers, agencies, no-code beginners — through a single product surface with mode toggle.

## 3. Non-goals

- **Real-time collaboration / CRDT.** Phase 1 keeps single-editor concurrency. Multi-editor is a separate later arc.
- **Pixel-diff visual regression** (Percy/Chromatic). DOM snapshots + axe a11y are sufficient for current scale.
- **Community catalog / marketplace.** The catalog is Buildrik-shipped only Phase 1. Pure-data format leaves the door open for Phase 2+.
- **Voice/tone/copy guidelines.** Out of scope for a visual builder.
- **Promote-saved-symbol-to-typed-component.** Powerful Phase 2+ moat but not in this arc.
- **Full sidebar IA reset.** Tabs stay where they are; only `Design`, `Components`, and `Templates`/`Starters` change.

---

## 4. Locked decisions (from brainstorm)

| # | Decision | Rationale |
|---|---|---|
| 1 | Bridge model with style presets ("D + B-presets") | Maps cleanly onto existing engine separation between `TokenRegistryContext` and `composer.components`. No engine rewrite. |
| 2 | Tiered UX — beginner default + pro mode toggle | Single product serves all three audiences. Mode is display-only; engine state identical in either mode. |
| 3 | Full DS canon Phase 1 — 14 foundation token kinds + 11 style preset categories + Components | User explicitly chose ambition over essentials. Empty kinds shown muted in beginner mode. |
| 4 | Model E — kill MyTemplates · Components = single user-saved store · Templates → Starters (read-only, Buildrik-shipped) | Removes the redundancy that caused user confusion. One user-saved-reusables shelf. |
| 5 | Sections die as a separate concept | Components are scope-agnostic. A "Hero section" is just a Component you happen to build at section size. |
| 6 | Hybrid model "C" — Buildrik catalog (B-side) + user-saved symbols (A-side) | Catalog gives day-one quality; user-saved gives agency-tier flexibility and an escape hatch from catalog gaps. |
| 7 | Phase 1 catalog ship count = **10 polished**, not 27 | Solo dev cannot match shadcn/MUI quality at 27 components in available time. 10 polished + quarterly additions beats 27 mediocre. |
| 8 | Catalog format = **pure data** (JSON-like config) + small interpreter + named behavior modules | Data is portable (AI-generatable, wire-shippable, hot-reloadable), keeps structure/variants/bindings cleanly separated, enables future moat features. |
| 9 | Approach 1 — Layered extension on existing engine | Smallest blast radius. Touches only DS + Components + Templates folders. No vibcoder churn, no sidebar IA reset. |

Three smaller defaults flagged for confirmation during implementation:

- **Import formats:** Tokens Studio JSON + Tailwind config + Figma Variables JSON.
- **Starter DS gallery on project create:** blank-with-defaults; preset gallery is Phase 2 enhancement.
- **Off-DS overrides:** warn-then-allow in beginner mode; silent allow in pro mode.

---

## 5. Architecture

### 5.1 Folder layout

New code lives under `editor/`. No additions to `src/components/` (graveyard killed 2026-05-02). Existing folders extend without restructuring.

```
src/editor/design-system/                 # extends existing
├── state/
│   ├── TokenRegistryContext.tsx         # extend with 11 new TokenKinds
│   ├── StylePresetRegistry.tsx          # NEW: sibling registry for presets
│   ├── DSModeContext.tsx                # NEW: beginner|pro toggle
│   ├── useColorTokens.ts                # existing
│   ├── useTypeTokens.ts                 # existing
│   ├── useSpacingTokens.ts              # existing
│   ├── useRadiusTokens.ts               # NEW
│   ├── useShadowTokens.ts               # NEW
│   ├── useMotionTokens.ts               # NEW
│   ├── useBorderTokens.ts               # NEW
│   ├── useOpacityTokens.ts              # NEW
│   ├── useZindexTokens.ts               # NEW
│   ├── useBreakpointTokens.ts           # NEW
│   ├── useGridTokens.ts                 # NEW
│   ├── useSizingTokens.ts               # NEW
│   ├── useIconTokens.ts                 # NEW
│   └── useImageryTokens.ts              # NEW
├── presets/                             # NEW
│   ├── ButtonPresets.ts
│   ├── CardPresets.ts
│   ├── FormPresets.ts
│   ├── LinkPresets.ts
│   ├── BadgePresets.ts
│   ├── AlertPresets.ts
│   ├── TooltipPresets.ts
│   ├── ModalPresets.ts
│   ├── NavPresets.ts
│   ├── TablePresets.ts
│   └── LayoutPresets.ts
├── ui/
│   ├── DesignSystemTab.tsx              # restructure to 4 top-level sections
│   ├── sections/                        # NEW
│   │   ├── TokensSection.tsx
│   │   ├── StylesSection.tsx
│   │   ├── ComponentsSection.tsx
│   │   └── ExportSection.tsx
│   ├── tokens/                          # per-kind editors
│   │   ├── ColorTokenList.tsx           # existing
│   │   ├── TypeTokenList.tsx            # existing
│   │   ├── SpacingTokenList.tsx         # existing
│   │   └── ... (11 NEW per-kind editors)
│   ├── styles/                          # per-category preset editors
│   │   └── ... (11 NEW)
│   └── modals/
│       ├── ImportDSModal.tsx            # NEW
│       └── ExportDSModal.tsx            # NEW
├── importers/                           # NEW
│   ├── TokensStudio.ts
│   ├── TailwindConfig.ts
│   └── FigmaVariables.ts
├── migrations/                          # extends existing
│   ├── 0007-add-extended-token-kinds.ts
│   ├── 0008-add-style-presets-store.ts
│   ├── 0009-add-component-ds-bound-flag.ts
│   ├── 0010-mytemplates-to-components.ts
│   ├── 0011-sectiontemplates-to-components.ts
│   ├── 0012-rename-templates-to-starters.ts
│   ├── 0013-add-ds-mode-pref.ts
│   └── runner.ts
├── types.ts                             # extend with TokenKind, StylePreset
├── constants.ts                         # extend DEFAULT_TOKENS
└── utils/exportUtils.ts                 # extend existing

src/editor/components-catalog/           # NEW · Buildrik-shipped catalog (B-side)
├── atoms/
│   ├── Button.ts
│   ├── Input.ts
│   ├── Select.ts
│   ├── Checkbox.ts
│   └── Badge.ts
├── molecules/
│   ├── Card.ts
│   ├── Form.ts
│   └── Alert.ts
├── organisms/
│   ├── Hero.ts
│   └── Footer.ts
├── behaviors/                           # named code escape hatches
│   ├── focus-ring.ts
│   ├── click.ts
│   └── ... (cap at ~10)
├── interpreter.tsx                      # ~200 LOC schema → DOM
├── catalog.ts                           # exports + lookup
└── types.ts                             # ComponentType / Variant / Schema

src/editor/sidebar/tabs/component-library/  # extends existing
├── ComponentsTab.tsx                    # dual-section restructure
├── CatalogSection.tsx                   # NEW · renders from catalog
├── UserSavedSection.tsx                 # NEW · existing logic moved here
├── DSStatusChip.tsx                     # NEW · header chip
├── ComponentRow.tsx                     # gains DS-bound icon + unbound warning
├── DetachInstanceButton.tsx             # NEW · pro-mode action
├── CreateComponentModal.tsx             # gains "Pre-fill from DS" toggle
└── ... (existing files kept)

src/editor/sidebar/tabs/starters/        # rename of templates/
├── StartersTab.tsx                      # was MyTemplates.tsx, scope-tightened
├── StarterPreview.tsx                   # was TemplatePreview.tsx
└── starterCatalog.ts                    # NEW · Buildrik-shipped page library
                                          # MyTemplates.tsx + SectionTemplates.tsx deleted

src/editor/inspector/sections/
└── DSBindingChip.tsx                    # NEW · per-property binding display
```

### 5.2 Engine boundaries

Composer remains the single gateway:

```
Composer
   ├── tokens                  → TokenRegistryContext (14 kinds)
   ├── presets                 → StylePresetRegistry (11 categories)
   ├── components              → split surface:
   │     ├── catalog           → read-only catalog access
   │     ├── userSaved         → master/instance CRUD (existing)
   │     └── placeInstance(source, id, ...)
   └── EventBus emits:
         token:updated, preset:updated, component:master-updated,
         component:detached, instance:placed, tokens:bulk-updated
```

UI subscribes to events, never polls registry, never mutates engine state directly.

Per CLAUDE.md import direction:
- `editor/design-system/` → `engine/`, `shared/`
- `editor/components-catalog/` → `editor/design-system/state/` (read tokens), `shared/`
- `editor/sidebar/tabs/component-library/` → `engine/`, `shared/`, `editor/design-system/state/` (read context only)
- `editor/sidebar/tabs/starters/` → `editor/design-system/`
- No new code in `src/components/`. No new imports from `engine/` to `editor/`.

### 5.3 Token shape

```typescript
type TokenKind =
  | "color" | "type" | "spacing"             // existing
  | "radius" | "shadow" | "motion"            // new
  | "border" | "opacity" | "zindex"
  | "breakpoint" | "grid" | "sizing"
  | "icon" | "imagery";                       // 14 total

interface DesignToken {
  id: string;                  // e.g. "color-brand-500"
  friendlyName: string;        // e.g. "Brand color"  ← beginner-mode label
  kind: TokenKind;
  value: TokenValue;           // discriminated union per kind
  cssVar: string;              // e.g. "--bd-color-brand-500"
  category?: string;           // grouping inside kind (e.g. "brand", "neutral")
}
```

### 5.4 Style preset shape

```typescript
type PresetCategory =
  | "button" | "card" | "form" | "link"
  | "badge" | "alert" | "tooltip" | "modal"
  | "nav" | "table" | "layout";              // 11 total

interface StylePreset {
  id: string;                  // e.g. "button-primary"
  friendlyName: string;        // e.g. "Primary button"
  category: PresetCategory;
  variant: string;             // e.g. "primary" | "secondary" | "ghost"
  bindings: {
    [cssProperty: string]: { tokenId: string };
  };
  // example: { "background-color": { tokenId: "color-brand-500" } }
}
```

Bindings reference token IDs only. Raw values are forbidden; this is what makes propagation O(1) at the CSS-variable level.

### 5.5 Catalog component shape (Model 2B · pure data)

```typescript
interface ComponentType {
  id: string;                            // e.g. "button"
  category: "atom" | "molecule" | "organism";
  name: string;                          // user-facing label
  variants: string[];                    // e.g. ["primary","secondary","ghost","link"]
  sizes?: string[];                      // e.g. ["sm","md","lg"]
  schema: ComponentSchema;
  defaultBindings: {
    [variant: string]: {
      [cssProperty: string]: { tokenId: string };
    };
  };
}

interface ComponentSchema {
  props: Record<string, PropDefinition>;
  structure: SchemaNode;
  behaviors?: string[];                  // names of behavior modules
}

type SchemaNode =
  | { type: "element"; tag: string; classes: string[]; attrs?: Record<string,string>; children?: SchemaNode[] }
  | { type: "slot"; name: string; showIf?: string }
  | { type: "text"; source: string }
  | { type: "icon"; source: string; showIf?: string };
```

`{variant}`, `{size}`, `{disabled}` etc. are placeholder expressions resolved at interpret time.

### 5.6 Component instance (canvas state)

```typescript
type ComponentInstance =
  | {
      source: "catalog";
      componentTypeId: string;
      variant: string;
      size?: string;
      props: Record<string, unknown>;
      overrides?: PartialBindings;
    }
  | {
      source: "user";
      userComponentId: string;
      overrides?: PartialBindings;
      detached?: true;
    };
```

### 5.7 SSOT contract

Every concept has exactly one canonical home. Forbidden duplications are auto-rejected via CI gates (Section 9).

| Concept | Canonical Home |
|---|---|
| All foundation tokens (14 kinds) | `editor/design-system/state/TokenRegistryContext.tsx` |
| Style presets (11 categories) | `editor/design-system/state/StylePresetRegistry.tsx` |
| Buildrik-shipped catalog | `editor/components-catalog/catalog.ts` (compile-time) |
| User-saved compositions | `composer.components.userSaved` |
| Component instance discriminator | `ComponentInstance.source: "catalog" \| "user"` |
| Beginner/Pro mode flag | `editor/design-system/state/DSModeContext.tsx` |
| Token default values | `editor/design-system/constants.ts` (`DEFAULT_TOKENS`) |
| Token kind enum | `editor/design-system/types.ts` (`TokenKind`) |
| Preset category enum | `editor/design-system/types.ts` (`PresetCategory`) |
| Variant definitions | `ComponentType.variants` field |
| Default token bindings per variant | `ComponentType.defaultBindings[variant]` |
| CSS variable generation | runtime, written to `:root` from TokenRegistry |
| Friendly names (beginner labels) | `DesignToken.friendlyName` field |
| Component DS-link state | `dsBound: boolean` on user-saved master |
| Preset → token bindings | `StylePreset.bindings` field |
| Token usage scan | `useTokenUsageMap` (existing, extended) |
| Migration schemas | `editor/design-system/migrations/` |
| Importer parsers | `editor/design-system/importers/` |
| Export bundle format | `editor/design-system/utils/exportUtils.ts` |
| Buildrik Starter library | `editor/sidebar/tabs/starters/starterCatalog.ts` |
| Persistence to project | `Composer.setProjectSettings` |

**Forbidden duplications:**

- Raw color/spacing/radius literals in preset bindings (must reference `tokenId`).
- Raw token values in component instances (instance → master → DS chain only).
- Token defaults defined outside `constants.ts`.
- DS state in localStorage outside `DSModeContext` and existing token registry persistence.
- CSS variable `--bd-*` definitions for user tokens in any `.css` file (runtime-generated only).
- Friendly-name dictionary as a separate map.
- Parallel "DS-bound components" store (use `dsBound` flag).
- Catalog component types defined outside `editor/components-catalog/`.
- Variant string literals outside `ComponentType.variants`.
- User-saved component duplicating catalog type's structure (lint warning, not block).
- Section-template store (deleted in migration 0011).
- MyTemplates store (deleted in migration 0010).
- String-literal token kinds outside `TokenKind` type union.

---

## 6. UI components

### 6.1 Sidebar IA changes

| Tab | Before | After |
|---|---|---|
| `design` | full-page, 3 sub-tabs (Colors/Type/Spacing) | full-page, 4 sub-tabs (Tokens / Styles / Components / Export) |
| `components` | panel, "Comps" label | panel, "Components" label, dual-section, DS chip |
| `templates` | full-page MyTemplates + SectionTemplates | full-page Starters (read-only Buildrik library) |
| `add`, `ai`, `layers`, `pages`, `settings`, `publish`, `history`, `assets` | unchanged | unchanged |

No new tabs. No tabs deleted. Rail real-estate untouched.

### 6.2 Design tab — 4-section workspace

```
┌─ Design tab (full-page) ───────────────────────────────────┐
│  ┌─ Tokens / Styles / Components / Export ──────────────┐  │
│  │  Beginner | Pro · mode toggle (top-right)            │  │
│  │                                                      │  │
│  │  Tokens section (active):                            │  │
│  │    ▾ Color · 12 tokens                               │  │
│  │    ▸ Type · 8 tokens                                 │  │
│  │    ▸ Spacing · 9 tokens                              │  │
│  │    ▸ Radius · 5 tokens                               │  │
│  │    ▸ Shadow · 5 tokens                               │  │
│  │    ▸ Motion · 6 tokens                               │  │
│  │    ▸ Border · empty (muted in beginner)              │  │
│  │    ... 7 more kinds                                  │  │
│  └───────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

- TokensSection: 14 collapsible cards, one per `TokenKind`.
- StylesSection: 11 collapsible cards, one per `PresetCategory`.
- ComponentsSection: read-only summary (counts, DS-bound %); button to jump to Components panel.
- ExportSection: import dropdown, export dropdown, preview pane.

In beginner mode, empty foundation kinds appear muted at the bottom (discoverable but de-emphasized). In pro mode, every kind is equal and editable; token IDs and CSS variables are visible inline.

### 6.3 Components panel — dual-section (Model C)

```
┌─ Components panel (280 px) ────────────────────────────────┐
│ Components               [pin][+]                          │
│ ✓ Bound to DS · 6 styles · 47 tokens                       │
│ Filter: All | DS | Yours    Search [_______________]       │
│                                                            │
│ ── From your Design System · 27 ──────────────────────     │
│   Atoms (8)     Button | Input | Select | Checkbox | ...   │
│   Molecules (11) Card | Form | Alert | Modal | Nav | ...   │
│   Organisms (8) Hero | Footer | Pricing | CTA | ...        │
│                                                            │
│ ── Your symbols · 3 ──────────────────────────────────     │
│   Pricing block · ●3 instances                             │
│   Newsletter signup · ●1 instance                          │
│   Custom CTA · ●7 instances                                │
│   + Save current selection                                 │
└────────────────────────────────────────────────────────────┘
```

- `CatalogSection.tsx`: renders from `catalog.ts`. Drag → places catalog instance.
- `UserSavedSection.tsx`: existing `composer.components.userSaved` logic, moved here. Drag → places user-saved instance.
- `DSStatusChip.tsx`: header chip showing live DS-binding stats. Click jumps to Design tab.
- `ComponentRow.tsx`: each row shows DS-bound icon (green) or unbound warning (yellow ⚠).
- `DetachInstanceButton.tsx`: pro-mode action available in inspector when an instance is selected.
- `CreateComponentModal.tsx`: gains "Pre-fill from DS styles" toggle (default on).

### 6.4 Inspector binding chips

Per `editor/inspector/sections/DSBindingChip.tsx`:

- Bound to token → green chip with token ID. Click jumps to Design > Tokens > kind.
- Bound to preset → blue chip with preset ID. Click jumps to Design > Styles > category.
- Off-DS (raw value) → yellow ⚠ chip with the raw value. "Bind to token" suggestion in beginner mode.

### 6.5 Starters tab

`editor/sidebar/tabs/starters/StartersTab.tsx` is full-page browse-and-fork. `starterCatalog.ts` is compile-time data shipping in the editor bundle. No save action — read-only library.

A one-time toast on first load after migration: "Templates renamed to Starters · saved templates moved to Components" with a docs link.

### 6.6 Existing components reused without modification

- `PanelHeader`, `PanelShell`, `PanelErrorState` (extensions).
- `Modal`, `OverlayMount`, `Toast`, `Button`, `Input`, `EmptyState` (vibcoder primitives).
- `ColorTokenList`, `TypeTokenList`, `SpacingTokenList` (existing, moved into `tokens/` subfolder).
- `useColorRegistry`, `useTypeRegistry`, `useSpacingRegistry` (existing hooks; joined by 11 new siblings).
- `useTokenUsageMap` (existing scan; extended to cover new kinds and presets).
- `Composer.setProjectSettings` (existing persistence path).

---

## 7. Data flow

### 7.1 Direction rule

```
UI → Composer method → Registry mutation → EventBus emit → subscribers
```

UI never writes to a registry directly, never polls registry — it subscribes to events. Persistence flows through Composer only.

### 7.2 Flow · Token mutation

```
TokenList row · onChange("color-brand-500", "#0055FF")
  → composer.tokens.update("color-brand-500", "#0055FF")
  → validates (shape, kind match, ID exists)
  → TokenRegistry.set(...)
  → Composer.setProjectSettings(...)
  → EventBus.emit("token:updated", { kind, id })
  → subscribers fan out:
       - :root style sheet updates --bd-color-brand-500
       - TokensSection re-renders affected row
       - StylePresetRegistry recomputes preset bindings using the token
       - useTokenUsageMap bumps usage version
       - Inspector chips on bound elements re-render
       - Canvas elements with this var auto-restyle (CSS-driven, no React update)
```

CSS-driven canvas updates keep token mutation O(1) regardless of element count.

### 7.3 Flow · Preset binding propagation

`StylePreset.bindings` reference `tokenId`. When a token changes, the runtime CSS for `.preset-button-primary` updates automatically (the binding becomes `var(--bd-color-brand-500)`, not the raw value).

```css
.preset-button-primary {
  background-color: var(--bd-color-brand-500);
  padding: var(--bd-spacing-md);
  border-radius: var(--bd-radius-md);
}
```

No preset mutation needed. Same O(1) propagation as Flow 7.2.

### 7.4 Flow · Catalog component placement (Model B-side)

```
User drags Button from "From your DS" section
  → composer.components.placeInstance({
      source: "catalog",
      typeId: "button",
      variant: "primary"
    })
  → ComponentsManager.catalog resolves type from catalog.ts
  → creates element on canvas with componentTypeId + variant props
  → element rendered via interpreter using type's structure + DS bindings
  → emits "instance:placed", { source: "catalog" }
```

No master entity. The catalog type is the conceptual master, immutable, ships in the bundle.

### 7.5 Flow · User-saved component creation (Model A-side)

```
User selects element on canvas, clicks "+" in Components panel
  → CreateComponentModal opens with "Pre-fill from DS styles" toggle (default ON)
  → User confirms name + DS-bound flag
  → composer.components.userSaved.createComponent({
      name, elementId, dsBound: true
    })
  → ComponentsManager.userSaved:
       · serializes element subtree
       · scans every style prop → detects token/preset bindings
       · stores master with binding map preserved (not raw values)
       · creates initial instance from master at original location
  → emits "component:created", "component:master-updated"
```

Master stores bindings, not raw values. Token edits propagate visually to the master and all instances.

### 7.6 Flow · Master edit fans out

Instance overrides always win over master patches. If an instance has a local override on the same property, the master patch is masked.

### 7.7 Flow · Detach instance (pro-mode)

```
User right-clicks instance → Detach
  → composer.components.userSaved.detachInstance(id)
  → removes masterId reference, copies current resolved values
  → marks dsBound: false on the detached instance
  → emits "component:detached"
```

Detach is one-way per session. Re-attach = save as new component.

### 7.8 Flow · Token update fans out to BOTH sources

Token brand-500 changes → CSS var updates → catalog Buttons restyle (no React work) AND user-saved Heroes restyle (same path). Both sources benefit equally from O(1) propagation.

### 7.9 Flow · Import DS bundle

```
User picks file → importer parses based on type (Tokens Studio / Tailwind / Figma Variables)
  → validation: ID collisions, schema, friendly-name dedup
  → preview modal: "Will add 47 tokens, replace 12 conflicts"
  → user picks merge strategy: replace / merge-keep-mine / merge-keep-theirs
  → composer.tokens.bulkImport(tokens, strategy)
  → TokenRegistry applies in transaction (all-or-nothing)
  → emits "tokens:bulk-updated"
  → single re-render pass, single CSS regeneration
```

### 7.10 Flow · Export DS bundle

`exportUtils.buildExport({ tokens, presets, components })` serializes to target format.
- Buildrik bundle: lossless (full registry + masters).
- Tokens Studio / Figma Variables / Tailwind: lossy where target spec doesn't cover all kinds (e.g., Tailwind has no Motion concept → motion tokens dropped with warning).

### 7.11 Flow · Beginner/Pro mode toggle

`DSModeContext.setMode("pro")` writes to localStorage and triggers conditional rendering. Engine state identical in either mode. Mode flip is instant, no data loss, no surprise.

### 7.12 Edge case decisions

| Scenario | Behavior |
|---|---|
| Token deleted while preset references it | Block in beginner; warn + cascade-update preset to fallback in pro. |
| Component master deleted with instances live | Block in beginner; in pro: confirm + auto-detach all instances. |
| Import collision on token ID | Modal asks: replace / merge-keep-mine / merge-keep-theirs. |
| Off-DS override on bound preset | Beginner: warn before commit; Pro: silent allow. |
| Migration partial failure | Rollback transaction; keep old schema; surface error toast + Sentry breadcrumb. |
| Two browsers edit same DS concurrently | Last-writer-wins via Composer event fence (existing pattern); CRDT future arc. |
| Token rename | Updates ID + cssVar; rewrites CSS regen; existing element vars rebind via redirect map (1-version-back). |

---

## 8. Error handling

### 8.1 Taxonomy

| Category | Where caught | UX result |
|---|---|---|
| Validation | Composer method entry | Inline form error · no commit |
| Persistence | `setProjectSettings` chain | Toast + auto-retry · last-good-state preserved |
| Render | Interpreter + canvas | Component error boundary · "broken" placeholder · Sentry |
| Migration | First-load schema check | Modal + rollback to old schema · breadcrumb |
| I/O | Import/export adapters | Modal with error detail · partial-progress preserved |

### 8.2 Error class hierarchy

```typescript
// shared/errors/dsErrors.ts
class DSError extends Error {
  constructor(public code: string, message: string, public context?: object) {
    super(message);
  }
}

class TokenValidationError extends DSError {}
class TokenInUseError extends DSError {}
class PresetValidationError extends DSError {}
class CatalogSchemaError extends DSError {}
class ComponentValidationError extends DSError {}
class ComponentInUseError extends DSError {}
class TokenPersistenceError extends DSError {}
class ComponentPersistenceError extends DSError {}
class CatalogRenderError extends DSError {}
class BehaviorAttachError extends DSError {}
class MigrationError extends DSError {}
class SchemaVersionError extends DSError {}
class ImportParseError extends DSError {}
class ImportValidationError extends DSError {}
class ExportSerializeError extends DSError {}
```

Composer methods throw domain errors. UI subscribes and translates to user-friendly messages. Sentry captures all `DSError` extends in the background.

### 8.3 Critical UX rules

- **No silent deletes.** Always confirmation modal for in-use tokens, in-use components, etc.
- **No silent partial imports.** Show full list of skipped items before commit.
- **No silent migration data loss.** Snapshot before; rollback on failure.
- **No silent off-DS commits in beginner mode.** Always warn before commit.
- **Render-error boundaries on every catalog component.** One broken type does not blank the canvas.

### 8.4 UX patterns

| Severity | Surface | Example |
|---|---|---|
| Inline | Form field | Invalid hex color |
| Toast | Bottom-right ephemeral | Save failed · retrying |
| Modal | Center blocking | Migration failed · token in use |
| Banner | Persistent panel header | Catalog has 1 broken type ⚠ |
| Indicator | Element corner glyph | Off-DS override · broken master |
| Sentry only | Background | Stale event subscriber, recovered |

---

## 9. Testing strategy

### 9.1 Layers

```
  E2E (browser via /qa skill)         · 5 happy paths
  Integration (Vitest + RTL)          · ~30 cross-module flows
  Unit (Vitest, co-located __tests__) · ~200 per-file
  CI gates (build-time validators)    · zero runtime cost
```

### 9.2 CI gates

Implementation in `scripts/`:

- `check-catalog-schema.mjs` — Zod-validate every catalog file.
- `check-behavior-references.mjs` — every `behaviors[]` entry must resolve.
- `check-token-references.mjs` — every binding `tokenId` must reference a registered token.
- `check-variant-coverage.mjs` — every variant must have a `defaultBindings` entry.
- `check-migration-fixtures.mjs` — every migration must have a passing test fixture.
- `check-ds-binding-renderers.mjs` — Inspector chip type for each token kind.

Run on `npm run check:ci` and on every PR via GitHub Actions. Block merge on failure. Pattern mirrors existing `check-buildrick-baseline.mjs`.

### 9.3 Unit tests (selected)

- 11 new `useXTokens.test.ts` (one per new kind).
- `StylePresetRegistry.test.tsx` — preset CRUD + token-deletion cascade.
- `interpreter.test.tsx` + 4 sub-tests — schema → DOM correctness.
- 10 per-component catalog tests — schema validation, all variants render, axe a11y, keyboard interaction.
- Existing user-saved manager tests extended for `dsBound`, detach, fan-out preserving overrides.
- Per-importer tests: valid/invalid/lossy/round-trip.
- `DSModeContext.test.tsx` — default, persistence, localStorage-unavailable fallback.

### 9.4 Integration tests

```
editor/__tests__/integration/
├── tokenUpdate.fanout.test.tsx
├── presetTokenChange.test.tsx
├── catalogPlacement.test.tsx
├── userSaveDS.test.tsx
├── componentEdit.fanout.test.tsx
├── importBundle.atomic.test.tsx
├── migration.0010.test.tsx
└── inspectorChip.flow.test.tsx
```

### 9.5 Migration tests

Each migration ships with a `before.json` and `after.json` fixture. Test runs migration on `before` → asserts equals `after` byte-for-byte (after deterministic ordering). Idempotence test runs the migration twice. Rollback test triggers mid-migration error and asserts `before` state restored.

### 9.6 E2E (5 flows)

1. New project → blank DS → add token → drag Button → Button uses token.
2. New project → import Tokens Studio JSON → catalog Buttons restyle.
3. Build composition → save as own component → use on second page → edit master → both update.
4. Pro mode: instance → detach → master edit → detached unaffected.
5. Load v6 project → migration runs → DS workspace renders correctly.

E2E runs on release tags only, not every PR. Use `/browse` skill from gstack per CLAUDE.md.

### 9.7 Coverage targets

| Layer | Target |
|---|---|
| Engine state files | 80%+ |
| UI components | 60%+ |
| Catalog schemas | 100% (gate) |
| Behavior references | 100% (gate) |
| Migration fixtures | 100% (gate) |

### 9.8 Skipped Phase 1

- Pixel-diff visual regression (Percy/Chromatic).
- Performance benchmarks (advisory only, not gates).
- Cross-browser E2E matrix (single Chromium pass enough).

---

## 10. Migration plan

### 10.1 Schema versions

```
v6  current     · Color/Type/Spacing only · MyTemplates/SectionTemplates separate
v7              · + 11 token kinds (radius/shadow/motion/...)
v8              · + 11 style preset categories
v9              · + dsBound on components, detach support
v10             · MyTemplates → Components
v11             · SectionTemplates → Components
v12             · Templates store deleted, Starters catalog activated
v13             · DS mode preference field
```

### 10.2 Migration files

```
src/editor/design-system/migrations/
├── 0007-add-extended-token-kinds.ts
├── 0008-add-style-presets-store.ts
├── 0009-add-component-ds-bound-flag.ts
├── 0010-mytemplates-to-components.ts
├── 0011-sectiontemplates-to-components.ts
├── 0012-rename-templates-to-starters.ts
├── 0013-add-ds-mode-pref.ts
└── runner.ts
```

Each exports `{ fromVersion, toVersion, description, up(project), validate(project) }`.

### 10.3 Runtime flow

```
On project load:
  → Composer reads project.dsSchemaVersion
  → if currentVersion < TARGET_VERSION:
      · snapshot project state to localStorage["ds-migration-backup-{projectId}"]
      · run migrations sequentially
      · each wrapped in try/catch
        · on failure: rollback to snapshot, throw MigrationError, halt
      · each logs Sentry breadcrumb
      · on full success: clear snapshot
  → Editor loads with migrated project
```

User sees a brief spinner if migrations exceed 100 ms. Success is silent. Failure shows a blocking modal with a "Try again" / "Contact support" choice.

### 10.4 Critical migration · 0010 (MyTemplates → Components)

For each MyTemplate:
- Create user-saved Component master with the same `id` (preserves deep links).
- `dsBound: false` (old templates didn't have DS link).
- Move to `project.components.userSaved`.
- Clear `project.myTemplates`.

User sees existing MyTemplates appear in the "Your symbols" section of Components panel. Same names, same content. Deep links continue working.

Risk: medium. Conversion logic must preserve nested element structure exactly. Test fixture: project with 5 MyTemplates → migration → 5 Components in `userSaved` with identical trees.

### 10.5 Cleanup steps

After migration completes and 2 release cycles pass:

1. Delete `editor/templates/` (renamed already).
2. Delete `MyTemplates.tsx` and `SectionTemplates.tsx`.
3. Drop `@templates` alias from `tsconfig.json` if present.
4. Drop `project.myTemplates` and `project.sectionTemplates` deprecated fields.
5. Update CLAUDE.md SSOT contract with new canonical homes.
6. Add memory file `project_ds_components_arc_shipped_<DATE>.md`.

### 10.6 Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| 10 polished components Phase 1 = quality bottleneck | Medium | Pre-design schema for all 10 in Week 1-2; parallel work. |
| MyTemplates migration corrupts user data | Low | Snapshot + transaction · before/after fixtures. |
| Catalog interpreter slow on canvas with 100+ instances | Low | Bench in Week 5 · React.memo per type. |
| Importer formats incompatible (Tokens Studio v2 vs v1) | Medium | Test against fixture files for each format version. |
| Beginner mode hides too much | Medium | Empty foundations muted-not-hidden. |
| Behavior modules accumulate technical debt | Low | Cap at 10 behaviors total · code-review gate on adds. |

---

## 11. Release sequencing (12-week DS arc)

| Week | Phase | Deliverables |
|---|---|---|
| 1-2 | A · Token foundation | 0007 migration, 11 `useXTokens` hooks, `DEFAULT_TOKENS` extended, per-kind editor scaffolds, CI gates (schema/token-reference/variant-coverage), 11 token-kind unit tests + 0007 migration test |
| 3-4 | B · Style preset infra | 0008 migration, `StylePresetRegistry`, 11 preset editor scaffolds, usage map extended, preset registry unit + integration tests |
| 5-6 | C · Catalog (B-side) | `components-catalog/` folder, `types.ts`, interpreter (~200 LOC), 10 polished component schemas, 5-10 named behaviors, CI gates (catalog-schema/behavior-references), interpreter unit + per-component a11y/snapshot tests |
| 7 | D · Components panel restructure | `ComponentsTab` dual-section, `CatalogSection`, `UserSavedSection`, 0009 migration, `DSStatusChip`, `DSBindingChip` in inspector |
| 8 | E · User-saved DS-binding + detach | "Pre-fill from DS" toggle, `DetachInstanceButton` (pro-mode), fan-out preserving overrides, fan-out integration + detach unit tests |
| 9 | F · Templates → Starters | 0010 + 0011 + 0012 migrations, `starters/` rename, `starterCatalog.ts` (5-10 starter pages), MyTemplates UI removal, migration fixtures |
| 10 | G · Beginner/Pro mode + import/export | 0013 migration, `DSModeContext`, `ImportDSModal` + 3 importers, `ExportDSModal` + 4 export formats, importer unit + round-trip integration tests |
| 11 | H · Polish + E2E | Design tab UI polish, Inspector chip click-to-jump UX, 5 E2E happy-path tests, Sentry breadcrumb wiring, axe audit |
| 12 | I · Buffer + ship | Bug fixes, in-app docs, release notes, production migration smoke test |

**Critical path:** A → B → C → D → E. Migration phases (F) can run parallel to E. Phase G/H are additive and can compress. Week 12 is buffer.

---

## 12. Open questions / deferred

Three smaller decisions defaulted with "override during implementation" affordance:

1. **Import format priority** — defaulted to Tokens Studio + Tailwind + Figma Variables. Confirm during Phase G; could narrow to one if scope tightens.
2. **Starter DS gallery on project create** — defaulted to blank-with-defaults. Preset gallery (Stripe-style, Notion-style, Apple-style starter DSes) is a Phase 2 enhancement.
3. **Off-DS override behavior** — defaulted to warn-then-allow in beginner, silent allow in pro. Could flip to hard-block in beginner if user testing shows friction is preferred over orphaned overrides.

Out-of-scope items reserved for future arcs:

- Phase 2 promote-saved-symbol-to-typed-component.
- Phase 2 community/marketplace catalog.
- CRDT real-time collaboration.
- Pixel-diff visual regression infra.
- Sidebar IA reset (separate brainstorm if needed).

---

## 13. Appendix · Phase 1 catalog (10 polished components)

| # | Component | Tier | Variants | Sizes | Behaviors |
|---|---|---|---|---|---|
| 1 | Button | atom | primary, secondary, ghost, link, outline | sm, md, lg | focus-ring, click |
| 2 | Input | atom | default, error, success | sm, md, lg | focus-ring |
| 3 | Select | atom | default, error | sm, md, lg | focus-ring, dropdown |
| 4 | Checkbox | atom | default, indeterminate | sm, md, lg | focus-ring |
| 5 | Badge | atom | neutral, success, warning, danger, info | sm, md | — |
| 6 | Card | molecule | flat, elevated, outlined, interactive | — | hover-lift (interactive only) |
| 7 | Form | molecule | vertical, horizontal | — | — |
| 8 | Alert | molecule | info, success, warning, danger | — | dismiss |
| 9 | Hero | organism | left-aligned, center, split-image | — | — |
| 10 | Footer | organism | minimal, columns, mega | — | — |

Phase 2 additions (next quarter): Modal, Tabs, Nav, Tooltip, Toast, Pricing, FeatureGrid, CTA.
Phase 3+: Switch, Radio, Drawer, Pagination, Breadcrumb, Table, FAQ, Header, Navbar variants.

---

## 14. Memory references

- `feedback_inventory_must_cross_packages.md` — multi-package plans need multi-package inventory.
- `feedback_ssot_verification.md` — never trust constants files as canonical; grep consumers.
- `feedback_axioms_against_code.md` — design rules must hold against shipped code, not intended direction.
- `feedback_phantom_bugs_static_analysis.md` — verify against actual semantics, not static analysis assumptions.
- `feedback_no_stash_mid_execution.md` — don't stash mid-execution for baseline checks.
- `feedback_replace_all_word_boundary.md` — `replace_all` is literal substring, not word-boundary.
- `project_vibcoder_finish_arc_20260507.md` — CI per-panel-growth gate pattern; 274 → 72 LOC drain.
- `project_phase_1c_editor_publish_20260507.md` — Phase 1 publish wiring (current state of editor roadmap).

---

## 15. Approval

| Section | Status |
|---|---|
| 1. Summary | ✓ |
| 2. Goals | ✓ |
| 3. Non-goals | ✓ |
| 4. Locked decisions | ✓ (extended in §16) |
| 5. Architecture | ✓ (extended in §16) |
| 6. UI components | ✓ |
| 7. Data flow | ✓ (extended in §16) |
| 8. Error handling | ✓ (extended in §16) |
| 9. Testing strategy | ✓ (extended in §16) |
| 10. Migration plan | ✓ (extended in §16) |
| 11. Release sequencing | ✓ (replaced by §16) |
| 12. Open questions | ✓ (resolved in §16) |
| 13. Catalog appendix | ✓ |
| 14. Memory references | ✓ |
| 16. CEO Review Addendum | ✓ |

Implementation plan to be drafted via `superpowers:writing-plans` skill once user approves spec.

---

## 16. CEO Review Addendum (2026-05-07 · `/plan-ceo-review`)

This section captures decisions D1–D25 from the SELECTIVE EXPANSION review of the v1 spec. Treat addendum as authoritative where it conflicts with v1 body. Implementation plan must reflect addendum, not v1 alone.

### 16.1 Foundation Prereqs (NEW · Week 0 · 1-3 weeks pre-arc)

Per D10, the DS arc cannot start until these gaps are closed. Each is currently a TODO item or unwritten doc:

| Prereq | Source | Effort | Acceptance |
|---|---|---|---|
| **jsdom test env fixed** | TODOS.md P2 | ~1 day CC | `render()` and `renderHook()` succeed; existing test suite passes |
| **Component swap override preservation MVP** | TODOS.md P2 | ~2 weeks human / ~3 hr CC | Master patches preserve instance-level overrides via JSON-patch path remapping; spec §7.6 claim becomes true |
| **DESIGN.md ships** (focused, ~1 day) | D25, TODOS.md P2 | ~1 day | Doc covers cobalt accent, Inter Tight body, 4px base, density rules, ban list. Memory `project_editor_chrome_ds.md` has ~80% pre-drafted content. |
| **Vibcoder Stage 2/3 explicitly deferred** | D12 | doc-only | Spec note: "Components panel = 280px; Stage 2 chrome-ssot deferred indefinitely" |

Total prereq budget: **~3 weeks (Week 0)**. Phase A starts only after all four prereqs land.

### 16.2 Approach Locked · Implementation strategy

**D1 = Approach A · Full DS arc as specced.** Despite audit findings flagging in-flight work, broken jsdom, and ~50-file scope as risk, user committed to ambition. Compression levers (factory hooks D19, deferrable surface) noted but not pre-applied.

**D2 = SELECTIVE EXPANSION review mode.** Hold spec scope as baseline + cherry-pick expansions. 6 expansions accepted:

| Cherry-pick | Effort (human/CC) | Phase |
|---|---|---|
| D3 · AI-assist component schema generation | 1 wk / 2 hr | C |
| D4 · Token aliasing (semantic layer, depth-1) | 2 days / 30 min | A |
| D5 · DS export → publishable CSS bundle | 1 day / 30 min | G |
| D6 · Starter DS gallery (6-8 themed) | 2 wks / 3 hr | F |
| D7 · DS lint warnings (debounce 500ms per D21) | 3 days / 1 hr | H |
| D8 · Dark mode infrastructure (color-only) | 1 wk / 1.5 hr | B |

Lower-priority cherry-picks (12 total proposals; 6 deferred) live in TODOS.md per D27.

### 16.3 Token shape extended (D4 + D11)

```typescript
interface DesignToken {
  id: string;                           // "color-blue-500"
  friendlyName: string;                 // "Brand color"
  kind: TokenKind;
  
  // Either raw value...
  value?: TokenValue | {                 // D11: dual-mode for color kind
    light: TokenValue;
    dark?: TokenValue;                   // optional; D16 fallback to light
  };
  
  // OR alias pointer to another token
  aliasOf?: string;                     // D4: depth-1 only Phase 1
  
  cssVar: string;                       // "--bd-color-blue-500"
  category?: string;
}
```

Validation rules:
- D15: alias cycle detection runs at import + at every alias edit (DFS visit-set, throws `AliasCycleError` with chain)
- D16: dark-mode missing pair → fall back to light + show yellow warn chip in Inspector

### 16.4 Catalog instance + version migration (D18)

`ComponentInstance` extended:

```typescript
type ComponentInstance =
  | {
      source: "catalog";
      componentTypeId: string;           // e.g. "button"
      variant: string;                   // e.g. "primary"
      size?: string;
      props: Record<string, unknown>;
      overrides?: PartialBindings;
    }
  | { source: "user"; userComponentId: string; overrides?: PartialBindings; detached?: true };
```

Catalog version migration map (NEW concept):

```typescript
// editor/components-catalog/migrations.ts
export const CATALOG_MIGRATIONS = [
  { from: "button.outline", to: "button.stroke" },         // Phase 2 example
  { deprecated: "badge.legacy", fallback: "badge.neutral" },
];
```

Runs on project load; auto-rewrites instances with deprecated typeId/variant. Includes chaos test in spec §9.

### 16.5 Architecture additions (D3, D5, D7, D14, D17, D22)

Composer surface extended:

```
composer
  .tokens                  (existing, extended for 14 kinds)
  .presets                 (NEW · 11 categories)
  .components.catalog      (NEW · read-only)
  .components.userSaved    (existing, gains dsBound + detach)
  .aliasResolver           (NEW · D4 · cycle-validated)
  .darkResolver            (NEW · D8 · light/dark resolve with D16 fallback)
  .aiAssistService         (NEW · D3 · stubbed in tests per D20)
  .dsLinter                (NEW · D7 · debounce 500ms per D21)
  .cssBundler              (NEW · D5 · publish-time injection)
  .auditLogger             (NEW · D22 · AI prompt audit log)
```

Catalog importer security (D17): Tailwind config parsed via **AST only** (`@babel/parser` walking the literal `theme.*` tree). The importer must NOT execute or evaluate user-supplied JavaScript via any runtime evaluation primitive. Allowlist extracts theme literals; reject configs requiring JS execution (functions, dynamic plugin calls, conditional logic).

AI error class hierarchy (D14):
```typescript
class AITimeoutError       extends DSError {}
class AIRateLimitError     extends DSError {}
class AIInvalidSchemaError extends DSError {}
class AIPromptRejectedError extends DSError {}
class AIPartialOutputError  extends DSError {}
```
Each maps to specific UX (toast / modal / retry). AI quota uses existing `AIUsage` service (memory `project_ai_tab_phase_1_2_20260426.md`).

### 16.6 SSOT contract additions

Extend §5.7 SSOT table with:

| Concept | Canonical Home |
|---|---|
| Alias chain | `editor/design-system/state/AliasResolver.ts` (NEW) |
| Dark mode resolver | `editor/design-system/state/DarkResolver.ts` (NEW) |
| AI-assist service | `editor/design-system/services/AIAssistService.ts` (NEW) |
| AI audit log | `dashboard` Prisma table `DSAIAudit` (NEW · D22) |
| DS lint rules | `editor/design-system/lint/rules/*.ts` (NEW · D7) |
| CSS bundler | `editor/design-system/bundler/CSSBundler.ts` (NEW · D5) |
| Starter DS catalog | `editor/sidebar/tabs/starters/dsStarterCatalog.ts` (NEW · D6) |
| Catalog version migrations | `editor/components-catalog/migrations.ts` (NEW · D18) |
| Migration in-progress marker | `project.dsMigrationInProgress` field (NEW · D13) |
| Per-phase feature flags | `VITE_FEATURE_DS_*` env vars (NEW · D23) |

### 16.7 DRY refactor: factory pattern (D19)

Replace 11 separate `useXTokens.ts` files with single factory:

```typescript
// editor/design-system/state/createTokenHook.ts
export function createTokenHook(kind: TokenKind, defaults: TokenValue[], validators: Validator[]) {
  return function useKindTokens() { /* shared implementation */ };
}

// per-kind file becomes:
// editor/design-system/state/useRadiusTokens.ts
export const useRadiusTokens = createTokenHook("radius", DEFAULT_RADIUS, RADIUS_VALIDATORS);
```

Same pattern for 11 preset editors via `<PresetEditor category={...} schema={...} />`. Saves ~1300 LOC.

Migration boilerplate via `defineMigration({ fromVersion, toVersion, up, validate })` helper (~200 LOC saved).

### 16.8 Test strategy additions

Per D20: AI-assist tests use stub `AIClient` interface in unit/integration; live API smoke runs only on release tags. ~10 prompt fixtures with snapshot expected schemas.

Per D14 + D15 + D16 + D18: dedicated test suites for each error class, alias cycle detection, dark-mode fallback, catalog version chaos.

Per D6 + D7: starter DS gallery axe tests per starter; DS lint corpus of known-bad fixtures (delta-E violations, contrast failures, spacing duplicates).

D8 dark mode parity: every catalog component test runs both light + dark assertions. Test count grows ~2× for catalog visual tests but ~1.3× total.

### 16.9 Observability (D22)

New Prisma table `DSAIAudit`:

```prisma
model DSAIAudit {
  id          String   @id @default(cuid())
  projectId   String
  userId      String
  timestamp   DateTime @default(now())
  prompt      String   @db.Text
  schemaJSON  Json
  accepted    Boolean
  // indices on userId+timestamp, projectId+timestamp
}
```

Used for:
- Adversarial prompt detection (security)
- Prompt quality analytics (product)
- Future fine-tuning data (Phase 2+)

Mode toggle telemetry via existing analytics (low-effort). Metrics + alerts dashboards deferred Phase 2 (TODOS).

### 16.10 Deployment (D23)

Per-phase `VITE_FEATURE_DS_*` flags:

| Flag | Phase | Default |
|---|---|---|
| `VITE_FEATURE_DS_TOKENS` | A | false |
| `VITE_FEATURE_DS_PRESETS` | B | false |
| `VITE_FEATURE_DS_CATALOG` | C | false |
| `VITE_FEATURE_DS_AI_ASSIST` | C (after stable) | false |
| `VITE_FEATURE_DS_PANEL_V2` | D | false |
| `VITE_FEATURE_DS_STARTERS` | F | false |
| `VITE_FEATURE_DS_PUBLISH_BUNDLE` | G | false |
| `VITE_FEATURE_DS_IMPORT_EXPORT` | G | false |
| `VITE_FEATURE_DS_LINT` | H | false |

Each flips on after staging validation per phase. Flag-gate ALL new surface.

Backward-compat (Section 9 finding): old editor session reads new schema → version mismatch detected via `dsSchemaVersion > KNOWN_VERSION` → "editor outdated, refresh" toast. Forward-fix-only policy: migrations forward-only; rollback only via point-in-time DB restore documented in 1-page runbook.

### 16.11 First-time UX (D24)

New project + first Design tab open → **Starter DS gallery (D6) auto-shows**. User picks Stripe-blue / Notion-warm / Apple-minimal / Linear-dark / Vercel-mono / +1-3 themed OR clicks "Skip — build from blank." Once any token edited, gallery dismissed forever for that project.

### 16.12 Release sequencing — REPLACES v1 §11

Original 12-week plan + 6 expansions + 3-week prereq sprint = **~16 weeks of in-arc work + Week 0 prereqs**.

| Phase | Weeks | Includes (relative to v1 + expansions) |
|---|---|---|
| **Week 0 · Prereq sprint** | 1-3 | jsdom fix, override preservation MVP, DESIGN.md focused doc, Vibcoder Stage 2/3 deferral note |
| A · Token foundation + aliasing | 4-6 | v1 Phase A + D4 alias layer + D11 dark shape on color kind + D17 AST Tailwind importer |
| B · Style preset infra + dark mode color pairs | 7-8 | v1 Phase B + D8 dual-value resolver |
| C · Catalog + AI-assist + audit log | 9-11 | v1 Phase C + D3 AI service + D22 audit table + D14 AI errors + D20 stub strategy |
| D · Components panel + Inspector chips | 12 | v1 Phase D unchanged |
| E · User-saved DS-binding + detach | 13 | v1 Phase E (depends on Week 0 override preservation) |
| F · Templates → Starters + Starter DS gallery | 14-15 | v1 Phase F + D6 starter library + D24 first-time UX |
| G · Beginner/Pro + Import/Export + CSS bundle | 16 | v1 Phase G + D5 publish bundler |
| H · DS lint + AI audit + smoke checklists | 17 | D7 lint + alerts ground-laid (deferred) |
| I · Polish + E2E + buffer | 18-19 | full polish + 2-week buffer |

**Total: 19 weeks elapsed** (3-week prereq + 16-week arc). Per-phase feature flags isolate risk.

### 16.13 Risk register — REPLACES v1 §10.6

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| jsdom blocks 280 unit tests | Resolved | n/a | Week 0 prereq sprint |
| Override preservation TODO unbuilt | Resolved | n/a | Week 0 prereq sprint MVP ships |
| 19-week elapsed budget vs in-flight features | High | Schedule slip | Per-phase feature flags · parallelizable Phase F · Week 18-19 buffer |
| Catalog content quality bottleneck | Medium | "junior" tool comparison | Pre-design 10 schemas in Week 4 · D3 AI-assist eases Phase 2 growth |
| Starter DS gallery quality vs Stripe et al | Medium | AI-slop perception | Each starter = dedicated design pass · 2 weeks budget · memory shows you've fought slop before |
| AI-assist generates broken schemas | Medium | Catalog corruption | Zod gate · preview-before-commit · D14 error classes · D22 audit |
| Dark mode catalog binding complexity | Medium | Components must mode-fit | Bind via aliases (D4) · per-component dark fitness review |
| Tailwind config import code execution | Resolved | n/a | D17 AST-only parser |
| Token alias cycle injection via import | Resolved | n/a | D15 cycle detection at every entry |
| Catalog version drift breaks existing instances | Resolved | n/a | D18 catalog migration map |

### 16.14 Phase scope cuts available if Week 18 falls behind

In strict order of "least painful to cut":

1. Drop 3 of 4 import formats (keep Tokens Studio only) — saves ~3 days
2. Drop 3 of 4 export formats (keep Buildrik bundle only) — saves ~2 days
3. Defer beginner/pro tiered UX → ship pro-only Phase 1, beginner Phase 2 — saves ~1 week (D24 UX still works for beginners since pre-built Starters cover most)
4. Drop 3 starter DSes (ship 3 instead of 6-8) — saves ~1 week
5. Defer Templates → Starters rename (keep MyTemplates, defer rename Phase 2) — saves ~3 days
6. Drop dark mode (D8) entirely — saves ~1 week, big UX cost

Cut order minimizes user-visible impact. **Ship-or-cut decision point: Week 17 retro.**

### 16.15 Decisions index

| ID | Topic | Resolution |
|---|---|---|
| D1 | Implementation approach | Full A as specced |
| D2 | Review mode | SELECTIVE EXPANSION |
| D3 | AI-assist component generation | ACCEPTED |
| D4 | Token aliasing | ACCEPTED |
| D5 | DS publish CSS bundle | ACCEPTED |
| D6 | Starter DS gallery | ACCEPTED |
| D7 | DS lint warnings | ACCEPTED |
| D8 | Dark mode (color) | ACCEPTED |
| D9 | Continue review | Proceed to sections |
| D10 | Foundation prereqs | Week 0 sprint |
| D11 | Dark token shape | Option A (`{light, dark}` per token) |
| D12 | Vibcoder Stage 2/3 | Document 280px override |
| D13 | Migration in-progress marker | Add per migration |
| D14 | AI-assist error classes | Full enumeration |
| D15 | Alias cycle detection | At import + at every edit |
| D16 | Dark-mode missing pair | Fall back to light + warn chip |
| D17 | Tailwind import strategy | AST parse + allowlist |
| D18 | Catalog version migration | Per-version migration map + auto-rewrite |
| D19 | DRY refactor pattern | Factory for hooks + editors |
| D20 | AI-assist test strategy | Stub + snapshot + release-tag smoke |
| D21 | Lint scan timing | Debounce 500ms |
| D22 | AI audit log scope | Full audit log (Prisma table) |
| D23 | Feature flag strategy | Per-phase flags |
| D24 | First-time IA | Starter gallery first |
| D25 | DESIGN.md prerequisite | Ship Phase A0 (~1 day) |
| D26 | Outside voice | Skipped |
| D27 | TODOS batch | All 15 added |
| D28 | Spec update strategy | This addendum |

### 16.16 Memory references added

- `feedback_audit_phase_specs_against_engine_apis.md` — applied here (audit caught jsdom + override preservation gaps before Phase A)
- `project_phase_1c_editor_publish_20260507.md` — relevant for D5 publish CSS bundle
- `project_ai_tab_phase_1_2_20260426.md` — relevant for D22 audit log + AIUsage quota service
- `project_q2_day3_4_shipped_20260507.md` — relevant for understanding existing component-library churn (override preservation MVP partial work)

### 16.17 Design Review Addendum (2026-05-07 · `/plan-design-review`)

Design review surfaced 7-pass audit. Initial overall 5/10 → 8.7/10 after 5 decisions.

**Critical correction to §16.1:** DESIGN.md (`/Users/shahg/Desktop/pencil/buildrik/DESIGN.md`, 356 lines) **EXISTS** — confirmed at design-review time. The TODOS.md "DESIGN.md not yet created" entry was stale. **D25 (Phase A0 DESIGN.md ship) is OBSOLETE** — already shipped. Week 0 prereq sprint reduces to 3 items: jsdom fix, override preservation MVP, `dsSchemaVersion` field.

**DESIGN.md direction (calibration baseline for Phase 1):**
- Industrial / utilitarian / light chrome ("Webflow meets Linear, daylight edition")
- Audience: solo pro designers / Webflow-Framer migrants (NOT beginners — affects D24 first-time UX framing)
- NO BLACK rule: no `#000`, no near-black surfaces; max dark = `#334155`
- Cobalt accent (`#2D6DFF`); no purple/violet/indigo
- No system font fallbacks (no `system-ui`, `-apple-system`, Arial, Roboto)
- General Sans (display, marketing only) / Inter Tight (UI body) / Geist Mono (data)
- 4px base spacing, compact density
- Minimal motion, no spring physics, no scroll choreography

**Design decisions D1-D5 (re-numbered DD1-DD5 to avoid collision with prior CEO/Eng D-numbering):**

| ID | Topic | Resolution |
|---|---|---|
| DD1 | Review focus | All 7 passes condensed |
| DD2 | Catalog visual discipline | CI gate + linter + per-starter design pass requirement |
| DD3 | a11y baseline scope | Full Phase 1 (Inspector chip ARIA, modal focus traps, Design workspace keyboard nav, catalog ARIA defaults) |
| DD4 | Lint chip placement + colors | Hybrid: per-property Inspector chip + Design tab banner; chip colors map to DESIGN.md status tokens (NO raw green/blue/yellow) |
| DD5 | Design TODOs batch | 3 added (per-starter design pass, catalog mockups, DESIGN.md AI-assist UI extension) |

**Pass scores (initial → final):**

| Pass | Initial | Final | Resolution |
|---|---|---|---|
| 1 IA | 7 | 8 | Storyboard added (10-step user journey) |
| 2 States | 5 | 9 | Full state coverage table for 10 features |
| 3 Journey | 3 | 9 | Emotional arc storyboard with magic moments (D8 alias rebrand, save-your-gap symbol) |
| 4 AI Slop | 5 | 8 | DD2 CI gate enforces slop blacklist + per-starter design pass |
| 5 DESIGN.md | 7 | 9 | DD2 enforces NO-BLACK + no-system-fallback in catalog + presets |
| 6 a11y | 4 | 9 | DD3 full baseline (Inspector chip ARIA, modal traps, keyboard nav, axe per catalog component) |
| 7 Decisions | 6 | 9 | DD4 lint placement + chip color tokens resolved |
| **Overall** | **5** | **8.7** | — |

**User journey storyboard (Pass 3 deliverable, 10 steps):**

1. Open editor for new project → Starter DS gallery auto-shows (per D24)
2. Pick "Stripe-blue" starter → Tokens populate, catalog Buttons restyle in <500ms, "Your DS is ready" toast
3. Drag Button onto canvas → Catalog instance renders, Inspector shows binding chips
4. Notices brand color is wrong → Click chip → jumps to Design > Tokens > brand-500, edit, all instances restyle live
5. Saves Hero composition as user-saved Component → "Pre-fill from DS" toggle, DS-bound chip "✓ uses 6 tokens"
6. Reopens project next day → Editor loads with DS intact, components in Yours section, no friction
7. Publishes site → "Live at <url>" toast, DS bundle injected (D5)
8. Client asks rebrand → Edit alias `primary → color-purple-700`, all pages restyle (D4 magic moment)
9. Stuck without "Stepper" component → Build from primitives + save as Yours symbol (C-model rescue)
10. Ships work to client → DS export to Tokens Studio JSON for handoff

**Interaction state coverage table (Pass 2 deliverable):**

| Feature | Loading | Empty | Error | Success | Partial |
|---|---|---|---|---|---|
| Tokens section | skeleton 3-5 rows | "No {kind} yet · + Add" | red banner + retry | inline edit feedback | n/a |
| Components panel · DS catalog | static (compile-time) | n/a (always >10) | broken-type placeholder | drop ghost on canvas | n/a |
| Components panel · Yours | skeleton 2-3 rows | "No saved components · select element + Save" | broken master toast | row appears with ●N badge | "1 of 5 instances failed" toast |
| AI-assist generate | streaming-tokens skeleton OR 2-8s spinner with cancel | n/a | toast per error class (D14) | preview modal Accept/Discard | "Got partial result, retry?" |
| Import DS modal | progress bar | n/a | error inline with field paths | "Added 47 / Replaced 12" | "Import valid 47, skipped 3" |
| Lint warnings | (debounce indicator) | "All good — no warnings" | scan failed badge | n/a | "10 of 50 scanned" indeterminate |
| Starter DS gallery | thumbnail skeleton | n/a (always >5) | thumbnail load fail | apply success toast | "Applying tokens..." progress |
| Detach instance | instant | n/a | concurrent-edit error toast | "Detached" badge on instance | n/a |
| Migration runner | "Updating project..." spinner >100ms | n/a | blocking modal "Couldn't update" | silent (editor loads) | "Migration v9 incomplete, restore?" modal |
| Mode toggle | instant | n/a | localStorage fail toast | preference applied silently | "5 off-DS values exist" non-blocking banner |

**a11y baseline (Pass 6 deliverable, DD3):**

- Inspector chips: `role="button"`, `aria-label="Jump to {token-id} in Design tab"`, Enter to activate, focus ring per DESIGN.md
- Modal focus traps: ImportDSModal, ExportDSModal, AI-assist preview, Starter gallery, AddTokenModal — all use vibcoder Modal/OverlayMount focus trap
- Keyboard nav: arrow keys between Tokens/Styles/Components/Export tabs in Design workspace; Tab into section; Esc closes modals
- Color contrast: D7 lint flags WCAG AA failures; catalog default bindings + starter DSes must NOT trigger lint out-of-box
- Catalog component a11y baseline: every `ComponentType.schema` includes `behaviors: ["focus-ring"]` minimum + ARIA attrs in structure

**AI-slop blacklist enforcement (Pass 4 + DD2):**

- ❌ Purple/violet/indigo gradients (DESIGN.md cobalt-only)
- ❌ 3-column feature grid as default Hero (most-AI pattern)
- ❌ Icons-in-colored-circles section decoration
- ❌ Uniform bubbly border-radius (use DESIGN.md radius scale)
- ❌ Decorative blobs / floating circles / wavy SVG
- ❌ Emoji as design elements
- ❌ Colored left-border on cards
- ❌ Generic hero copy ("Welcome to...", "Unlock the power of...")
- ❌ `system-ui` / Arial / Roboto fallback in catalog CSS
- ❌ Pure black (`#000`) or near-black surfaces in any catalog component

CI gate `scripts/check-catalog-slop.sh` (extends existing pattern) catches above at PR.

**Per-starter design pass requirement:** Each of 6-8 starter DSes (Stripe-blue, Notion-warm, Apple-minimal, Linear-dark, Vercel-mono, +1-3) gets dedicated ~2-day visual design treatment by you (NOT AI-templated). Phase F Week 14-15 budget honors this.

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | CLEAR | 12 proposals, 6 accepted, 15 deferred, 25 decisions |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR | 15 issues found, 0 critical gaps, 7 eng decisions |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | CLEAR | score 5/10 → 9/10, 5 design decisions, 3 design TODOs |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | not run |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | n/a (visual builder, not API/CLI/SDK) |

- **UNRESOLVED:** 0 unresolved decisions across CEO + Eng + Design reviews.
- **TODOS deferred:** 22 items (15 CEO + 4 Eng + 3 Design) added to repo TODOS.md.
- **TEST PLAN:** persisted at `~/.gstack/projects/aamirtauqir-buildrik/saqib-main-eng-review-test-plan-20260507.md`.
- **DESIGN.md confirmed:** exists at `/DESIGN.md` (356 lines) — D25 prereq from CEO addendum is NOT NEEDED, mark as resolved.
- **VERDICT:** CEO + ENG + DESIGN all CLEARED — ready to implement. Begin Week 0 prereq sprint (jsdom + override preservation MVP + dsSchemaVersion field; DESIGN.md skipped per existing file).
