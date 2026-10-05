# Brand redesign · Part 1 — Token foundation (design spec)

Date: 2026-10-05 · Status: **amended after /plan-ceo-review (SCOPE EXPANSION), pending owner approval** · Approach A (extend the existing engine)

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

### CEO review decisions (2026-10-05, SCOPE EXPANSION)

| # | Decision | Answer |
|---|----------|--------|
| D2 | Token usage map + in-use delete guard | Added (§6) |
| D3 | One colour → full scale + dark aliases generator | Added (§7) |
| D4 | Token schema shaped like W3C Design Tokens (DTCG) | Added (§1) |
| D5 | Contrast guard (WCAG AA) | Deferred to Part 2 (badges) |
| D6 | Brand restore points | Added (§8) |
| D7 | Brand from logo or website URL (AI) | Added (§9), against the reviewer's Defer recommendation |
| D8 | Dark mode on existing sites | Per-site setting `Dark mode: Auto / Off`; migrated sites Off, new sites Auto (§2) |
| D9 | Three factual corrections from the code audit | Accepted (Current state, §1, §4) |
| D10 | Where restore points live | Reopened in review round 2: extend the existing `SiteThemeSnapshot` with a `reason`; one restore list (§8) |
| D11 | Turning Dark mode Auto on a site with missing dark values | Generate the missing dark aliases, preview, restore point, confirm (§2) |
| D12 | Theme-toggle block for published sites | Added to Part 1, against the reviewer's Defer recommendation (§2) |
| D13 | How logo/URL colours are extracted | Deterministic (image quantization / CSS parse); AI only optional for naming roles (§9) |

## Current state (verified on main, 2026-10-05)

- Tokens live in `projectSettings.designTokens` (array of `DesignToken`, `engine/designSystem/types.ts`)
  plus `designTokensSchemaVersion`. The model already has `aliasOf`, `darkValue`, `kind` (14 kinds),
  `typedValue`, `semanticKind`, `replacedBy`.
- Seed: `DEFAULT_TOKENS`, now in `engine/designSystem/defaultTokens.ts` (moved by the BRD-23 fix).
- Merge: `mergeProjectTokens` (`editor/design-system/state/projectTokens.ts`).
- Canvas: `ProjectTokensApplier` (64 lines, mounted at `StudioPanels.tsx:813`) sets each var with
  `document.documentElement.style.setProperty`, resolving colours to light or dark.
- Export/publish: `siteTokensCSS` (`engine/export/ExportHelpers.ts:104-123`) emits one `:root{}` rule:
  saved tokens, then all 78 `DEFAULT_TOKENS`, deduped. **Light values only.** Publish builds its CSS in
  the editor (`exportPublishPages.ts:46` → `ExportEngine.exportAllPages` → `siteTokensCSS`).
- Dark CSS exists only in `CSSBundler.ts:70-85` (Brand ExportSection). `darkValue` is already set on 9
  colours by migration `0002-seed-dark-color-values.ts`, but nothing published uses it today.
- A Light/Dark switch already exists: `ColorModeToggle.tsx` → `composer.colorMode` (`engine/colorMode/
  ColorMode.ts`, stored per browser in localStorage).
- Undo: history snapshots `designTokens`, `designTokensSchemaVersion` and `designPresets` and records
  patches (`HistoryManager.ts:376-410`), so token edits are already undoable. What breaks "one undo" is
  that there are **three stacks**: `useBrandDraft` staging, a per-kind `undoStackRef` in
  `useTokensForKind.ts`, and canvas history; plus Brand Apply (`BrandWorkspace.tsx:526`) and
  `useUpdateColorEverywhere.ts:42` call `setProjectSettings` without a transaction.
- Brand edits stage in `useBrandDraft` (109 lines) and commit via Save → `ReviewModal` (270 lines)
  "Apply N changes". Only `BrandWorkspace.tsx` imports them.
- Deleting a token without `replaceWith` hard-removes it (`useTokensForKind.ts:193-204`); bound elements
  keep a `var()` that resolves only if a `DEFAULT_TOKENS` seed of the same name exists.
