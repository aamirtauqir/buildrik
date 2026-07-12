# Editor PRD · Ch.06 — Design System, Components Catalog, Themes

> Part of BUILDRIK-PRD-EDITOR v2.0 · `main` @ `e5624ca1` · 2026-07-07 · paths under `packages/editor/src/`

## 6.0 Two token systems (critical context)

- **Chrome/editor-UI tokens**: `--buildrick-*`, CSS in `themes/design-system/*.css`, typed union `shared/utils/token-names.ts:7-17`, read via `getToken()` (`shared/utils/tokens.ts:8-16`).
- **User-site DESIGN tokens**: `--buildrick-design-*` + newer `--bd-*` for 11 new kinds (`editor/design-system/constants.ts:20-727`).
- `themes/` = CSS-only layer files (color, typography, spacing, radius, shadow, motion, layout, z-index, a11y, bd-aliases, bd-topbar-overrides, design, index).

## 6.1 Design-system features

**14 token kinds** (`engine/designSystem/types.ts:64-69`): color, type, spacing, radius, shadow, motion, border, opacity, zindex, breakpoint, grid, sizing, icon, imagery — each with own hook (`state/use*Tokens.ts`) + React context (`TokenRegistryContext.tsx:77-90`).

**Theme modes**: `light|dark|system` (`types.ts:125`); ColorMode persists `buildrik:colorMode`, system via `prefers-color-scheme` (`engine/colorMode/ColorMode.ts:4,16,58-70`). **DarkResolver**: dark → `darkValue ?? value`, emits `tokens:dark-missing`; empty-string darkValue = explicit (`engine/darkResolver/DarkResolver.ts:19-28`). UI = 2-pill Light/Dark — **System dropped from UI**, kept in state (`ui/ColorModeToggle.tsx:8-13,53-54`). DS panel dark-previews via `data-ds-preview`; chrome stays light (`ui/DesignSystemTab.tsx:147-161,487`).

**Style presets** ×11 categories (button/card/form/link/badge/alert/tooltip/modal/nav/table/layout — `types.ts:137-158`); 22 defaults seeded (`constants.ts:735-907`); property → `{tokenId}` bindings, raw values forbidden.

**Starter themes ×6**: cobaltDefault, stripeBlue, notionWarm, appleMinimal, linearDark, vercelMono (`starters/index.ts:18-25`) — applying restyles tokens, keeps elements (`ui/StarterGalleryModal.tsx:93-94`). Auto-open disabled (D3 2026-05-22) — "Browse themes" button only (`StarterGalleryMount.tsx:68-95`).

**Beginner/Pro mode** (`DSMode`): per-user, `buildrik:ds-mode`, default beginner (semantic tokens only; Pro adds primitives) (`DSModeContext.tsx:17-20`, `semanticKind.ts:27-33`).

**⚠ "Brand kit"/"brand blast" DOES NOT EXIST in editor scope** — "brand" is a token group name (`constants.ts:29,39,49`); "blast" only in ReachScopeStrip copy (`inspector/components/ReachScopeStrip.tsx:11`). Cross-site brand = dashboard shared-theme **link-out only** (`DesignSystemTab.tsx:500-527`) — no push API here. *(PM note: Figma dashboard wireframes assume a push/ledger flow — E-class drift.)*

## 6.2 Components catalog

**30 compile-time components** (`components-catalog/catalog.ts`, `CATALOG_LAST_UPDATED = 2026-04-12`): atoms ×8 (button…spinner `:19-235`), molecules ×11 (card…tooltip `:237-502`), organisms ×8+ (modal…feature-grid `:504-712`).

**Model** (`types.ts`): `ComponentType {id, category, variants[], sizes?, schema, defaultBindings}` (`:51-59`); `ComponentInstance` source = `catalog` | `user` (+`detached?`) (`:67-81`); `defaultBindings`: variant → CSS prop → `{tokenId}` (`:16-17`).

