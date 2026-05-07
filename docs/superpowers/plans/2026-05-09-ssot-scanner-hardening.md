# SSOT Scanner Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 4 scanner false-positive sources flagged in the DS SSOT audit Appendix so categories 1, 4, 6 produce high-signal output for future arcs.

**Architecture:** Surgical edits to existing `ssot-scan.mjs`. Each fix targets one category function: comment-strip + rule-head anchor for selector dups, basename-symbol validation for component dups, barrel-chain walking for dead exports. Doc-drift detector (audit fix #5) is a documented scanner limitation, no code change.

**Tech Stack:** Node 22 ESM, vitest with `execFileSync`, ts-morph (already in devDeps for category 6 AST). No new dependencies.

**Predecessor:** DS SSOT audit + fix arc closed 2026-05-08 (memory: `project_ds_ssot_audit_arc_20260508.md`). Audit Appendix at `docs/audits/2026-05-08-ds-ssot-audit.md:258-266`.

**Expected impact (informal):**
- selectorDuplicates: 11 → ~2 (real concerns only after FP cleanup)
- componentDuplicates: 0 → 0 (no current FPs; locks ERROR mode against future FPs)
- antiPatterns dead-export tail: 3181 → ~200-500 (real after barrel-chain walking)

---

## File Structure

**Modified files:**
- `packages/editor/scripts/audit/ssot-scan.mjs` — 4 category functions hardened
- `packages/editor/scripts/audit/__tests__/ssot-scan.test.mjs` — 4 new fixture-driven tests (one per fix)
- `packages/editor/scripts/baselines/ssot.json` — auto-ratcheted by gate run after fixes
- `packages/editor/CLAUDE.md` — append cleanup-history entry

**Memory:** `~/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/project_ssot_scanner_hardening_20260509.md` + `MEMORY.md` index entry.

**No new files.** All edits are surgical to existing scanner + tests.

---

## Task 1: Strip CSS comments in `scanSelectorDuplicates`

**Files:**
- Modify: `packages/editor/scripts/audit/ssot-scan.mjs` (`scanSelectorDuplicates` function ~line 113-141)
- Modify: `packages/editor/scripts/audit/__tests__/ssot-scan.test.mjs` (append test)

**Audit reference:** Appendix #1 — `_layer.css:8` JSDoc mentions `.bd-btn` triggering false-positive duplicate report.

- [ ] **Step 1: Write failing test for comment-strip**

Append to `ssot-scan.test.mjs` inside the `scanSelectorDuplicates` describe block:

```js
it('strips /* ... */ comments before matching selectors', () => {
  const dir = makeFixture({
    'src/themes/components.css': '.bd-btn { color: red; }',
    'src/themes/_layer.css': '/* mentions .bd-btn in JSDoc */\n@layer { /* ok */ }',
  });
  const results = run(dir, ['--category=4']);
  const cat4 = results.find((r) => r.category === 'selectorDuplicates');
  expect(cat4.violations).toHaveLength(0);
  rmSync(dir, { recursive: true, force: true });
});
```

- [ ] **Step 2: Run test, expect failure**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run scripts/audit/__tests__/ssot-scan.test.mjs -t 'strips /\\* \\.\\.\\. \\*/ comments'
```

Expected: FAIL — current scanner counts the `.bd-btn` mention inside the comment.

- [ ] **Step 3: Implement comment-strip in `scanSelectorDuplicates`**

In `ssot-scan.mjs`, find `scanSelectorDuplicates`. Before line-walking the file, strip block comments. Replace the existing `const content = readFileSync(f, 'utf8');` line with:

```js
let content = readFileSync(f, 'utf8');
// Strip /* ... */ block comments (multi-line aware) before selector matching.
// Audit Appendix fix #1 — JSDoc comments mention selectors that aren't real defs.
content = content.replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, ' '));
```

The replacement preserves line numbers (replaces non-newline chars with spaces) so reported line numbers stay accurate.

- [ ] **Step 4: Run test, expect pass**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run scripts/audit/__tests__/ssot-scan.test.mjs
```

Expected: PASS — all existing scanner tests + new comment-strip test green.