- Server writes of `designTokens`, **none validated** (no Zod schema covers them today):
  `sites.service.ts` `saveProjectData` (:962, autosave, settings stored as-is) and duplicate site
  (:509); `theme.service.ts` `withTokens` (:250) and `restoreTokens` (:351). `updateProjectSettings`
  cannot write tokens (its schema excludes them).
- Collab already carries token edits as history patches; autosave is compare-and-swap on
  `lastEditedAt`, so a stale tab gets a conflict, not a silent overwrite.
- Raw values today: `defaultStyles.ts` ~21 hex / 23 token vars; the rest of `blocks/` ~86 hex / 0 vars.

## 1 · Data model

- `projectSettings.designTokens` stays the single source of truth; bump the schema version.
- **Shape follows the W3C Design Tokens (DTCG) format (D4)**: each token maps 1:1 to a DTCG entry
  (`$type` = kind, `$value` = literal or `{group.token}` alias, mode values under a `modes` extension).
  The 14 kinds get a fixed mapping table to DTCG types (kinds with no DTCG type use a namespaced
  extension). A round-trip test (ours → DTCG JSON → ours) must be lossless, so Part 5 import/export is a
  serializer, not a migration.
- Every token has:
  - `layer`: `"primitive"` (a literal value, e.g. `blue-600 = #1A56DB`) or `"semantic"` (e.g. `color-primary`).
  - `kind`: required, one of the 14 kinds. Colours are no longer identified by `category`.
  - `modes`: `{ light: TokenRef, dark?: TokenRef }`, where `TokenRef` is either `{ alias: <tokenId> }` or
    `{ value: <literal> }`. **Primitives have exactly `modes.light`, always a `{ value }`; only semantic
    tokens may have `modes.dark` or aliases.** `darkValue` folds into `modes.dark`.
- Alias rules: a semantic token may alias a primitive or another semantic token of the **same kind**; no
  cycles; the target must exist. One shared Zod schema in `packages/shared/schemas/` enforces this in the
  editor and on every server write path that stores `designTokens`: `saveProjectData`, duplicate site,
  theme `withTokens` and `restoreTokens`. An invalid payload is refused with a domain error (not
  silently dropped), and the editor shows the save as failed.
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
- `emitTokenCss` keeps today's value sanitizing (`siteTokensCSS` strips `;`, `{`, `}`, `<`) and also
  refuses values that fail the kind's schema. This matters more now that §9 feeds extracted values in.
- Canvas: one `<style>` element with this string replaces `ProjectTokensApplier`'s per-var `setProperty`.
  The editor's Light/Dark switch sets `data-theme` on the canvas root.
- Export (single-file, ZIP) and publish write the same string. An optional theme-toggle element flips
  `data-theme`.
- **Dark mode is a per-site setting (D8):** `Dark mode: Auto | Off`. `Auto` emits the
  `prefers-color-scheme` and `data-theme` blocks; `Off` emits light only, so the site never changes
  with the visitor's OS. **Migrated sites start Off** (their seeded `darkValue`s stay stored but are not
  published until the owner turns Auto on); **new sites start Auto**. The setting lives in project
  settings and is covered by the shared schema.
- The editor's existing `ColorModeToggle` / `composer.colorMode` drives the canvas preview (reused, not
  rebuilt). The canvas shares the editor's document (`ProjectTokensApplier` writes to
  `document.documentElement` today), so the editor **always** sets an explicit `data-theme="light"|"dark"`
  on `document.documentElement` from `composer.colorMode`. It never leaves it unset; otherwise the
  `prefers-color-scheme` block would follow the designer's OS. The emitted CSS's `:root` selectors
  therefore match in the editor exactly as on the published site.
- When the site's Dark mode is `Off`, the editor's Dark preview is disabled, with a hint "Dark mode is
  off for this site". Previewing a mode the site will never publish would mislead.
- **Turning `Auto` on (D11):** if any semantic colour has no `modes.dark`, the generator (§7) proposes
  dark aliases for the missing ones. The canvas previews in dark, a restore point is taken (§8), and the
  switch completes only on confirm, as one ⌘Z step.