**Insert flow** (`placeCatalogComponent.ts`): interpretSchema (`{props.X}` only; `{variant}/{size}/{disabled}` deferred — `schemaInterpreter.ts:9-12,43,71-99`) → applyInterpretedTree in ONE transaction w/ rollback, slots = `div[data-slot]` (`applyInterpretedTree.ts:62-74,101-120`) → bindings as inline `var(--buildrick-design-<id>)` = O(1) token propagation (`:40-50,73-77`) → root tagged `data-buildrik-catalog-component` (`schemaInterpreter.ts:190-193`).

**Detach**: pro-mode only, `composer.components.detachInstance()` (`DetachInstanceButton.tsx:54,63-80`).

**⚠ Catalog drag-drop canvas handler = unshipped stub** (`CatalogCard.tsx:397-403`, `CatalogSection.tsx:5-8`). DS-tab ComponentsSection read-only by design; authoring = rail ComponentsPanelV2 (filters All|DS|Yours, search, +AI, +Save selection — `ComponentsPanelV2.tsx:130-134,240-261`).

## 6.3 Token CRUD / validation / propagation

- CRUD (color = SSOT ref, `useColorTokens.ts`): add `:221-225`; update w/ per-token undo `:104-123`; delete hard OR soft (`replaceWith` → `replacedBy` bridge) `:227-248`; rename = new id + bridge `:250-263`. **Per-token undo stacks**, not global (`:126-187`). type & spacing = fixed-set, no addToken (`useImportTokens.ts:69-70`).
- Validation: AddTokenModal name unique + hex `/^#([0-9A-Fa-f]{6})$/` (`AddTokenModal.tsx:23-40`); import shape-check (`importUtils.ts:33-79`); contrast auto-fix binary-search to AA 4.5 (`contrastFix.ts:9,17-50`).
- Propagation: live CSS var on documentElement per edit (`useTokenBase.ts:62`); Apply → `composer.setProjectSettings({designTokens, schemaVersion, designPresets})` + localStorage + markSaved (`DesignSystemTab.tsx:376-422`); usage map 2-pass scan → `Map<tokenId, Set<elementId>>` (`useTokenUsageMap.ts:32-38,66-134`); Reach model: This item / All like this (confirm) / Whole site (`ReachScopeStrip.tsx:31-68,93-138`).

## 6.4 State machines

| FSM | States | Source |
|---|---|---|
| Dirty/save per registry | tokens vs savedTokens → pendingDiff → isDirty; markSaved/discardAll/resetFromSaved/hydrateFromExternal | `useColorTokens.ts:87-101` |
| ColorMode | light/dark/system, MQL resolve, `colorMode:changed` | `ColorMode.ts:34-70` |
| DSMode | beginner ⇄ pro | `DSModeContext.tsx:55-83` |
| Spacing preset | compact/normal/spacious/null (manual edit → null; apply clears undo) | `useSpacingTokens.ts:11,71-105` |
| Type responsive | desktop/mobile (setter only, no swap logic yet) | `useTypeTokens.ts:11,34,49` |
| Section-switch guard | dirty → TabGuardModal Discard/Keep/Save&switch | `DesignSystemTab.tsx:325-373` |
| Schema migration | CURRENT_SCHEMA_VERSION = 4, iterative | `migrations/index.ts:37,164-184` |

## 6.5 Enums

TokenKind ×14 · TokenType color/font-family/font-size/length/shadow/number/string/select (`types.ts:95-103`) · TokenCategory legacy ×9 (`:26-35`) · SemanticKind action/surface/text/feedback (`:74`) · WcagLevel aaa/aa/aa-large/fail/na (`:38`) · PresetCategory ×11 · ComponentTier atom/molecule/organism · DSMode ×2 · SpacingPreset ×3 · ResponsiveMode ×2 · LintRuleId ×7 (banned-hue, pure-black, empty-value, missing-dark, unresolved-binding, alias-depth-exceeded, semantic-needs-alias — `DSLinter.ts:12-19`) · ExportFormat css/tailwind/json (+figma stub, `ExportSection.tsx:37,178-193`)

