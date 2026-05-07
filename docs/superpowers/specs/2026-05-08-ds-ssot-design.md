# DS SSOT Audit + Fix Arc — Design Spec

**Date:** 2026-05-08
**Author:** Brainstorm session (Saqib + Claude)
**Status:** Draft, pending implementation plan
**Arc estimate:** ~8-9 PRs over ~2-3 sessions
**Predecessor:** `docs/superpowers/specs/2026-05-07-vibcoder-finish-design.md` (vibcoder-finish arc closed 2026-05-07)

---

## 1. Goal

Achieve **structural SSOT compliance** for the Buildrik chrome design system. Identify every violation against CLAUDE.md's SSOT contract, fix the violations that have clear fixes, and lock in CI gates that prevent new violations from landing.

### Done criteria (verifiable)

| # | Bar | How verified |
|---|-----|-------------|
| 1 | Every primitive name has exactly one home (vibcoder OR shared/ui OR shared/extensions, never two) | `find packages/editor/src -name "<Name>.tsx"` returns exactly 1 path per name (excluding test pairs) |
| 2 | Every `--bd-*` token alias defined in exactly one CSS file | grep across `themes/` returns single source per `--bd-*` token |
| 3 | Every `@keyframes <name>` defined in exactly one CSS file | grep across all CSS files returns single source per keyframe name |
| 4 | Every `.bd-*` selector defined in exactly one CSS file (or documented intentional layered overrides) | scanner confirms |
| 5 | `legacy-components.css` content audited per rule — each rule has clear surviving consumer + clear reason it can't move to a tier file | manual review + comment per rule |
| 6 | New CI gate `check-ds-ssot.mjs` blocks PRs that introduce duplicate primitives/keyframes/aliases | gate test suite ≥6 cases, runs in CI |
| 7 | CLAUDE.md SSOT contract section reflects audited reality (no aspirational rules) | section consistency self-check |
| 8 | Memory file written + index entry added | files exist |

### Out of scope

- **Site-builder DS** at `editor/design-system/` — different domain, separate audit if ever needed
- **Storage keys** with `buildrick-*` prefix (Decision 1A from prior arc still holds)
- **Engine-side `.buildrick-canvas` queries + `data-buildrick-id` attrs** (canonical, immutable)
- **Tier classification rebalancing** (whether something is atom vs molecule) — judgment work, separate concern
- **Naming convention churn** (renaming `bd-X` to something prettier) — non-functional polish
- **Vibcoder primitive rewrites** (existing primitives that work)

### Starting numbers (today, after vibcoder-finish arc)

- 68 vibcoder primitives + 67 tier CSS files
- 4 shared/ui files, 6 shared/extensions files
- 72 LOC `legacy-components.css`
- 65 `.buildrick-*` JSX refs (locked, all canonical/storage/site-builder)
- **4 known violations** from quick audit: Badge duplicate, two alias files, duplicate keyframes (`pulse`/`spin`), surviving `buildrick-flash`
- **Unknown count of additional violations** — Phase 0 surfaces

---

## 2. Audit Categories (8 dimensions)

Phase 0 audit scans these. Each surfaces a list of violations with file:line refs.

### 1. Component-level duplicates (mechanical)

**Check:** No primitive name exists in 2+ homes simultaneously.
**Scan:** Find files in `editor/shared/vibcoder/`, `shared/ui/`, `shared/extensions/` with same basename (excluding `.test.tsx`).
**Known:** Badge in vibcoder + shared/ui.

### 2. Keyframe duplicates (mechanical)

**Check:** Each `@keyframes <name>` defined exactly once across all CSS.
**Scan:** Grep `@keyframes` across `themes/`, `editor/`, count by name.
**Known:** bare `pulse`/`spin` in legacy-components.css duplicate `bd-status-pulse`/`bd-spin`.

### 3. Token alias SSOT (mechanical)

**Check:** Each `--bd-*` token defined in exactly one alias file.
**Scan:** Find all `--bd-X:` definitions in `themes/`. Cross-check `_aliases.css` and `bd-aliases.css` for overlap.
**Known:** Two alias files exist — overlap or complementary?

### 4. CSS selector duplicates (mechanical)

