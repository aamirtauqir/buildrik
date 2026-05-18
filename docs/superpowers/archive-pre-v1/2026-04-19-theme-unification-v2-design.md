# Theme Unification V2 — Namespace Separation + Runtime Reconciliation

> **⚠️ SUPERSEDED — DO NOT IMPLEMENT**
>
> Invalidated by Codex review 2026-04-19 (same day as spec was written). Codex caught
> premise problems that internal review missed — same pattern that killed V1. Seven
> structural findings:
>
> 1. **Not 2 namespaces — at least 3 (possibly 4).** V2's "chrome vs canvas" model is
>    too clean. Reality has: chrome tokens (`themes/default.css`), canvas
>    **operational** tokens (`editor/canvas/Canvas.css` + duplicate `components/Canvas/Canvas.css`),
>    persisted Design-tab tokens (`constants.ts` + `design-tokens.css`). V2 collapses
>    canvas operational and persisted design tokens into one bucket — they're different systems.
> 2. **P2/P3 codemod is internally contradictory.** Spec says "delete bare `--aqb-*`
>    definitions outside `themes/default.css` as scope violations" — but 4+ files contain
>    load-bearing, intentional `--aqb-*` definitions. Executing P2 as written breaks the
>    app before P3 can delete anything.
> 3. **Dual persistence missed.** `TokenRegistryContext.tsx:61` trusts localStorage
>    arrays; `DesignSystemTab.tsx:142` loads from Composer by id/name ignoring saved cssVar.
>    V2 migration addresses only the Composer side.
> 4. **Keyframes count undercounted.** V2 says 6 keyframes in `default.css`. Actual
>    `aqb-*` animations/keyframes live across 7+ additional files: `AnimationPresets.ts`,
>    both `Canvas.css` files, `LeftSidebar.css`, `layers.css`, `Skeleton.tsx`, `ImageUploader.tsx`.
> 5. **`themes/index.ts` has live consumers.** V2 claimed zero internal callsites.
>    Actual: `src/index.ts:75` re-exports + `demo/main.tsx:11` imports. Deletion breaks
>    demo + public API.
> 6. **`aqb` prefix is multi-semantic, not just tokens.** CSS variables + `data-aqb-*`
>    DOM attributes (engine contracts in `StyleEngine.ts`, `ReactExporter.ts`) + class
>    names (`.aqb-sidebar`, `.aqb-toast` still live) + storage keys (`aqb-design-tokens-*`)
>    + demo/public API. V2 treats `aqb` as a single rename target — it's not.
> 7. **Undefined-token consumer list is incomplete.** `var(--aqb-text)`, `var(--aqb-surface)`,
>    `var(--aqb-bg-input)`, `var(--aqb-primary-dark)` live in `IconPickerModal`, `MediaLibraryPanel`,
>    `AutocompleteField`, `canvas/shared/tokens.ts`, `shared/constants/canvas.ts`, and more.
>
> **Meta pattern (now confirmed twice):** Author leaps to clean architecture before the
> inventory is closed. Codex review caught this premise problem on V1 AND V2. The reliable
> pattern: **do inventory first, architecture second**.
>
> **Real problem (now refined):** Not "one namespace" or "chrome vs canvas". It's that
> the `aqb` prefix has accumulated at least 6 unrelated uses (CSS vars + DOM attrs +
> classnames + storage keys + keyframes + demo API), each needing independent treatment.
> Token debt is a subset, and even that subset has 3+ domains (chrome / canvas operational /
> persisted design) with different lifecycles.
>
> **V3 scope (to be authored):** Start with a complete inventory — classify every `aqb`
> hit into one of: chrome token / canvas operational token / persisted design token /
> data-attribute contract / class name / storage key / keyframe / demo API. No architecture
> decisions until the inventory is committed and reviewed. Then design migration topology
> around the actual 6+ bucket reality, not a forced 2-bucket model.

**Date:** 2026-04-19
**Branch:** `main`
**Status:** SUPERSEDED — see banner above
**Supersedes:** `2026-04-18-theme-unification-design.md` (V1, also invalidated by Codex)

---

