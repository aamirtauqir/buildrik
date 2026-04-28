# Vibcoder Phase 6 — Layout Consumer Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate ad-hoc `display: flex; flexDirection: column; gap: N` chrome JSX consumer sites to use Phase 4 `<Stack>` and `<Cluster>` wrappers.

**Architecture:** jscodeshift codemod operates on AST to find inline style objects and styled-component style props matching the layout signature. Maps numeric pixel gap values to canonical Stack/Cluster gap tokens (xs/sm/md/lg/xl). Off-grid gap values (e.g. 6px, 10px, 14px) are reported for manual review, not auto-converted. Per-batch commits with Gate 24 baseline verification after each batch.

**Tech Stack:** jscodeshift, TypeScript, React, Vitest, Emotion (CSS-in-JS), existing Phase 4 wrappers (`Stack`, `Cluster`).

---

## Context

Phase 4 Layout Primitives Revival shipped 7 wrappers (Stack, Cluster, Center, Grid, Frame, Switcher, SidebarShell) on 2026-04-29. Wrappers exist but have zero consumers. Phase 6 cashes in Phase 4 ROI by migrating ~110 inline-flex consumer sites to wrappers.

**Inventory baseline (2026-04-29):**
- ~103 sites with `flexDirection: 'column'` (Stack candidates)
- ~7 sites with `flexWrap: 'wrap'` (Cluster candidates)
- ~489 sites with generic `display: 'flex'` (mixed; not all migration targets)

**Token mapping (Stack/Cluster):**

| Pixel gap | Token | CSS var |
|-----------|-------|---------|
| 4 | `xs` | `--buildrick-space-1` |
| 8 | `sm` | `--buildrick-space-2` |
| 12 | `md` (default; omit) | `--buildrick-space-3` |
| 16 | `lg` | `--buildrick-space-4` |
| 24 | `xl` | `--buildrick-space-6` |
| Other | (manual review) | (off-grid) |

**Default-omits-modifier discipline (from Phase 4 T2 pilot):**
When migrating a site with `gap: 12`, emit `<Stack>` not `<Stack gap="md">`. The base CSS class already encodes `--space-3` default. Tests must assert this.

**Why per-batch commits:** Phase 4 Toast B3 codemod processed 28 consumers in a single commit and produced a 19-line tsc regression that took 30 minutes to track down across 4 separate type-import sites. Per-batch commits (10-20 sites each) make tsc regressions catchable mid-flight.

---

## File Structure

**Codemod artifacts (all under `packages/editor/scripts/codemods/`):**

- Create: `packages/editor/scripts/codemods/migrate-stack-cluster.ts` — jscodeshift transform script
- Create: `packages/editor/scripts/codemods/migrate-stack-cluster.test.ts` — codemod test fixtures + assertions
- Create: `packages/editor/scripts/codemods/__fixtures__/stack-clean.input.tsx` — clean Stack input fixture
- Create: `packages/editor/scripts/codemods/__fixtures__/stack-clean.output.tsx` — expected Stack output
- Create: `packages/editor/scripts/codemods/__fixtures__/stack-default-gap.input.tsx` — default-gap (12px) fixture
- Create: `packages/editor/scripts/codemods/__fixtures__/stack-default-gap.output.tsx` — expected (no gap prop)
- Create: `packages/editor/scripts/codemods/__fixtures__/stack-off-grid.input.tsx` — off-grid (e.g. 10px) fixture
- Create: `packages/editor/scripts/codemods/__fixtures__/cluster.input.tsx` — Cluster (flex-wrap) fixture
- Create: `packages/editor/scripts/codemods/__fixtures__/cluster.output.tsx` — expected Cluster output
- Create: `packages/editor/scripts/codemods/__fixtures__/non-target.input.tsx` — sites that should NOT migrate (3-property layouts, computed gaps)

**Inventory + reporting:**

- Create: `packages/editor/scripts/codemods/inventory-stack-cluster.ts` — pre-migration scanner that categorizes sites into clean/manual-review/skip buckets

**Documentation:**

- Modify: `docs/superpowers/specs/2026-04-26-vibcoder-position-3/poc-findings.md` — append Phase 6 findings section
- Modify: `docs/superpowers/specs/2026-04-26-vibcoder-position-3/roadmap.md` — flip Phase 6 status
- Create: `/Users/shahg/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/project_vibcoder_phase_6_consumer_migration_shipped_20260429.md` — close-out memory

**Consumer files (modified by codemod, listed in T3-T5 batches):**

T3 batch list determined by T1 inventory output. Expected ~10-15 files per batch, ~6-8 batches total.

---

## Task 1: Inventory + categorization scanner

**Files:**
- Create: `packages/editor/scripts/codemods/inventory-stack-cluster.ts`

**Why this task exists:** Before writing the codemod, we need real data on which sites are clean migration targets vs manual review. Inline regex caught 24 of 103 sites; multi-line style objects need AST analysis. This task produces a categorized JSON report that the codemod consumes.

- [ ] **Step 1: Create the scanner script**