**Check:** Each `.bd-X` rule appears in exactly one CSS file. Multiple rules across files = ambiguity.
**Allowed exception:** layered overrides (e.g., `.bd-X:focus-visible` in `a11y.css` + base in tier file) — documented as intentional.

### 5. Three-home contract violations (judgment + scan)

**Check:** Per CLAUDE.md table, each concept's canonical home enforced.
**Scan candidates:**
- React component in `themes/components/` (wrong)
- CSS rule in vibcoder primitive instead of tier file (wrong)
- Buildrik-domain logic in vibcoder primitive (wrong → should be `shared/ui/`)
- Pure CSS pattern wrapped in React component (wrong → should be tier CSS)

### 6. Anti-pattern detection (mechanical + judgment)

**Check** per CLAUDE.md "ARCHITECTURE RULES":
- Pass-through wrapper functions
- Middle-man classes/components
- Pass-through React components
- Dead exports
- Mixed-responsibility files

**Scan:** ts-morph AST + grep for unused exports.

### 7. Legacy residual triage (judgment)

**Check:** every rule in `legacy-components.css` (72 LOC) has documented reason + can't move to tier CSS.
**Output:** per-rule annotation — "canonical engine selector" / "single-consumer chrome" / "should move to tier X" / "dead, delete".

### 8. CLAUDE.md doc-vs-reality drift (judgment)

**Check:** every claim in CLAUDE.md SSOT contract holds against current code.
**Output:** list of doc claims that no longer match reality + suggested CLAUDE.md edits.
**Known:** today's cleanup-history entry says "vibcoder fully implemented" but 4+ violations exist.

---

## 3. Phase Plan

### Phase 0 — Audit (1 PR, ~half-day)

**Output:** `docs/audits/2026-05-08-ds-ssot-audit.md` + `packages/editor/scripts/audit/ssot-scan.mjs`

**Scope:**
1. Implement 8 category scanners (each as function in `ssot-scan.mjs`)
2. Run full sweep
3. Author audit doc with categorized findings — each violation: file:line + suggested action + severity
4. Run Codex review on audit doc

**Severity rubric:**
- **Critical** — breaks functionality (dead consumer, runtime collision)
- **Important** — duplicate definitions, ambiguous source of truth, doc drift
- **Minor** — naming inconsistency, cosmetic

**Exit gate:** audit doc committed, Codex-reviewed, scanner script reusable for re-runs.

### Phase 1 — Gate scripts (1-2 PRs)

**Output:**
- `packages/editor/scripts/check-ds-ssot.mjs` — CI gate that runs the 4 mechanical-only checks (categories 1, 2, 3, 4)
- Optional: ESLint custom rules for inline checks
- Wire to CI alongside existing gates

**Per-PR shape:**
- PR α: gate script + tests + initial baseline (current violations as known-ignored)
- PR β (optional): ESLint rules

**Exit gate:** new gate runs in CI, blocks new violations even if existing ones grandfathered.

### Phase 2-N — Fix PRs by category (3-5 PRs)

**Order (smallest scope first):**

| PR | Category | Fix |
|---|---|---|
| 2 | Token alias consolidation | Merge `_aliases.css` + `bd-aliases.css`; pick canonical home, drop other |
| 3 | Keyframe deduplication | Drain bare `pulse`/`spin` from legacy-components.css; resolve `@keyframes buildrick-flash` |
| 4 | Badge dedupe | Pick canonical home, redirect/delete other, update consumers |
| 5 | Three-home + anti-pattern violations | Per Phase 0 findings, move/delete files. May split |
| 6 | Legacy residual triage | Annotate each rule in legacy-components.css. Move 1-2 obvious-relocates. Document final residual |

**Per-PR pattern:**
1. Read Phase 0 audit's violations for this category
2. Apply fix (rename/delete/relocate/consolidate)
3. Run tests (vitest + gate)
4. Visual smoke
5. Update gate baseline if needed
6. Commit

### Phase Final — Lock + memory + CLAUDE.md amendment (1 PR)

**Scope:**
1. Lock new gate to ERROR mode for fixed categories (no more new violations)
2. Update CLAUDE.md cleanup-history: amend prior arc's "vibcoder fully implemented" to reflect SSOT reality
3. Update CLAUDE.md SSOT contract section to reflect post-audit reality
4. Write memory file `project_ds_ssot_audit_arc_<date>.md` + index entry
5. Final gate run, all green