## 1. Context

### Why V1 was superseded

V1 framed the problem as "dual-prefix cleanup" — migrate 524 `--ls-*` references into the canonical `--aqb-*` namespace per DESIGN.md light-chrome direction. Codex review (2026-04-18) invalidated the premise. Five structural problems sit beneath the prefix surface:

1. `themes/index.ts` mutates `--aqb-*` at runtime via `applyTheme()` (lines 27-42). The defaults are all **dark** values (`#0c0c14`, `#14141f`, `#F5F5F0`) — actively fighting DESIGN.md's light canonical.
2. `--aqb-*` itself has **multi-scope semantics**. `PagesTab.css` lines 2179-2201 redefine ~20 `--aqb-*` tokens back to dark values inside a local scope. Eliminating `--ls-*` does not unify the system; `--aqb-*` is not yet canonical.
3. Multiple consumers reference **tokens that don't exist globally**: `--aqb-text`, `--aqb-surface`, `--aqb-surface-elevated`, `--aqb-bg-input`, `--aqb-primary-dark`. Zero definitions in `themes/default.css`, 20+ consuming files.
4. Three runtime `setProperty` callsites mutate tokens directly — `useTokenBase.ts:62` (shared primitive), `useColorTokens.ts:50`, `useSpacingTokens.ts:90`. All three user-facing hooks (`useColorTokens`, `useSpacingTokens`, `useTypeTokens`) route updates through the shared `useTokenBase` primitive, so every Design tab edit flows through these mutations. Any visual comparison can be invalidated by persisted user edits.
5. Theme preference system is half-built — `themeMode` type + `aqb-theme` storage key exist, but no application path anywhere.

### Real problem

**Chrome tokens and canvas design tokens share the same namespace.** That is the root cause. Everything else (runtime mutation of chrome, scope overrides, undefined consumer tokens) is a symptom. V1's prefix migration would have produced a clean `--aqb-*` set that is still structurally confused.

### Success goal

Two namespaces with strict ownership, no runtime mutation of chrome, no scope shadowing, no undefined consumers. Every future CSS edit becomes predictable because the mental model and the token resolution agree by construction.

---

## 2. Namespace Contract

### Two isolated namespaces, two different lifetimes

| Namespace | Purpose | Source of truth | Lifetime | Mutable? |
|---|---|---|---|---|
| `--buildrick-*` | Editor chrome (sidebar, topbar, panels, dialogs, buttons, inspector, tabs) | `themes/default.css` (`:root` only) | Static — set once when CSS loads | **No.** Never mutated at runtime. Never re-scoped in other CSS files. |
| `--buildrick-canvas-*` | User's canvas design tokens (colors/typography/spacing the end-user edits in the Design tab and uses in their website) | `themes/canvas.css` (`:root` defaults) + Composer/project state (per-project persisted values) | Dynamic — hydrated from project state at load, mutated on user edits | **Yes.** Only through `useTokenBase`/`useColorTokens`/`useSpacingTokens`/`useTypeTokens`, only writing `--buildrick-canvas-*`. |

### Invariant rules (enforceable via CI grep)

1. No file outside `themes/` may define `--buildrick-*` or `--buildrick-canvas-*` tokens.
2. No JavaScript may write `--buildrick-*` chrome tokens at runtime.
3. Design-system hooks (`useColorTokens`, `useSpacingTokens`, `useTypeTokens` — all using the shared `useTokenBase` primitive) may only write `--buildrick-canvas-*`.
4. `themes/default.css` contains only `--buildrick-*` (no `--buildrick-canvas-*`). `themes/canvas.css` contains only `--buildrick-canvas-*`.

### File structure after migration

```
packages/editor/src/themes/
  default.css          Chrome only — all --buildrick-* definitions (~3000 lines, down from 5000)
  canvas.css           NEW — all --buildrick-canvas-* default values
  index.ts             DELETED
```

### Why file-level split matters

- Cannot accidentally mix chrome and canvas tokens in the same file.
- Chrome file reviewable without canvas noise.
- CI grep becomes trivial: `--buildrick-canvas-` in `default.css` or non-canvas `--buildrick-` in `canvas.css` = build fail.