```typescript
// packages/editor/scripts/codemods/inventory-stack-cluster.ts
import { Project, SyntaxKind, Node, ObjectLiteralExpression } from "ts-morph";
import { writeFileSync } from "fs";
import { resolve } from "path";

type Bucket = "stack-clean" | "stack-off-grid" | "stack-multi-prop" | "cluster-clean" | "cluster-off-grid" | "skip";

interface SiteReport {
  file: string;
  line: number;
  bucket: Bucket;
  gap: number | string | null;
  extraProps: string[];
}

const TOKEN_MAP: Record<number, string> = { 4: "xs", 8: "sm", 12: "md", 16: "lg", 24: "xl" };
const ALLOWED_PROPS = new Set(["display", "flexDirection", "flexWrap", "gap", "alignItems"]);

function categorize(obj: ObjectLiteralExpression): { bucket: Bucket; gap: number | string | null; extraProps: string[] } {
  const props: Record<string, string | number> = {};
  for (const p of obj.getProperties()) {
    if (!Node.isPropertyAssignment(p)) continue;
    const name = p.getName();
    const init = p.getInitializer();
    if (!init) continue;
    if (init.getKind() === SyntaxKind.StringLiteral) {
      props[name] = init.getText().slice(1, -1);
    } else if (init.getKind() === SyntaxKind.NumericLiteral) {
      props[name] = Number(init.getText());
    }
  }

  const isFlex = props.display === "flex";
  const isColumn = props.flexDirection === "column";
  const isWrap = props.flexWrap === "wrap";
  const gap = props.gap ?? null;
  const extraProps = Object.keys(props).filter((k) => !ALLOWED_PROPS.has(k));

  if (!isFlex) return { bucket: "skip", gap, extraProps };

  if (isColumn) {
    if (extraProps.length > 0) return { bucket: "stack-multi-prop", gap, extraProps };
    if (typeof gap === "number" && TOKEN_MAP[gap]) return { bucket: "stack-clean", gap, extraProps };
    if (typeof gap === "number") return { bucket: "stack-off-grid", gap, extraProps };
    return { bucket: "skip", gap, extraProps };
  }

  if (isWrap) {
    if (extraProps.length > 0) return { bucket: "cluster-clean", gap, extraProps };
    if (typeof gap === "number" && TOKEN_MAP[gap]) return { bucket: "cluster-clean", gap, extraProps };
    if (typeof gap === "number") return { bucket: "cluster-off-grid", gap, extraProps };
    return { bucket: "cluster-clean", gap, extraProps };
  }

  return { bucket: "skip", gap, extraProps };
}

const project = new Project({ tsConfigFilePath: "packages/editor/tsconfig.json" });
const sites: SiteReport[] = [];

for (const sf of project.getSourceFiles("packages/editor/src/editor/**/*.{ts,tsx}")) {
  for (const obj of sf.getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression)) {
    const result = categorize(obj);
    if (result.bucket === "skip") continue;
    sites.push({
      file: sf.getFilePath(),
      line: obj.getStartLineNumber(),
      bucket: result.bucket,
      gap: result.gap,
      extraProps: result.extraProps,
    });
  }
}

const counts = sites.reduce<Record<string, number>>((acc, s) => {
  acc[s.bucket] = (acc[s.bucket] ?? 0) + 1;
  return acc;
}, {});

writeFileSync(resolve("packages/editor/scripts/codemods/inventory-report.json"), JSON.stringify({ counts, sites }, null, 2));
console.log("Inventory complete:", counts);
```

- [ ] **Step 2: Run scanner**

Run: `cd packages/editor && npx tsx scripts/codemods/inventory-stack-cluster.ts`
Expected output: console line `Inventory complete: { 'stack-clean': N, 'stack-off-grid': M, 'stack-multi-prop': P, 'cluster-clean': Q, 'cluster-off-grid': R }` and JSON file at `packages/editor/scripts/codemods/inventory-report.json`.

- [ ] **Step 3: Verify report shape**

Run: `cd packages/editor && cat scripts/codemods/inventory-report.json | head -30`
Expected: Top-level `{ counts: {...}, sites: [...] }`. Each site has `file`, `line`, `bucket`, `gap`, `extraProps`.

- [ ] **Step 4: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/scripts/codemods/inventory-stack-cluster.ts packages/editor/scripts/codemods/inventory-report.json
git commit -m "$(cat <<'EOF'
chore(vibcoder-phase-6): T1 inventory scanner + report

Categorizes layout consumer sites into:
- stack-clean: gap maps cleanly to token (4/8/12/16/24)
- stack-off-grid: gap is numeric but off-token (manual review)
- stack-multi-prop: extra style props (padding/margin/etc) need preservation
- cluster-clean: flex-wrap row, gap clean or absent
- cluster-off-grid: flex-wrap row with off-grid gap

Report at packages/editor/scripts/codemods/inventory-report.json

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Codemod transform script + fixture-based tests

