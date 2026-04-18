# Theme Unification V3 — `aqb-*` → `buildrick-*` rename, two-namespace invariant, structural cleanup deferred

**Date:** 2026-04-19
**Branch:** `main`
**Status:** Proposed — awaiting user review, then Codex Gate 1 before P0 commits
**Supersedes:**
- `2026-04-18-theme-unification-design.md` (V1 — killed by Codex: dual-prefix cleanup premise ignored runtime mutation + multi-scope semantics)
- `2026-04-19-theme-unification-v2-design.md` (V2 — killed by Codex: 2-namespace split conflated 3+ categories, codemod internally contradictory, dual persistence missed, `aqb` treated as single rename target)

**Source inventory:** `scripts/theme-v3-audit.json` v2.0 (discussion-grade, Codex-reviewed twice, known gaps + SSOT-verification guardrails documented)

---

## 0. Why V3 exists

V1 and V2 each got killed by Codex for the same premise error: leaping to architecture before closing the inventory. V2 also independently failed because it treated `aqb` as a single rename target when in reality the prefix has accumulated 7+ unrelated uses (CSS vars + keyframes + classnames + data-attrs + storage keys + dev flags + orphan engine constant + sibling `--accent-*` prefix + user-export HTML + `aqb:trace:` colon-separator dev flags).

V3 proceeds on top of a committed, twice-reviewed inventory. It renames the prefix **everywhere it appears, consistently**, enforces a single invariant that matters (chrome never mutated at runtime), and **explicitly defers structural-debt work** (file consolidations, SSOT wire-ups, storage key consolidation) to separate specs per the inventory's own meta-reflection:

> "Treat structural-debt cleanup and rename-debt cleanup as two separate specs. Don't bundle."

The inventory lists four documented failure patterns (V1 architecture-first, V2 architecture-first, inventory v1 bucket-driven normalization, inventory v2 declared-vs-actual SSOT). V3's mandatory guardrails map to each:

- **Guardrail A (vs V1/V2 pattern):** inventory is authoritative. Architecture sits on top of it, not around it.
- **Guardrail B (vs inventory v1):** no bucket-driven normalization. Where evidence spans multiple categories, it's marked compound, not rounded.
- **Guardrail C (vs inventory v2):** every "X is centralized in Y" claim is verified with a consumer grep, committed to the mapping table's `verifications` block, re-run at phase gates.

---

## 1. Brainstorm decisions (Q1–Q15)

Each row is load-bearing for the design below. All answered during brainstorm on 2026-04-19.

| # | Question | Decision |
|---|---|---|
| Q1 | Final prefix | `--buildrick-*` (two R, intentional — mismatches repo/product "buildrik" spelling by design) |
| Q2 | `--accent-*` sibling prefix fate | Fold into `--buildrick-accent-*`. Flat single-namespace, consumers renamed to `--buildrick-accent`. Layered raw/semantic pattern deliberately dropped. |
| Q3 | Customer exported HTML impact | No production customer exports yet. `data-aqb-*` and `.aqb-*` in exported HTML are free to rename. |
| Q4 | Design tab status | Experimental / half-built. Some paths matter, some don't. Lossy runtime retargeting acceptable. |
| Q5 | `ux-fixes.css` merge | **Out of scope.** Structural debt — separate spec. |
| Q6 | Two `Canvas.css` files | Consolidation **out of scope** (structural). DARK_THEME_SHIM dark values in `components/Canvas/Canvas.css` **in scope** as a value-correctness fix (DESIGN.md violation). File kept, values corrected. |
| Q7 | `design-tokens.css` fate | **Out of scope.** Structural debt — separate spec. |
| Q8 | Namespace topology | Two namespaces. `--buildrick-*` = chrome + canvas operational (static). `--buildrick-design-*` = runtime-mutated user design tokens only. Enforces the one invariant that matters. |
| Q9 | `data-aqb-*` rename | All **19 attributes** renamed to `data-buildrick-*`. `DATA_ATTRIBUTES` constant in `config.ts` is incomplete (lists 11) — live code uses 8 more: `data-aqb-canvas`, `data-aqb-cms-bound`, `data-aqb-context-menu`, `data-aqb-ids`, `data-aqb-interactions`, `data-aqb-name`, `data-aqb-root`, `data-aqb-section`. Codemod operation 4 greps pattern-based (`data-aqb-[a-z-]+`) so correctness doesn't depend on constant completeness — but mapping table must list all 19, not the 12 V2 claimed. |
| Q10 | `.aqb-*` class rename | All 550+ selectors + 320+ JSX usages renamed to `.buildrick-*`. Includes engine-contract classes + user-export classes. Dead scope wrappers (`.aqb-editor`, `.aqb-layout`) deleted in the same pass. |
| Q11 | `CSS_CLASSES` orphan constant | **Delete.** Zero consumers today — orphan is a false-SSOT trap. Rename runs inline. Real SSOT wire-up is a separate structural spec if ever wanted. |
| Q12 | Storage key treatment | Rename prefix only, all ~68 keys (48 centralized + 20 ad-hoc + 4 known-gap hardcoded). Migration shim extends `storageMigration.ts`. Structural consolidation (duplicates, hardcoded-consumer gaps) **out of scope** — separate spec. |
| Q13 | `aqb:trace:*` dev flags | Clean rename to `buildrick:trace:*`. No backward-compat shim. Solo workflow = zero coordination cost. |
| Q14 | 29 undefined tokens | Case-by-case mapping-table decisions in P0. Six sub-populations (comment-only, runtime-written, truly-broken-live, fallback-masked, mixed). One decision per token, each justified inline. |
| Q15 | `PagesTab.css` dark overrides | **Delete.** DESIGN.md violation (shadows canonical light tokens with dark values inside `.pages-panel`). Classification test: *would the deletion still be necessary in a "rename only, preserve structure" universe?* Yes — post-rename the overrides shadow `--buildrick-*` back to dark, same DESIGN.md violation with the new name. Shadow-removal is value-correctness, not file restructure. Scope defensible. |

