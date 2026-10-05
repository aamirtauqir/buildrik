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
| D14 | Global migration kill switch | Server-side env switch; off → no migration, Brand read-only on old shape (§10) |
| D15 | Part 1 UI has no Figma boards | Request boards from the designer; engine/server work starts now; UI tasks blocked on boards; `/plan-design-review` before UI build (§11) |
| D16 | Where logos are decoded | In the browser (canvas), not server-side sharp; no upload endpoint (§9) |
| D17 | Hardening from the section review | All four groups accepted: migration/emit safety, authz + upload safety, preview + Apply safety, observability + runbook (§10) |

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
  Writes are coalesced to at most one per animation frame, and a continuous drag is one history entry
  (eng P1).
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
  stored without its snapshot. Such a save **must** carry `expectedLastEditedAt` (refused otherwise);
  the pre-transaction read also selects `lastEditedAt` and must equal it (else conflict), so the snapshot
  is exactly the state the CAS overwrites (eng E4).
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
1. Schema (`packages/shared/schemas/design-tokens.ts`) refuses alias cycles, kind mismatches and modes on primitives — client and server.
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
23. Kill switch off: un-migrated site is not migrated and Brand is read-only; an already-migrated site
    still loads and saves normally.
31. Admin theme-push rollback takes the newest `theme-push` snapshot even when a newer generator
    snapshot exists (E1).
32. Migration rollback sets the hold; reload does not re-migrate; clearing the hold allows migration (E2).
33. A tokens-version-raising save without `expectedLastEditedAt` is refused; a pre-read whose
    `lastEditedAt` differs yields a conflict (E4).
34. Prune failure is logged and does not fail the save (E5); legacy rows absent from the Brand list,
    present for admin rollback (E6).
35. Emit coalescing: 50 rapid edits → one stylesheet write per frame, final value correct (P1).
36. E2E (Playwright, QA workspace, publish blocked): Primary change + ⌘Z measured with
    `getComputedStyle`; migration fixture export CSS diff = 0; Dark Auto flow (T1).
24. `migrateTokens` throwing: editor loads old tokens, Brand read-only, Sentry event; nothing saved.
25. `emitTokenCss` with one bad value: skips it, still emits the backstop var, does not throw.
26. Autosave refusal: persistent banner, local recovery copy, no retry loop on the same payload.
27. Snapshot list/restore as VIEWER → refused; as editor without agency layer → allowed.
28. Extract endpoint rate limit; >4 MP image downscaled; SVG parsed, never rasterized; font names sanitized.
29. Each preview reverts on cancel, navigation and unmount; double-click Apply → one transaction.
30. Usage index built in one pass (call count asserted) and matches per-token counts.
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
  except `migration`, which is never pruned (at most one per schema version). A prune failure is logged
  with siteId instead of being swallowed; the save still succeeds (eng E5). Writing a snapshot changes
  neither `lastEditedAt` nor `dsSchemaVersion`, so no open editor reloads or conflicts because of it. Snapshot writes go through `theme.service.ts` (Router → Service → Prisma). The
  Prisma migration is created by the agent and applied by the owner.
- Taken automatically before: migration, scale generator, Dark-mode Auto switch, Connect to tokens
  Apply, brand-from-logo apply.
- Brand lists them with time and reason. **Restore runs in the editor**: it fetches the snapshot, runs
  the shared migration if the snapshot is an older schema version, and applies it as one transaction.
  So it is one ⌘Z step and is saved by normal autosave. If a theme push lands between fetching the
  snapshot and saving it, the save gets the normal `lastEditedAt` conflict (acceptable; user reloads).
- **Migration rollback is the one server-only path:** for `reason=migration`, a rollback writes the old shape
  verbatim (tokens + `tokensSchemaVersion`), bumps `dsSchemaVersion` so open editors reload, and sets a
  per-site `tokensMigrationHold` (eng E2): while held, neither the editor nor the server migrates that
  site; the runbook clears the hold once the bug is fixed.
- The existing admin theme-push rollback (`rollbackSiteTheme`) and its list filter on `reason = 'theme-push'`
  (eng E1), so a newer generator/logo snapshot never changes what "undo the push" undoes.
- The Brand restore list returns only rows whose `prevStyles` is a token set; legacy projectStyles rows
  stay admin-rollback-only (eng E6). It is an operator/owner action, not shown in the user's
  restore list. All other restores use the client path.

## 9 · Brand from logo or website URL (D7)
- The user picks a logo file or pastes a site URL. **Extraction is deterministic (D13):** a logo is
  **decoded in the browser (D16)** via canvas `getImageData` and quantized by a pure function in
  `packages/shared` (no native dependency, no upload endpoint). Images over 4 megapixels are downscaled
  before reading; SVG logos are never rasterized: their `fill`/`stroke` colours are parsed from the
  markup. For a URL, the server fetches the page and parses its CSS for colours and font families.