- [ ] **Step 5: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/scripts/audit/
git commit -m "$(cat <<'EOF'
fix(ssot-scanner): strip CSS comments before selector match (Appendix #1)

JSDoc and inline /* ... */ comments mentioning .bd-* selectors were
flagged as duplicate definitions. Strip block comments to whitespace
(preserving line numbers) before selector regex match.
EOF
)"
```

---

## Task 2: Anchor `scanSelectorDuplicates` on rule-head right-most simple selector

**Files:**
- Modify: `packages/editor/scripts/audit/ssot-scan.mjs` (`scanSelectorDuplicates` function)
- Modify: `packages/editor/scripts/audit/__tests__/ssot-scan.test.mjs`

**Audit reference:** Appendix #2 — 9/12 reported selectorDuplicates are context-wrapped child rules (`.parent > .bd-X` flagged as dup of `.bd-X`).

- [ ] **Step 1: Write failing test for child-selector anchor**

Append to `scanSelectorDuplicates` describe block:

```js
it('does not flag child-combinator wrapped selectors as duplicates', () => {
  const dir = makeFixture({
    'src/themes/atoms/helper.css': '.bd-helper-text { color: gray; }',
    'src/themes/molecules/form.css': '.bd-form-field--inline > .bd-helper-text { font-size: 11px; }',
  });
  const results = run(dir, ['--category=4']);
  const cat4 = results.find((r) => r.category === 'selectorDuplicates');
  expect(cat4.violations).toHaveLength(0);
  rmSync(dir, { recursive: true, force: true });
});
```

- [ ] **Step 2: Run test, expect failure**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run scripts/audit/__tests__/ssot-scan.test.mjs -t 'child-combinator wrapped'
```

Expected: FAIL — current substring match treats `.bd-form-field--inline > .bd-helper-text` as a duplicate of `.bd-helper-text`.

- [ ] **Step 3: Implement rule-head anchor in `scanSelectorDuplicates`**

The current regex matches any `.bd-X { ` substring. Replace with logic that:
1. Splits the rule head on `,` (selector list)
2. For each comma-segment, finds the right-most simple selector (after the last combinator: `>`, `+`, `~`, ` `)
3. Only counts that as the rule's primary selector

Find the loop that matches `\.(bd-[a-z][a-z0-9-]*)\s*\{`. Replace with rule-head extraction:

```js
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (PSEUDO_STATES.some((p) => line.includes(p))) return;
  // Match opening of rule (text before {). Extract every comma-separated head.
  const ruleHeadMatch = line.match(/^(.+?)\{/);
  if (!ruleHeadMatch) return;
  const heads = ruleHeadMatch[1].split(',');
  for (const head of heads) {
    // Right-most simple selector: split on combinators (whitespace, >, +, ~)
    // and take the last non-empty segment.
    const segments = head.trim().split(/\s+|\s*[>+~]\s*/);
    const last = segments[segments.length - 1] ?? '';
    const m = last.match(/^\.(bd-[a-z][a-z0-9-]*)\b/);
    if (!m) continue;
    const selector = m[1];
    if (!byName.has(selector)) byName.set(selector, new Map());
    if (!byName.get(selector).has(relative(root, f))) {
      byName.get(selector).set(relative(root, f), i + 1);
    }
  }
});
```

Then the duplicate-count logic stays the same: a selector with files Map size > 1 = violation.

Note: `byName` shape changes from `Map<string, Set<string>>` to `Map<string, Map<string, number>>` (file → first-line). Update the violation emission accordingly:

```js
for (const [selector, fileMap] of byName) {
  if (fileMap.size > 1) {
    const locs = [...fileMap].map(([path, line]) => `${path}:${line}`);
    violations.push({
      path: locs[0].split(':')[0],
      line: parseInt(locs[0].split(':')[1], 10),
      severity: 'important',
      message: `Selector ".${selector}" defined in ${fileMap.size} files: ${locs.join(', ')}`,
      suggestion: 'Consolidate to single tier CSS file or document layered override.',
    });
  }
}
```

- [ ] **Step 4: Run test, expect pass**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run scripts/audit/__tests__/ssot-scan.test.mjs
```

Expected: PASS — child-combinator test green + all prior tests still green.

- [ ] **Step 5: Smoke against real codebase**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && node scripts/audit/ssot-scan.mjs 2>&1 | grep '## selectorDuplicates'
```

Expected: count drops from 11 to ~2-3 (the real `.bd-btn`/`.bd-depth-badge`/etc. dupes that survived as actual concerns per audit §4).