Structural-debt items (Q5, Q7, storage consolidation, SSOT wire-up, `themes/` file restructure) are all explicitly deferred. V3 scope is rename + value-correctness fixes that the codemod touches anyway.

---

## 2. Namespace contract

Two namespaces, one invariant.

| Namespace | Contents | Source of truth | Lifetime | Runtime-mutable? |
|---|---|---|---|---|
| `--buildrick-*` | Chrome tokens (sidebar, topbar, panels, dialogs, buttons, inspector, tabs) AND canvas operational tokens (selection glow, box-model colors, font scale, canvas spacing) | `themes/default.css` + `components/Canvas/Canvas.css` + `editor/canvas/Canvas.css` (file structure unchanged in this spec) | Static — set when CSS loads | **No.** Never written by JS. CI grep-enforced. |
| `--buildrick-design-*` | User-editable design tokens from the Design tab (colors, typography, spacing the end-user edits in their website) | `features/design-system/constants.ts` `DEFAULT_TOKENS` + persisted project state | Dynamic — hydrated from project state at load, mutated on user edits | **Yes**, and ONLY by `useTokenBase` / `useColorTokens` / `useSpacingTokens` / `useTypeTokens`. CI grep-enforced. |

### CI-enforceable invariants

1. `grep -rnE "setProperty\s*\(\s*['\"]--buildrick-(?!design-)" packages/editor/src/` → empty. (No JS writes a chrome token.)
2. `grep -rnE "^\s*--buildrick-design-" packages/editor/src/ --exclude-dir=features` → empty. (Design-namespace defs stay in `features/design-system/`.)
3. `grep -rnE "^\s*--buildrick-(?!design-)" packages/editor/src/ --exclude-dir=themes --exclude "**/Canvas.css"` → empty. (Chrome-namespace defs stay in themes/ + Canvas.css.)
4. `grep -rE "var\(--aqb-|var\(--ls-|var\(--accent-|@keyframes aqb-|animation(-name)?:\s*aqb-|data-aqb-|[.'\"]aqb-|aqb:trace:" packages/editor/src/ packages/editor/demo/` → empty across all matches. (Zero-surviving-`aqb` acceptance gate.)

### Invariant #1 enforcement timeline

Invariant #1 ("No JS writes a chrome token") is NOT enforced by the codemod alone. Today `themes/index.ts:applyTheme()` writes 11 chrome `--aqb-*` tokens at runtime via `setProperty` (verified at lines 31-41). Callers: `demo/main.tsx:21` + public re-export at `src/index.ts:75`. The invariant holds only after `applyTheme` and its entire module are deleted. **This deletion must happen BEFORE consumer rename** — see Section 5 phase P2b. Otherwise, codemod in P3 would rename `setProperty("--aqb-primary", ...)` → `setProperty("--buildrick-primary", ...)` via the new JS-string-literal operation (Section 4.1 op 1b), and the app would be actively violating invariant #1 between P3 and P5. P2b eliminates the violating code before the rename can propagate it.

Rationale for Q8=B (two namespaces rather than three or one): given Q4=C, the design-system namespace's purpose is to enforce "setProperty never touches chrome." Canvas operational tokens are static CSS vars for rendered user content — they don't move at runtime. A third namespace for operational tokens would split a distinction that isn't load-bearing.

---

## 3. Mapping table framework

### Location + lifecycle

`scripts/theme-v3-mapping.json` — committed in P0, reviewed at Codex Gate 1, retained as historical record after migration.

### Six-domain structure

```jsonc
{
  "css_vars": {
    "chrome_and_canvas_operational": { /* --aqb-* / --ls-* / --accent-* → --buildrick-* */ },
    "design_runtime": { /* --aqb-color-* etc. → --buildrick-design-* */ },
    "delete": [ /* comment-only placeholders */ ],
    "undefined_decisions": { /* Q14: each of 29 tokens resolved */ }
  },
  "keyframes":       { /* ~70 definitions + 2 orphan deletions */ },
  "data_attributes": { /* 12 attrs */ },
  "classnames":      { /* 550+ selectors + dead-rule deletions */ },
  "storage_keys":    { /* 48 centralized + 20 inline + 4 gaps + scaffolding deletions */ },
  "dev_flags":       { "aqb:trace:": "buildrick:trace:" },
  "deletions":       { /* CSS_CLASSES, scope rules, PagesTab overrides, DARK_THEME_SHIM, themeMode scaffolding */ },
  "manual_edits":    [ /* file:line whitelist for template-literal sites */ ],
  "verifications":   [ /* command + captured-output pairs for every SSOT claim */ ]
}
```

### Q14 case-by-case resolutions for the 29 undefined tokens

Each token gets exactly one action in `css_vars.undefined_decisions`:

- `rename-to-existing` — point consumer at an existing canonical that has the semantic intent. Example: `--aqb-primary-dark` → `--buildrick-accent-pressed`.
- `define-new` — add the token with an explicit value in the right file. Example: `--aqb-surface` → define `--buildrick-surface` at `themes/default.css` with value `#F8FAFC`.
- `delete-consumer` — the consumer reference is dead code (e.g., unused calc expression). Delete it.

Sub-populations guide which action is typical (not prescribed):

| Sub-population | Count | Typical action |
|---|---|---|
| Comment-only placeholder | 2 | `delete-consumer` (delete the comment or the placeholder string) |
| Runtime-written by design hooks | 3 | Map into `--buildrick-design-*` namespace |
| Truly undefined + live + no fallback | 6 | `define-new` where the component needs a distinct value; `rename-to-existing` where semantically equivalent to a canonical token |
| Masked by `var(..., fallback)` | 7 | Usually `rename-to-existing` (the fallback reveals the intended canonical) |
| Runtime-writer mixed cases | 11 | `rename-to-existing` to `--buildrick-design-*` |

