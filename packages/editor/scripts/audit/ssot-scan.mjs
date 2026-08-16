#!/usr/bin/env node
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, join, basename, relative, dirname } from 'node:path';
import { createRequire } from 'node:module';

const requireCjs = createRequire(import.meta.url);

function walk(dir, exts = ['.tsx', '.ts', '.css', '.md']) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...walk(full, exts));
    else if (exts.some((e) => full.endsWith(e))) out.push(full);
  }
  return out;
}

const HOMES = ['src/editor/shared/vibcoder', 'src/shared/ui', 'src/shared/extensions'];
const PSEUDO_STATES = [':focus-visible', ':hover', ':active', ':focus', ':disabled'];

function fileExportsSymbol(filePath, symbolName) {
  let content;
  try {
    content = readFileSync(filePath, 'utf8');
  } catch {
    return false;
  }
  // Three patterns matching common TS/TSX export shapes:
  // 1. `export <kind> <name>` — const/function/class/let/var/interface/type/enum
  // 2. `export default [async] [function|class] <name>`
  // 3. `export { ..., <name>, ... }` (LOCAL block; re-export chains via `from` excluded)
  const patterns = [
    new RegExp(`export\\s+(?:const|function|class|let|var|interface|type|enum)\\s+${symbolName}\\b`),
    new RegExp(`export\\s+default\\s+(?:async\\s+)?(?:function|class)?\\s*${symbolName}\\b`),
    new RegExp(`export\\s*\\{[^}]*\\b${symbolName}\\b[^}]*\\}(?!\\s*from)`),
  ];
  return patterns.some((p) => p.test(content));
}

export function scanComponentDuplicates(root) {
  const byName = new Map();
  for (const home of HOMES) {
    const dir = resolve(root, home);
    let files;
    try { files = walk(dir, ['.tsx']); } catch { continue; }
    for (const f of files) {
      if (f.endsWith('.test.tsx')) continue;
      const name = basename(f, '.tsx');
      if (!byName.has(name)) byName.set(name, []);
      byName.get(name).push(relative(root, f));
    }
  }
  const violations = [];
  for (const [name, paths] of byName) {
    if (paths.length > 1) {
      // Audit Appendix #3: basename collision is only a real duplicate when
      // each file actually exports the basename-matching symbol. Skeleton.tsx
      // (vibcoder primitive) + Skeleton.tsx (extensions, exports
      // SkeletonListItem/StudioSkeleton compositions) was a false positive.
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
  return { category: 'componentDuplicates', violations };
}

export function scanKeyframeDuplicates(root) {
  const byName = new Map();
  let cssFiles = [];
  try { cssFiles = walk(resolve(root, 'src'), ['.css']); } catch { return { category: 'keyframeDuplicates', violations: [] }; }
  for (const f of cssFiles) {
    const content = readFileSync(f, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      const m = line.match(/@keyframes\s+([a-zA-Z][a-zA-Z0-9_-]*)/);
      if (m) {
        const name = m[1];
        if (!byName.has(name)) byName.set(name, []);
        byName.get(name).push({ path: relative(root, f), line: i + 1 });
      }
    });
  }
  const violations = [];
  for (const [name, locs] of byName) {
    if (locs.length > 1) {
      violations.push({
        path: locs[0].path,
        line: locs[0].line,
        severity: 'important',
        message: `@keyframes "${name}" defined in ${locs.length} files: ${locs.map((l) => `${l.path}:${l.line}`).join(', ')}`,
        suggestion: 'Consolidate to single tier CSS file; rename if intentional namespace difference.',
      });
    }
  }
  return { category: 'keyframeDuplicates', violations };
}

export function scanTokenAliasSSOT(root) {
  const byToken = new Map();
  let cssFiles = [];
  try { cssFiles = walk(resolve(root, 'src'), ['.css']); } catch { return { category: 'tokenAliasSSOT', violations: [] }; }
  for (const f of cssFiles) {
    const content = readFileSync(f, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      const m = line.match(/(--bd-[a-zA-Z0-9_-]+)\s*:/);
      if (m) {
        const token = m[1];
        if (!byToken.has(token)) byToken.set(token, []);
        byToken.get(token).push({ path: relative(root, f), line: i + 1 });
      }
    });
  }
  const violations = [];
  for (const [token, locs] of byToken) {
    // Only flag cross-file duplicates. Multiple definitions in the SAME file
    // are legitimate CSS cascade — e.g., :root sets the default and
    // [data-theme="dark"] overrides under a layered selector. SSOT is about
    // "one canonical home" (file), not "one declaration site" (line).
    const distinctFiles = new Set(locs.map((l) => l.path));
    if (distinctFiles.size > 1) {
      violations.push({
        path: locs[0].path,
        line: locs[0].line,
        severity: 'important',
        message: `Token "${token}" defined in ${distinctFiles.size} files: ${locs.map((l) => `${l.path}:${l.line}`).join(', ')}`,
        suggestion: 'Pick canonical alias file; delete duplicate definition.',
      });
    }
  }
  return { category: 'tokenAliasSSOT', violations };
}