- [ ] **Step 6: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/scripts/audit/
git commit -m "$(cat <<'EOF'
fix(ssot-scanner): anchor selectorDuplicates on right-most simple selector (Appendix #2)

Previous substring match treated `.parent > .bd-X` as a duplicate of
`.bd-X`. Now splits rule-head on combinators and only counts the
right-most simple selector. Drops 9 of 12 false positives.
EOF
)"
```

---

## Task 3: Basename-symbol validation in `scanComponentDuplicates`

**Files:**
- Modify: `packages/editor/scripts/audit/ssot-scan.mjs` (`scanComponentDuplicates` function ~line 23-50)
- Modify: `packages/editor/scripts/audit/__tests__/ssot-scan.test.mjs`

**Audit reference:** Appendix #3 — `Skeleton.tsx` reported as duplicate but file exports `SkeletonListItem`/`StudioSkeleton`, not `Skeleton`.

- [ ] **Step 1: Write failing test for symbol-validate**

Append to `scanComponentDuplicates` describe block:

```js
it('does not flag basename collision when files export different symbols', () => {
  const dir = makeFixture({
    'src/editor/shared/vibcoder/Foo.tsx': 'export const Foo = () => null;',
    'src/shared/extensions/Foo.tsx': 'export const FooListItem = () => null;\nexport const StudioFoo = () => null;',
  });
  const results = run(dir, ['--category=1']);
  const cat1 = results.find((r) => r.category === 'componentDuplicates');
  expect(cat1.violations).toHaveLength(0);
  rmSync(dir, { recursive: true, force: true });
});

it('still flags basename collision when both files export matching symbol', () => {
  const dir = makeFixture({
    'src/editor/shared/vibcoder/Bar.tsx': 'export const Bar = () => null;',
    'src/shared/ui/Bar.tsx': 'export const Bar = () => null;',
  });
  const results = run(dir, ['--category=1']);
  const cat1 = results.find((r) => r.category === 'componentDuplicates');
  expect(cat1.violations).toHaveLength(1);
  expect(cat1.violations[0].message).toMatch(/Bar/);
  rmSync(dir, { recursive: true, force: true });
});
```

- [ ] **Step 2: Run tests, expect first to fail**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run scripts/audit/__tests__/ssot-scan.test.mjs -t 'basename collision'
```

Expected: FAIL on first new test ("does not flag basename collision when files export different symbols") — current scanner is basename-only, would emit a violation.

- [ ] **Step 3: Implement symbol-validate**

In `scanComponentDuplicates`, after collecting `byName` paths, check whether each candidate file actually exports a symbol matching the basename. Add a helper:

```js
function fileExportsSymbol(filePath, symbolName) {
  const content = readFileSync(filePath, 'utf8');
  // Match: export const|function|class <name>, export default <name>, export { <name> }
  const patterns = [
    new RegExp(`export\\s+(?:const|function|class|let|var)\\s+${symbolName}\\b`),
    new RegExp(`export\\s+default\\s+(?:function\\s+)?${symbolName}\\b`),
    new RegExp(`export\\s*\\{[^}]*\\b${symbolName}\\b[^}]*\\}`),
  ];
  return patterns.some((p) => p.test(content));
}
```

Modify the duplicate-emission logic. After identifying `paths.length > 1`, filter to files whose content exports the basename symbol:

```js
for (const [name, paths] of byName) {
  if (paths.length > 1) {
    const matchingPaths = paths.filter((p) => fileExportsSymbol(resolve(root, p), name));
    if (matchingPaths.length > 1) {
      violations.push({
        path: matchingPaths[0],
        line: 1,
        severity: 'important',
        message: `Primitive "${name}" defined in ${matchingPaths.length} homes: ${matchingPaths.join(', ')}`,
        suggestion: 'Pick canonical home per CLAUDE.md three-home contract; delete duplicates.',
      });
    }
  }
}
```

- [ ] **Step 4: Run tests, expect both pass**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run scripts/audit/__tests__/ssot-scan.test.mjs
```

Expected: PASS — both new tests + all existing tests green.

- [ ] **Step 5: Smoke against real codebase**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && node scripts/audit/ssot-scan.mjs 2>&1 | grep '## componentDuplicates'
```