### Dependency graph

```
Phase 0 (audit) ──→ Phase 1 (gates, parallel after audit)
                ──→ Phase 2 (token aliases)
                ──→ Phase 3 (keyframes)
                ──→ Phase 4 (Badge)
                ──→ Phase 5 (three-home + anti-pattern)
                ──→ Phase 6 (legacy residual triage)
                                         ↓
                                  Phase Final (lock + docs + memory)
```

Phase 1 gates can ship in parallel with Phase 2-6.

### PR estimate

Phase 0 (1) + Phase 1 (1-2) + Phase 2-6 (5) + Phase Final (1) = **8-9 PRs**

---

## 4. Audit Doc Structure

**Path:** `docs/audits/2026-05-08-ds-ssot-audit.md`

```markdown
# DS SSOT Audit — 2026-05-08

**Status:** Phase 0 complete, Phase 1+ unblocked
**Scanner:** packages/editor/scripts/audit/ssot-scan.mjs (re-runnable)

## Summary

- Total violations: <N> (Critical: <a> · Important: <b> · Minor: <c>)
- Categories with violations: <X of 8>
- Estimated fix PRs: <Y>

## 1. Component-level duplicates

| File path A | File path B | Severity | Suggested fix |

## 2. Keyframe duplicates

| Keyframe name | Defined in (paths) | Identical? | Severity | Suggested fix |

## 3. Token alias SSOT

| Token | Defined in | Severity | Suggested fix |

## 4. CSS selector duplicates

| Selector | Defined in (paths) | Layered intentionally? | Severity | Suggested fix |

## 5. Three-home contract violations

| File | Current home | Suggested home | Reason | Severity |

## 6. Anti-pattern detection

| File | Pattern | Severity | Suggested fix |

## 7. Legacy residual triage

| Rule (file:line) | Reason kept | Move to tier? | Delete? | Severity |

## 8. CLAUDE.md doc-vs-reality drift

| CLAUDE.md claim (section, line) | Reality | Severity | Suggested edit |

## Cross-cutting summary

| Concern | Count | Worst severity | Fix arc PR |

## Codex review notes

(Filled after `/codex review`.)
```

**Format conventions:**
- Severity tags inline next to each row
- File paths absolute from repo root for grep-ability
- Suggested fixes specific enough that fix-PR implementer doesn't re-derive
- Cross-cutting summary maps audit findings to fix PR sequence

---

## 5. Gate Scripts

### `scripts/audit/ssot-scan.mjs` (Phase 0 — re-runnable)

Pure-Node script. Each category as a function returning `{ category, violations: [{path, line, severity, message, suggestion}] }`.

```js
#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, relative, basename, sep } from 'node:path';

function scanComponentDuplicates(root) { /* find primitive files with same name */ }
function scanKeyframeDuplicates(root) { /* grep @keyframes */ }
function scanTokenAliasSSOT(root) { /* grep --bd-* defs */ }
function scanSelectorDuplicates(root) { /* parse CSS for .bd-X rules */ }
function scanHomeContractViolations(root) { /* heuristic: file in wrong dir */ }
function scanAntiPatterns(root) { /* ts-morph wrappers/middlemen/dead exports */ }
function scanLegacyResiduals(root) { /* read legacy-components.css, classify each rule */ }
function scanDocDrift(root) { /* compare CLAUDE.md claims vs grep'd reality */ }

const ROOT = process.cwd();
const SCANS = [scanComponentDuplicates, scanKeyframeDuplicates, scanTokenAliasSSOT,
  scanSelectorDuplicates, scanHomeContractViolations, scanAntiPatterns,
  scanLegacyResiduals, scanDocDrift];

const results = SCANS.map((fn) => fn(ROOT));
const totalViolations = results.reduce((acc, r) => acc + r.violations.length, 0);

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(results, null, 2));
  process.exit(totalViolations > 0 ? 1 : 0);
}

for (const r of results) {
  console.log(`## ${r.category} (${r.violations.length})`);
  for (const v of r.violations) {
    console.log(`- [${v.severity}] ${v.path}:${v.line} — ${v.message}`);
    console.log(`  ${v.suggestion}`);
  }
}
process.exit(totalViolations > 0 ? 1 : 0);
```

Output formats:
- Default human-readable for audit doc population
- `--json` flag for CI gate consumption
- `--category=<n>` flag to scope during fix PRs

### `scripts/check-ds-ssot.mjs` (Phase 1 — CI gate)

Runs the 4 mechanical checks (categories 1-4). Compares to `scripts/baselines/ssot.json` (grandfathered violations).

```js
#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const BASELINE = resolve(ROOT, 'scripts/baselines/ssot.json');
const SCANNER = resolve(ROOT, 'scripts/audit/ssot-scan.mjs');