- **Theme-toggle block (D12), new in Part 1:** an insertable block that flips `data-theme` on `<html>`
  and remembers the visitor's choice in localStorage (read before first paint by a tiny inline script,
  so there is no flash). It is offered in the Add panel only when Dark mode is `Auto`, and it is token-
  bound like every other block (§3). If Dark mode is later set to `Off`, existing toggles are hidden on
  publish and listed as a Brand check.
- `siteTokensCSS` and `CSSBundler`'s dark path are both replaced by `emitTokenCss`; the BRD-23 closure
  test is kept and extended. Every current caller moves to it: `Composer.ts:750`, `BrandLivePreview.tsx:68`,
  `ExportEngine.ts:362` (single file) and `:815` (multi-page/publish), and the Brand ExportSection.
  `siteFontsFromTokens` (`ExportEngine.ts:815`) is rewritten to read the new shape.
- **Legacy backstop:** today `siteTokensCSS` also emits all 78 `DEFAULT_TOKENS` so a hard-deleted seed
  token still resolves. `emitTokenCss` keeps that guarantee: every legacy seed var name that no current
  token defines is emitted with its seed value. A migration fixture covers "seed token deleted, element
  still uses it".

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
- Migration is one shared function used by the editor, every server write path, and publish.
- **Migration is not an undo step.** It runs on load, before history starts recording (applied like
  `importScoped`), so ⌘Z after load can never revert to the old shape.
- **Version rule on the server:** if the payload's schema version is old *and* the stored version is
  also old, the server migrates it. If the payload is older than what is stored, it is refused (see
  Version skew). Never both for the same request.
- **First migrated save (payload newer than store):** `saveProjectData` writes the `migration` snapshot
  of the stored (old-shape) tokens **in the same DB transaction** as the save. No migrated data can be
  stored without its snapshot.
- `custom-<id>` primitives are named deterministically from the original token id (`custom-<originalId>`),
  so two tabs migrating the same site produce identical patches. The
  workspace shared theme (pushed into sites by `withTokens`) is migrated by the same function, both when
  stored and before validation on push, so a theme push never sends old-shape tokens.
- **Theme push vs in-use tokens:** a push no longer replaces a site's tokens wholesale. Site tokens
  absent from the workspace theme but in use on the site (§6 scanner) are kept as site-local tokens, so
  no element is left with an undefined `var()`. Unused site-only tokens are dropped as today.
- **Before** a site's migrated data is first saved, a `SiteThemeSnapshot` row (reason `migration`) with the pre-migration tokens
  and old schema version is written (§8). If the three-site live check fails after rollout, the
  **server-only migration rollback** (§8) writes that snapshot's tokens and old schema version back
  verbatim, returning the site exactly to its pre-migration state.
  So §8's table must ship before migration is enabled.
- **Version skew:** a client on the old bundle that saves old-shape tokens after a site was migrated is
  refused by the server's schema with a "reload to continue" conflict, the same UX as today's
  `lastEditedAt` compare-and-swap. It is never silently re-migrated over newer data.

### Autosave + ⌘Z
- Token edits already reach history as snapshot patches. Part 1 makes it **one undo stack** by removing
  the other two: the `useBrandDraft` staging layer and the per-kind `undoStackRef` in
  `useTokensForKind.ts`. Every multi-token write (Brand Apply, `useUpdateColorEverywhere`, scale
  generator, Connect to tokens, restore, migration) runs inside one `begin/endTransaction`, so it is a
  single ⌘Z step.
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
8. Server: each of the 4 write paths refuses an invalid `designTokens` payload (cycle, kind mismatch).
9. Dark mode setting: `Off` emits no dark blocks; migrated fixtures come out `Off`; new sites `Auto`.
10. DTCG round-trip is lossless for the seed and every migration fixture.
11. Usage map counts direct and alias-chain references; in-use delete is refused; replaced token resolves.
12. Scale generator: fixed inputs give fixed 11-step output; one transaction; restore point taken.
13. Restore points: capped at 10; restore is one undo step.
14. Logo/URL: SSRF guard refuses private IPs, non-http(s), a redirect to a private IP, and a hostname that
    re-resolves to a private IP; works without `OPENAI_API_KEY`; fixed images give fixed palettes.
