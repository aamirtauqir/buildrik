---
date: 2026-04-25
topic: ds-week-1-codex-prep
status: ready-for-codex-review
plan: docs/plans/2026-04-25-ds-rollout-week-1.md
parent_rollout: docs/ideation/2026-04-20-editor-chrome-ds-ideation.md
---

# Week 1 Closeout — Codex Review Prep

Per rollout Non-negotiable Gate #3 (`docs/ideation/2026-04-20-editor-chrome-ds-ideation.md:127`).

Week 1 shipped under solo workflow, direct commits to `main`. 9 commits since plan doc (`3ebde03..6ced085`).

## Final State

| check | result |
|------|--------|
| `bash packages/editor/scripts/ds-grep-gates.sh` | exit 0 |
| green-panel allowlist | 173 files, all at zero chrome-gate violations |
| `npx tsc --noEmit` | 253 lines (parity with pre-Week-1 baseline; all pre-existing in `src/editor/canvas/`) |
| Vitest layout SSOT suite | 3/3 pass |
| Vitest rule suite (no-legacy-components-import) | 8/8 pass |
| Vitest rule suite (no-magic-layout-literals) | 12/12 pass |
| ESLint baseline (no-magic-layout-literals) | 879 (frozen in `scripts/.layout-literals-baseline`) |
| ESLint baseline (no-legacy-components-import) | 0 (ERROR mode, locked) |

## What Shipped

### Task 1 — `layout.ts` SSOT cleanup
Commit `9f8421c`. Dropped legacy `LAYOUT` object after grep-verified 0 consumers. Removed barrel re-export from `shared/constants/index.ts`. Added vitest guard at `packages/editor/src/shared/constants/__tests__/layout.test.ts` enforcing 11 named exports + canonical values + LAYOUT-removal invariant.

### Task 2 — ESLint rule `no-legacy-components-import` (ERROR, baseline 0)
Commits `d97fc58`, `61f25a0`. Custom rule banning imports from `src/editor/**` into legacy `src/components/`. Fixed regex threshold `(\.\.\/){3,}` → `(\.\.\/){2,}` after code review showed 2-up paths slipped through. Plugin registered in `eslint-rules/index.cjs`. Wired into BASE flat-config block at ERROR severity.

### Task 3 — ESLint rule `no-magic-layout-literals` (WARN, baseline 879)
Commits `829786b`, `bfc992c`. Bans raw pixel literals in layout-property contexts inside chrome files. Property-AST + TemplateLiteral-AST visitors. `LAYOUT_PROPS` Set of 25 entries (added `inset` post-review). `TEMPLATE_LAYOUT_PATTERN` covers shorthand + every long-hand variant including `padding-top/-bottom/-left/-right`, `flex-basis`, `row-gap/column-gap`. Honors `// @lint-layout-policy: <reason>` escape with **bounded** scope (immediate enclosing Statement only — does NOT exempt the whole file). Code review caught initial implementation walking AST to `Program` which would have made any file-top comment a global escape. Fixed to stop at first `Statement`/`VariableDeclaration` ancestor. Baseline frozen at `scripts/.layout-literals-baseline`.

### Task 4 — Green-panel cleanup (NOT new mechanism)
Commits `c90149f` (reverted via `922f7ab`), `003545b`, `6ced085`.

**Major plan deviation surfaced during execution:** the `.ds-green-panels.json` allowlist + inline strict-zero gate (`ds-grep-gates.sh:213-282`) was already shipped as Survivor #6 from DS V1 remediation (commits 65c590b, f828069, etc). The rollout doc and the plan both treated the mechanism as net-new and prescribed building a separate `verify-green-panels.mjs` + Gate 15. **Both were wrong** — the existing inline block already does JSON parse + per-file existence check + per-file 4-chrome-pattern violation check, with a stronger "ZERO violations" enforcement than the plan's Gate 15 idea. Original Task 4 work was reverted entirely (`922f7ab`).

Real Task 4 work that actually shipped (after re-scope):
- Removed 8 dead-file entries from `.ds-green-panels.json` (files deleted in earlier legacy cleanup; entries stale). Allowlist 181 → 173.
- Fixed chrome-gate violations on 10 listed files (not just the 5 the plan anticipated):
  - 13 `borderRadius` sites swapped from 6 → `var(--buildrick-radius-sm)` across 8 settings screens. Code review caught initial choice of `--buildrick-radius-md` (8) which would have been a +2px regression vs the original 6; corrected to `sm` (4) per DESIGN.md A1.3.
  - `shared.tsx` `LOCKED_MIN_HEIGHT`/`LOCKED_MAX_WIDTH` rewritten from `16 * 20` arithmetic-as-evasion to `SIDEBAR_WIDE` SSOT import. `LOCKED_PAD_Y = 8 * 6` retained (no SSOT named export for 48; `@lint-layout-policy` comment satisfies the new ESLint rule).
  - `ControlRow.tsx` JSDoc rewrite — 1 site where the bash gate's regex false-positives on `44px` in a `/** */` comment, not on actual layout code. See concern #2 below.

### Task 5 — This artifact + Codex handoff

## What Did NOT Ship (per plan)

- **Codemod for raw literals.** Rollout doc Week 1 line 97 explicitly defers bulk replace to Week 3.
- **PanelShell, Box token primitive, Inspector schema registry.** All downstream rollout sequence.
- **A new Gate 15 for green-panel allowlist structural integrity.** Mechanism already existed; new gate would have been redundant. Plan's prescription was wrong.

## Plan Defects Surfaced (for Codex Attention)