- No colours found (e.g. a monochrome logo) → a clear "We couldn't find brand colours in this logo" state
  with a colour picker fallback. Fetch timeout → "That site took too long to answer". The scale
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

## 10 · Rollout, safety and operations (D14, D17)

### Kill switch (D14)
- A **server-side** env var (`BRAND_TOKENS_V2`, not `NEXT_PUBLIC_*`, which would bake at build time) is
  read by the server and sent to the editor at load. **Off = no new migrations (eng E3):** sites already
  migrated keep working on the new shape (version rule unchanged); sites not yet migrated stay on the
  old shape with Brand read-only and a notice. On → Part 1 behaviour. Rollout: QA workspace first, then everyone. The CLAUDE.md env table gets the row in the
  same commit.

### Migration and emit safety (D17)
- If `migrateTokens` throws for a site, the editor still loads with the old tokens, Brand is read-only
  with "We couldn't upgrade this site's brand — nothing was changed", and the error goes to Sentry with
  siteId and schema version. The site is never half-migrated.
- `emitTokenCss` never throws on a bad value: it skips that token, logs it, and the legacy backstop
  still defines the var. Publish never fails because of one token.
- An autosave refused by the schema shows a persistent banner (not a toast), keeps the unsaved tokens
  in local recovery storage, and stops retrying the same payload in a loop.

### Authorization and input safety (D17)
- Snapshot list and restore require site membership with edit rights; VIEWER is refused. They do not
  require the agency layer (the existing theme-push rollback route stays admin + agency gated).
- The URL-extract endpoint is rate limited per user and per workspace.
- Font family names from a URL pass through the same sanitizer as token values.

### Preview and Apply safety (D17)
- Every preview (Dark-Auto, Connect to tokens, logo/URL, generator) reverts the canvas on cancel,
  navigation away or unmount.
- Apply buttons are disabled while their transaction is in flight, so a double-click cannot create two
  transactions.
- The usage scanner builds one index of all references in a single pass; per-token counts read from
  that index.

### Observability (D17)
- Metrics/logs: sites migrated, migrations failed (Sentry, with siteId + versions), schema refusals
  (siteId + reason), extraction failures (kind, no URL contents logged).
- An operator script for the migration rollback (§8), plus a runbook in `docs/` covering: switch off
  `BRAND_TOKENS_V2`, find affected sites from the failure metric, roll them back, verify.

## 11 · UI surfaces and design boards (D15)
Part 1 adds seven UI surfaces: token usage count/highlight, restore list, Dark mode setting, Auto
switch flow, logo/URL import, theme-toggle block, and Connect to tokens suggestions. None has a Figma
board yet. The designer gets a brief for all seven; **engine and server work starts now, UI tasks wait
for the boards**, and `/plan-design-review` runs before UI build. Verification follows the editor's
board-vs-live rule.

## Delivery order (recommended)
1. **1a Foundation:** shared schema + DTCG shape, `emitTokenCss` (+ backstop), migration + kill switch,
   snapshot columns (owner applies the Prisma migration), server validation on all four paths, one undo
   stack, observability.
2. **1b Binding:** insert-bound defaults, usage index + safe delete, Connect to tokens, theme push keeps
   in-use tokens.
3. **1c Generators:** scale generator, Dark mode Auto/Off + D11 flow, toggle block, restore list,
   logo/URL import.
UI parts of 1b/1c land when their boards arrive (D15).

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

---

# CEO review record (/plan-ceo-review, 2026-10-05, SCOPE EXPANSION)

CEO scope summary: `~/.gstack/projects/aamirtauqir-buildrik/ceo-plans/2026-10-05-brand-token-foundation.md`.

## Decision ledger

| ID | Owner section | Answer | Status |
|----|---------------|--------|--------|
| D1 | Step 0E mode | SCOPE EXPANSION (owner; reviewer recommended SCOPE REDUCTION) | settled |
| D2 | 0G | Usage map + safe delete: Add | approved |
| D3 | 0G | Scale generator: Add | approved |
| D4 | 0G | DTCG shape: Add | approved |
| D5 | 0G | Contrast guard: Defer to Part 2 (TODOS.md § Brand) | deferred |
| D6 | 0G | Restore points: Add | approved |
| D7 | 0G | Logo/URL brand: Add (reviewer recommended Defer) | approved |
| D8 | 0D | Dark mode per-site Auto/Off, migrated Off, new Auto | approved |
| D9 | 0D | Three code-audit corrections: Accept all | approved |
| D10 | 0H loop | Restore store: new table → **reopened** round 2 → extend `SiteThemeSnapshot` | approved (latest) |
| D11 | 0H loop | Auto on missing dark values: generate + preview + snapshot | approved |
| D12 | 0H loop | Theme-toggle block: Add (reviewer recommended Defer) | approved |
| D13 | 0H loop | Deterministic extraction; AI optional for roles | approved |
| D14 | Section 9 | Server-side kill switch | approved |
| D15 | Section 11 | Boards from designer; engine first; UI blocked on boards | approved |
| D16 | Section 5 | Browser canvas decode, no sharp | approved |
| D17 | Sections 2–8 | All four hardening groups | approved |
| — | Spec approval | "Approve, continue" | approved |