export function scanSelectorDuplicates(root) {
  // Map<selector, Map<filePath, firstLine>> — anchor is the rule's right-most
  // simple selector after combinators (whitespace, >, +, ~). Audit Appendix
  // fix #2: only count rules whose head is a SINGLE simple selector. Context-
  // wrapped rules like `.parent > .bd-X` are intentionally scoped overrides,
  // NOT competing base definitions, so they don't enter the duplicate map.
  const byName = new Map();
  let cssFiles = [];
  try { cssFiles = walk(resolve(root, 'src'), ['.css']); } catch { return { category: 'selectorDuplicates', violations: [] }; }
  for (const f of cssFiles) {
    let content = readFileSync(f, 'utf8');
    // Strip /* ... */ block comments (multi-line aware) before selector matching.
    // Audit Appendix fix #1 — JSDoc comments mention selectors that aren't real defs.
    content = content.replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, ' '));
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (PSEUDO_STATES.some((p) => line.includes(p))) return;
      // Match opening of rule (text before {). Extract every comma-separated head.
      const ruleHeadMatch = line.match(/^(.+?)\{/);
      if (!ruleHeadMatch) return;
      const heads = ruleHeadMatch[1].split(',');
      for (const head of heads) {
        const segments = head.trim().split(/\s+|\s*[>+~]\s*/).filter(Boolean);
        if (segments.length !== 1) continue;
        // [\w-]* covers BEM modifiers (--), elements (__), digits, hyphens.
        const m = segments[0].match(/^\.(bd-[a-z][\w-]*)/);
        if (!m) continue;
        const selector = m[1];
        if (!byName.has(selector)) byName.set(selector, new Map());
        const fileMap = byName.get(selector);
        const filePath = relative(root, f);
        if (!fileMap.has(filePath)) fileMap.set(filePath, i + 1);
      }
    });
  }
  const violations = [];
  for (const [selector, fileMap] of byName) {
    if (fileMap.size > 1) {
      const locs = [...fileMap].map(([path, line]) => `${path}:${line}`);
      const [firstPath, firstLine] = [...fileMap][0];
      violations.push({
        path: firstPath,
        line: firstLine,
        severity: 'important',
        message: `Selector ".${selector}" defined in ${fileMap.size} files: ${locs.join(', ')}`,
        suggestion: 'Consolidate to single tier CSS file or document layered override.',
      });
    }
  }
  return { category: 'selectorDuplicates', violations };
}

export function scanHomeContractViolations(root) {
  const violations = [];
  const themesComponentsDir = resolve(root, 'src/themes/components');
  let themesFiles = [];
  try { themesFiles = walk(themesComponentsDir, ['.tsx']); } catch {}
  for (const f of themesFiles) {
    violations.push({
      path: relative(root, f),
      line: 1,
      severity: 'important',
      message: `${basename(f)} is a .tsx in CSS-only dir src/themes/components/`,
      suggestion: 'Move React wrapper to src/editor/shared/vibcoder/; keep only CSS in themes/components/.',
    });
  }
  const vibcoderDir = resolve(root, 'src/editor/shared/vibcoder');
  let vibcoderCss = [];
  try { vibcoderCss = walk(vibcoderDir, ['.css']); } catch {}
  for (const f of vibcoderCss) {
    const content = readFileSync(f, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      const m = line.match(/@keyframes\s+([a-zA-Z][a-zA-Z0-9_-]*)/);
      if (m) {
        violations.push({
          path: relative(root, f),
          line: i + 1,
          severity: 'important',
          message: `@keyframes "${m[1]}" defined inside vibcoder wrapper dir`,
          suggestion: 'Move @keyframes to matching tier CSS in src/themes/components/.',
        });
      }
    });
  }
  const sharedUiDir = resolve(root, 'src/shared/ui');
  let sharedUi = [];
  try { sharedUi = walk(sharedUiDir, ['.tsx']); } catch {}
  const vibcoderNames = new Set();
  let vibcoderTsx = [];
  try { vibcoderTsx = walk(vibcoderDir, ['.tsx']); } catch {}
  for (const f of vibcoderTsx) {
    if (f.endsWith('.test.tsx')) continue;
    vibcoderNames.add(basename(f, '.tsx'));
  }
  for (const f of sharedUi) {
    if (f.endsWith('.test.tsx')) continue;
    const name = basename(f, '.tsx');
    if (vibcoderNames.has(name)) {
      violations.push({
        path: relative(root, f),
        line: 1,
        severity: 'important',
        message: `${name}.tsx in src/shared/ui/ shadows vibcoder primitive`,
        suggestion: 'Delete the shared/ui/ duplicate; redirect imports to src/editor/shared/vibcoder/.',
      });
    }
  }
  return { category: 'homeContractViolations', violations };
}