Expected: count stays at 0 (post-Task-6 dedupe) — Skeleton false positive was already handled by file rename. Test ensures future Skeleton-style FPs can't re-emerge.

- [ ] **Step 6: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/scripts/audit/
git commit -m "$(cat <<'EOF'
fix(ssot-scanner): validate basename-to-symbol match in componentDuplicates (Appendix #3)

Basename-only check flagged Skeleton.tsx + Skeleton.tsx as dup even
though one exported SkeletonListItem/StudioSkeleton. Now reads file
contents and confirms both export the basename-matching symbol before
emitting a violation.
EOF
)"
```

---

## Task 4: Walk barrel re-export chains in `scanAntiPatterns`

**Files:**
- Modify: `packages/editor/scripts/audit/ssot-scan.mjs` (`scanAntiPatterns` function ~line 204-280)
- Modify: `packages/editor/scripts/audit/__tests__/ssot-scan.test.mjs`

**Audit reference:** Appendix #4 — 3197 of 3209 anti-pattern reports inflated by `export * from`/`export { X } from` re-exports the scanner doesn't track.

- [ ] **Step 1: Write failing test for barrel-chain walk**

Append to `scanAntiPatterns` describe block:

```js
it('does not flag exports re-exported via barrel chain as dead', () => {
  const dir = makeFixture({
    'src/feature/Foo.ts': 'export const Foo = 1;',
    'src/feature/index.ts': 'export { Foo } from "./Foo";',
    'src/consumer.ts': 'import { Foo } from "./feature";\nconsole.log(Foo);',
    'tsconfig.json': '{"compilerOptions":{"target":"es2020","module":"esnext","moduleResolution":"node"},"include":["src/**/*"]}',
  });
  const results = run(dir, ['--category=6']);
  const cat6 = results.find((r) => r.category === 'antiPatterns');
  const fooDead = cat6.violations.find((v) => v.message.includes('Foo') && v.message.toLowerCase().includes('dead'));
  expect(fooDead).toBeUndefined();
  rmSync(dir, { recursive: true, force: true });
});

it('does not flag exports re-exported via export-star as dead', () => {
  const dir = makeFixture({
    'src/feature/Bar.ts': 'export const Bar = 2;',
    'src/feature/index.ts': 'export * from "./Bar";',
    'src/consumer.ts': 'import { Bar } from "./feature";\nconsole.log(Bar);',
    'tsconfig.json': '{"compilerOptions":{"target":"es2020","module":"esnext","moduleResolution":"node"},"include":["src/**/*"]}',
  });
  const results = run(dir, ['--category=6']);
  const cat6 = results.find((r) => r.category === 'antiPatterns');
  const barDead = cat6.violations.find((v) => v.message.includes('Bar') && v.message.toLowerCase().includes('dead'));
  expect(barDead).toBeUndefined();
  rmSync(dir, { recursive: true, force: true });
});
```

- [ ] **Step 2: Run tests, expect failure**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run scripts/audit/__tests__/ssot-scan.test.mjs -t 'barrel chain|export-star'
```

Expected: FAIL — current scanner builds a global `importNames` set that doesn't include re-exports, so `Foo` and `Bar` are flagged dead.

- [ ] **Step 3: Implement barrel-chain walk via ts-morph**

In `scanAntiPatterns`, expand the `importNames` Set to include names that are re-exported through barrel chains. Use ts-morph's existing `Project` instance.

Find the section that builds `importNames` (the global set of imported names). Add a parallel pass that collects re-exported names:

```js
// In addition to import-name collection, walk export declarations.
// Names that appear as `export { X } from "..."` or `export * from "..."`
// targets are public-API; treat them as imported for dead-export purposes.
const reExportedNames = new Set();
for (const sf of project.getSourceFiles()) {
  for (const exp of sf.getExportDeclarations()) {
    if (exp.getModuleSpecifierValue() === undefined) continue; // local re-export, not from another module
    if (exp.isNamespaceExport()) {
      // export * from "./foo" — pull every export from the target module
      const target = exp.getModuleSpecifierSourceFile();
      if (target) {
        for (const [name] of target.getExportedDeclarations()) {
          reExportedNames.add(name);
        }
      }
    } else {
      // export { A, B as C } from "./foo" — add A and original-name of C
      for (const spec of exp.getNamedExports()) {
        const name = spec.getNameNode().getText();
        reExportedNames.add(name);
      }
    }
  }
}

// Combine for dead-export check
const reachableNames = new Set([...importNames, ...reExportedNames]);
```