Approval readiness: PASS (D2–D17 each cite the owner's AskUserQuestion answer in this session; no unapproved remedy is in the spec).

## NOT in scope
- Contrast guard (WCAG AA): deferred to Part 2 badges (D5), recorded in TODOS.md.
- Parts 2–5 (Brand panel UI, Inspector picker, Text/Component styles, workspace library, import/export UI).
- Server-side image decoding (D16 rejected sharp).

## What already exists (reused)
| Need | Existing code | Reused? |
|------|---------------|---------|
| Undo of token edits | `HistoryManager` snapshot/patch incl. `designTokens` (:376-410) | Yes, only the extra stacks go |
| Dark CSS shape | `CSSBundler.ts:70-85` | Folded into `emitTokenCss` |
| Alias redirect for deleted tokens | `AliasResolver.ts:107-124` + `replacedBy` | Yes (safe delete) |
| Canvas Light/Dark switch | `ColorModeToggle` / `composer.colorMode` | Yes |
| Snapshots + retention | `SiteThemeSnapshot`, `pruneSnapshots`, `rollbackSiteTheme` | Extended (D10) |
| Transactions | `Composer` begin/endTransaction | Yes, for every multi-token write |
| Save conflicts | `lastEditedAt` compare-and-swap | Yes, for version skew |
| Lazy AI client | `openai.client.ts` | Optional role naming only |

## Dream state delta
After Part 1: one token pipeline (schema → emitter) shared by canvas, export and publish; safe binding,
delete and restore; dark mode that never surprises a live site; tokens in a standard format. Still
missing vs the 12-month ideal: the Brand panel UX (Part 2), the Inspector picker everywhere (Part 3),
styles (Part 4), and the agency library (Part 5).

## Error & Rescue Registry
| Codepath | Failure | Rescue | User sees | Test |
|----------|---------|--------|-----------|------|
| `migrateTokens` on load | throws on unexpected data | load old tokens, Brand read-only, Sentry | "We couldn't upgrade this site's brand — nothing was changed" | 24 |
| server schema on save | invalid payload | domain error → tRPC error; client stops retrying that payload | persistent banner; local recovery copy | 8, 26 |
| server version rule | old payload vs newer store | refuse | "reload to continue" | 16, 19 |
| `emitTokenCss` | bad value | skip + log; backstop defines var | nothing broken | 15, 25 |
| first migrated save | snapshot write fails | whole DB transaction fails | normal save-failed state | 17 |
| client restore | theme push in between | `lastEditedAt` conflict | reload prompt | 17 |
| URL extract | SSRF / redirect / rebinding | refuse | "This address can't be used" | 14 |
| URL extract | timeout / too big | abort | "That site took too long to answer" | 14 |
| logo decode | no colours / huge image | empty state / downscale | picker fallback | 28 |
| AI role naming | missing key, malformed or refused | deterministic fallback | nothing (works without AI) | 14 |
| delete in-use token | usage > 0 or unknown | refuse until replacement picked | replacement picker | 11 |

## Failure Modes Registry
```
CODEPATH            | FAILURE MODE              | RESCUED? | TEST? | USER SEES?            | LOGGED?
--------------------|---------------------------|----------|-------|-----------------------|--------
migrateTokens       | throw                     | Y        | Y(24) | read-only notice      | Sentry
autosave + schema   | refusal loop              | Y        | Y(26) | persistent banner     | Y
emitTokenCss        | bad value                 | Y        | Y(25) | nothing               | Y
theme push          | drops in-use token        | Y        | Y(21) | nothing               | -
migration rollout   | bug across many sites     | Y (D14)  | Y(23) | read-only notice      | metric
previews            | stuck after navigate      | Y        | Y(29) | canvas reverts        | -
Apply               | double transaction        | Y        | Y(29) | one change            | -
snapshot retention  | migration row pruned      | Y        | Y(17) | rollback still works  | -
```
0 CRITICAL GAPS (the one found in Section 2, `migrateTokens` blocking load, is closed by D17).

## Diagrams
System architecture: see Section 1 of the review (shared pure modules → editor, server, export). Data
flow (save path with shadow paths):
```
edit ─► Composer txn ─► history patch ─► autosave ─► schema(Zod) ──ok──► saveProjectData
                                                      │                    ├─ store old & payload new → write migration snapshot (same txn)
                                                      │                    └─ lastEditedAt CAS ──stale──► conflict "reload"
                                                      └─invalid─► domain error ─► banner + local copy (no retry loop)
load ─► kill switch? ─off─► old shape, Brand read-only
          └─on─► migrateTokens ─throw─► old tokens, read-only, Sentry
                     └─ok─► emitTokenCss ─► <style> ; data-theme from colorMode
```
Dark mode state:
```
 [Off] ──owner turns Auto──► [Auto pending: generate missing dark → preview → snapshot]
   ▲                                 │confirm                 │cancel/navigate
   │                                 ▼                        ▼
   └──────owner turns Off────── [Auto]                     [Off] (canvas reverted)
```
Rollback: `BRAND_TOKENS_V2=off` (stops spread) → find sites from failure metric → operator script runs
migration rollback per site (restores tokens + schema version, bumps `dsSchemaVersion`) → verify CSS.
Deployment: Prisma migration (owner) → server accepting both shapes → editor; switch on for QA
workspace → three-site live check → switch on for all.

Stale diagram audit: no existing ASCII diagrams in the files this plan touches were found.

## Implementation Tasks
Synthesized from this review's findings (detailed plan comes from `writing-plans`).

- [ ] **T1 (P1, human: ~3d / CC: ~1.5h)** — shared — tokens schema (DTCG shape), migrate, emit + backstop + sanitize, usage index
  - Surfaced by: Step 0 corrections, D4, D9, rounds 2–3; eng D1 arrangement
  - Files: `packages/shared/tokens/{schema,migrate,emit,usage}.ts`; browser-only `engine/designSystem/{scale,quantize}.ts`, `engine/designSystem/types.ts`, `engine/export/ExportHelpers.ts`
  - Verify: tests 1, 2, 5, 10, 15, 19, 20, 25
- [ ] **T2 (P1, human: ~2d / CC: ~1h)** — server — schema on 4 write paths, version rule, migration snapshot in save txn, kill switch
  - Surfaced by: D9(b), D14, round 3
  - Files: `server/services/sites.service.ts`, `server/services/theme.service.ts`, `prisma/schema.prisma`
  - Verify: tests 8, 16, 17, 23, 26
- [ ] **T3 (P1, human: ~2d / CC: ~1h)** — editor — one undo stack, `<style>` emitter, always-set data-theme, migration-failure path
  - Surfaced by: D9(a)(c), Section 2
  - Files: `ProjectTokensApplier.tsx`, `useBrandDraft.ts` (delete), `ReviewModal.tsx` (delete), `useTokensForKind.ts`, `BrandWorkspace.tsx`
  - Verify: tests 7, 18, 24; live: change Primary, one ⌘Z
- [ ] **T4 (P1, human: ~3d / CC: ~1.5h)** — binding — insert-bound blocks, usage index + safe delete, Connect to tokens, theme push keeps in-use tokens
  - Surfaced by: §3, D2, round 2
  - Files: `shared/constants/defaultStyles.ts`, `blocks/`, theme.service
  - Verify: tests 3, 4, 6, 11, 21, 30
- [ ] **T5 (P2, human: ~3d / CC: ~1.5h)** — generators — scale generator, Dark Auto/Off + D11 flow, toggle block, restore list (UI after boards)
  - Surfaced by: D3, D8, D11, D12, D10
  - Files: to be determined
  - Verify: tests 9, 12, 13, 22, 27, 29
- [ ] **T6 (P2, human: ~4d / CC: ~2h)** — import — logo (browser decode) and URL (server fetch, SSRF guard, rate limit)
  - Surfaced by: D7, D13, D16, D17
  - Files: to be determined
  - Verify: tests 14, 28
- [ ] **T7 (P2, human: ~1d / CC: ~30m)** — ops — metrics, Sentry events, rollback script, runbook, CLAUDE.md env row
  - Surfaced by: Section 8, D14
  - Verify: run the runbook against a seeded local site
- [ ] **T8 (P1, owner/designer)** — design — brief for the 7 UI surfaces; `/plan-design-review` before UI build
  - Surfaced by: Section 11, D15
  - Verify: boards exist and are linked in `boards.json`

## Completion Summary
```
  +====================================================================+
  |            MEGA PLAN REVIEW — COMPLETION SUMMARY                   |
  +====================================================================+
  | Mode selected        | SCOPE EXPANSION                             |
  | System Audit         | 5 spec assumptions wrong vs code (dark on   |
  |                      | live sites, undo stacks, server paths,      |
  |                      | delete → undefined var, existing toggle)    |
  | Step 0               | EXPANSION; D2-D7, D8, D9                     |
  | Section 1  (Arch)    | 3 issues found                              |
  | Section 2  (Errors)  | 11 error paths mapped, 4 GAPS (all closed)  |
  | Section 3  (Security)| 5 issues found, 2 High severity             |
  | Section 4  (Data/UX) | 3 edge cases mapped, 2 unhandled (closed)   |
  | Section 5  (Quality) | 2 issues found                              |
  | Section 6  (Tests)   | Diagram produced, 6 gaps (closed)           |
  | Section 7  (Perf)    | 1 issue found                               |
  | Section 8  (Observ)  | 2 gaps found (closed)                       |
  | Section 9  (Deploy)  | 2 risks flagged                             |
  | Section 10 (Future)  | Reversibility: 2/5, debt items: 1           |
  | Section 11 (Design)  | 1 issue (7 surfaces without boards)         |
  +--------------------------------------------------------------------+
  | NOT in scope         | written (3 items)                           |
  | What already exists  | written                                     |
  | Dream state delta    | written                                     |
  | Error/rescue registry| 11 rows, 0 CRITICAL GAPS                    |
  | Failure modes        | 8 total, 0 CRITICAL GAPS                    |
  | TODOS.md updates     | 1 item (D5)                                 |
  | Scope proposals      | 7 proposed, 6 accepted (EXP)                |
  | CEO plan             | written                                     |
  | Outside voice        | codex: unavailable (probe module missing)   |
  | Lake Score           | 5/5 recommendations chose complete option   |
  | Diagrams produced    | 5 (architecture, data flow, state, rollback,|
  |                      | deployment)                                 |
  | Stale diagrams found | 0                                           |
  | Unresolved decisions | 0                                           |
  +====================================================================+
```
Spec-review loop: 3 rounds (6, 5, 6 / 10). The 6 round-3 fixes (§4/§8 snapshot mechanics) were applied
after the last reviewer launch and are **not reviewer-verified**; `/plan-eng-review` must re-check them.

# Eng review record (/plan-eng-review, 2026-10-05)

Target: `docs/superpowers/specs/2026-10-05-brand-token-foundation-design.md` (commit 90c756935).

## Scope record
feature answers: none proposed (CEO scope D2–D17 kept); structure: B "Smaller arrangement" (eng D1, owner answer 2026-10-05); accepted scope: shared `packages/shared/tokens/` holds schema.ts (DTCG shape + round-trip), migrate.ts, emit.ts, usage.ts; editor `engine/designSystem/` holds scale.ts and quantize.ts (browser-only); pending remedies: E1–E6.
Scope Challenge result: scope accepted as-is (smaller arrangement, no feature reduction).

## Decision ledger

### E1: theme-push rollback must ignore Brand snapshots
Finding: 1, P1, confidence 9/10, `server/services/theme.service.ts:331-334` (`findFirst({ where: { siteId, workspaceId }, orderBy: { createdAt: "desc" } })`), reviewer: eng review
Plan baseline: spec §8 (D10 reopened) puts generator/connect/logo/dark-auto/migration snapshots in the same `SiteThemeSnapshot` table; admin rollback route unchanged.
Runtime evidence: `rollbackSiteTheme` pops the newest snapshot of any kind and deletes it.
Comparison grid: | Choice | Current | A | B | / E1 rollback filter | none | `reason = 'theme-push'` on rollback + admin list, regression test | none (admin rollback may undo a generator/logo snapshot) |
Question D2: see AskUserQuestion D2 (filter vs do nothing). Recommendation A. Completeness A=10/10, B=3/10.
State: approved
Actual answer: D2 A "Filter by reason" (owner, 2026-10-05)
Accepted scope: `rollbackSiteTheme` and the admin snapshot list filter `reason = 'theme-push'`; regression test: a newer generator snapshot does not change which snapshot admin rollback takes.

### E2: migration rollback is undone by the next load
Finding: 2, P1, confidence 8/10, spec §4 "server-only migration rollback" + §10 kill switch, reviewer: eng review
Plan baseline: rollback writes old shape + old version; switch on → editor migrates on load.
Runtime evidence: proposed behaviour only (no code yet); with the switch on, a rolled-back site re-migrates on its next open.
Comparison grid: | Choice | Current | A | B | / E2 hold | none | per-site `tokensMigrationHold` set by rollback, editor + server skip migration while held, runbook clears it | rollback only with global switch off (documented) |
Question D3: see AskUserQuestion D3. Recommendation A. Completeness A=9/10, B=6/10.
State: approved
Actual answer: D3 A "Per-site hold" (owner, 2026-10-05)
Accepted scope: rollback sets per-site `tokensMigrationHold`; editor and server skip migration while held; runbook step clears it; test: rollback → reload → site stays old shape.

### E3: kill switch "off" cannot read old shape for migrated sites
Finding: 3, P2, confidence 8/10, spec §10 "Off → the editor does not migrate, reads the old shape … the server accepts old-shape saves", reviewer: eng review
Plan baseline: D14 server-side switch.
Runtime evidence: contradiction inside the spec (migrated sites store the new shape; §4 version rule refuses older payloads).
Comparison grid: | Choice | Current | A | B | / E3 off-semantics | ambiguous | Off = no NEW migrations; migrated sites keep working; version rule unchanged; un-migrated sites stay old with Brand read-only | Off = also roll every migrated site back |
Question D4: see AskUserQuestion D4. Recommendation A. Note: options differ in kind.
State: approved
Actual answer: D4 A "Off = no new migrations" (owner, 2026-10-05)
Accepted scope: §10 reworded: Off stops new migrations only; migrated sites keep working; version rule unchanged; un-migrated sites stay old with Brand read-only; test 23 updated.

### E4: migration snapshot source read outside the save transaction
Finding: 4, P2, confidence 7/10, `server/services/sites.service.ts:908-911` (`findUnique … select: { deletedAt: true, projectSettings: true }` before `$transaction`) and `:948` (`...(expectedLastEditedAt ? { lastEditedAt: … } : {})`), reviewer: eng review
Plan baseline: spec §4 "writes the migration snapshot of the stored tokens in the same DB transaction".
Runtime evidence: stored settings are read before the transaction; CAS is skipped when `expectedLastEditedAt` is omitted.
Comparison grid: | Choice | Current | A | B | / E4 snapshot consistency | pre-txn read, optional CAS | a save that raises the tokens schema version must carry `expectedLastEditedAt`; pre-read also selects `lastEditedAt` and must equal it; snapshot from that read | lock row inside txn with raw `SELECT … FOR UPDATE` and snapshot from it |
Question D5: see AskUserQuestion D5. Recommendation A. Completeness A=9/10, B=9/10 (kind differs).
State: approved
Actual answer: D5 A "Require CAS" (owner, 2026-10-05)
Accepted scope: a save that raises the tokens schema version is refused without `expectedLastEditedAt`; the pre-read selects `lastEditedAt` and must equal it or conflict; snapshot taken from that read; tests for both.

### E5: snapshot pruning swallows errors
Finding: 5, P3, confidence 9/10, `server/services/theme.service.ts:288-290` (`.deleteMany(…).catch(() => {})`), reviewer: eng review
Plan baseline: spec §8 retention 10, migration rows exempt.
Runtime evidence: prune failures are silent.
Comparison grid: | Choice | Current | A | B | / E5 prune | silent catch, all reasons | exempt `migration` in the query, log failure with siteId, test | leave as is |
Question D6: see AskUserQuestion D6. Recommendation A. Completeness A=10/10, B=5/10.
State: approved
Actual answer: D6 A "Exempt + log" (owner, 2026-10-05)
Accepted scope: prune query excludes `reason = 'migration'`; prune failure logged with siteId (save still succeeds); tests: migration row survives 15 generator runs, prune error is logged.

### E6: legacy snapshots cannot be restored by the client
Finding: 6, P2, confidence 9/10, `server/services/theme.service.ts:340-341` (`const prevTokens = readTokenTheme(snap.prevStyles);` … legacy rows hold projectStyles), reviewer: eng review
Plan baseline: spec §8 "One restore list per site … Restore runs in the editor".
Runtime evidence: some stored rows are projectStyles snapshots, not token sets.
Comparison grid: | Choice | Current | A | B | / E6 list filter | n/a | Brand list returns only rows where `readTokenTheme(prevStyles)` is a token set; legacy rows stay for admin rollback only; test | show all, client errors on legacy |
Question D7: see AskUserQuestion D7. Recommendation A. Completeness A=10/10, B=4/10.
State: approved
Actual answer: D7 A "Filter legacy rows" (owner, 2026-10-05)
Accepted scope: Brand restore list returns only rows whose `prevStyles` is a token set; legacy rows stay admin-rollback-only; test.

### F1: schema file location (factual correction, no behaviour change)
Finding: 7, P2, confidence 9/10, CLAUDE.md Global Invariants ("Shared/domain validation schemas live in `packages/shared/schemas/` (SSOT)"); eng D1 had put schema.ts under `packages/shared/tokens/`.
Correction: schema at `packages/shared/schemas/design-tokens.ts`; migrate/emit/usage stay in `packages/shared/tokens/`. No question needed.

### T1: automated E2E for the three critical flows
Finding: 8, P2, confidence 8/10, spec §5 live done-conditions have no automated E2E, reviewer: eng review (Section 3)
Comparison grid: | Choice | Current | A | B | / E2E | none (live QA only) | 3 Playwright tests in the QA workspace with publish blocked | live QA only |
State: approved
Actual answer: D8 A "Add 3 E2E" (owner, 2026-10-05)
Accepted scope: Playwright: (1) change Primary → canvas computed colour changes → one ⌘Z restores it; (2) migration fixture site → export CSS diff = 0; (3) Dark Auto → generate → preview → confirm.

### P1: coalesce token CSS writes during continuous edits
Finding: 9, P2, confidence 6/10 (unmeasured), spec §2 "one `<style>` element with this string replaces … per-var `setProperty`"; canvas shares the editor document, reviewer: eng review (Section 4)
Comparison grid: | Choice | Current | A | B | / emit rate | every edit rewrites the stylesheet | at most one write per animation frame; one history entry per drag | measure after 1a |
State: approved
Actual answer: D9 A "rAF coalesce" (owner, 2026-10-05)
Accepted scope: emitter writes coalesced to one per animation frame; test: 50 rapid edits → one write per frame, final value correct; live measure of picker drag on a ~200-element page.

### N1: autosave times out on large pages (pre-existing, outside this plan)
Finding: 10, P1, confidence 8/10, Brand QA walk 2026-10-05 (`qa/brand-bugs-2026-10-05`, 615487d05): saving a ~700-element page → 500 from DB timeout in `tx.page.upsert`, then 409. Not caused by this plan, but E4 adds a snapshot write to the same transaction. Recorded for a separate /investigate.
State: approved
Actual answer: D10 C "Build now, before 1a" (owner, 2026-10-05)
Accepted scope: before any 1a work, root-cause and fix the save-transaction timeout on large pages via /investigate; regression test: a ~700-element page saves without 500/409.

Approval readiness: PASS — checked E1 (D2 A), E2 (D3 A), E3 (D4 A), E4 (D5 A), E5 (D6 A), E6 (D7 A), T1 (D8 A), P1 (D9 A), N1 (D10 C); F1 is a factual correction (no behaviour change); scope record = D1 B.

## Eng review outputs

### NOT in scope
- Canvas-vs-export fidelity differences unrelated to tokens (2,435 computed-style diffs from canvas-only
  styling, found by Brand QA 2026-10-05): needs its own audit; not part of the token pipeline.
- Everything already listed under the CEO review's NOT in scope.

### What already exists
CEO review table stands. Added by this review: the CAS pattern in `saveProjectData` (`sites.service.ts:948`)
is reused for E4; `SiteThemeSnapshot` + `pruneSnapshots` + `rollbackSiteTheme` are extended, not rebuilt
(E1, E2, E5, E6); `@buildrik/shared` is already a dependency of the editor (`packages/editor/package.json:54`).

### Diagrams
Save path after E4 (replaces the CEO data-flow line for the first migrated save):
```
saveProjectData(input, expectedLastEditedAt)
  pre-read {deletedAt, projectSettings, lastEditedAt}
  ├─ tokens version raised? ── no ──► normal save (CAS optional, as today)
  └─ yes ─┬─ expectedLastEditedAt missing ──► refuse (reload)
          ├─ pre-read.lastEditedAt ≠ expected ──► SAVE_CONFLICT
          └─ txn: CAS update ─► create SiteThemeSnapshot{reason:migration, tokensSchemaVersion, darkMode}
                  └─ CAS lost ──► SAVE_CONFLICT (snapshot rolled back with it)
```
Migration hold (E2):
```
[migrated] ──operator rollback──► [old shape + hold] ──load──► no migration (held)
                                          └─ runbook clears hold ──► [old shape] ──load──► migrate
```
Inline diagrams to add in code: `migrate.ts` (shape → version branches), `saveProjectData` (the block above).

### Failure modes (new paths from this review)
| Path | Failure | Test | Handling | User sees |
|------|---------|------|----------|-----------|
| admin push rollback | picks a Brand snapshot | 31 | reason filter | correct undo |
| migration rollback | re-migrates on load | 32 | hold | site stays rolled back |
| switch off | migrated site saves refused | 23 | Off = no new migrations | normal saves |
| first migrated save | stale snapshot | 33 | required CAS + pre-read check | conflict → reload |
| prune | silent failure | 34 | logged | nothing (logged) |
| Brand restore list | legacy row | 34 | filtered | only restorable rows |
| picker drag | style-recalc jank | 35 | rAF coalesce | smooth drag |
| large page save | DB timeout (pre-existing) | N1 test | fix before 1a | save succeeds |
0 critical gaps.

### Worktree parallelization strategy
| Step | Modules touched | Depends on |
|------|----------------|------------|
| N1 save-timeout fix | server/services (sites) | — |
| S shared tokens | packages/shared/schemas, packages/shared/tokens | — |
| B server | server/services (sites, theme), server/trpc/routers, prisma | N1, S |
| C editor engine + Brand | packages/editor/src/engine, editor/design-system, editor/shell | S |
| E E2E | e2e/ Playwright | B, C |

Parallel lanes: Lane 1: N1 → B (shared `server/services/sites.service.ts`). Lane 2: S → C.
Execution order: launch N1 and S together; when both merge, launch B and C in parallel; then E.
Conflict flags: B and C both read the shared schema (S must be merged first); `ExportEngine`/publish
files overlap with the cleanUrls and SEO lanes (coordinate on `lib/publish-*.ts`).

## Implementation Tasks (eng review)
Synthesized from this review's findings; add to the CEO task list T1–T8.

- [ ] **E-T1 (P1, human: ~1d / CC: ~45min)** — server — fix save-transaction timeout on large pages (before 1a)
  - Surfaced by: N1 (Brand QA 615487d05)
  - Files: `server/services/sites.service.ts`
  - Verify: ~700-element page saves, no 500/409
- [ ] **E-T2 (P1, human: ~4h / CC: ~20min)** — server — snapshot reason/version/darkMode columns; rollback + list filter `theme-push`; Brand list filters legacy rows; prune exempts migration + logs
  - Surfaced by: E1, E5, E6
  - Files: `prisma/schema.prisma`, `server/services/theme.service.ts`, `server/trpc/routers/theme.ts`
  - Verify: tests 31, 34
- [ ] **E-T3 (P1, human: ~4h / CC: ~20min)** — server — required CAS + pre-read check for tokens-version-raising saves; migration snapshot in txn
  - Surfaced by: E4
  - Files: `server/services/sites.service.ts`
  - Verify: tests 17, 33
- [ ] **E-T4 (P1, human: ~4h / CC: ~20min)** — server+editor — migration hold + Off-means-no-new-migrations
  - Surfaced by: E2, E3
  - Files: to be determined (site flag storage), migrate.ts callers
  - Verify: tests 23, 32
- [ ] **E-T5 (P2, human: ~3h / CC: ~15min)** — editor — rAF-coalesced emitter, one history entry per drag
  - Surfaced by: P1
  - Files: `ProjectTokensApplier.tsx` replacement
  - Verify: test 35 + live drag measure
- [ ] **E-T6 (P2, human: ~2d / CC: ~1h)** — e2e — three Playwright flows (QA workspace, publish blocked)
  - Surfaced by: T1
  - Verify: test 36
- [ ] **E-T7 (P2, human: ~30m / CC: ~5min)** — shared — schema at `packages/shared/schemas/design-tokens.ts`
  - Surfaced by: F1
  - Verify: gate/tsc green
_No new tasks from Code Quality._

### Unresolved decisions
None in this review.

### Completion summary
- Step 0: Scope Challenge — scope accepted as-is (smaller arrangement D1 B; 6 round-3 findings E1–E6 resolved)
- Architecture Review: 2 issues found
- Code Quality Review: 0 issues found
- Test Review: diagram produced, 1 gap identified (E2E) + regression contract for the catalog baseline
- Performance Review: 1 issue found
- NOT in scope: written
- What already exists: written
- TODOS.md updates: 1 item proposed to user (N1 → build now)
- Failure modes: 0 critical gaps flagged
- Unresolved decisions: 0 in this review
- Outside voice: codex, unavailable (probe: missing gstack module `resolve-codex-generation-model.ts`); native fallback not run (TaskOutput unavailable)
- Parallelization: 2 lanes, 2 parallel / 3 sequential steps
- Lake Score: 4/4

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | CLEAR | 7 proposals, 6 accepted, 1 deferred |
| Outside Review | codex via `/plan-ceo-review` and `/plan-eng-review` | Independent 2nd opinion | 2 | unavailable | Codex probe failed (missing gstack module); no completed external review |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | ISSUES OPEN | 4 issues, 0 critical gaps (all 4 resolved with approved remedies; plus 6 scope-challenge findings E1–E6 resolved) |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | 7 UI surfaces need boards first (D15) |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

- **OUTSIDE COVERAGE:** codex, plan-review phase (CEO and eng), unavailable both times: `Module not found ".../resolve-codex-generation-model.ts"`; native fallback not run. No outside findings.
- **VERDICT:** CEO CLEARED. Eng review ISSUES OPEN only as mapped work: all 10 findings resolved by approved remedies, 0 critical gaps, ready for the implementation plan — eng review required (re-run after implementation to clear).

NO UNRESOLVED DECISIONS