15. `emitTokenCss` strips `; { } <` and refuses values failing the kind schema.
16. Workspace theme push migrates old-shape tokens before validation; an old-shape save after migration is
    refused with the reload conflict.
17. Snapshot write changes neither `lastEditedAt` nor `dsSchemaVersion`; the first migrated save writes the
    `migration` snapshot in the same transaction (a forced failure leaves neither); existing rows read
    back as `theme-push` with the backfilled version; `migration` rows survive 15 generator runs;
    restoring a `dark-auto` snapshot restores the Dark mode setting; migration rollback returns the
    stored tokens and schema version byte-for-byte.
19. Migration is not in undo history; old payload vs old store migrates, old payload vs new store is
    refused; `custom-<originalId>` is deterministic across two runs.
20. Legacy backstop: a deleted seed token used by an element still resolves after migration.
21. Theme push keeps in-use site-only tokens.
22. Toggle block: flips `data-theme`, persists, no flash on reload; hidden on publish when Dark mode is Off.
18. Editor always sets `data-theme`; `Off` disables the dark preview; switching to `Auto` fills missing
    dark aliases.

### Live done-conditions (the live app is the verifier; measure, don't eyeball)
- Change Primary in **3 steps**; canvas buttons, links and CTA repaint immediately; one ⌘Z reverts.
- Change fonts in 3 steps; canvas repaints immediately.
- Pick one brand colour; the whole primary scale and its dark aliases update (generator, §7); one ⌘Z.
- Delete a token in use: refused until a replacement is picked; afterwards no element has an undefined
  `var()` (measured).
- Restore point: make a big change, reload, Restore; tokens match the snapshot (measured).
- Migrated site: published CSS has no dark blocks until Dark mode is set to Auto.
- See the effect in **0 steps** (canvas visible). Note: full panel-beside-canvas UI is Part 2; Part 1 must at
  least make the existing surface repaint the real canvas live.
- Light/Dark: the editor switch turns the canvas dark; an exported page turns dark under
  `prefers-color-scheme: dark` (measured with computed styles).
- Three real existing sites: canvas and export screenshots are unchanged after migration (measured).
- Canvas = export = publish: computed styles of button, input, heading and card match across all three.

## 6 · Token usage map + safe delete (D2)
- One function counts, per token, the references to its var (directly or through an alias chain)
  across **every page of the site**, including element styles, class/project styles, saved components
  and CMS template pages. It reads the project data, not only the loaded page. If any source cannot be
  scanned, the count is shown as unknown and delete is refused, never treated as 0. Brand shows the count on each token; clicking it highlights those elements on the
  canvas.
- Deleting a token with usage > 0 is refused until the user picks a replacement; then the token gets
  `replacedBy` (soft delete, already resolved by `AliasResolver`). Usage 0 → hard delete is allowed.
- Connect to tokens (§3) reuses the same scanner for its "14 elements" counts.

## 7 · Scale generator (D3)
- Input: one colour. Output: an 11-step primitive scale (50…950) built in OKLCH, plus the semantic
  light/dark aliases for that role (e.g. Primary light → 600, dark → 400).
- **The picked colour is kept exactly** at the step closest to it by OKLCH lightness, and the role's light
  alias points at that step. So "Primary" always equals the colour the user picked; the other 10 steps
  are derived around it. ("Light → 600" above is the typical case for a mid-tone brand colour.)
- **Dark alias rule:** the step whose lightness mirrors the picked step around the middle
  (`index = 10 − picked index`), clamped to 300…500 so dark-mode accents stay readable. A very light pick
  (50/100) therefore gets dark → 500. (The seed places `#1A56DB` at that computed step. Its blue-600 vs Flowbite
  blue-700 naming is settled by the generator, not by hand.)
- Runs as one transaction (one ⌘Z) and makes a restore point first (§8).
- Pure function in `packages/shared/`, unit-tested on fixed inputs; the scale's look gets a design
  review before merge.