## 6.6 Business rules

| Rule | Value | Source |
|---|---|---|
| **NO BLACK** | `#000/#000000/black/rgb(0,0,0)` (incl. darkValue) = lint ERROR — "use slate-700 or cobalt" | `DSLinter.ts:122-138,213-216` |
| **Banned hues** | purple/violet/indigo = ERROR; cobalt `#2D6DFF` sole accent | `DSLinter.ts:104-120,192-211` |
| Alias depth | MAX 3 | `DSLinter.ts:24,82-89` |
| Semantic-needs-alias | semanticKind ⇒ aliasOf required | `DSLinter.ts:58-65` |
| Spacing grid | 4px, 3 preset px-maps | `useSpacingTokens.ts:13-27` |
| Default palette | 9 core (primary #3B82F6, text #334155…) + B5 seed (blue-500 #2D6DFF…) | `constants.ts:22-194` |
| Lint debounce | 500ms (spec D21) | `DSLinter.ts:35-38` |
| Export compat | renamed vars kept 2 major versions | `exportUtils.ts:24-70` |
| Migrations | additive/id-gated, never clobber user edits | `migrations/index.ts:143-147` |
| Token count cap | none found | — |

## 6.7 Defects / TODOs (feeds master §13)

1. **Duplicate token IDs** in DEFAULT_TOKENS: radius-sm/md, shadow-sm/md defined twice (`--buildrick-design-*` vs `--bd-*`) — masked by kind-filtering, IDs non-unique (`constants.ts:367/709, 375/710, 407/711, 414/712`)
2. **persistAll serializes only 3/14 kinds** to localStorage → divergence for 11 new kinds (`TokenRegistryContext.tsx:197-212`) *(= v1.0 register A3)*
3. ReviewModal diffs only color/type/spacing (`DesignSystemTab.tsx:751-762`); `changedSectionLabels` hardcodes `["Tokens"]` (`:484`)
4. Typo'd migration comment (rename identical both sides) — `constants.ts:16-18`
5. AI component schema → localStorage only; canvas insert needs unbuilt `createComponentFromSchema` (`ComponentsPanelV2.tsx:158,267-309`)
6. Figma Variables export = stub envelope (`ExportSection.tsx:178-193`)
7. Catalog drag→canvas drop stub (`CatalogCard.tsx:397-403`)
8. `window.prompt` TODO → modal (`TokenDetailView.tsx:481`)
9. AIPromptModal onAccept no-op in DS tab (`DesignSystemTab.tsx:773-778`)
10. Fixed-bug archaeology: `undo:applied` zero-emitter events (now `history:undo/redo`, `:301-305`); `buildrik:openRailTab` silent no-op (now `ui:switch-tab`, `ComponentsSection.tsx:275-286`)

## 6.8 Integration

Project persist: `composer.setProjectSettings` (Apply); load merges saved-over-defaults by id, migrates <v4 (`DesignSystemTab.tsx:230-269,404-411`). localStorage keys: `buildrick-design-tokens-{projectId}-v1`, `…-presets-…`, `buildrik:starter-gallery-seen-*`. Cross-window: `SETTINGS_CHANGE` → conflict toast if dirty (`:286-295`). Export: CSS (dark strategies media|data-attr|off), JSON, Tailwind (drops dark variants — warned), Figma stub (`exportUtils.ts:80-124`). Engine services: composer.colorMode/darkResolver/dsLinter/components/designSystem.tokenBindingResolver/elements/styles/selection/aiAssistService + events `ui:switch-tab`, `UI_OPEN_STARTERS`, `COMPONENT_SAVE_AS_REQUESTED`.