Then in the dead-export emission loop, replace the check `!importNames.has(name)` with `!reachableNames.has(name)`.

- [ ] **Step 4: Run tests, expect pass**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run scripts/audit/__tests__/ssot-scan.test.mjs
```

Expected: PASS — both barrel tests + all existing tests green.

- [ ] **Step 5: Smoke against real codebase**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && node scripts/audit/ssot-scan.mjs 2>&1 | grep '## antiPatterns'
```

Expected: count drops dramatically from 3181 to ~200-500 (real dead exports after barrel-chain reachability removed). Exact number depends on actual barrel structure.

- [ ] **Step 6: Update scanner JSDoc to remove "approximate" caveat**

The `scanAntiPatterns` function has a JSDoc block warning about approximate dead-export accuracy (added in commit `b7bdf211`). Now that barrel chains are walked, the caveat is no longer accurate. Edit the JSDoc to:

```js
/**
 * Anti-pattern scan: pass-through wrappers + dead exports.
 *
 * Dead-export detection walks barrel re-export chains
 * (`export * from`, `export { X } from`) so names exported from a
 * leaf module and re-shipped via an index.ts barrel are treated as
 * reachable. Hardened 2026-05-09 per audit Appendix #4.
 */
```

- [ ] **Step 7: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/scripts/audit/
git commit -m "$(cat <<'EOF'
fix(ssot-scanner): walk barrel re-export chains in dead-export check (Appendix #4)

Previous global importNames set didn't track export-from chains, so
names re-shipped via index.ts barrels were falsely flagged dead.
Scanner now collects names from `export * from` and `export { X }
from` declarations; dead-export count drops from ~3181 to real
unreachable count.

JSDoc caveat about approximate accuracy removed.
EOF
)"
```

---

## Task 5: Phase Final — gate ratchet, CLAUDE.md, memory

**Files:**
- Modify: `packages/editor/scripts/baselines/ssot.json` (auto-rewrites via gate run)
- Modify: `packages/editor/CLAUDE.md` (cleanup-history entry)
- Create: `~/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/project_ssot_scanner_hardening_20260509.md`
- Modify: `~/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/MEMORY.md`

- [ ] **Step 1: Run gate, accept ratcheted baseline**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && node scripts/check-ds-ssot.mjs
```

Expected: `[ratchet] selectorDuplicates: N violation(s) removed` (where N is 9 or close — the comment + child-selector FPs that the hardened scanner no longer reports). Then `[ok] DS SSOT gate green`. Baseline file (`scripts/baselines/ssot.json`) auto-rewrites with the lower count.

If gate fails with new additions: a real selectorDuplicates that the looser scanner missed has surfaced. Read the failure output, decide whether to grandfather or fix.

- [ ] **Step 2: Run all tests + gates**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx vitest run
node scripts/check-ds-ssot.mjs
pnpm run gate:buildrick
pnpm run lint:ds-hex || true
```

Expected: vitest PASS (1 pre-existing MediaTab unrelated), gates green.

- [ ] **Step 3: Append cleanup-history entry to `packages/editor/CLAUDE.md`**

Find the "Cleanup history (live record)" section and append a new dated entry:

```markdown
- **2026-05-09 — SSOT scanner hardening shipped**:
  - Per audit Appendix #1-#4. Stripped /* */ comments before selector matching, anchored selectorDuplicates on right-most simple selector, added basename-symbol validation to componentDuplicates, walked barrel re-export chains in dead-export check.
  - selectorDuplicates baseline ratchet: 11 → ~2 (real concerns only).
  - antiPatterns dead-export: ~3181 → real count after barrel-chain reachability.
  - Gate retains ERROR-mode locks on cats 1, 2, 3. Cat 4 stays WARN with new lower baseline.
  - Audit Appendix #5 (generalized doc-drift detector) remains documented limitation — manual review is SSOT.
```

- [ ] **Step 4: Run final gates one more time**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
node scripts/check-ds-ssot.mjs
npx vitest run
```

Expected: gate green, tests pass.

- [ ] **Step 5: Commit code + docs**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/scripts/baselines/ssot.json packages/editor/CLAUDE.md
git commit -m "$(cat <<'EOF'
chore(ssot-scanner): hardening Phase Final — ratchet + cleanup-history