1. **Task 0 audit was incomplete.** It checked `layout.ts` exports + chrome-axioms-baseline + plugin structure, but did NOT grep for the existence of `.ds-green-panels.json` — a load-bearing file shipped weeks earlier. Result: Task 4 first attempt destroyed 181 curated allowlist entries before the regression was caught and reverted. The "inventory before architecture" rule (memory: `feedback_inventory_before_architecture.md`) was followed for tokens but not for gate infrastructure. **5th architecture kill of the same root cause.**

2. **Bash grep gate is a literal scanner, not a code parser.** It false-positives on:
   - JSDoc strings containing `44px` (e.g. `ControlRow.tsx:3,12`).
   - Code comments containing forbidden tokens (e.g. `Resolves to 48px.`).
   It also false-negatives on arithmetic that resolves to a forbidden value at compile time (e.g. `16 * 20`). Fixing this is out of Week 1 scope but is a known gap. The new ESLint `no-magic-layout-literals` rule does honor `@lint-layout-policy:` comments and operates on AST — that's the proper enforcement layer. The bash gate stays as a CI fallback but should be improved Week 2 to skip comment lines via `grep -v '^\s*\*'` or similar.

3. **Duplicate enforcement: `no-legacy-components-import` ESLint rule (Task 2) overlaps with the existing `no-restricted-imports` block at `eslint.config.mjs:204-239`.** Both at ERROR. Both at baseline 0. The existing block enumerates 1-6 levels of `../`; the new rule uses regex `(\.\.\/){2,}`. After Task 2's `61f25a0` fix, the rules cover the same surface. User accepted the duplication for Week 1; suggested Codex follow-up: pick one (the new buildrik rule has better message text and explicit `isEditorFile` scope filter; the old block enumerates more relative-path forms).

4. **`borderRadius: 6` was the original code intent, not a typo.** DESIGN.md A1.3 says ≤4 for panel chrome. Settings screens are arguably content rendered IN chrome, not chrome itself. The decision to migrate 13 sites to `var(--buildrick-radius-sm)` (= 4) is a -2px visual change. If product wants the 6px back, the design call is to introduce a `--buildrick-radius-card` (6) token explicitly, OR exempt settings screens from the chrome scope. Codex should weigh in.

## Concerns Codex Should Stress-Test

1. **Rule scope.** `no-magic-layout-literals` applies via the `CHROME_FILES` override block (`src/editor/**`, `src/shared/ui/**`, `src/shared/forms/**`). Some form atoms in `shared/forms/` may legitimately need arbitrary pixel values (spinbox width, etc). Baseline 879 captures current state. Should form atoms be on `FORM_ATOMS` exempt list for this rule too? Or is the policy-comment escape hatch sufficient?

2. **`@lint-layout-policy:` comment scope.** The ESLint rule walks at most 6 hops to the enclosing Statement / VariableDeclaration. A comment placed above an enclosing function exempts that function's entire body if it's the same Statement boundary. Verify: does this exempt too much in real chrome files?

3. **Layout-property regex completeness.** Rule covers `width|height|min/max variants|top/left/right/bottom|inset|padding|paddingTop/Bottom/Left/Right|margin|marginTop/Bottom/Left/Right|gap|rowGap|columnGap|flexBasis`. Missing intentionally: `strokeWidth`, `borderWidth`, `transform` values, `inset` shorthand variants. Confirm intent.

4. **Green-panel allowlist append-only contract.** Removing 8 dead-file entries is documented as "the files literally don't exist anymore so there's nothing to hide" — but the allowlist's own description says "Do NOT remove files from this list once added. If a migration regresses, fix the code — removing from the allowlist hides the regression." We removed entries because the FILES (not the migrations) were deleted upstream. Codex: confirm this is policy-compliant.

5. **`16 * 20` evasion remediation.** The replacement `LOCKED_MIN_HEIGHT = SIDEBAR_WIDE` is correct (the value IS 320 = SIDEBAR_WIDE). The `LOCKED_PAD_Y = 8 * 6` retained-arithmetic is documented but still gate-evading. Should this become a constant in `shared/constants/layout.ts`? Or should the bash gate honor `@lint-layout-policy:` comments?

6. **Settings screens visual delta.** 13 `borderRadius` sites: 6 → 4. Verify visually at localhost:5050 that no settings card looks "too sharp" after the change. If yes, see plan defect #4.

## Evidence Checklist

- `git log --oneline 3ebde03..HEAD` shows 9 Week 1 commits.
- `bash packages/editor/scripts/ds-grep-gates.sh` exits 0. All gates pass.
- `npx vitest run packages/editor/src/shared/constants/__tests__/layout.test.ts` 3/3 pass.
- `node --experimental-vm-modules packages/editor/eslint-rules/__tests__/no-legacy-components-import.test.mjs` all pass.
- `node --experimental-vm-modules packages/editor/eslint-rules/__tests__/no-magic-layout-literals.test.mjs` all pass.
- `npx tsc --noEmit | wc -l` = 253 (parity).
- `packages/editor/scripts/.layout-literals-baseline` contains `879`.
- `packages/editor/scripts/.ds-green-panels.json` lists 173 files.

## Next: Week 2

Per rollout row 98 (`docs/ideation/2026-04-20-editor-chrome-ds-ideation.md:98`):
- `<Box>` Token Binding primitive (compile-time DS contract via TS union types).
- Token convergence decision: grandfather `radius-md` (8) on form atoms only; panels use `radius-sm` (4) per DESIGN.md A1.3.
- Small PanelShell scaffold (no tab migration yet).

4-5 day cost. Stop-here value: typed `<Box>` shipped, token contract locked, PanelShell API exists but tabs unchanged.

## Codex Handoff Command

```
/codex review
```

Scope: this artifact + the 9 Week 1 commits (`3ebde03..6ced085`).

After Codex findings addressed, Week 2 unblocked.