---

## 3. Dedup + Mapping Strategy

### Step 1 — Audit script produces raw inventory

`scripts/theme-v2-audit.mjs` (Node, deleted after P7) scans `packages/editor/src/**/*.{css,ts,tsx}`:

- Every unique `--aqb-*` and `--ls-*` name with callsite count
- Tokens consumed but never defined (e.g. `--aqb-text`, `--aqb-surface-elevated`)
- Tokens defined outside `themes/default.css` (scope violations)

Output: `scripts/theme-v2-audit.json`, committed for review.

### Step 2 — Manual dedup pass, one-shot mapping table

Human + Claude Code reviews audit output together. Group by semantic role. Decide ONE canonical `--buildrick-*` name per role. Output written to `scripts/theme-v2-mapping.json` and mirrored into this spec as the committed historical record.

Example shape:

```
# Chrome (--buildrick-*)
--aqb-primary           → --buildrick-accent
--aqb-primary-hover     → --buildrick-accent-hover
--ls-accent             → --buildrick-accent             (dedup)
--aqb-text-primary      → --buildrick-text
--aqb-text              → --buildrick-text               (was undefined — resolved)
--ls-text-lighter       → --buildrick-text-muted         (dedup)
--ls-text-subtle        → --buildrick-text-muted         (dedup)
--aqb-text-muted        → --buildrick-text-muted         (dedup)
--aqb-surface           → --buildrick-surface            (was undefined — resolved)
--aqb-surface-elevated  → --buildrick-surface-elevated   (was undefined — resolved)
...

# Canvas (--buildrick-canvas-*) — new namespace
(derived from DesignToken DEFAULT_TOKENS registry — color/typography/spacing roles user edits)
```

### Step 3 — Token organization inside CSS files

Both `default.css` and `canvas.css` organize tokens by semantic category, alphabetical within each:

```
/* === Accent === */
/* === Text === */
/* === Surfaces === */
/* === Borders === */
/* === Radii === */
/* === Shadows === */
/* === Motion === */
```

### Step 4 — Handling ambiguous dedup cases

Rule: if two tokens serve visually-distinct roles in different components, keep them separate with precise names. If they were merely inconsistent names for the same thing, merge. Edge cases documented inline in the mapping table with a one-line reason.

### Dedup decision gate

Before codemod executes: user reviews the mapping table. No mapping decisions are made during codemod execution — all decisions upfront, reviewed, approved.

---

## 4. Codemod Script

### Location + lifecycle

`scripts/theme-v2-codemod.mjs` — Node, committed in the migration branch, deleted in P7. Not long-term tooling.

### Inputs

- `scripts/theme-v2-mapping.json` (from Section 3)
- Target glob: `packages/editor/src/**/*.{css,ts,tsx}`

### What it does (in exact order)

1. **Load mapping.** Validates every `from` is unique, every `to` starts with `--buildrick-` or `--buildrick-canvas-`. Errors if invalid.
2. **Dry-run mode (default).** Walks every file, reports what would change (per-file count, sample lines). Writes nothing. Output saved to `scripts/theme-v2-codemod-report.txt` for review.
3. **Apply mode (`--apply` flag).** Replaces:
   - `var(--aqb-X)` → `var(--buildrick-Y)` per mapping
   - `var(--ls-X)` → `var(--buildrick-Y)` per mapping
   - `animation: aqb-X ...` → `animation: buildrick-X ...` (animation-name shorthand)
   - `animation-name: aqb-X` → `animation-name: buildrick-X`
   - Bare token definitions found outside `themes/default.css` — **deleted**, emitting to report (these are scope violations)

### What it deliberately does NOT do

- Does NOT touch hex values, calc expressions, or any non-token syntax.
- Does NOT handle string-concatenated token names (e.g. `` `var(--aqb-${key})` ``). Script detects these and **errors out**, listing every occurrence for manual handling. Zero silent failures.
- Does NOT write to `themes/default.css` or `themes/canvas.css` — those are authored manually in P1. Codemod only transforms consumers.
- Does NOT rename `cssVar: "--aqb-*"` string literals in `DEFAULT_TOKENS`, `types.ts`, or `exportUtils.ts` — those are canvas-namespace retargets handled manually in P4.
- Does NOT run formatting.