/**
 * Anti-pattern scan: pass-through wrappers + dead exports.
 *
 * Dead-export detection walks barrel re-export chains
 * (`export * from`, `export { X } from`) so names exported from a
 * leaf module and re-shipped via an index.ts barrel are treated as
 * reachable. Hardened 2026-05-09 per audit Appendix #4.
 */
export function scanAntiPatterns(root) {
  const violations = [];
  let Project;
  try { ({ Project } = requireCjs('ts-morph')); } catch {
    return { category: 'antiPatterns', violations };
  }
  let project;
  try {
    const tsConfigPath = resolve(root, 'tsconfig.json');
    if (existsSync(tsConfigPath)) {
      project = new Project({ tsConfigFilePath: tsConfigPath, skipAddingFilesFromTsConfig: true });
    } else {
      project = new Project({ useInMemoryFileSystem: false });
    }
  } catch {
    return { category: 'antiPatterns', violations };
  }
  let tsFiles = [];
  try { tsFiles = walk(resolve(root, 'src'), ['.ts', '.tsx']); } catch { return { category: 'antiPatterns', violations }; }
  for (const f of tsFiles) {
    if (f.endsWith('.d.ts')) continue;
    project.addSourceFileAtPathIfExists(f);
  }

  /*
    Consumers that live outside src/. They are loaded for REACHABILITY only —
    the violation loop below still reports on src/ files, so nothing here can
    become a dead-export finding of its own.

    e2e/probe is the load-bearing one. Panels boarded with a loading state whose
    data source is still synchronous (Pages 774:4044, Insert, Layers) are built
    to their board and mounted by the probe until the source goes async;
    check-anchors greps the probe's testids. Ignoring it reported those
    components as dead code, which is the opposite of what they are.
  */
  for (const dir of ['e2e/probe', 'demo']) {
    let extra = [];
    try { extra = walk(resolve(root, dir), ['.ts', '.tsx']); } catch { continue; }
    for (const f of extra) {
      if (f.endsWith('.d.ts')) continue;
      project.addSourceFileAtPathIfExists(f);
    }
  }
  const importNames = new Set();
  for (const sf of project.getSourceFiles()) {
    for (const imp of sf.getImportDeclarations()) {
      for (const named of imp.getNamedImports()) importNames.add(named.getName());
      const def = imp.getDefaultImport();
      if (def) importNames.add(def.getText());

      /*
        `import * as Storage from "./CollectionStorage"` — the whole module is
        reachable through the namespace, and which members get used is decided
        at each `Storage.foo()` call site rather than at the import.

        This was invisible until the `export * as CollectionStorage` alias in
        engine/cms/index.ts was deleted as an unused middle-man: eleven CMS
        storage functions that CollectionManager and cmsSync call every day
        immediately appeared as dead exports. The alias had been masking the
        gap, so removing real cruft made the report worse. Mark them reachable
        from the namespace import itself.
      */
      if (imp.getNamespaceImport()) {
        const target = imp.getModuleSpecifierSourceFile();
        if (target) {
          for (const [name] of target.getExportedDeclarations()) importNames.add(name);
        }
      }
    }
  }

  /*
    Dynamic imports, which getImportDeclarations() does not see.

    Every code-split panel in this editor arrives this way — TabRouter does
    `React.lazy(() => import("./tabs/pages/PagesTab"))`, FullPageRouter does
    `import("../media/LibraryManager").then((m) => ({ default: m.LibraryManager }))`.
    Counting only static imports reported `PagesTab` and `LibraryManager` as
    dead exports. Deleting on that report would have removed the Pages panel and
    the media library. Same failure as reading only one syntactic form of a prop
    hand-off: the reachable set is bigger than the syntax you grepped for.

    Conservative on purpose — a module reached by `import()` has ALL its exports
    marked reachable. Which member the consumer plucks off the namespace varies
    (`.then(m => m.X)`, `React.lazy` default, `await import()` destructuring),
    and over-marking loses a few true positives while under-marking deletes
    live code.
  */
  const dynamicallyImported = new Set();
  for (const sf of project.getSourceFiles()) {
    sf.forEachDescendant((node) => {
      if (node.getKindName() !== "CallExpression") return;
      const expr = node.getExpression?.();
      if (!expr || expr.getKindName() !== "ImportKeyword") return;
      const target = node.getArguments?.()[0];
      if (!target) return;
      const spec = target.getText().replace(/^['"`]|['"`]$/g, "");
      dynamicallyImported.add({ from: sf, spec });
    });
  }
  for (const { from, spec } of dynamicallyImported) {
    if (!spec.startsWith(".")) continue;                 // aliases resolve below
    const base = resolve(dirname(from.getFilePath()), spec);
    for (const ext of [".ts", ".tsx", "/index.ts", "/index.tsx"]) {
      const target = project.getSourceFile(base + ext);
      if (!target) continue;
      for (const [name] of target.getExportedDeclarations()) importNames.add(name);
      break;
    }
  }
  // In addition to import-name collection, walk export declarations.
  // Names that appear as `export { X } from "..."` or `export * from "..."`
  // targets are public-API; treat them as imported for dead-export purposes.
  // Audit Appendix fix #4 — drops 3197 false-positive dead-export count.
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
  for (const sf of project.getSourceFiles()) {
    const filePath = relative(root, sf.getFilePath());
    for (const fn of sf.getFunctions()) {
      const body = fn.getBody();
      if (!body) continue;
      const stmts = body.getStatements();
      if (stmts.length !== 1) continue;
      const stmt = stmts[0];
      const stmtText = stmt.getText().trim();
      const m = stmtText.match(/^return\s+([\w.]+)\(([^)]*)\);?$/);
      if (!m) continue;
      const callArgs = m[2].split(',').map((s) => s.trim()).filter(Boolean);
      const params = fn.getParameters().map((p) => p.getName());
      if (callArgs.length !== params.length) continue;
      const verbatim = callArgs.every((a, i) => a === params[i]);
      if (verbatim) {
        violations.push({
          path: filePath,
          line: fn.getStartLineNumber(),
          severity: 'minor',
          message: `Pass-through wrapper "${fn.getName() ?? '<anonymous>'}" — body is single return ${m[1]}(...sameArgs)`,
          suggestion: 'Inline at call sites; delete wrapper.',
        });
      }
    }
    // Generated files are rewritten wholesale by their generator; an unused
    // export there is the generator's business, and hand-editing them is a
    // build failure (gate:tokens-generated).
    if (filePath.includes('.generated.')) continue;

    for (const [name, decls] of sf.getExportedDeclarations()) {
      if (!name || name === 'default') continue;
      if (reachableNames.has(name)) continue;

      /*
        Types are NOT reported. `export interface FooProps` sitting next to
        `export const Foo: React.FC<FooProps>` is idiomatic TypeScript — the
        props type is a component's public contract whether or not another
        file imports it today, and this check's own advice ("delete unused
        export") is wrong for it. 407 of the 509 hits were exactly that shape,
        and burying 84 real dead values under 407 false ones is why this
        category sat outside the gate for months instead of being drained.
      */
      const isTypeOnly = decls.every((d) => {
        const k = d.getKindName();
        return k === 'InterfaceDeclaration' || k === 'TypeAliasDeclaration';
      });
      if (isTypeOnly) continue;

      violations.push({
        path: filePath,
        line: decls[0]?.getStartLineNumber() ?? 1,
        severity: 'minor',
        message: `Dead export "${name}" — not imported anywhere`,
        suggestion: 'Delete unused export; rely on git history if needed later.',
      });
    }
  }
  return { category: 'antiPatterns', violations };
}

export function scanLegacyResiduals(root) {
  const file = resolve(root, 'src/themes/legacy-components.css');
  if (!existsSync(file)) return { category: 'legacyResiduals', violations: [] };
  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');
  // Pre-compute which lines lie fully or partially inside a /* ... */ block
  // (including the opening and closing lines). Used to (a) skip brace-counting
  // inside JSDoc-style comments whose body contains literal { } characters,
  // and (b) stop the backward selector walker from sweeping comment bodies.
  const inCommentByLine = new Array(lines.length).fill(false);
  let inBlockComment = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let touchedComment = inBlockComment;
    let scan = 0;
    while (scan < line.length) {
      if (!inBlockComment) {
        const open = line.indexOf('/*', scan);
        if (open === -1) break;
        inBlockComment = true;
        touchedComment = true;
        scan = open + 2;
      } else {
        const close = line.indexOf('*/', scan);
        if (close === -1) { scan = line.length; break; }
        inBlockComment = false;
        scan = close + 2;
      }
    }
    inCommentByLine[i] = touchedComment;
  }
  const violations = [];
  let depth = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip brace counting on lines inside block comments — JSDoc bodies may
    // contain literal { and } that would otherwise corrupt depth.
    if (inCommentByLine[i]) continue;
    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;
    if (depth === 0 && opens > 0) {
      const currentSelectorPart = line.split('{')[0].trim();
      const selectorLines = currentSelectorPart ? [currentSelectorPart] : [];
      let topLineIdx = i;
      let lineIdx = i - 1;
      while (lineIdx >= 0) {
        const prev = lines[lineIdx].trim();
        if (prev === '' || prev.startsWith('//')) { lineIdx--; continue; }
        if (
          inCommentByLine[lineIdx] ||
          prev.startsWith('*') ||
          prev.startsWith('/*') ||
          prev.endsWith('}') ||
          prev.endsWith('*/') ||
          prev.endsWith(';')
        ) break;
        selectorLines.unshift(prev);
        topLineIdx = lineIdx;
        lineIdx--;
      }
      const fullSelector = selectorLines.join(' ').replace(/\s*,\s*/g, ', ').trim();
      const startLine = topLineIdx + 1;
      if (fullSelector && !fullSelector.startsWith('@')) {
        violations.push({
          path: relative(root, file),
          line: startLine,
          severity: 'minor',
          message: `${fullSelector} at line ${startLine} — needs annotation`,
          suggestion: 'Add /* keep: <reason> */ annotation or relocate to tier CSS.',
        });
      }
    }
    depth += opens;
    depth -= closes;
    if (depth < 0) depth = 0;
  }
  return { category: 'legacyResiduals', violations };
}