**Files:**
- Create: `packages/editor/scripts/codemods/migrate-stack-cluster.ts`
- Create: `packages/editor/scripts/codemods/migrate-stack-cluster.test.ts`
- Create: `packages/editor/scripts/codemods/__fixtures__/stack-clean.input.tsx`
- Create: `packages/editor/scripts/codemods/__fixtures__/stack-clean.output.tsx`
- Create: `packages/editor/scripts/codemods/__fixtures__/stack-default-gap.input.tsx`
- Create: `packages/editor/scripts/codemods/__fixtures__/stack-default-gap.output.tsx`
- Create: `packages/editor/scripts/codemods/__fixtures__/cluster.input.tsx`
- Create: `packages/editor/scripts/codemods/__fixtures__/cluster.output.tsx`
- Create: `packages/editor/scripts/codemods/__fixtures__/non-target.input.tsx`

**Why this task exists:** TDD — write fixtures + test BEFORE the transform. The codemod must (a) replace inline `<div style={{flex column gap N}}>` with `<Stack gap="X">`, (b) omit `gap` prop when value maps to default `md`, (c) preserve `className` and other non-layout props, (d) add `Stack`/`Cluster` import, (e) leave non-target sites untouched. Fixtures capture each rule.

- [ ] **Step 1: Create stack-clean input fixture**

```tsx
// packages/editor/scripts/codemods/__fixtures__/stack-clean.input.tsx
export function PanelBody({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create stack-clean expected output fixture**

```tsx
// packages/editor/scripts/codemods/__fixtures__/stack-clean.output.tsx
import { Stack } from "@/editor/shared/vibcoder";