### Safety properties

- **Deterministic:** same input → same output. Re-runnable.
- **Idempotent:** running twice produces no further changes.
- **Auditable:** dry-run report shows every change before commit.
- **Fails loud:** any unmapped `--aqb-*` or `--ls-*` reference after apply → script exits non-zero. No half-migrated state.

### Verification after apply

```bash
grep -rE "var\(--aqb-|var\(--ls-" packages/editor/src/                         # → empty
grep -rE "animation(-name)?:\s*aqb-" packages/editor/src/                       # → empty
grep -rE "^\s*--aqb-|^\s*--ls-" packages/editor/src/ --exclude-dir=themes       # → empty
```

---

## 5. Runtime Mutation Rewrite

### Deletions

- `packages/editor/src/themes/index.ts` — **entire file deleted**. `applyTheme`/`defaultTheme` exports removed. Zero internal callsites verified — only the re-export from `packages/editor/src/index.ts:75`, which is also removed.

### Canvas namespace retargeting (manual edits — not codemod)

Three user-facing hooks (`useColorTokens`, `useSpacingTokens`, `useTypeTokens`), sharing the `useTokenBase` primitive, currently emit `--aqb-*` via `cssVar` strings stored on each `DesignToken`. Change the cssVar strings at their source; hook runtime behavior is unchanged.

| Location | Before | After |
|---|---|---|
| `features/design-system/constants.ts` — `DEFAULT_TOKENS` entries | `cssVar: "--aqb-color-primary"` etc. | `cssVar: "--buildrick-canvas-color-primary"` etc. |
| `features/design-system/types.ts:73` — `tokenToCssVar(id)` helper | Emits `--aqb-${id}` | Emits `--buildrick-canvas-${id}` |
| `features/design-system/utils/exportUtils.ts:15` — color var generator | Emits `--aqb-color-${name}` | Emits `--buildrick-canvas-color-${name}` |
| `features/design-system/state/__tests__/useSpacingTokens.test.ts:22` | `cssVar: \`--aqb-${id}\`` | `cssVar: \`--buildrick-canvas-${id}\`` |

The hooks write whatever `cssVar` string each `DesignToken` carries. Only the emitted strings change, so mutation target automatically moves to the canvas namespace. No hook logic is touched.

### Persisted project data migration

User projects saved before V2 store tokens with `cssVar: "--aqb-*"`. Without migration, loading an old project silently writes to a CSS variable that no longer exists.

Add a pure mapping step in `TokenRegistryContext.tsx` before tokens reach the hooks:

```ts
const migrated = initialTokens.map((t) =>
  t.cssVar.startsWith("--aqb-")
    ? { ...t, cssVar: t.cssVar.replace(/^--aqb-/, "--buildrick-canvas-") }
    : t,
);
```

One-way, runs on every load. Eventually (after one save cycle by users) persisted data is clean. Lenient — replaces prefix regardless of whether the original was chrome or canvas-intended, because any `--aqb-*` not represented in `DEFAULT_TOKENS` is orphan data that has no effect (no component consumes it).

**Open question flagged for implementation:** verify Composer's token save path. If it serializes from hooks' internal state, orphan tokens are dropped on next save (clean). If it serializes the full `initialTokens` passed to the provider, orphans persist as dead JSON data (harmless but inelegant). Either is acceptable; noted for implementation to document actual behavior.

### Design-system UI components — two-namespace coexistence

Files like `DesignSystemTab.tsx`, `DesignTabFooter.tsx` contain BOTH kinds of token usage in the same component:

- **Chrome styling** (how the tab looks): `var(--buildrick-border)`, `var(--buildrick-surface-2)` — renamed by codemod in P2 like every other consumer.
- **Canvas editing** (what the tab does): `document.documentElement.style.setProperty("--buildrick-canvas-primary", ...)` — retargeted manually in P4 via `DEFAULT_TOKENS` edit.