Every row is justified inline in the mapping with a one-line `reason` field.

### SSOT verifications embedded in the mapping

Per inventory Guardrail C, every "X is centralized in Y" claim is verified with a grep at P0. The `verifications` block captures command + output at generation time. Gates 2 and 3 re-run the same commands; divergence = stale mapping = phase halt.

Required verifications at minimum:

| Claim | Command | Expected (at P0) |
|---|---|---|
| Storage keys: every `'aqb-*'` string literal outside `storageKeys.ts` is either a known duplicate or an ad-hoc inline | `grep -rE "'aqb-[a-z-]+'" packages/editor/src/ \| grep -v storageKeys.ts` | List captured verbatim; every hit must be in mapping `storage_keys` section |
| **All `data-aqb-*` attrs enumerated in mapping** (NOT "DATA_ATTRIBUTES in config.ts is complete" — it isn't; 8 attrs live outside the constant) | `grep -rnoE "data-aqb-[a-z-]+" packages/editor/src/ packages/editor/demo/ \| sed 's/.*:data-aqb-/data-aqb-/' \| sort -u` | 19 unique attrs as of 2026-04-19; mapping `data_attributes` section must cover every one |
| 29 undefined tokens count | `comm -23 <(all-consumers.txt) <(all-definitions.txt) \| wc -l` | 29 |
| No `--accent-*` tokens exist outside `themes/default.css` | `grep -rE "^\s*--accent-" packages/editor/src/` | Only `themes/default.css:69-74,413` hits |
| `CSS_CLASSES` has zero real consumers (safe to delete) | `grep -rE "import.*CSS_CLASSES\|CSS_CLASSES\." packages/editor/src/` | Empty. Re-export at `shared/constants/index.ts:36` doesn't count as a consumer (no downstream import) |
| All `setProperty("--aqb-*"...)` JS callsites enumerated (covered by Section 4.1 op 1b) | `grep -rnE "setProperty\s*\(\s*['\"]--(?:aqb\|ls\|accent)-" packages/editor/src/` | As of 2026-04-19: only `themes/index.ts:31-41` (11 calls). File deleted in P2b before codemod runs, so these never reach op 1b. |
| All template-literal `aqb-…${` patterns enumerated in `manual_edits` | `grep -rnE "\`[^\`]*aqb-[^\`]*\\\$\{" packages/editor/src/ packages/editor/demo/` | Every hit matches an entry in `manual_edits` whitelist |

### Dynamic token refs — explicit manual-edits whitelist

Template-literal patterns are the V2 blocker Codex flagged. The codemod errors on every such pattern unless it's in the `manual_edits` whitelist. This list is the P0 grep output as of 2026-04-19, NOT a priori knowledge — regenerate via grep at P0 and diff against this list; any difference means new code was added that the spec didn't anticipate, and mapping must be updated before codemod runs.

**Pattern used for enumeration:** `` grep -rnE "\`[^\`]*aqb-[^\`]*\\\$\{" packages/editor/src/ packages/editor/demo/ `` — matches any backtick-delimited string literal containing `aqb-` followed by `${`, anywhere in the string (not just adjacent). V2's narrower pattern (`aqb-${`) missed 2 sites.

| # | File:line | Current | Target (after rename) |
|---|---|---|---|
| 1 | `features/design-system/types.ts:73` (`tokenToCssVar`) | `` `--aqb-${id}` `` | `` `--buildrick-design-${id}` `` |
| 2 | `features/design-system/state/__tests__/useSpacingTokens.test.ts:22` | `` `--aqb-${id}` `` | `` `--buildrick-design-${id}` `` |
| 3 | `features/design-system/utils/exportUtils.ts:15` (color generator) | `` `--aqb-color-${name}` `` | `` `--buildrick-design-color-${name}` `` |
| 4 | `shared/types/animations.ts:116` | `` `aqb-${config.type}` `` | `` `buildrick-${config.type}` `` |
| 5 | `engine/elements/ElementOperations.ts:223` | `` `aqb-${config.type}` `` | `` `buildrick-${config.type}` `` |
| 6 | `editor/inspector/sections/registry.tsx:562` | `` `aqb-${anim.type} ${anim.duration}ms ${anim.easing} ${anim.delay}ms 1 normal forwards` `` | `` `buildrick-${anim.type} ${anim.duration}ms ${anim.easing} ${anim.delay}ms 1 normal forwards` `` |
| 7 | `editor/sidebar/shared/usePanelNavigation.ts:78,96` | `` `aqb-nav-${storageKey}` `` | `` `buildrick-nav-${storageKey}` `` |
| 8 | `editor/panels/layers/hooks/layersPersistence.ts` (dynamic key family, ~4 callsites) | `` `aqb-layers-${pageId}-hidden` ``, `` `-locked` ``, `` `-names` ``, `` `-expanded` `` | `` `buildrick-layers-${pageId}-...` `` each |
| 9 | `shared/utils/devLogger.ts:85,172,179,195` (4 callsites, same pattern) | `` `aqb:trace:${domain}` `` | `` `buildrick:trace:${domain}` `` |
| 10 | `features/design-system/constants.ts` `DEFAULT_TOKENS` (~40 rows) | `cssVar: "--aqb-X"` (non-template string literals, batched as manual for review) | `cssVar: "--buildrick-design-X"` |

**NOT in manual_edits (plain string literals — handled by codemod operation 6 for storage keys):**
- `shared/ui/QuickSwitcher.styles.ts:17` — `"aqb-quick-switcher-recent"` (plain string, storage key)
- `shared/utils/savedTemplates.ts:23` — `"aqb-saved-templates"` (plain string, storage key)
- `editor/panels/layers/hooks/useLayersState.ts:31` — `"aqb-layers-display-prefs"` (plain string, storage key)

These were in V3 draft's manual-edits list but don't need manual handling — they have no `${` interpolation. They're covered by the codemod's op 6 string-literal rename. Misclassifying them as "manual" was a spec error Codex caught.

Any template-literal hit that the codemod encounters not in this whitelist causes P3 to abort with a listing of every occurrence.

---

## 4. Codemod, migration shim, runtime retargeting

### 4.1 Codemod

**Location:** `scripts/theme-v3-codemod.mjs` (Node). Committed through P7, deleted in P8. Not long-term tooling.

**Inputs:** `scripts/theme-v3-mapping.json` + target glob `packages/editor/src/**/*.{css,ts,tsx,html}` and `packages/editor/demo/**/*.{ts,tsx,html}`.

**Modes:**

| Flag | Behavior |
|---|---|
| (default) | Dry-run. Reports every change per file with line numbers. Writes nothing. Output at `scripts/theme-v3-codemod-report.txt`, committed for Gate 1 review. |
| `--verify` | Validates mapping (every `from` unique, every `to` starts with correct prefix). Executes every command in `verifications` block, compares to captured output. Errors on mismatch. |
| `--apply` | Applies all operations. Requires prior `--verify` pass in the same session. Atomic per file. |

**Operations (applied in exact order, per file):**

1. **CSS-side CSS vars:** `var(--aqb-X)` / `var(--ls-X)` / `var(--accent-X)` → `var(--buildrick-Y)` per `css_vars` mapping. Fallbacks preserved.
1b. **JS/TS-side CSS vars:** in `.ts`, `.tsx`, `.test.ts`, `.test.tsx` files — `"--aqb-X"` / `'--aqb-X'` / `` `--aqb-X` `` non-template string literals → `"--buildrick-Y"` per `css_vars` mapping. Covers `setProperty`/`getPropertyValue`/`getProperty` args AND object-literal `cssVar` fields (e.g., `DEFAULT_TOKENS` in `constants.ts`). Template literals remain manual (Section 3 whitelist).
2. **Keyframe rename OR delete per mapping:**
   - If `keyframes[X]` is a string target: `animation: aqb-X …` / `animation-name: aqb-X` → `animation[-name]: buildrick-X`. `@keyframes aqb-X` → `@keyframes buildrick-X`.
   - If `keyframes[X] = { action: "delete" }`: the codemod deletes the matching CSS property line entirely (`animation-name: aqb-X;` line removed; `animation: aqb-X <duration> <easing> ...;` line removed since `aqb-X` is the only animation name and has no valid replacement). Multi-animation shorthand (`animation: aqb-X 200ms ease, other-anim 100ms;`) is an abort condition — manual review required; no ambiguous partial-edit attempts.
3. (merged into op 2 above — `@keyframes` renames share the op-2 mapping logic)
4. **Data attributes:** `data-aqb-X` (CSS selectors, JSX props, HTML attrs, string literals inside `getAttribute`/`setAttribute`/`querySelector`) → `data-buildrick-X`. Pattern-based grep across all file types — does NOT depend on `DATA_ATTRIBUTES` constant completeness.
5. **Class names:** `.aqb-X` (CSS selectors) + `"aqb-X"` / `'aqb-X'` (JSX className strings, non-template string literals in `classList.*`/`querySelector(".aqb-X")`/etc.) → `.buildrick-X` / `"buildrick-X"`.
6. **Storage-key string literals** at locations listed in `storage_keys` (48 centralized in `storageKeys.ts` + 20 ad-hoc inline) → `"buildrick-X"`. Includes the 3 plain-string sites Codex pointed out (QuickSwitcher.styles.ts:17, savedTemplates.ts:23, useLayersState.ts:31).
7. **Dev flag colon-prefix:** `aqb:trace:` literals → `buildrick:trace:`.
8. **Delete dead scope-rule blocks only:** `.aqb-editor { ... }`, `.aqb-layout { ... }`, and any `.aqb-editor *` / `.aqb-editor *::selection` derivative blocks in `themes/default.css`. Pattern-unambiguous block deletion.

Codemod does NOT handle value-replacement work (DARK_THEME_SHIM dark → light canonical requires value decisions), does NOT delete old CSS var definitions, does NOT delete scaffolding files. Those are P4/P5 manual work — value decisions don't belong in a string-replacement tool, and multi-file coordinated deletes (`themes/index.ts` + `src/index.ts:75` re-export + `themeMode` field) are **handled in phase P2b BEFORE the codemod runs** (Section 5), so the codemod never encounters them.

**Abort conditions (fail loud, exit non-zero):**

- Any template literal hit matching `` `[^`]*aqb-[^`]*${ `` (flexible pattern — `aqb-` followed anywhere by `${`, not required to be adjacent) at a file:line NOT in `manual_edits` whitelist.
- Multi-animation shorthand containing an `action: delete` keyframe alongside live animations (e.g., `animation: aqb-slide-down 200ms, other-live 100ms;`) — ambiguous partial edit, abort with file:line + review instruction.
- Any `--aqb-`, `--ls-`, `--accent-`, `aqb-` string literal, `data-aqb-`, `.aqb-`, `@keyframes aqb-`, `animation.*aqb-`, `setProperty("--aqb-...")`, or `aqb:trace:` hit not covered by mapping.
- `--apply` invoked without `--verify` pass in the same session.

**Idempotency:** running twice is a no-op on the second run.

### 4.2 Storage migration shim (Q12)

Extends `packages/editor/src/shared/utils/storageMigration.ts`. **Mirrors the existing `migrateStorageKeys()` safety model exactly** — each key is a try/catch, `!localStorage.getItem(newKey)` guard prevents overwriting pre-existing target keys, completion flag uses `STORAGE_KEYS` constant (not hardcoded), precedent's own migration markers are excluded from the dynamic scan.

```ts
// Added to storageMigration.ts alongside the existing migrateStorageKeys().
// Called AFTER migrateStorageKeys so keys that migrated aquibra-* → aqb-* can
// then migrate aqb-* → buildrick-*.
export function migrateAqbKeys(): void {
  if (localStorage.getItem(STORAGE_KEYS.AQB_MIGRATION_FLAG_V1)) return;

  let migratedCount = 0;

  // Static map: exact-key renames (built from mapping table's storage_keys section)
  Object.entries(AQB_TO_BUILDRICK_STORAGE_MAP).forEach(([oldKey, newKey]) => {
    if (oldKey.includes('${')) return; // dynamic families handled below
    try {
      const value = localStorage.getItem(oldKey);
      if (value !== null && !localStorage.getItem(newKey)) {
        localStorage.setItem(newKey, value);
        localStorage.removeItem(oldKey);
        migratedCount++;
      }
    } catch {
      // localStorage may be full or disabled — fail silently per precedent
    }
  });

  // Dynamic-key families: aqb-nav-*, aqb-layers-${pageId}-*, aqb-design-tokens-${projectId}-v1.
  // Scan all localStorage keys once and rename remaining aqb-* survivors.
  const EXCLUDED_PREFIXES = [
    'aqb-migration-v1-complete',      // the aquibra→aqb migration marker — not ours to touch
    'aqb-migration-v1-timestamp',
  ];

  // Snapshot keys first — mutating localStorage during iteration is undefined behavior.
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k) keys.push(k);
  }

  for (const key of keys) {
    if (!key.startsWith('aqb-')) continue;
    if (EXCLUDED_PREFIXES.includes(key)) continue;
    const newKey = 'buildrick-' + key.slice('aqb-'.length);
    try {
      const value = localStorage.getItem(key);
      if (value !== null && !localStorage.getItem(newKey)) {
        localStorage.setItem(newKey, value);
        localStorage.removeItem(key);
        migratedCount++;
      }
    } catch {
      // same silent-fail contract
    }
  }

  try {
    localStorage.setItem(STORAGE_KEYS.AQB_MIGRATION_FLAG_V1, Date.now().toString());
  } catch { /* storage full */ }

  if (migratedCount > 0) {
    devLog('Storage', `Migrated ${migratedCount} localStorage keys from aqb-* to buildrick-*`);
  }
}
```

**Requirements:**
- `AQB_TO_BUILDRICK_STORAGE_MAP` is generated from `theme-v3-mapping.json#storage_keys` at build time (not hand-inlined).
- `STORAGE_KEYS.AQB_MIGRATION_FLAG_V1` is a new constant in `storageKeys.ts` with value `"buildrick-aqb-migration-v1-complete"` (note: the flag itself uses the NEW prefix so it's never caught by the dynamic loop).
- Invoked at `AquibraStudio.tsx:19` AFTER the existing `migrateStorageKeys()` call (sequencing matters: old `aquibra-*` keys need to become `aqb-*` first, then `aqb-*` → `buildrick-*`).
- Lifetime: permanent. Matches the precedent — the `aquibra-*` migration is still shipped years later; same convention here.

**Safety invariants validated by this snippet:**
1. Idempotent — early return on completion flag.
2. Never overwrites a pre-existing `buildrick-*` key (mirrors `migrateStorageKeys:70` guard).
3. Per-key try/catch — single failure doesn't abort the whole migration.
4. Precedent's migration markers explicitly excluded.
5. Completion flag uses the new prefix, so a re-run of the dynamic loop in a future migration won't mistakenly mirror it.

### 4.3 Design-tab runtime retargeting (Q4=C, lossy acceptable)

Four files. With Section 4.1 op 1b (JS string literal rename), `constants.ts` DEFAULT_TOKENS becomes automatic rather than manual. Only the 3 template-literal sites in the table below stay in `manual_edits`.

| File | Change | Handled by |
|---|---|---|
| `features/design-system/constants.ts` `DEFAULT_TOKENS` (~40 rows) | Every `cssVar: "--aqb-X"` → `cssVar: "--buildrick-design-X"` | **Codemod op 1b** (automatic) |
| `features/design-system/types.ts:73` `tokenToCssVar` | Emits `` `--buildrick-design-${id}` `` | **Manual** (template literal — whitelist #1) |
| `features/design-system/utils/exportUtils.ts:15` color generator | Emits `` `--buildrick-design-color-${name}` `` | **Manual** (template literal — whitelist #3) |
| `features/design-system/state/__tests__/useSpacingTokens.test.ts:22` fixture | `` `--aqb-${id}` `` → `` `--buildrick-design-${id}` `` | **Manual** (template literal — whitelist #2) |

**Direct design-token writers (hooks that call `setProperty`):**
- `features/design-system/state/useTokenBase.ts:62` — the shared primitive that writes to `:root`. All other design-token state hooks route through this.
- `features/design-system/state/useColorTokens.ts:50` — also writes directly (does NOT delegate to `useTokenBase` for this particular `setProperty` call).
- `features/design-system/state/useSpacingTokens.ts:90` — also writes directly.
- `features/design-system/state/useTypeTokens.ts` — **delegates to `useTokenBase`**, NOT a direct writer. V3 draft misclassified this. (Fix surfaced by Codex Gate 1.)

Hook internals untouched by the codemod — they write whatever `cssVar` each `DesignToken` carries. The cssVar strings change (via op 1b + manual edits above); the hook code does not.

**Persisted project data:** `TokenRegistryContext.tsx` load path adds a pre-hook mapping step:

```ts
const migrated = initialTokens.map((t) =>
  t.cssVar.startsWith('--aqb-')
    ? { ...t, cssVar: t.cssVar.replace(/^--aqb-/, '--buildrick-design-') }
    : t,
);
```

Lossy per Q4=C: tokens not in `DEFAULT_TOKENS` become orphan JSON, dropped on next save. Experimental user customizations may reset to defaults on first post-V3 load. Noted in CHANGELOG.

### 4.4 Documentation sweep

33 markdown files (per inventory v2: 20 in `docs/design-documentation/` + 13 in `project-documentation/` + `code-to-prd-output/pages/`) and 1 JSON fixture (`code-to-prd-output/buildrik-analysis.json`) reference `aqb`. Codemod runs with `--docs` flag on these paths in phase P7. Same replacements, no AST validation (markdown is free-form).

**Not part of the --docs sweep (covered elsewhere):**
- `packages/editor/demo/index.html` lines 19-29 (pre-React body defaults + comments referencing `--aqb-*` token names). This file is inside the P3 codemod's target glob (`packages/editor/demo/**/*.html`), so its HTML comments + class/data-attr strings get the same string-replacement treatment as source files. Explicit mention here so the P7 docs sweep isn't mistaken as the only documentation-level pass.

---

## 5. Phase sequencing

10 phases (9 + new P2b inserted after Codex Gate 1 review). Every phase leaves a working app. Every phase independently revertable. Solo workflow, direct-to-main commits (per memory).

| Phase | Goal | Prereq |
|---|---|---|
| **P0** | Produce `theme-v3-mapping.json` (all 6 domains + `manual_edits` whitelist + `verifications` block). Commit dry-run codemod report. | — |
| **P1 (gate)** | Codex Gate 1 review of P0 artifacts. Challenges dedup merges, undefined-token decisions, SSOT verifications, manual-edits completeness. | P0 |
| **P2** | Author **only the mapped canonical targets** in `themes/default.css` + design-system constants alongside existing old definitions. **No lexical prefix mirroring:** if `--aqb-primary` maps to `--buildrick-accent`, P2 creates `--buildrick-accent` and does NOT also create `--buildrick-primary`. Only what the mapping says, nothing else. Double-definitions of mapped targets = value-neutral. App runs identically. | P1 |
| **P2b (scaffolding deletion)** | Delete the `applyTheme()` runtime mutator + `themeMode` scaffolding BEFORE consumer rename so invariant #1 ("chrome never mutated at runtime") holds from here onward. Deletes: `themes/index.ts` entirely, `src/index.ts:75` `applyTheme`/`defaultTheme` re-export, `demo/main.tsx:11` import + `demo/main.tsx:21` call, `shared/types/project.ts` `themeMode` field, `storageKeys.THEME` entry. **Visible impact:** chrome renders with `themes/default.css` canonical light values instead of `applyTheme`'s dark runtime overrides — this IS the DESIGN.md 2026-04-18 light-chrome correction, not a regression. Capture before/after screenshots at `localhost:5050`. | P2 |
| **P3** | Codemod `--verify` then `--apply`. All consumer-side renames in one run via the 8 operations in Section 4.1: CSS vars (op 1), JS string-literal CSS vars including DEFAULT_TOKENS cssVars (op 1b), keyframes rename or delete per mapping (op 2), data-attrs (op 4), class names (op 5), storage key strings (op 6), dev flags (op 7), dead scope-rule blocks `.aqb-editor`/`.aqb-layout` (op 8). Template-literal sites handled via `manual_edits` whitelist (Section 3, 10 sites). | P2b |
| **P4 (gate)** | Codex Gate 2 on cumulative P2+P2b+P3 diff. Delete old `--aqb-*` / `--ls-*` / `--accent-*` definitions from `themes/default.css`. Delete `PagesTab.css` dark-override block (`.pages-panel` scope, DESIGN.md-violating shadows of renamed tokens). Fix DARK_THEME_SHIM in `components/Canvas/Canvas.css` to light canonical (file kept, dark hex values replaced with DESIGN.md canonical). | P3 + Codex Gate 2 |
| **P5** | Delete `CSS_CLASSES` constant from `shared/constants/config.ts` (and any `shared/constants/index.ts:36` re-export line). (`themes/index.ts` + `themeMode` + `storageKeys.THEME` already deleted in P2b. Orphan keyframe refs already deleted by codemod op 2 `action:delete` in P3.) | P4 |
| **P6** | Extend `storageMigration.ts` with `migrateAqbKeys()` (Section 4.2). Wire into `AquibraStudio.tsx:19` AFTER the existing `migrateStorageKeys()` call. Add `AQB_MIGRATION_FLAG_V1` entry to `storageKeys.ts`. | P3 |
| **P7** | Run codemod `--docs` against 33 markdown + 1 JSON. Update `DESIGN.md` with namespace contract section. Fix `CLAUDE.md` residual "dark-only" line (V1 leftover). `CHANGELOG.md` entry (include note: experimental Design-tab user customizations may reset to DEFAULT_TOKENS on first post-V3 load, per Q4=C). | P4, P5, P6 |
| **P8 (gate)** | Codex Gate 3 on cumulative P2–P7 diff. Delete `scripts/theme-v3-codemod.mjs` (keep audit + mapping + report JSONs as historical record). Full verification grep suite passes (Section 7.1). | P7 + Codex Gate 3 |

### Dependency graph

```
P0 → P1 → P2 → P2b → P3 → P4 → P5 → P7 → P8
                      │         ↑
                      └─▶ P6 ───┘
```

P6 parallelizes with P4/P5 (different files, no conflict).

**Why P2b is a separate phase, not bundled into P2 or P3:**
- Bundling into P2 mixes "add definitions" (non-destructive) with "delete runtime mutator" (changes visible rendering). P2b's visible rendering change benefits from isolation so any regression is unambiguously attributable.
- Bundling into P3 would mean the codemod's op 1b renames `setProperty("--aqb-primary", ...)` → `setProperty("--buildrick-primary", ...)` INSIDE `themes/index.ts` — which would be a live violation of invariant #1 until P5 deletes the file. Deleting the file in P2b BEFORE the codemod encounters it eliminates the violating code before the rename can propagate it.

### Per-phase hard gates (before every commit)

1. `cd packages/editor && npx tsc --noEmit` → clean.
2. `cd packages/editor && npx vitest run` → pass.
3. Vite HMR at `localhost:5050` → visual sweep of affected area (~2–5 min per phase).
4. Phase-specific grep subset of the acceptance grep suite (Section 7.1).

**P3 extra:** dry-run codemod diff reviewed before `--apply`. Every `manual_edits` entry confirmed present in the diff.

**P4 extra:** full acceptance grep suite run before deleting old definitions. Non-empty output on any "zero-aqb-ghost" grep = halt, investigate missed consumer, fix-forward in a P3 extension commit, re-run P4.

**P8 extra:** full acceptance grep suite, file-size sanity (`wc -l themes/default.css < 4000`), browser invariant check (`document.documentElement.style` after Design-tab edit shows only `--buildrick-design-*` writes).

### Codex gates

Three hard checkpoints:

| Gate | Timing | Scope |
|---|---|---|
| Gate 1 (P1) | Before any code change | Mapping table + `verifications` + dry-run report + `manual_edits` whitelist. Challenges every dedup decision, every undefined-token resolution, every SSOT claim. |
| Gate 2 (P4) | Before destructive old-definition deletion | Cumulative P2+P3 diff + full grep suite output. Challenges: anything still referencing old prefix, any JS `setProperty` writing to non-`--buildrick-design-*`. |
| Gate 3 (P8) | Before final artifact cleanup | Cumulative P3–P7 diff, full acceptance criteria passing, DESIGN.md namespace section. Exit gate for the whole spec. |

Per inventory recommended defenses ("Run Codex on the architecture BEFORE writing it"), V3 bakes Codex into mandatory checkpoints rather than relying on after-the-fact review.

### Rollback

- **Single phase:** `git revert <sha>`. ~10 min.
- **P2 → P3 window:** if codemod fails mid-apply, `git reset --hard HEAD` (no commit yet). P2's double-definitions mean pre-codemod state is intact.
- **P3 → P4 window:** most fragile. If P4 grep reveals missed consumer, don't revert — forward-fix with targeted `fix(theme-v3): …` commit, re-run P4 grep.
- **Full abort:** `git revert <P8-sha>..<P0-sha>` one-shot return to pre-migration.
- **Fix-forward preferred** post-commit (solo workflow, direct-to-main per memory, no PR amend complications).

---

## 6. Risk register

| # | Risk | Likelihood | Impact | Detection | Mitigation |
|---|---|---|---|---|---|
| R1 | Mapping dedups two tokens that serve different visual roles | Medium | High | Codex Gate 1. Value comparison in mapping `reason` field. | If values differ beyond perceptual threshold, split into two canonical names. Don't force-merge. |
| R2 | Codemod misses a template-literal pattern, leaves `--aqb-${id}` in source | Low | High | Codemod AST detection + fail-loud on any `${` inside aqb-prefixed strings. 9 manual edits explicitly whitelisted. | Whitelist is positive allowlist — codemod errors on any template literal NOT whitelisted. |
| R3 | User's local state wiped on first post-rename boot | High if unmitigated | Medium | First-boot user sees empty recents, favorites, etc. | Migration shim (P6) runs before any component reads storage. |
| R4 | `--buildrick-design-*` invariant violated — JS writes chrome tokens | Medium | High | Grep gate at P4 + P8: `setProperty("--buildrick-(?!design-)` must be empty. | Non-empty → either rename JS source to emit `--buildrick-design-X`, or remove the JS write if chrome-intended. |
| R5 | `--accent-*` fold misses semantic difference between `--accent-hover` and `--buildrick-accent-hover` | Low | Medium | Codex Gate 1 challenges `--accent-*` rows specifically. | 7 tokens, trivial to line-review at `themes/default.css:69-74 + 413`. |
| R6 | DARK_THEME_SHIM fix breaks demo | Medium | Medium | P4 browser sweep at demo `localhost:5050`. | Fix replaces dark hex with light canonical per DESIGN.md. Demo sweep part of P4 gate. |
| R7 | Design-tab retargeting loses experimental user customization | Acceptable (Q4=C) | Low | Saved project loads with some tokens re-initialized | Per Q4=C: lossy OK. CHANGELOG notes this. |
| R8 | Codemod + manual edits leave broken intermediate state between P3 and P4 | Low | High | Atomic per-file writes in P3. P4 grep gate mandatory before destructive delete. | If P3 errors mid-run, `git reset --hard` — no commit happened. P2's double-definitions mean old consumers still have a fallback. |
| R9 | Parallel commit adds fresh `aqb-*` during migration window | Very low (solo workflow) | Low | P8 final grep catches. | `git status` check at every phase boundary. |
| R10 | `.aqb-*` class rename breaks CSS specificity in unexpected places | Low | Medium | P3 browser sweep full 7-tab walkthrough. | In-place prefix swap doesn't change specificity on its own; regression would indicate cascade order shift, which codemod doesn't do. |
| R11 | Publicly-exported Canvas component consumer queries break | Low (per Q3=B) | Medium | P8 demo sweep. | `querySelector('.aqb-canvas')` literals are caught by codemod as string replacements. |

---

## 7. Success criteria

### 7.1 Programmatic (all must pass after P8)

```bash
# Zero aqb-anywhere ghosts (CSS side)
grep -rE "var\(--aqb-|var\(--ls-|var\(--accent-|@keyframes aqb-|animation(-name)?:\s*aqb-" packages/editor/src/ packages/editor/demo/              # → empty
grep -rE "^\s*--aqb-|^\s*--ls-|^\s*--accent-" packages/editor/src/ packages/editor/demo/                                                           # → empty
grep -rE "data-aqb-|[.'\"]aqb-" packages/editor/src/ packages/editor/demo/ --include="*.ts" --include="*.tsx" --include="*.css" --include="*.html"  # → empty
grep -rE "aqb:trace:" packages/editor/src/ packages/editor/demo/                                                                                    # → empty

# Zero aqb-anywhere ghosts (JS string literal side — new in V3 Gate 1 revision)
grep -rnE "setProperty\s*\(\s*['\"]--(?:aqb|ls|accent)-" packages/editor/src/ packages/editor/demo/                                                 # → empty
grep -rnE "['\"]--(?:aqb|ls|accent)-[a-z0-9-]+['\"]" packages/editor/src/ packages/editor/demo/                                                     # → empty (covers cssVar fields etc.)
grep -rnE "\`[^\`]*aqb-[^\`]*\\\$\{" packages/editor/src/ packages/editor/demo/                                                                     # → empty (no surviving template literals)

# Namespace invariants
grep -rnE "setProperty\s*\(\s*['\"]--buildrick-(?!design-)" packages/editor/src/                                                                    # → empty (no JS writes chrome)
grep -rnE "^\s*--buildrick-design-" packages/editor/src/ --exclude-dir=features                                                                     # → empty (design defs stay in features/)
grep -rnE "^\s*--buildrick-(?!design-)" packages/editor/src/ --exclude-dir=themes --exclude "**/Canvas.css"                                         # → empty (chrome defs stay in themes/+Canvas.css)

# Data-attribute completeness (19 attrs expected post-rename; 0 --aqb-- ones)
test $(grep -rnoE "data-buildrick-[a-z-]+" packages/editor/src/ packages/editor/demo/ | sed 's/.*:data-buildrick-/data-buildrick-/' | sort -u | wc -l) -ge 19  # >= 19

# Scaffolding and orphans gone
grep -rE "applyTheme|defaultTheme|themeMode|aqb-theme|\.aqb-editor|\.aqb-layout|CSS_CLASSES" packages/editor/src/                                   # → empty

# Standard quality gates
cd packages/editor && npx tsc --noEmit                                                                                                              # clean
npx vitest run                                                                                                                                      # pass

# Size sanity
[ $(wc -l < packages/editor/src/themes/default.css) -lt 4000 ]                                                                                      # true

# Migration shim present + invoked
grep -c "migrateAqbKeys" packages/editor/src/shared/utils/storageMigration.ts                                                                       # >= 1
grep -c "migrateAqbKeys\|storageMigration" packages/editor/src/editor/shell/AquibraStudio.tsx                                                       # >= 1 (and AFTER migrateStorageKeys call)

# Re-run of mapping-table verifications block
node scripts/theme-v3-codemod.mjs --verify                                                                                                          # pass before P8 deletes the script
```

### 7.2 Behavioral (hard-refresh `localhost:5050`)

1. First-boot with existing `aqb-*` localStorage keys: migration shim runs, previous state survives (recents, favorites, panel state, AI context, design tokens, layer display prefs).
2. Chrome is pixel-identical to pre-migration across 3 consecutive reloads. No "undefined CSS variable" console warnings.
3. Canvas operational surface pixel-identical (selection glow, box model, spacing, font scale).
4. Design tab works: edit a color → canvas reflects → reload → color persists. `document.documentElement.style` after edit contains only `--buildrick-design-*` entries, never `--buildrick-*`.
5. Chrome untouched by Design-tab edits (sidebar/panels/buttons/inspector identical).
6. Dead scope wrappers (`.aqb-editor`, `.aqb-layout`) do not appear on any element in DevTools.
7. Export produces `.buildrick-*` classes + `data-buildrick-*` attrs, no `aqb` anywhere.
8. `PagesTab` renders with light chrome canonical — `.pages-panel` children's computed `background-color` matches `--buildrick-bg-panel`.
9. Demo canvas renders with light canonical (DARK_THEME_SHIM fix verified).

### 7.3 Meta criterion (pattern-breaking)

- Codex passes Gates 1, 2, 3 without surfacing a new failure mode requiring V4.
- Every SSOT claim in the spec + mapping has a grep verification command with captured output.
- Post-migration, source contains zero `aqb-*`. Any future reference to "the aqb prefix" in code review is an obvious red flag, not an ambiguity.

---

## 8. Explicitly NOT in scope (deferred follow-up specs)

1. **Structural cleanup of `themes/` and Canvas files** — merge `ux-fixes.css` (Q5), consolidate the two `Canvas.css` files (Q6 file-level), reclassify/merge `design-tokens.css` (Q7). Pure file-organization work. Separate spec when desired.
2. **Real engine class-name SSOT** — wire up a new constant (not the deleted `CSS_CLASSES`) as authoritative for `.buildrick-canvas` / `.buildrick-selected` / etc., replace hardcoded strings in engine modules with imports. Structural spec.
3. **Storage key consolidation** — collapse the 4 duplicates + 4 hardcoded-consumer gaps. Inline strings become imports from `storageKeys.ts`. Separate spec per Q12=A.
4. **Real `themeMode` light/dark feature** — if wanted, re-introduce with `buildrick-theme` storage key + application path. Fresh feature spec, not scaffolding.
5. **Inspector token picker UX review** (pre-existing deferred work).
6. **Dashboard (Next.js) package theme alignment** — separate concern, separate package.
7. **Playwright visual regression infrastructure** — permanent safety net for future migrations. Separate tooling spec.

Every commit in V3 is pure rename + value-correctness-fix work on files the codemod touches anyway. If an edit doesn't match those categories, it's out of scope.

---

## 9. References

- Superseded V1 spec: `docs/superpowers/specs/2026-04-18-theme-unification-design.md`
- Superseded V2 spec: `docs/superpowers/specs/2026-04-19-theme-unification-v2-design.md`
- Source inventory (discussion-grade, twice Codex-reviewed): `scripts/theme-v3-audit.json`
- Canonical design direction: `DESIGN.md` (2026-04-18 light-chrome flip)
- Project conventions: `CLAUDE.md`, `packages/editor/CLAUDE.md`
- Storage migration precedent: `packages/editor/src/shared/utils/storageMigration.ts` (`aquibra-* → aqb-*` pattern)
- Token registry: `packages/editor/src/themes/default.css`, `packages/editor/src/features/design-system/constants.ts`
- Inventory meta-reflections guiding V3 guardrails: `scripts/theme-v3-audit.json#ssot_verification_guardrail_for_v3`, `#meta_reflection_on_inventory_production_process`