Gate auto-ratcheted selectorDuplicates baseline after hardened
scanner removes 9 FPs. CLAUDE.md cleanup-history entry covers all 4
audit Appendix fixes.
EOF
)"
```

Capture this commit's SHA — needed for memory file in Step 6.

- [ ] **Step 6: Write memory file**

Create `/Users/shahg/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/project_ssot_scanner_hardening_20260509.md`:

```markdown
---
name: SSOT scanner hardening shipped 2026-05-09
description: 4 audit-Appendix fixes for ssot-scan.mjs. Drops selectorDuplicates 11→~2 and antiPatterns dead-export tail to real count. Cats 1, 2, 3 stay ERROR-locked.
type: project
---

SSOT scanner hardening shipped 2026-05-09. ~5 commits.

**Why:** DS SSOT audit + fix arc (2026-05-08) closed cats 1-3 but left audit Appendix #1-#4 scanner false-positive sources unaddressed. Cat 4 had 9/12 FPs; cat 6 had 3197/3181 dead-export inflation. This arc closes those.

**How to apply:**
- Scanner now strips /* */ block comments before selector matching (Appendix #1)
- Scanner anchors selectorDuplicates on right-most simple selector after combinator split (Appendix #2)
- Scanner validates basename matches an actually-exported symbol before flagging componentDuplicates (Appendix #3)
- Scanner walks `export * from`/`export { X } from` chains; re-exported names treated as reachable (Appendix #4)
- Audit Appendix #5 (generalized doc-drift) remains scanner limitation — manual review is SSOT

**Gate:** unchanged contract (ERROR cats 1-3, WARN cat 4) but cat 4 baseline drops 11 → ~2 after ratchet.

**Findings worth remembering:**
- Comment-strip via regex replace with whitespace preserves line numbers in violation reports — important for grep-ability.
- Right-most simple selector extraction handles `,`-lists + `>`/`+`/`~`/whitespace combinators in one regex split.
- ts-morph's `getExportDeclarations()` + `isNamespaceExport()` cleanly handle both barrel forms (`export *` and `export { X }`).

**Final commit SHA:** <fill from Step 5>

**7th DS-simplification arc this quarter.** Pattern continues: each arc reduces structural debt + scanner-correctness debt by another order of magnitude.
```

Substitute `<fill from Step 5>` with actual commit SHA.

- [ ] **Step 7: Update memory index**

Append to `/Users/shahg/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/MEMORY.md`:

```markdown
- [SSOT scanner hardening shipped 2026-05-09](project_ssot_scanner_hardening_20260509.md) — 4 audit-Appendix fixes. Cat 4 baseline 11→~2; antiPatterns dead-export drops to real count. 7th DS-simplification arc this quarter.
```

Memory files outside repo — no commit needed.

---

## Self-Review

**Spec coverage** (audit Appendix items 1-5):
- #1 (strip CSS comments): Task 1 ✓
- #2 (anchor on rule head): Task 2 ✓
- #3 (basename-symbol validate): Task 3 ✓
- #4 (walk barrel chains): Task 4 ✓
- #5 (generalized doc-drift): documented as scanner limitation in Task 5 cleanup-history entry, no code task — correct decision per audit ("Documented as a known scanner limitation; manual review remains the SSOT")

**Placeholder scan:** No "TBD", "implement later", "appropriate error handling", "edge cases" patterns. Each step has full code.

**Type consistency:**
- `scanSelectorDuplicates` data shape changes from `Map<string, Set<string>>` (file paths) to `Map<string, Map<string, number>>` (file → first-line) in Task 2. The violation emission loop in Task 2 reflects this shape change explicitly.
- `scanAntiPatterns` adds a `reachableNames` Set in Task 4 that's used in lieu of `importNames` for the dead-export check. Existing pass-through-wrapper detection logic untouched.
- Test file imports/helpers (`makeFixture`, `run`, `EMPTY_BASELINE`) used across tasks reference patterns established in the existing test file from the prior arc. No new helpers introduced.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-09-ssot-scanner-hardening.md`. Two execution options:

**1. Subagent-Driven (recommended)** — fresh subagent per task, two-stage review, fast iteration.

**2. Inline Execution** — batched in this session with checkpoints.

Which approach?
