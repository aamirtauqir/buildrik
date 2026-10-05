# Brand redesign · Part 1 — Token foundation (design spec)

Date: 2026-10-05 · Status: **draft for owner review** · Approach A (extend the existing engine)

## Why

The Brand re-audit (`docs/audits/2026-10-05-brand-reaudit.md`) scores Brand 4.2/10. The top pain is that
**changing the brand does not change the site**: elements insert raw hex/px values, the canvas, the
preview, the export and publish each write token CSS their own way (BRD-03/04/23), there are two save
models and a hidden-undo hazard (BRD-07/08/14/24), and duplicate colour tokens (BRD-12). Every later part
of the redesign (panel UI, Inspector picker, styles, library) depends on fixing this foundation first.

## Owner decisions this spec builds on (interview 2026-10-05)

1. Brand is a **full design system** (Figma-variables level, for designers and agencies).
2. It opens as a **panel beside the live canvas** (expandable to full width for big tables). — Part 2
3. **Autosave + ⌘Z**; any "review" is non-blocking; Inspector "Update everywhere" uses the same path.
4. **Real site modes Light/Dark**: the published site follows `prefers-color-scheme`, with an optional toggle.
5. **Two layers**: Primitives → Semantic (aliases). Elements bind to semantic tokens.
6. **All kinds**, including everything the Inspector exposes.
7. Inspector: a token picker on every tokenizable field. — Part 3
8. New elements insert token-bound; old sites get **"Connect to tokens"** exact-match suggestions with preview, never automatic.
9. Starters are whole themes with own names. — Part 2
10. Text styles + Component styles; Classes go to Advanced. — Part 4
11. Workspace library with "update available". — Part 5
12. Checks are badges on token rows; a fresh site has 0 warnings. — Part 2
13. Basic features on all plans; library, advanced kinds and import/export on Pro/Business. — Parts 2/5

This spec is **Part 1 only**. Parts 2–5 get their own spec → plan → build cycle.

## Current state (verified on main, 2026-10-05)

- Tokens live in `projectSettings.designTokens` (array of `DesignToken`, `engine/designSystem/types.ts`)
  plus `designTokensSchemaVersion`. The model already has `aliasOf`, `darkValue`, `kind` (14 kinds),
  `typedValue`, `semanticKind`, `replacedBy`.
- Seed: `DEFAULT_TOKENS`, now in `engine/designSystem/defaultTokens.ts` (moved by the BRD-23 fix).
- Merge: `mergeProjectTokens` (`editor/design-system/state/projectTokens.ts`).
- Canvas: `ProjectTokensApplier` sets each var with `document.documentElement.style.setProperty`.
- Export/publish: `siteTokensCSS` (`engine/export/ExportHelpers.ts`) emits defaults + saved values.
- Brand edits stage in `useBrandDraft` and commit via Save → ReviewModal "Apply N changes".
- Server: `theme.service.ts` reads/writes `designTokens`/`designPresets`.

## 1 · Data model

- `projectSettings.designTokens` stays the single source of truth; bump the schema version.
- Every token has:
  - `layer`: `"primitive"` (a literal value, e.g. `blue-600 = #1A56DB`) or `"semantic"` (e.g. `color-primary`).
  - `kind`: required, one of the 14 kinds. Colours are no longer identified by `category`.
  - `modes`: `{ light: TokenRef, dark?: TokenRef }`, where `TokenRef` is either `{ alias: <tokenId> }` or
    `{ value: <literal> }`. Primitives carry only `light` (no modes). `darkValue` folds into `modes.dark`.
- Alias rules: a semantic token may alias a primitive or another semantic token of the **same kind**; no
  cycles; the target must exist. One shared Zod schema in `packages/shared/schemas/` enforces this in the
  editor and on the server (every write path that stores `designTokens`).
- Seed for a new site:
  - Primitive palette: blue, gray, red, green, amber scales; a 4px spacing scale; radius, shadow, type-size,
    opacity, motion, z-index, breakpoint, sizing scales.
  - About 12 semantic colours: Primary, Secondary, Accent, Background, Surface, Text, Muted, Border,
    Success, Warning, Error, Info, each with light and dark aliases; semantic tokens for every other kind.
  - The four duplicate colours today (action = primary = brand-500, etc.) become one (BRD-12).
- Element bindings stay as `var(--buildrick-design-<semantic-id>)` in element styles, so existing bindings
  keep working.

## 2 · One CSS emitter (canvas, export, publish)

- One pure function `emitTokenCss(tokens)` in `packages/shared/` (runs in the browser and on the server).
- Output:
  ```css
  :root {
    --buildrick-design-blue-600: #1A56DB;                                   /* primitive */
    --buildrick-design-color-primary: var(--buildrick-design-blue-600);       /* semantic alias */
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) { --buildrick-design-color-primary: var(--buildrick-design-blue-400); }
  }
  :root[data-theme="dark"] { --buildrick-design-color-primary: var(--buildrick-design-blue-400); }
  ```
  (Var names come from `tokenToCssVar`, prefix `--buildrick-design-`, unchanged from today.)
- Aliases stay aliases in CSS (`var()` inside `var()`), so changing a primitive cascades in the browser.
- **Every** token is emitted, used or not; no var can be undefined.
- Canvas: one `<style>` element with this string replaces `ProjectTokensApplier`'s per-var `setProperty`.
  The editor's Light/Dark switch sets `data-theme` on the canvas root.