Codemod only matches `var(--aqb-X)` syntax, never `cssVar: "..."` or `setProperty("...")` string literals. This is why the two concerns can share files without confusion — the syntactic patterns differ, and the codemod is pattern-safe.

### Scaffolding deletion (Y=B decision)

- `shared/types/project.ts:197` — remove `themeMode?: "light" | "dark" | "system"`
- `shared/constants/storageKeys.ts:27` — remove `THEME: "aqb-theme"`
- Any consumer of `storageKeys.THEME` (if any exist) — delete reference

---

## 6. Phase Sequencing

### Design principle

Temporary aliases: old + new tokens coexist during migration. Old names deleted only after all consumers moved. Every phase leaves a working app. Any phase independently revertable.

### Phase table

| Phase | Goal | Output | Prereq |
|---|---|---|---|
| **P0** | Audit + mapping | `scripts/theme-v2-audit.json` + `scripts/theme-v2-mapping.json` committed. Mapping table mirrored into this spec. | — |
| **P1** | Author new CSS definitions (chrome + canvas) | `themes/default.css` adds `--buildrick-*` alongside existing `--aqb-*`/`--ls-*`. New `themes/canvas.css` with `--buildrick-canvas-*` defaults. Canvas.css import added to main CSS entry. App works identically. | P0 |
| **P2** | Codemod — chrome consumer rename | All `var(--aqb-X)`/`var(--ls-X)` → `var(--buildrick-Y)`. All `animation: aqb-X` → `animation: buildrick-X`. App works because both old + new definitions exist. | P1 |
| **P3** | Delete old chrome definitions + scope violations | Remove `--aqb-*`/`--ls-*` blocks from `themes/default.css`. Delete `.aqb-editor` scope rules. Delete `PagesTab.css` dark overrides (and any similar per audit). | P2 + Codex review gate |
| **P4** | Canvas namespace retarget | Rewrite `constants.ts` `DEFAULT_TOKENS`, `types.ts` generator, `exportUtils.ts` color generator, test fixtures. Add persisted-data migration step in `TokenRegistryContext.tsx`. | P1 |
| **P5** | Delete dead runtime + scaffolding | Delete `themes/index.ts` entirely. Remove `applyTheme`/`defaultTheme` re-export from `src/index.ts`. Delete `themeMode` type + `aqb-theme` storage key. | P2, P4 |
| **P6** | Keyframes rename | 6 `@keyframes aqb-*` → `buildrick-*` in `themes/default.css` (references already renamed in P2). | P2 |
| **P7** | Docs + final cleanup | Delete codemod + audit scripts (JSON artifacts retained as historical record). Update `DESIGN.md` with namespace contract section. Fix `CLAUDE.md` "dark-only" line (V1 leftover). Update `CHANGELOG.md`. | All prior |

### Dependency chain

```
P0 ──▶ P1 ──▶ P2 ──▶ P3 ──▶ P5 ──▶ P7
               │                ↑
               └──▶ P4 ─────────┤
                    P6 ─────────┘
```

### Per-phase verification (hard gates, before every commit)

1. `npx tsc --noEmit` → clean
2. `npx vitest run` → pass
3. Vite HMR hot-load → visual sweep of affected areas (~2 min)
4. Phase-specific grep gate (per table row above)

### Codex review gates

Codex caught V1's premise issues twice when internal review missed them. V2 runs Codex at three explicit checkpoints:

1. **Before P0 commits** — review the mapping table decisions. Let Codex challenge dedup merges.
2. **Before P3 commits** — review cumulative P1+P2 diff. This is the destructive phase gate; past this point old definitions are gone.
3. **Before `writing-plans` is invoked** — review this spec itself. Done before user spec review (per user directive: "Run Codex early, today").

### Time estimate

| Phase | Est. |
|---|---|
| P0 | 60 min |
| P1 | 90 min |
| P2 | 30 min |
| P3 | 45 min |
| P4 | 60 min |
| P5 | 20 min |
| P6 | 15 min |
| P7 | 30 min |
| **Total focused work** | **~5.5 hours** |
| **Realistically with reviews + browser checks** | **~1.5 days** |