const out = execFileSync('node', [SCANNER, '--json', '--category=1,2,3,4'], {
  cwd: ROOT, encoding: 'utf8',
});
const live = JSON.parse(out);
const baseline = JSON.parse(readFileSync(BASELINE, 'utf8'));

// Compare violations live vs baseline
// New violations not in baseline → fail
// Removed violations → auto-ratchet baseline (write updated)
// Same → pass
// (gate logic similar shape to check-buildrick-baseline.mjs)
```

### `scripts/baselines/ssot.json`

```json
{
  "componentDuplicates": [{ "name": "Badge", "paths": ["editor/shared/vibcoder/Badge.tsx", "shared/ui/Badge.tsx"] }],
  "keyframeDuplicates": [{ "name": "pulse", "paths": [...] }],
  "tokenAliasSSOT": [...],
  "selectorDuplicates": [...]
}
```

Grandfathered violations listed. Gate fails on additions, auto-ratchets on removals.

### Optional ESLint custom rules (Phase 1 sub-task)

If desired:
- `no-duplicate-primitive-name`
- `no-pass-through-component`

Inline checks per-file. Optional.

### Test scripts

`scripts/__tests__/check-ds-ssot.test.mjs` — vitest tests covering:
1. Passes when violations match baseline exactly
2. Fails when new violation introduced
3. Auto-ratchets baseline when violation removed
4. Each of 4 mechanical checks independently testable
5. JSON output format stable
6. Severity labels correct

Pattern follows `check-buildrick-baseline.test.mjs` (uses `execFileSync`, no shell, tmp fixtures).

---

## 6. Fix PR Template

Each Phase 2-6 fix PR follows this shape.

### Per-fix-PR steps

1. **Read Phase 0 audit** for the category being fixed
2. **Re-run scanner scoped to category:**
   ```bash
   cd packages/editor && node scripts/audit/ssot-scan.mjs --category=<N>
   ```
3. **Apply fixes per violation:**
   - File rename / delete
   - Selector rename in lockstep with consumers
   - Content move between files
   - Document residuals when violation can't be cleanly fixed
4. **Run tests** — `npx vitest run`. Update tests referencing renamed identifiers
5. **Run gates:**
   - `node scripts/check-ds-ssot.mjs` (auto-ratchets)
   - `node scripts/check-buildrick-baseline.mjs` (no regression in prior arc)
6. **Visual smoke test** if any visual chrome changed
7. **Commit** per category with message `fix(ds-ssot): <category> — drained N violations`

### Per-category fix specifics

**Phase 2 — Token alias consolidation:**
- Compare `_aliases.css` and `bd-aliases.css` content
- If complementary: pick canonical home, move other's content there, delete other file
- If overlapping with conflicts: surface conflict, judgment call
- Update any `@import` paths
- Validate by grepping consumers

**Phase 3 — Keyframe deduplication:**
- Bare `pulse` in legacy-components.css: find consumers; rename to namespace OR migrate consumers; delete bare
- Same for `spin`
- `@keyframes buildrick-flash`: find consumers (per memory PR γ — `useElementFlash.ts` + `dragDrop/animations.ts`). Rename to `bd-element-flash` + update consumers OR confirm canonical

**Phase 4 — Badge dedupe:**
- Read both Badge.tsx files — what differs?
- Apply three-home admission test → pick canonical home
- Update consumers (grep `import.*Badge`)
- Delete other Badge file + tests + gallery refs

**Phase 5 — Three-home + anti-pattern violations:**
- Per Phase 0 findings, may be 1 PR or split
- Per violation: file move (`git mv`), update imports, lockstep test/CSS

**Phase 6 — Legacy residual triage:**
- Open `legacy-components.css`, walk every rule
- Add `/* keep: <reason> */` annotation per rule
- For obvious-move candidates: relocate, update `@import` if needed
- Document residual as "permanent" with reason

### Common pitfalls (from prior arc)

- **Inventory undercount risk** — scanner is regex-based; cross-check with grep
- **CSS-side scan included this time** — Phase 0 explicitly scans CSS files for categories 2/3/4
- **Storage key avoidance** — Decision 1A still holds, no fix PR touches them
- **Cross-folder coordination** — animation refs taught us cross-folder rename arcs need scope acknowledgment
- **Codemod hygiene** — if AST work needed, codemod committed + deleted same PR

### What NOT to do per fix PR

- No new vibcoder primitives (own arc)
- No tier reclassification (separate concern)
- No CLAUDE.md edits beyond strictly-needed (Phase Final consolidates)
- No refactor of unrelated code touched in passing
- No comments explaining what you did (commit message has the why)

---

## 7. Out of Scope + Risks

### Out of scope (called out, mirrors prior arc)

| Item | Why excluded |
|------|--------------|
| Site-builder DS at `editor/design-system/` | Different domain (user output, not chrome) |
| `.buildrick-*` storage keys (~27 sites) | Decision 1A holds — user data risk |
| Engine-emitted canonical refs | Engine emits these; renaming breaks editor |
| Tier reclassification (atom vs molecule) | Different concern — design judgment, separate |
| Vibcoder primitive rewrites | Out of scope — only fix duplicates and consolidate |
| Naming convention churn (`bd-X` → prettier name) | Cosmetic |
| ESLint rules (Phase 1 optional sub-task) | Optional, can defer |
| Dashboard package SSOT | Out of scope per Q2-A |
| Hex token gate (DS V1 hex baseline) | Separate gate, separate arc |
| ESLint baseline (1033 violations) | Separate gate, separate arc |
| Site-builder hex/token violations | Separate domain |

### Risks + mitigations

**Risk 1 — Scanner false positives.**
Categories 5-8 require judgment. Scanner could flag intentional patterns.
*Mitigation:* Phase 0 audit doc explicitly marks ambiguous calls. Codex review catches misclassifications.

**Risk 2 — Scanner false negatives.**
Regex-based scanner has same blind spots as buildrick gate.
*Mitigation:* Cross-check with manual grep during audit. Audit doc acknowledges scanner is "best-effort, not exhaustive."

**Risk 3 — Fix PRs cross-affect each other.**
Consolidating aliases (Phase 2) might shift token references that Phase 4 relies on.
*Mitigation:* Each fix PR re-runs scanner. Phases ship in defined order.

**Risk 4 — Badge consumers break silently after dedupe.**
If vibcoder Badge has different API than shared/ui Badge, consumers break.
*Mitigation:* Phase 4 includes consumer-by-consumer review + API diff before commit. May reveal sub-naming needed.

**Risk 5 — `legacy-components.css` triage produces no movements.**
Phase 6 might find every rule has legitimate reason to stay. No LOC reduction.
*Mitigation:* Acceptable — doc-everything pass is the value.

**Risk 6 — Doc drift accumulates again post-arc.**
*Mitigation:* Phase 1 gate prevents new mechanical violations. Categories 5-8 not auto-detected — periodic re-run of scanner. "Run SSOT scanner before any DS-arc spec."

**Risk 7 — Codex disagrees with audit classifications.**
*Mitigation:* Audit doc passes Codex review BEFORE Phase 1 begins.

**Risk 8 — Scope creep into "while I'm here" cleanup.**
*Mitigation:* Constraints section per-PR explicit. CLAUDE.md "Don'ts" rules apply.

### Memory + CLAUDE.md updates required (Phase Final)

1. New memory file: `project_ds_ssot_audit_arc_<date>.md`
2. New `MEMORY.md` index entry
3. CLAUDE.md "Cleanup history" entry — date + commit SHA + violation count drained
4. CLAUDE.md SSOT contract section — amend any aspirational claims
5. CLAUDE.md "Forbidden moves" — confirm/add gate-script enforcement row