export function scanDocDrift(root) {
  const file = resolve(root, 'packages/editor/CLAUDE.md');
  const fallback = resolve(root, 'CLAUDE.md');
  const docPath = existsSync(file) ? file : (existsSync(fallback) ? fallback : null);
  if (!docPath) return { category: 'docDrift', violations: [] };
  const content = readFileSync(docPath, 'utf8');
  const lines = content.split('\n');
  const violations = [];
  let inTable = false;
  lines.forEach((line, i) => {
    if (line.includes('| Concept | Canonical Home | Status |')) {
      inTable = true;
      return;
    }
    if (!inTable) return;
    if (!line.trim().startsWith('|')) {
      if (line.trim() === '') inTable = false;
      return;
    }
    if (line.includes('|---')) return;
    const cells = line.split('|').map((c) => c.trim()).filter((c) => c.length > 0);
    if (cells.length < 3) return;
    const homeCell = cells[1] ?? '';
    if (homeCell.startsWith('~~') && homeCell.endsWith('~~')) return;
    const m = homeCell.match(/`([^`]+)`/);
    if (!m) return;
    let claim = m[1];
    if (claim.startsWith('~~') && claim.endsWith('~~')) return;
    if (claim.endsWith('/*.css')) claim = claim.slice(0, -'/*.css'.length);
    else if (claim.endsWith('*')) claim = claim.slice(0, -1);
    const claimPath = resolve(root, claim);
    if (!existsSync(claimPath)) {
      violations.push({
        path: relative(root, docPath),
        line: i + 1,
        severity: 'minor',
        message: `CLAUDE.md row claims canonical home "${m[1]}" but path missing on disk`,
        suggestion: 'Update CLAUDE.md SSOT contract row to reflect current state.',
      });
    }
  });
  return { category: 'docDrift', violations };
}

const SCANS = [
  scanComponentDuplicates, scanKeyframeDuplicates, scanTokenAliasSSOT, scanSelectorDuplicates,
  scanHomeContractViolations, scanAntiPatterns, scanLegacyResiduals, scanDocDrift,
];

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = process.cwd();
  const filter = process.argv.find((a) => a.startsWith('--category='));
  const allowed = filter ? new Set(filter.split('=')[1].split(',').map(Number)) : null;
  const results = SCANS.map((fn, i) => allowed && !allowed.has(i + 1) ? null : fn(root)).filter(Boolean);
  const total = results.reduce((a, r) => a + r.violations.length, 0);
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    for (const r of results) {
      console.log(`## ${r.category} (${r.violations.length})`);
      for (const v of r.violations) {
        console.log(`- [${v.severity}] ${v.path}:${v.line} — ${v.message}`);
        console.log(`  ${v.suggestion}`);
      }
    }
  }
  process.exit(total > 0 ? 1 : 0);
}