---

## 7. Verification + Risk Register

### Programmatic verification (must all pass after P7)

```bash
# 1. Zero old-prefix references in source
grep -rE "var\(--aqb-|var\(--ls-" packages/editor/src/                             # → empty
grep -rE "^\s*--aqb-|^\s*--ls-" packages/editor/src/                                # → empty
grep -rE "@keyframes aqb-|animation(-name)?:\s*aqb-" packages/editor/src/           # → empty

# 2. Namespace isolation enforced
grep "buildrick-canvas" packages/editor/src/themes/default.css                      # → empty
# Chrome tokens must not appear in canvas.css. Approach: list all --buildrick-* in canvas.css,
# verify every hit is --buildrick-canvas-* (no bare chrome tokens).
grep -oE "\-\-buildrick-[a-z0-9-]+" packages/editor/src/themes/canvas.css \
  | sort -u \
  | grep -v "^--buildrick-canvas-"                                                  # → empty

# 3. No file outside themes/ defines --buildrick-*
grep -rE "^\s*--buildrick-" packages/editor/src/ --exclude-dir=themes               # → empty

# 4. Dead code gone
grep -rn "applyTheme\|defaultTheme\|themeMode\|aqb-theme\|\.aqb-editor" packages/editor/src/   # → empty

# 5. Chrome file shrunk
[ $(wc -l < packages/editor/src/themes/default.css) -lt 3500 ]

# 6. Standard gates
cd packages/editor && npx tsc --noEmit && npx vitest run
```

### Manual browser verification

After every phase, hard-refresh `localhost:5050` and walk through:

| Area | States to check |
|---|---|
| Topbar | Default, user menu open |
| Build tab | Elements idle, search, Sections idle, accordion open |
| Pages tab | List, settings drawer, search, bulk-select |
| Templates tab | Grid, detail modal |
| Media tab | Library, image editor |
| Design tab | Color picker, edit → verify canvas updates, chrome unchanged |
| Inspector | Each section rendered, token picker |
| History tab | Activity view, version panel |
| Canvas | Empty state, dropped element, selected element |

Each phase ~5 min. P3 (destructive) + P7 (final) get ~15 min full sweep.

### Risk register

| # | Risk | Likelihood | Impact | Detection | Mitigation |
|---|---|---|---|---|---|
| R1 | Codemod misses dynamic token refs (template literals) | Medium | Medium | Codemod fails loud on unmapped patterns; final grep catches residuals | 3 known template sites already flagged in Section 5 (canvas-side). Codemod errors on `` `--aqb-${...}` ``. |
| R2 | Mapping table dedup merges tokens with subtly different values | Medium | High | P0 human review; side-by-side value comparison during dedup | Every merge decision has a one-line reason in mapping. If values differ, decide intentional unification (declare winner) or "don't merge". Codex review gate before P0 commits. |
| R3 | User's saved project loses design tokens | Low | High | `TokenRegistryContext` migration step; fallback to DEFAULT_TOKENS for unknown names | Lenient prefix-replace preserves behavior for known tokens. Orphan tokens are dead JSON only. Composer save path behavior verified during P4 implementation. |
| R4 | Keyframe rename leaves a consumer pointing at deleted name | Low | Medium | P6 grep: `animation.*aqb-` empty | Codemod pattern extended for `animation:` shorthand in P2. P6 only renames the `@keyframes` blocks; references already fixed. |
| R5 | Parallel commit adds fresh `--aqb-*` during migration | Low | Low | P7 final grep catches | 1.5-day focused window. Solo workflow minimizes this further. |
| R6 | P3 deletes `--aqb-*` but a CSS file still references them | Low | High | P3 hard gate: grep consumers before deletion | Don't trust codemod completeness — grep-verify in P3 runbook. If non-empty, back to P2 codemod on the missed files. |
| R7 | Canvas token retarget breaks Design tab UI | Medium | Medium | P4 browser verification: open Design tab, edit a color, check DOM | P4 test: after edit, `document.documentElement.style` shows only `--buildrick-canvas-*` changes, never `--buildrick-*`. |
| R8 | `canvas.css` isn't imported; `--buildrick-canvas-*` tokens undefined | Medium | High | P1 browser check: canvas renders colors, not fallbacks | Explicit import in P1 at main CSS entry. Verify via DevTools that `:root` computed style includes `--buildrick-canvas-*`. |

