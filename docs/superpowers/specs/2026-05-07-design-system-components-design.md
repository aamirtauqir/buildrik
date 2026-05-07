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
| 4. Locked decisions | ✓ |
| 5. Architecture | ✓ |
| 6. UI components | ✓ |
| 7. Data flow | ✓ |
| 8. Error handling | ✓ |
| 9. Testing strategy | ✓ |
| 10. Migration plan | ✓ |
| 11. Release sequencing | ✓ |
| 12. Open questions | ✓ |
| 13. Catalog appendix | ✓ |
| 14. Memory references | ✓ |

Implementation plan to be drafted via `superpowers:writing-plans` skill once user approves spec.
