# Brand token binding — canvas elements and built-in templates follow the Brand (R1 + R6)

Owner: Saqib · Author: Claude (lane L6, post-Oct-1) · Drafted 2026-09-24 · Branch: `feat/post-oct1` (ships after 2026-10-01, own PR) · Status: **plan only — no engine change made**

## Strict sources

1. Rules: `/CLAUDE.md` (root), `packages/editor/CLAUDE.md`, `packages/editor/src/engine/AGENTS.md`, `packages/editor/src/editor/AGENTS.md`. In force here: Composer is the single gateway; `engine/ → shared/` only; SSOT for constants in `shared/constants/`; no pass-through wrappers, no dead code; tests co-located in `__tests__/`; every item has a done-condition observed in the running app (live app is the verifier; measure, don't eyeball; state what was NOT verified).
2. Scope: `docs/plans/2026-09-23-code-gap-oct1-completion.md` §"Remaining work — after Oct 1" rows **R1** (owner 2026-09-24: option (b), defer) and **R6** (owner 2026-09-24: defer, "do together with R1").
3. Site-builder token domain: `src/editor/design-system/` + `themes/design-system/design.css` (never the chrome `--bk-*` domain — CLAUDE.md DS SSOT table).

## Non-goals

- Chrome tokens (`--bk-*`). Nothing here touches chrome.
- Dark mode on the **published** site. Today a published page declares light values only (see §1.5); that is true with or without this plan and is its own decision.
- AI-generated sections, paste and HTML import. They write whatever colours their source carries; only the catalog insert path and built-in templates are in scope.
- Re-opening decisions already closed (#25 retirement for toasts etc. is unrelated).

## The problem, observed

- **R1.** Add › Button inserts an element whose `background-color` is the literal `#1A56DB`. Change Primary in Brand, or flip the Colour mode page's Light/Dark switch: the Brand live preview and the canvas repaint anything bound to a token, and the button stays `#1A56DB`.
- **R6.** Built-in templates apply their own palettes. The Templates boards say a template "re-maps to your Brand colours and fonts"; the code resolves the three `{{token.color.primary}}` placeholders that exist to a literal snapshot at apply time and leaves every other colour as authored.

## 1 · Current data flow (measured in code, 2026-09-24, integration `09be15efb`)

### 1.1 Where colours are written on insert

| Path | File | What it writes |
|---|---|---|
| Catalog insert (Add panel) | `blocks/blockRegistry.ts:353` `insertOne` → `:339` `applyTypeDefaults` | fills gaps from `getDefaultStyles(elementType, tag)` onto the inserted ROOT only |
| Default styles | `shared/constants/defaultStyles.ts:18` `THEME.primary = "#1A56DB"` | used by blockquote rule `:147`, button background `:220`, link colour `:231`, checkbox/radio `accent-color` `:355/:361`, badge background `:407` |
| Already bound on insert | same file `:215-222`, `:315-332` | button font-size/weight/height/padding/radius and input sizing/border are **already** `var(--buildrick-design-*)` — the var path works end to end today for non-colour roles |
| Site-owned skip | `blocks/blockRegistry.ts:293` `isSiteOwned` | `font-family` and the `textPrimary` colour are NOT seeded, so the site's own `body{…}` rule wins — the precedent this plan extends to the brand colour |
| Block markup | `blocks/blockPalette.ts:27` `BLOCK_COLORS` (8 block files) + inline hex in 22 block files | `accent: "#1A56DB"` literal; `SocialIcons.tsx:14-17` `background:#1A56DB` ×4; banned purples `#667eea` ×5, `#8b5cf6` ×3 in block sources |

### 1.2 Where colours are written on template apply

| Step | File | Behaviour |
|---|---|---|
| Source | `editor/sidebar/tabs/templates/templatesData.ts:145` `SITE_TEMPLATES` | 9 built-in page templates, inline `style=""` HTML. Only **3** `{{token.color.primary}}` placeholders in total; every other colour is literal (incl. `#667eea`, `#764ba2`, `#7c6dfa`, `#a5b4fc`). **0** `font-family` declarations — fonts already follow the site through `siteFontCSS`. |
| Resolve | `TemplatesTab.tsx:268-269` → `utils/tokenSnapshot.ts:92` `snapshotFromComputedStyle` → `utils/resolveTemplateTokens.ts:42` `resolveTokens` | each placeholder becomes the token's **current literal value**, then DOMPurify, then `importHTMLToActivePage`. The binding is lost at apply. |
| Save as template | `utils/inverseResolveTokens.ts:84` | the reverse: literal values that match a token become `{{token.kind.name}}` placeholders |

### 1.3 How a token reaches the canvas

- Element styles render inline in the editor document (`editor/AGENTS.md`: canvas mounts engine HTML).
- `editor/design-system/ui/ProjectTokensApplier.tsx:33-51` writes every project token onto `document.documentElement` on `PROJECT_LOADED` / `SETTINGS_CHANGE`; colours resolve through `composer.darkResolver` (`engine/darkResolver/DarkResolver.ts`) for `composer.colorMode` — an **editor-local** preference in localStorage (`engine/colorMode/ColorMode.ts`), not a site setting. It returns early when `designTokens` is empty; the canvas then paints from the global defaults in `themes/design-system/design.css`.
- The Brand live preview (`editor/design-system/ui/BrandLivePreview.tsx`) is an iframe of `composer.exportHTML` plus one staged `:root{…}` block that swaps `darkValue` in Dark. **That** is the surface R1 was observed on: a `var()` repaints there, a hex cannot.

### 1.4 Two binding syntaxes coexist

| Syntax | Written by | Read by |
|---|---|---|
| `var(--buildrick-design-<id>)` | Inspector `TokenPickerPopover` / `ColorInput` | `editor/inspector/shared/tokenBindingDetection.ts:17` (anchored `^var\((--buildrick-design-…)\)$` — **no fallback form**), plus inline duplicates in `SizeSection.tsx:30` and `typography/FontControls.tsx:42` |
| `{{token.<kind>.<name>}}` | template HTML, save-as-template | `resolveTemplateTokens.ts`, `engine/designSystem/TokenUsageTracker.ts:28`, `engine/designSystem/TokenBindingResolver.ts:23` |

After apply, `{{token…}}` never survives into element styles (§1.2), so `TokenUsageTracker` / `TokenBindingResolver` see no binding on anything a template inserted.

### 1.5 How a token reaches export and publish

- Three emission points declare the site's tokens as `:root{--x:value}` from `projectSettings.designTokens`: `engine/export/ExportEngine.ts:294` (single-file export), `:729` (multi-page publish, via `editor/shell/exportPublishPages.ts`), `engine/Composer.ts:723` (preview). Implementation: `engine/export/ExportHelpers.ts:94` `siteTokensCSS`.
- `var(--buildrick-design-*)` in element styles passes through to the published CSS unchanged (`engine/export/__tests__/ExportEngine.chromeTokenLeak.test.ts:77`).
- **Gap A — only saved tokens are declared.** A project whose `designTokens` is empty declares nothing. On the canvas that is invisible (design.css defines the defaults in the editor); on the published page a bound element's colour resolves to nothing and drops. Whether a new site starts with an empty `designTokens` is **not measured** — Task 0.
- **Gap B — light values only.** `siteTokensCSS` emits `value`, never `darkValue`. `engine/designSystem/bundler/CSSBundler.ts:70` has a dark block, but publish does not call it. Out of scope (Non-goals).
- **Stale doc to fix in the same PR:** `blocks/blockPalette.ts:1-20` says "A published page defines no custom properties at all … the publish path never runs it". True when written; false since `siteTokensCSS` shipped.

## 2 · Proposed binding

1. **One syntax for element styles: plain `var(--buildrick-design-<id>)`** — the form the Inspector already writes and reads, so an inserted button opens in the Inspector as "bound to Primary" with Unlink/Relink working unchanged. No CSS fallback (`var(--x, #hex)`): the anchored detector and its two duplicates would read it as unbound.
2. **Declaration is guaranteed at export instead of by fallback.** Every export declares every token an element default can bind, even when the project never saved one. The role tokens and their default values move to one leaf constant, `shared/constants/siteRoleTokens.ts` (id, cssVar, value, darkValue), which three places read: `defaultStyles.ts` (the var name it writes), `ExportHelpers.siteTokensCSS` (declares any role token the project lacks, after the project's own — project values win), and `editor/design-system/constants.ts` `DEFAULT_TOKENS` (the same values for those ids, no second copy). `engine/` may import `shared/` (CLAUDE.md import rules), so the three emission points need no editor import.
3. **Which colour roles bind** — brand role only in this plan: button background, badge background, link colour, blockquote rule, checkbox/radio `accent-color`, `BLOCK_COLORS.accent`, the SocialIcons discs. Neutrals (`#1a1a1a`, `#333333`, `#e5e7eb`, `#ffffff`, `accentSubtle`) stay literal; they have no Brand control today that a user expects to move them. The **token** they bind to is owner decision D1.
4. **Templates (R6).** `resolveTokens` emits `var(--buildrick-design-<id>)` for colour placeholders instead of the snapshot literal (other kinds unchanged). Each of the 9 built-in templates gets an authoring pass that replaces its CTA/accent literals with `{{token.color.primary}}` (and link/highlight colours with the D1 token). Backgrounds and neutrals stay template-owned — a dark template stays dark (owner decision D3). The purple accents in templates and blocks leave with that pass. `TokenUsageTracker` and `TokenBindingResolver` learn the `var()` form so template-inserted bindings are visible to them.
5. **Fonts** need no change: templates name no family, and the site's font slots already reach canvas, preview and publish via `siteFontCSS`.

## 3 · Existing sites — owner decision D2

Existing elements carry literal hex. Three options:

| Option | What happens | Risk |
|---|---|---|
| **A · Auto-bind on load** | A project migration rewrites every whole-value colour that equals a known brand hex into the var | Rewrites a user's deliberate choice silently; `ProjectPayload` (`engine/designSystem/migrations/projectMigrations/types.ts`) holds tokens only, so this migration also needs the element tree — a bigger migration surface than 0001-0003 |
| **B · Leave** | Only new inserts and new template applies bind | Old sites keep the R1 symptom forever |
| **C · Opt-in action** | Brand checks gains "Link N matching colours to Brand": lists the count, applies as ONE history step (undoable), never runs by itself | One more control in Brand checks (needs a board) |

**Recommendation: B by default + C.** Nothing changes on a published site until its owner asks. The match set for C: exact, whole-value, case-insensitive equality with the site's current D1 token value **or** one of the three product defaults this code has shipped (`#1A56DB`, `#406ED6`, `#2D6DFF`). Partial values (`linear-gradient(#1A56DB, …)`) are skipped, same rule as `TokenBindingResolver`.

## 4 · Tasks

Each task: one commit, its own tests, done-condition checked in the running editor (port 5050 or `/edit/:id`, 1440×900), and the commit body says what was NOT verified.

**T0 · Measure before building (no code)**
- Read a freshly created site's `projectSettings.designTokens` (dashboard → new blank site → editor → `composer.getProjectSettings()`): empty or seeded? Decides how much of Gap A is live.
- In Brand › Colours, change Primary and read which custom properties move on `document.documentElement` (`getComputedStyle`), and which the live preview's `:root` block carries. Feeds D1.
- Baseline: insert Button, Link, Badge, Blockquote, Checkbox; screenshot canvas + Brand preview in Light and Dark.

**T1 · Role tokens in one place, declared by every export**
- Add `shared/constants/siteRoleTokens.ts`; `DEFAULT_TOKENS` reads it for those ids; `siteTokensCSS(projectTokens)` appends role tokens the project lacks.
- Tests: `ExportHelpers` unit — empty `designTokens` still declares the role vars; a project value overrides the default; value sanitising unchanged. `ExportEngine.publishedPage.test.ts` — a published page with no saved tokens declares `--buildrick-design-<D1>`.
- Done: publish (simulation) a site with empty `designTokens`; the page's `<style>` declares the role var.

**T2 · Element defaults bind the brand role**
- `defaultStyles.ts`: every `THEME.primary` use → `var(--buildrick-design-<D1>)`. `THEME.primary` stays only if something still needs the literal (the Inspector fallback swatch reads through `ColorInput`, which resolves the var).
- Tests: `blockRegistry` insert test — Button's `background-color` is the var; `defaultStyles` test — no brand-role literal left; `ColorInput` test — an inserted button reads "bound to <token name>".
- Done: insert a Button → Brand › Primary to another colour → canvas button repaints; Colour mode Dark → preview button takes the dark value; Inspector shows the token name. Measured with `getComputedStyle`, not by eye.

**T3 · Block markup binds the brand role**
- `BLOCK_COLORS.accent` → the var; `SocialIcons.tsx` discs → the var; purple literals in block sources → the var or a neutral. Rewrite the stale `blockPalette.ts` header.
- Tests: extend `ExportEngine.chromeTokenLeak.test.ts`'s source walk with "no brand-role hex in `src/blocks`" and "no banned-hue hex in `src/blocks`".
- Done: insert Tabs / Switch / Social icons → change Primary → they repaint.

**T4 · Templates bind (R6)**
- `resolveTokens` emits `var()` for colour placeholders; authoring pass over the 9 `SITE_TEMPLATES`; `TokenUsageTracker` / `TokenBindingResolver` read the `var()` form.
- Tests: `resolveTemplateTokens` — colour placeholder → var, non-colour kinds unchanged, miss left verbatim; `TokenBindingResolver` / `TokenUsageTracker` — var form detected; a guard that every built-in template's CTA carries a placeholder (count per template).
- Done: apply each template on a site whose Primary is not blue → its CTAs and accents paint in that Primary; change Primary after apply → they follow. Nine templates walked, each named in the commit.

**T5 · Existing sites (only after D2)**
- If C: the Brand checks row + one-step apply + undo. If A: a project migration with `validate()` and the runner's backup.
- Tests: match set (exact / case / whole-value / partial skipped); one history step; undo restores every literal.
- Done: on a site with literal `#1A56DB` buttons, the row counts them, Link rebinds them, Undo restores them.

## 5 · Rollback

- T2–T4 write `var()` into newly created elements; those references outlive a code revert. They keep rendering as long as T1's declarations exist, so **T1 is reverted last and never alone**. Reverting T2–T4 only stops new bindings.
- T5 (C) is a single history step; a site saved afterwards is restored from a saved version (Saves) or re-linked by hand. T5 (A) restores from the migration runner's `ds-migration-backup-<siteId>` snapshot for the current browser only — one more reason D2 recommends against A.
- No server schema change anywhere in this plan.

## 6 · Owner decisions needed

| # | Decision | Recommendation |
|---|---|---|
| D1 | Which token the brand role binds to: `color-primary` (what Starters and the Colours list edit) or `color-action` (semantic, `aliasOf: color-brand-500`) | `color-primary`, confirmed by T0; if the preview's `color-action` must stay, make it alias `color-primary` so the two cannot disagree |
| D2 | Existing sites: auto-bind (A), leave (B), or opt-in action (C) | B + C |
| D3 | Templates: map only CTA/accent (and fonts) to Brand, or also backgrounds/surfaces/text | CTA/accent only; a template keeps its character |
| D4 | Neutrals (text, border, surface) in element defaults: stay literal in this arc? | Yes — revisit once Brand has controls users expect to move them |

## 7 · Not covered / not verified by this plan

- Published-site dark mode (Gap B).
- AI-generated sections, paste and import keep writing literals.
- Whether a fresh site's `designTokens` is empty (T0 measures it).
- No Figma board exists for the T5 Brand checks row; C needs one before build.