### Rollback strategy

**Single phase:** `git revert <sha>`. Each phase = one commit, files minimally overlap. ~10 min recovery.

**P3 back-out:** `git revert` re-adds old definitions. Consumers (renamed in P2) still work — they now reference `--buildrick-*` which remains defined in `default.css` from P1. The revert just restores temporarily-bloated dead old definitions. App still works.

**Multi-phase:** `git revert <P7-sha>..<P1-sha>` one-shot return to pre-migration state.

**Fix-forward preferred** when discovering an issue post-commit: small "fix(theme): correct <X>" commit. Don't amend pushed work.

---

## 8. Out-of-Scope

Every commit in this migration is pure token work. Out of scope:

- `themeMode` light/dark switching feature. Scaffolding deleted per decision; real feature is a future spec.
- Splitting `themes/default.css` into multiple chrome files (e.g. `chrome-reset.css`, `chrome-tokens.css`). Deferred. Only `default.css` ↔ `canvas.css` split happens here.
- Value-level review of legacy `--aqb-surface-1..5` dark tokens. They get renamed to `--buildrick-surface-1..5` in the mapping or dedup'd; no independent purpose review.
- Inspector token picker UX changes.
- New canvas token categories end-users haven't asked for.
- Dashboard package theme alignment (separate Next.js app).
- Engine/composer logic beyond `TokenRegistryContext` persisted-data migration.
- Playwright visual regression setup — manual browser verification only.
- Dark mode as a runtime feature — token set is light-only per DESIGN.md.
- Component restructuring, JSX changes, or hook refactors beyond the exact targeted edits above.

If an edit doesn't match "token rename", "definition move/delete", or "DEFAULT_TOKENS/generator cssVar string change" — it's out of scope.

---

## 9. Success Criteria

### Programmatic (all must pass)

Per Section 7.

### Behavioral

After migration, open `localhost:5050`:

1. **Chrome is static.** Reload 3 times, compare screenshots — pixel-identical.
2. **Canvas design tab works.** Edit a color → canvas reflects new color → reload → color persists → DOM shows only `--buildrick-canvas-*` mutations, never `--buildrick-*`.
3. **Chrome untouched by user edits.** After editing design tokens, sidebar/panels/buttons look identical.
4. **No console errors.** Specifically no "undefined CSS variable" warnings.
5. **Old project loads correctly.** V1-era saved project: persisted-data migration kicks in, tokens re-hydrate, colors correct.

---

## 10. Post-Migration State

**What's different (structural wins):**
- Two namespaces with strict ownership. Impossible to confuse chrome vs canvas ever again.
- Chrome = static CSS. Simple mental model.
- Canvas = user content with explicit, scoped mutation surface.
- CI grep gates prevent future violations.
- Audit + mapping artifacts (`scripts/theme-v2-audit.json`, `scripts/theme-v2-mapping.json`) retained as historical record. Codemod scripts (`theme-v2-codemod.mjs`, `theme-v2-audit.mjs`) deleted in P7 since their job is one-shot and done.

**What remains for future specs:**
- Real `themeMode` light/dark feature for user canvas themes (not chrome).
- Further shrink `themes/default.css` via layered file splits.
- Playwright visual regression as permanent safety net.
- Inspector token picker design review.

---

## 11. References

- Superseded V1 spec: `docs/superpowers/specs/2026-04-18-theme-unification-design.md`
- V1 investigation learning: `theme-dual-token-mid-flip` (ts 2026-04-18)
- Related CSS shadowing learning: `single-root-block-canonical-token-pattern`
- Canonical direction: `DESIGN.md` (2026-04-18 light-chrome flip)
- Project conventions: `CLAUDE.md`, `packages/editor/CLAUDE.md`
- Token registry: `packages/editor/src/themes/default.css`, `packages/editor/src/features/design-system/constants.ts`