- Export (single-file, ZIP) and publish write the same string. The published site follows
  `prefers-color-scheme`; an optional theme-toggle element flips `data-theme`.
- `siteTokensCSS` is replaced by `emitTokenCss`; the BRD-23 closure test is kept and extended.

## 3 · New elements bind on insert; "Connect to tokens" for old sites

- Replace raw values in `shared/constants/defaultStyles.ts`, `blocks/blockRegistry.ts`, the Add-panel
  blocks and the Components catalog with semantic `var()`s: colour, font family/size/weight/line-height,
  padding, gap, radius, border, shadow. No fallback values (Section 2 emits every token). Fixes R1, BRD-05,
  BRD-25.
- A test inserts every catalog block and asserts no raw colour or raw px remains in its styles, except an
  explicit allow-list (`0`, `100%`, `auto`, layout values with no token kind).
- **"Connect to tokens"** (a check in Brand):
  - Scans the site's element styles for raw values that **exactly** equal a token's resolved value, for a
    property of the **same kind** (colour to colour, spacing to spacing).
  - Suggestion shape: "`#1A56DB` · 14 elements → Primary".
  - Ties: prefer semantic over primitive; if several semantic tokens still tie, the user picks.
  - Preview applies on the canvas immediately; Apply is a single ⌘Z step. Nothing changes without Apply.
  - No near-matches (no "close enough").
  - Applying a template runs the same check and offers suggestions; the template itself is not rewritten.

## 4 · Migration, autosave and one undo

### Migration (new schema version)
- Known seed tokens get their layer. A saved semantic value that exactly equals a primitive becomes an alias
  to it; otherwise a site primitive `custom-<id>` is created and the semantic token aliases it. **No site
  colour changes.**
- `darkValue` migrates the same way into `modes.dark`.
- Duplicate tokens merge; their old names keep being emitted as aliases
  (`--buildrick-design-color-action: var(--buildrick-design-color-primary)`), so no existing element binding
  breaks. The legacy `--buildrick-design-color-blue-500` also resolves this way.
- Migration is one shared function used by the editor, the server (`theme.service.ts`) and publish. The
  migrated data is written on the next save.

### Autosave + ⌘Z
- Every token edit is a Composer history command (`setToken`), so the canvas and Brand share **one undo
  stack**.
- Edits apply to the canvas immediately; the existing debounced `projectSettings` autosave persists them.
  Inspector "Update everywhere" goes through the same command. Two save models end (BRD-07, BRD-14).
- The staging layer (`useBrandDraft`, Save, "Apply N changes" ReviewModal) is removed. This removes the
  ⌘K-Undo / toast-Undo staged-edit gap and the double leave prompt (BRD-08) at the root, and supersedes the
  interim BRD-24 keyboard block.
- "Review changes" becomes a non-blocking list of this session's token edits, each with Revert.

## 5 · Testing and done-conditions

### Tests (each must fail on the old code)
1. Schema refuses alias cycles, kind mismatches and modes on primitives — client and server.
2. `emitTokenCss` emits every token, keeps aliases as `var()`, writes light / `prefers-color-scheme` /
   `data-theme` blocks, and emits legacy names as aliases.
3. Token closure: every `var()` in every catalog block and component export is defined.
4. Insert: no raw colour/px in any inserted element's styles (allow-list excepted).
5. Migration: fixtures (seed only, custom colours, dark values, duplicates) produce **identical resolved
   CSS** for canvas, export and publish before and after.
6. Connect to tokens: exact match only, preview, one ⌘Z.
7. Undo: token and canvas edits share one stack; ⌘K Undo and toast Undo behave; no hidden canvas undo.

### Live done-conditions (the live app is the verifier; measure, don't eyeball)
- Change Primary in **3 steps**; canvas buttons, links and CTA repaint immediately; one ⌘Z reverts.
- Change fonts in 3 steps; canvas repaints immediately.
- See the effect in **0 steps** (canvas visible). Note: full panel-beside-canvas UI is Part 2; Part 1 must at
  least make the existing surface repaint the real canvas live.
- Light/Dark: the editor switch turns the canvas dark; an exported page turns dark under
  `prefers-color-scheme: dark` (measured with computed styles).
- Three real existing sites: canvas and export screenshots are unchanged after migration (measured).
- Canvas = export = publish: computed styles of button, input, heading and card match across all three.

## Out of scope (later specs)
Part 2 Brand panel UI (surface, sections, checks as badges, starters as themes, plan gating) · Part 3
Inspector token picker on every field · Part 4 Text styles + Component styles · Part 5 Workspace library,
import/export. Part 1 only makes the minimum UI change needed to run on the new foundation (e.g. removing
staged Save).

## Risks
- Migration correctness on real sites — mitigated by the identical-resolved-CSS fixtures and the three-site
  live check.
- Server write paths that store `designTokens` without the shared schema — every path must be found and
  routed through it (theme service, settings save, import).
- Publish output size grows because every token is emitted — measure; acceptable if under a few KB gzip.
- `cleanUrls` and SEO lanes touch publish files in parallel — coordinate on `lib/publish-*.ts`.