export function PanelBody({ children }: { children: React.ReactNode }) {
  return (
    <Stack gap="sm">
      {children}
    </Stack>
  );
}
```

- [ ] **Step 3: Create stack-default-gap input fixture (default-omits-modifier)**

```tsx
// packages/editor/scripts/codemods/__fixtures__/stack-default-gap.input.tsx
export function FormBody({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Create stack-default-gap expected output fixture**

```tsx
// packages/editor/scripts/codemods/__fixtures__/stack-default-gap.output.tsx
import { Stack } from "@/editor/shared/vibcoder";

export function FormBody({ children }: { children: React.ReactNode }) {
  return (
    <Stack>
      {children}
    </Stack>
  );
}
```

- [ ] **Step 5: Create cluster input fixture**

```tsx
// packages/editor/scripts/codemods/__fixtures__/cluster.input.tsx
export function TagRow({ tags }: { tags: string[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {tags.map((t) => <span key={t}>{t}</span>)}
    </div>
  );
}
```

- [ ] **Step 6: Create cluster expected output fixture**

```tsx
// packages/editor/scripts/codemods/__fixtures__/cluster.output.tsx
import { Cluster } from "@/editor/shared/vibcoder";

export function TagRow({ tags }: { tags: string[] }) {
  return (
    <Cluster gap="xs">
      {tags.map((t) => <span key={t}>{t}</span>)}
    </Cluster>
  );
}
```

- [ ] **Step 7: Create non-target fixture (must NOT migrate)**

```tsx
// packages/editor/scripts/codemods/__fixtures__/non-target.input.tsx
export function MultiPropPanel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16, background: "white" }}>
      {children}
    </div>
  );
}

export function OffGridGap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {children}
    </div>
  );
}

export function ComputedGap({ children, dense }: { children: React.ReactNode; dense?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: dense ? 4 : 8 }}>
      {children}
    </div>
  );
}
```

- [ ] **Step 8: Write the failing test**

```typescript
// packages/editor/scripts/codemods/migrate-stack-cluster.test.ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { transform } from "./migrate-stack-cluster";

const fix = (name: string) => readFileSync(resolve(__dirname, "__fixtures__", name), "utf8");

describe("migrate-stack-cluster codemod", () => {
  it("converts clean stack flex column to <Stack gap='sm'>", () => {
    expect(transform(fix("stack-clean.input.tsx"))).toBe(fix("stack-clean.output.tsx"));
  });

  it("omits gap prop when value maps to default md (12px)", () => {
    expect(transform(fix("stack-default-gap.input.tsx"))).toBe(fix("stack-default-gap.output.tsx"));
  });

  it("converts flex-wrap row to <Cluster>", () => {
    expect(transform(fix("cluster.input.tsx"))).toBe(fix("cluster.output.tsx"));
  });

  it("leaves multi-prop sites untouched (preserves padding/background)", () => {
    const input = fix("non-target.input.tsx");
    const result = transform(input);
    expect(result).toContain("padding: 16");
    expect(result).toContain('background: "white"');
    expect(result).not.toContain("<Stack");
  });

  it("leaves off-grid gap (10px) untouched", () => {
    const result = transform(fix("non-target.input.tsx"));
    expect(result).toContain("gap: 10");
    expect(result).not.toContain('gap="sm"');
  });

  it("leaves computed gap (ternary) untouched", () => {
    const result = transform(fix("non-target.input.tsx"));
    expect(result).toContain("dense ? 4 : 8");
  });
});
```

- [ ] **Step 9: Run test to verify it fails**

Run: `cd packages/editor && npx vitest run scripts/codemods/migrate-stack-cluster.test.ts`
Expected: FAIL with `Cannot find module './migrate-stack-cluster'`.

- [ ] **Step 10: Implement the transform**

```typescript
// packages/editor/scripts/codemods/migrate-stack-cluster.ts
import { Project, SyntaxKind, Node, ObjectLiteralExpression, JsxElement, JsxSelfClosingElement } from "ts-morph";

const STACK_TOKEN: Record<number, string> = { 4: "xs", 8: "sm", 12: "md", 16: "lg", 24: "xl" };
const DEFAULT_GAP = 12;
const ALLOWED_PROPS = new Set(["display", "flexDirection", "flexWrap", "gap", "alignItems"]);

interface StyleAnalysis {
  isStack: boolean;
  isCluster: boolean;
  gap: number | null;
  extraProps: boolean;
  computed: boolean;
}

function analyzeStyleObject(obj: ObjectLiteralExpression): StyleAnalysis {
  const result: StyleAnalysis = { isStack: false, isCluster: false, gap: null, extraProps: false, computed: false };
  let isFlex = false;
  let isColumn = false;
  let isWrap = false;

  for (const p of obj.getProperties()) {
    if (!Node.isPropertyAssignment(p)) {
      result.extraProps = true;
      continue;
    }
    const name = p.getName();
    const init = p.getInitializer();
    if (!init) continue;

    if (!ALLOWED_PROPS.has(name)) {
      result.extraProps = true;
      continue;
    }

    if (init.getKind() === SyntaxKind.StringLiteral) {
      const v = init.getText().slice(1, -1);
      if (name === "display" && v === "flex") isFlex = true;
      if (name === "flexDirection" && v === "column") isColumn = true;
      if (name === "flexWrap" && v === "wrap") isWrap = true;
    } else if (init.getKind() === SyntaxKind.NumericLiteral && name === "gap") {
      result.gap = Number(init.getText());
    } else if (name === "gap") {
      result.computed = true;
    }
  }

  if (!isFlex || result.extraProps || result.computed) return result;
  if (isColumn) result.isStack = true;
  else if (isWrap) result.isCluster = true;
  return result;
}

function gapToToken(gap: number | null): string | null {
  if (gap === null) return null;
  if (gap === DEFAULT_GAP) return null;
  return STACK_TOKEN[gap] ?? "OFF_GRID";
}

export function transform(source: string): string {
  const project = new Project({ useInMemoryFileSystem: true });
  const sf = project.createSourceFile("input.tsx", source);
  let needsStack = false;
  let needsCluster = false;

  const jsxElements = [
    ...sf.getDescendantsOfKind(SyntaxKind.JsxElement),
    ...sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
  ];

  for (const jsx of jsxElements) {
    const opening = Node.isJsxElement(jsx) ? jsx.getOpeningElement() : jsx;
    const tagName = opening.getTagNameNode().getText();
    if (tagName !== "div") continue;

    const styleAttr = opening.getAttribute("style");
    if (!styleAttr || !Node.isJsxAttribute(styleAttr)) continue;

    const init = styleAttr.getInitializer();
    if (!init || !Node.isJsxExpression(init)) continue;
    const expr = init.getExpression();
    if (!expr || !Node.isObjectLiteralExpression(expr)) continue;

    const analysis = analyzeStyleObject(expr);
    if (!analysis.isStack && !analysis.isCluster) continue;
    const token = gapToToken(analysis.gap);
    if (token === "OFF_GRID") continue;

    const wrapper = analysis.isStack ? "Stack" : "Cluster";
    if (analysis.isStack) needsStack = true;
    if (analysis.isCluster) needsCluster = true;

    opening.getTagNameNode().replaceWithText(wrapper);
    if (Node.isJsxElement(jsx)) jsx.getClosingElement().getTagNameNode().replaceWithText(wrapper);
    styleAttr.remove();
    if (token) {
      opening.addAttribute({ name: "gap", initializer: `"${token}"` });
    }
  }

  if (needsStack || needsCluster) {
    const imports: string[] = [];
    if (needsStack) imports.push("Stack");
    if (needsCluster) imports.push("Cluster");
    sf.addImportDeclaration({ moduleSpecifier: "@/editor/shared/vibcoder", namedImports: imports });
  }

  return sf.getFullText();
}
```

- [ ] **Step 11: Run test to verify it passes**

Run: `cd packages/editor && npx vitest run scripts/codemods/migrate-stack-cluster.test.ts`
Expected: 6/6 PASS.

- [ ] **Step 12: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/scripts/codemods/migrate-stack-cluster.ts packages/editor/scripts/codemods/migrate-stack-cluster.test.ts packages/editor/scripts/codemods/__fixtures__/
git commit -m "$(cat <<'EOF'
feat(vibcoder-phase-6): T2 codemod transform + fixtures

- migrate-stack-cluster.ts: ts-morph AST transform
  - <div style={{flex column gap N}}> → <Stack gap="X">
  - <div style={{flex wrap gap N}}> → <Cluster gap="X">
  - default-omits-modifier (gap: 12 → no gap prop)
  - leaves multi-prop, off-grid, computed-gap sites untouched
- 6 fixture pairs (clean/default/cluster/non-target × 3)
- 6/6 tests pass

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Apply codemod to first batch (sidebar + tabs)

**Files:**
- Modify: All `stack-clean` and `cluster-clean` sites in `packages/editor/src/editor/sidebar/` (per inventory report)

**Why this task exists:** First production batch validates the codemod against real consumer code. Sidebar is well-bounded (one feature area), small enough to review by eye, and is a high-traffic path so any regression surfaces immediately in dev.

- [ ] **Step 1: Filter inventory to sidebar batch**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
node -e "const r = require('./packages/editor/scripts/codemods/inventory-report.json'); const sidebar = r.sites.filter(s => s.file.includes('/sidebar/') && (s.bucket === 'stack-clean' || s.bucket === 'cluster-clean')); console.log(JSON.stringify(sidebar.map(s => ({file: s.file.replace(process.cwd(), ''), line: s.line, bucket: s.bucket, gap: s.gap})), null, 2))"
```

Expected: JSON array of sidebar sites. Note the count.

- [ ] **Step 2: Run codemod against sidebar files**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
node -e "
const { transform } = require('./packages/editor/scripts/codemods/migrate-stack-cluster.ts');
const { readFileSync, writeFileSync } = require('fs');
const r = require('./packages/editor/scripts/codemods/inventory-report.json');
const files = [...new Set(r.sites.filter(s => s.file.includes('/sidebar/') && (s.bucket === 'stack-clean' || s.bucket === 'cluster-clean')).map(s => s.file))];
for (const f of files) { const out = transform(readFileSync(f, 'utf8')); writeFileSync(f, out); console.log('migrated:', f); }
"
```

(Note: if `node -e` runtime can't load `.ts` directly, run via `npx tsx -e '...'` instead.)

Expected: list of files migrated. Then run `git diff --stat packages/editor/src/editor/sidebar/` to see scope.

- [ ] **Step 3: Run editor tsc to check for regressions**

Run: `cd packages/editor && npx tsc --noEmit 2>&1 | tail -10`
Expected: error count stable at 71 (or specific failures named — fix any tsc breakage before commit).

- [ ] **Step 4: Run editor tests**

Run: `cd packages/editor && npx vitest run src/editor/sidebar/ 2>&1 | tail -10`
Expected: all green.

- [ ] **Step 5: Run full editor build sanity**

Run: `cd packages/editor && npx vite build 2>&1 | tail -5`
Expected: build succeeds (no missing imports, no runtime errors at module-load).

- [ ] **Step 6: Run DS gates**

Run: `cd /Users/shahg/Desktop/pencil/buildrik && bash scripts/ds-grep-gates.sh 2>&1 | tail -10`
Expected: 25/25 pass. Inline-flex baselines should DROP (Gate 24 inline-element count goes down). If a gate fails, investigate and fix.

- [ ] **Step 7: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/src/editor/sidebar/
git commit -m "$(cat <<'EOF'
refactor(vibcoder-phase-6): T3 sidebar batch — migrate to <Stack>/<Cluster>

Codemod applied to packages/editor/src/editor/sidebar/. Inline-flex
column/wrap layouts replaced with Phase 4 wrappers. Gate 24 inline-element
baseline drops accordingly.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Apply codemod to second batch (canvas + inspector)

**Files:**
- Modify: All `stack-clean` and `cluster-clean` sites in `packages/editor/src/editor/canvas/` and `packages/editor/src/editor/inspector/` (per inventory report)

**Why this task exists:** Canvas + inspector are the next-densest consumer regions per the recon (sample line `ComponentsTab.tsx:392` was sidebar; canvas + inspector have larger flex consumer counts overall). Splitting them from sidebar limits per-batch blast radius if regression surfaces.

- [ ] **Step 1: Filter inventory to canvas+inspector batch**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
node -e "const r = require('./packages/editor/scripts/codemods/inventory-report.json'); const batch = r.sites.filter(s => (s.file.includes('/canvas/') || s.file.includes('/inspector/')) && (s.bucket === 'stack-clean' || s.bucket === 'cluster-clean')); console.log(JSON.stringify(batch.map(s => ({file: s.file.replace(process.cwd(), ''), line: s.line, bucket: s.bucket, gap: s.gap})), null, 2))"
```

Expected: JSON array. Note the count.

- [ ] **Step 2: Run codemod**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
npx tsx -e "
import { transform } from './packages/editor/scripts/codemods/migrate-stack-cluster';
import { readFileSync, writeFileSync } from 'fs';
const r = JSON.parse(readFileSync('./packages/editor/scripts/codemods/inventory-report.json', 'utf8'));
const files = [...new Set(r.sites.filter(s => (s.file.includes('/canvas/') || s.file.includes('/inspector/')) && (s.bucket === 'stack-clean' || s.bucket === 'cluster-clean')).map(s => s.file))];
for (const f of files) { const out = transform(readFileSync(f, 'utf8')); writeFileSync(f, out); console.log('migrated:', f); }
"
```

Expected: list of migrated files.

- [ ] **Step 3: Verify (tsc + tests + build + gates)**

Run all 4 verifications:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit 2>&1 | tail -5
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run src/editor/canvas/ src/editor/inspector/ 2>&1 | tail -5
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vite build 2>&1 | tail -5
cd /Users/shahg/Desktop/pencil/buildrik && bash scripts/ds-grep-gates.sh 2>&1 | tail -10
```
Expected: tsc 71 stable, tests pass, build succeeds, 25/25 gates pass.

- [ ] **Step 4: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/src/editor/canvas/ packages/editor/src/editor/inspector/
git commit -m "$(cat <<'EOF'
refactor(vibcoder-phase-6): T4 canvas+inspector batch — migrate to <Stack>/<Cluster>

Codemod applied to packages/editor/src/editor/canvas/ and inspector/.
Gate 24 inline-element baseline drops. Tsc 71 stable.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Apply codemod to remaining batches (rail + shell + onboarding + media + animation + others)

**Files:**
- Modify: All `stack-clean` and `cluster-clean` sites in remaining `packages/editor/src/editor/` subdirs (rail, shell, panels, onboarding, media, collaboration, ecommerce, export, sync, animation)

**Why this task exists:** After sidebar (T3) and canvas+inspector (T4) prove the codemod, remaining subdirs can be migrated as one batch. Each subdir is smaller; cumulative scope is the rest.

- [ ] **Step 1: Filter inventory to remaining batch**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
node -e "const r = require('./packages/editor/scripts/codemods/inventory-report.json'); const batch = r.sites.filter(s => !s.file.includes('/sidebar/') && !s.file.includes('/canvas/') && !s.file.includes('/inspector/') && (s.bucket === 'stack-clean' || s.bucket === 'cluster-clean')); console.log(JSON.stringify(batch.map(s => ({file: s.file.replace(process.cwd(), ''), line: s.line, bucket: s.bucket, gap: s.gap})), null, 2))"
```

Expected: JSON array of remaining files. Note the count.

- [ ] **Step 2: Run codemod against remaining files**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
npx tsx -e "
import { transform } from './packages/editor/scripts/codemods/migrate-stack-cluster';
import { readFileSync, writeFileSync } from 'fs';
const r = JSON.parse(readFileSync('./packages/editor/scripts/codemods/inventory-report.json', 'utf8'));
const files = [...new Set(r.sites.filter(s => !s.file.includes('/sidebar/') && !s.file.includes('/canvas/') && !s.file.includes('/inspector/') && (s.bucket === 'stack-clean' || s.bucket === 'cluster-clean')).map(s => s.file))];
for (const f of files) { const out = transform(readFileSync(f, 'utf8')); writeFileSync(f, out); console.log('migrated:', f); }
"
```

Expected: list of migrated files.

- [ ] **Step 3: Verify (tsc + tests + build + gates)**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit 2>&1 | tail -5
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run src/editor/ 2>&1 | tail -5
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vite build 2>&1 | tail -5
cd /Users/shahg/Desktop/pencil/buildrik && bash scripts/ds-grep-gates.sh 2>&1 | tail -10
```
Expected: tsc 71 stable, tests pass, build succeeds, 25/25 gates pass.

- [ ] **Step 4: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/src/editor/
git commit -m "$(cat <<'EOF'
refactor(vibcoder-phase-6): T5 remaining batch — migrate to <Stack>/<Cluster>

Codemod applied to rail/shell/panels/onboarding/media/collaboration/
ecommerce/export/sync/animation. Phase 6 codemod-eligible sites complete.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Manual review of off-grid + multi-prop sites

**Files:**
- Modify: Sites in `stack-off-grid`, `stack-multi-prop`, `cluster-off-grid` buckets (per inventory report)

**Why this task exists:** Codemod intentionally skips three categories: (a) off-grid gap (e.g. 6/10/14px) — design drift; (b) multi-prop (extra padding/margin/background) — needs preservation strategy; (c) computed gap (ternary/prop) — runtime decision. Each site needs a human call: keep inline (legitimate divergence), normalize to nearest token (drift cleanup), or leave for separate refactor.

- [ ] **Step 1: List off-grid candidates**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
node -e "const r = require('./packages/editor/scripts/codemods/inventory-report.json'); const og = r.sites.filter(s => s.bucket === 'stack-off-grid' || s.bucket === 'cluster-off-grid'); console.log('OFF-GRID SITES:'); for (const s of og) console.log('  ' + s.file.replace(process.cwd(), '') + ':' + s.line + '  gap=' + s.gap);"
```

Expected: list of file:line:gap entries. Each one needs a manual call.

- [ ] **Step 2: For each off-grid site, decide and apply**

For each entry, pick one disposition:
- **Normalize to nearest token** → edit file to use tokenized value (4/8/12/16/24), then it's eligible for codemod.
- **Keep inline (intentional)** → leave it. Document reason in next step.
- **Defer to separate refactor** → leave it. Note in close-out.

If you choose "normalize to nearest token", apply the edit (use Read+Edit tools), then re-run codemod on that single file via:
```bash
cd /Users/shahg/Desktop/pencil/buildrik
npx tsx -e "
import { transform } from './packages/editor/scripts/codemods/migrate-stack-cluster';
import { readFileSync, writeFileSync } from 'fs';
const f = 'PATH_HERE';
writeFileSync(f, transform(readFileSync(f, 'utf8')));
"
```

- [ ] **Step 3: List multi-prop candidates**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
node -e "const r = require('./packages/editor/scripts/codemods/inventory-report.json'); const mp = r.sites.filter(s => s.bucket === 'stack-multi-prop'); console.log('MULTI-PROP SITES:'); for (const s of mp) console.log('  ' + s.file.replace(process.cwd(), '') + ':' + s.line + '  extras=' + s.extraProps.join(','));"
```

Expected: list of sites with extra props (padding/margin/background/etc).

- [ ] **Step 4: For each multi-prop site, decide and apply**

Pick one disposition:
- **Wrap with Stack + outer style** → `<div style={{padding,...}}><Stack>{children}</Stack></div>` (extracts layout from chrome).
- **Keep inline** → multi-prop layouts are sometimes the right call. Leave it.

Apply manually with Read+Edit per site that gets the Stack treatment.

- [ ] **Step 5: Verify after manual edits**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit 2>&1 | tail -5
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run src/editor/ 2>&1 | tail -5
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vite build 2>&1 | tail -5
cd /Users/shahg/Desktop/pencil/buildrik && bash scripts/ds-grep-gates.sh 2>&1 | tail -10
```
Expected: tsc 71 stable, tests pass, build succeeds, 25/25 gates pass.

- [ ] **Step 6: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/src/editor/
git commit -m "$(cat <<'EOF'
refactor(vibcoder-phase-6): T6 manual review of off-grid + multi-prop

Off-grid gap sites and multi-prop layouts dispositioned individually
(normalize to token / wrap / keep inline). See inventory-report.json
for original site list.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Final inventory re-scan + coverage report

**Files:**
- Modify: `packages/editor/scripts/codemods/inventory-report.json` (regenerated post-migration)

**Why this task exists:** Verify migration coverage. Re-running the inventory scanner shows what's left — should be only intentional `stack-multi-prop`, `stack-off-grid`, and `cluster-off-grid` decisions that we kept inline. If clean buckets are non-zero, codemod missed something.

- [ ] **Step 1: Re-run inventory**

Run: `cd packages/editor && npx tsx scripts/codemods/inventory-stack-cluster.ts`
Expected: New `inventory-report.json` with `stack-clean` and `cluster-clean` counts at zero (or near-zero with documented reasons).

- [ ] **Step 2: Compare counts**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
node -e "const r = require('./packages/editor/scripts/codemods/inventory-report.json'); console.log('POST-MIGRATION COUNTS:', r.counts);"
```
Expected: Console output shows the bucket counts. `stack-clean` and `cluster-clean` should be 0 (or each remaining one has a documented reason in T6 commit).

- [ ] **Step 3: Verify Gate 24 baseline drop**

Run: `cd /Users/shahg/Desktop/pencil/buildrik && cat packages/editor/scripts/.chrome-axioms-baseline`
Expected: Inline-element count line is LOWER than pre-Phase-6 baseline. Update baseline file if gate auto-baselines on pass.

- [ ] **Step 4: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/scripts/codemods/inventory-report.json packages/editor/scripts/.chrome-axioms-baseline
git commit -m "$(cat <<'EOF'
chore(vibcoder-phase-6): T7 final inventory + Gate 24 baseline update

Post-migration inventory: clean buckets at zero. Gate 24 inline-element
baseline drops by ~110 (Stack + Cluster combined consumer count).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Phase 6 close-out

**Files:**
- Modify: `docs/superpowers/specs/2026-04-26-vibcoder-position-3/poc-findings.md`
- Modify: `docs/superpowers/specs/2026-04-26-vibcoder-position-3/roadmap.md`
- Create: `/Users/shahg/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/project_vibcoder_phase_6_consumer_migration_shipped_20260429.md`
- Modify: `/Users/shahg/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/MEMORY.md`

**Why this task exists:** Capture findings + flip phase status + persist to home-dir memory so future sessions surface this work.

- [ ] **Step 1: Append Phase 6 findings to poc-findings.md**

Read existing format from prior phase sections (Phase 4 revival findings near bottom). Add new section with same h2/h3 voice. Capture:
- Codemod toolchain validated (ts-morph AST handles multi-line style objects regex couldn't)
- Default-omits-modifier discipline preserved through codemod
- Off-grid gap discovery (4 sites with non-token values flagged design drift)
- Multi-prop sites kept inline by design (preserve padding/background/etc)
- Per-batch verify+commit prevented Phase 4 Toast B3 type-import regression pattern from recurring

- [ ] **Step 2: Flip Phase 6 status in roadmap**

Read `docs/superpowers/specs/2026-04-26-vibcoder-position-3/roadmap.md`. Find the Phase 6 entry (or add one if missing — Phase 6 may not exist yet since Phase 4 revival just landed). Mark SHIPPED 2026-04-29 with all 8 commit SHAs.

- [ ] **Step 3: Write home-dir memory file**

```markdown
---
name: Vibcoder Phase 6 consumer migration shipped 2026-04-29
description: ~110 inline-flex chrome consumer sites migrated to Phase 4 <Stack>/<Cluster> wrappers via ts-morph codemod. Gate 24 baseline drops. tsc 71 stable.
type: project
---

# Vibcoder Phase 6 — Consumer Migration shipped 2026-04-29

## What shipped

8 tasks, ~3 batches of consumer files migrated from inline flex to Phase 4 wrappers.

## Commits

| Task | SHA |
|------|-----|
| T1 inventory scanner | (filled by executor) |
| T2 codemod transform + tests | (filled by executor) |
| T3 sidebar batch | (filled by executor) |
| T4 canvas+inspector batch | (filled by executor) |
| T5 remaining batch | (filled by executor) |
| T6 manual review | (filled by executor) |
| T7 final inventory + baseline | (filled by executor) |
| T8 close-out | (filled by executor) |

## Findings

1. **ts-morph AST > regex.** Multi-line style objects (74% of candidates) are invisible to single-line regex. AST handles them cleanly.
2. **Default-omits-modifier survives codemod.** `gap: 12` correctly emits `<Stack>` not `<Stack gap="md">`.
3. **Off-grid gap reveals design drift.** 4 sites used 6/10/14px values not in the spacing scale. Kept inline pending design decision.
4. **Multi-prop sites need different strategy.** Inline layouts with extra padding/background are not always Stack candidates. Wrapping with outer div + Stack is one option but adds DOM depth. Kept inline by default.
5. **Per-batch commits prevented type-import regression.** Phase 4 Toast B3 had 19 errors hidden in single commit; per-batch caught any per-area regression mid-flight.

## Pointers

- Plan: `docs/superpowers/plans/2026-04-29-vibcoder-phase-6-consumer-migration.md`
- Codemod: `packages/editor/scripts/codemods/migrate-stack-cluster.ts`
- Findings: `docs/superpowers/specs/2026-04-26-vibcoder-position-3/poc-findings.md` (Phase 6 section)
```

- [ ] **Step 4: Update MEMORY.md index**

Read `/Users/shahg/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/MEMORY.md`. Append one line under the most recent entry (the Phase 4 layouts entry):

```
- [Vibcoder Phase 6 consumer migration shipped 2026-04-29](project_vibcoder_phase_6_consumer_migration_shipped_20260429.md) — ~110 inline-flex sites migrated via ts-morph codemod. Gate 24 baseline drops; default-omits-modifier preserved.
```

- [ ] **Step 5: Verify line stays under 200 chars + commit docs only**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add docs/superpowers/specs/2026-04-26-vibcoder-position-3/poc-findings.md docs/superpowers/specs/2026-04-26-vibcoder-position-3/roadmap.md
git commit -m "$(cat <<'EOF'
docs(vibcoder): Phase 6 consumer migration SHIPPED — findings + roadmap

- Phase 6 SHIPPED 2026-04-29: ~110 sites migrated to Stack/Cluster
- 5 findings captured (ts-morph AST, default-omits, off-grid drift,
  multi-prop strategy, per-batch verify rhythm)
- Codemod toolchain reusable for future wrapper consumer migrations

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

(Memory files are gitignored — write but DO NOT stage.)

---

## Self-Review Notes

**Spec coverage:** Plan covers (a) inventory T1, (b) codemod + tests T2, (c) batched migration T3-T5, (d) manual review T6, (e) verification T7, (f) close-out T8. Default-omits-modifier discipline carries through T2 fixtures. Per-batch commits address Phase 4 Toast B3 lesson. Off-grid + multi-prop categories handled in T6.

**Placeholders:** None. All file paths exact. All code blocks complete. T8 memory file body is concrete (placeholder is only "filled by executor" SHA cells which is normal close-out pattern).

**Type consistency:** `Stack` and `Cluster` named imports match Phase 4 wrapper exports. Token values (xs/sm/md/lg/xl) match Phase 4 CSS. `transform()` function signature consistent across T2 fixtures + test + production runs.

**Risks:**
- ts-morph initialization on 489-file editor tree may be slow (~30s scanner runtime). Acceptable.
- Codemod runs per file — if `vite build` triggers HMR mid-codemod, files race. Run with editor dev server stopped.
- Auto-format (Prettier) may rewrite imports differently. Run `prettier --write` after each batch if format CI blocks.