## 8 · Brand restore points (D6)
- **Store (D10, reopened):** the existing `SiteThemeSnapshot` (`prisma/schema.prisma:415`), which keeps
  `designTokens` + `designPresets` (`snapshotTokens`, `theme.service.ts:55-64`) and retains 10 per site
  (`SNAPSHOT_RETENTION`, `:122`; `pruneSnapshots`, `:280-291`). Add three columns:
  - `reason` (`theme-push | migration | generator | dark-auto | connect | logo`); existing rows backfill as
    `theme-push`.
  - `tokensSchemaVersion` (the `designTokensSchemaVersion` at snapshot time; existing rows backfill with
    the pre-Part-1 version). Note: the existing `prevDsSchemaVersion` is the reload counter, not this.
  - `darkMode` (the site's Dark mode setting at snapshot time), so restoring a `dark-auto` snapshot also
    restores the setting.
  **One restore list per site**, shown in Brand. **Retention:** the cap of 10 applies to all reasons
  except `migration`, which is never pruned (at most one per schema version). Writing a snapshot changes
  neither `lastEditedAt` nor `dsSchemaVersion`, so no open editor reloads or conflicts because of it. Snapshot writes go through `theme.service.ts` (Router → Service → Prisma). The
  Prisma migration is created by the agent and applied by the owner.
- Taken automatically before: migration, scale generator, Dark-mode Auto switch, Connect to tokens
  Apply, brand-from-logo apply.
- Brand lists them with time and reason. **Restore runs in the editor**: it fetches the snapshot, runs
  the shared migration if the snapshot is an older schema version, and applies it as one transaction.
  So it is one ⌘Z step and is saved by normal autosave. If a theme push lands between fetching the
  snapshot and saving it, the save gets the normal `lastEditedAt` conflict (acceptable; user reloads).
- **Migration rollback is the one server-only path:** for `reason=migration`, `rollbackSiteTheme` is kept
  (extended to restore `tokensSchemaVersion` too) and writes the old shape verbatim, bumping
  `dsSchemaVersion` so open editors reload. It is an operator/owner action, not shown in the user's
  restore list. All other restores use the client path.

## 9 · Brand from logo or website URL (D7)
- The user uploads a logo or pastes a site URL. **Extraction is deterministic (D13):** for an image, the
  server decodes it and quantizes colours (one new lazily-loaded image dependency) to get dominant and
  accent colours; for a URL, it parses the page's CSS for colours and font families. The scale
  generator (§7) builds the token set. AI is optional and only suggests which colour plays which role
  (Primary/Accent); without `OPENAI_API_KEY` the most saturated dominant colour becomes Primary.
- Fonts found on a URL: a Google Fonts family is added to the site's font list; any other family is
  mapped to the closest available family and shown as "replaced X with Y" in the preview.
- Shown as a preview (canvas repaints), applied only on confirm, with a restore point first.
- URL fetch is server-side with SSRF guards: http(s) only; the hostname is resolved once and the
  connection goes to that resolved public IP (no DNS-rebinding window); private, loopback and link-local
  ranges refused; **every redirect is re-checked** against the same guard (max 3); size and time limits.
- Live done-condition: upload a logo → the preview repaints the canvas with its colours in ≤ 2 steps;
  confirm → one ⌘Z reverts; a restore point is listed.
- Plan gating per decision 13 is Part 2's job; Part 1 ships it behind the existing `dsAi` flag.

## Out of scope (later specs)
Part 2 Brand panel UI (surface, sections, checks as badges, starters as themes, plan gating) · Part 3
Inspector token picker on every field · Part 4 Text styles + Component styles · Part 5 Workspace library,
import/export. Contrast guard (WCAG AA) is deferred to Part 2's badges (D5). Part 1 only makes the minimum UI change needed to run on the new foundation (e.g. removing
staged Save).

## Risks
- Migration correctness on real sites — mitigated by the identical-resolved-CSS fixtures and the three-site
  live check.
- Server write paths that store `designTokens` without the shared schema — all four (`saveProjectData`,
  duplicate site, theme `withTokens`, `restoreTokens`) must route through it, plus the workspace theme
  store.
- Publish output size grows because every token is emitted — measure; acceptable if under a few KB gzip.
- `cleanUrls` and SEO lanes touch publish files in parallel — coordinate on `lib/publish-*.ts`.
