#!/usr/bin/env node
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, join, basename, relative } from 'node:path';
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
      violations.push({
        path: paths[0],
        line: 1,
        severity: 'important',
        message: `Primitive "${name}" defined in ${paths.length} homes: ${paths.join(', ')}`,
        suggestion: 'Pick canonical home per CLAUDE.md three-home contract; delete duplicates.',
      });
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
    if (locs.length > 1) {
      violations.push({
        path: locs[0].path,
        line: locs[0].line,
        severity: 'important',
        message: `Token "${token}" defined in ${locs.length} files: ${locs.map((l) => `${l.path}:${l.line}`).join(', ')}`,
        suggestion: 'Pick canonical alias file; delete duplicate definition.',
      });
    }
  }
  return { category: 'tokenAliasSSOT', violations };
}

export function scanSelectorDuplicates(root) {
  const byName = new Map();
  let cssFiles = [];
  try { cssFiles = walk(resolve(root, 'src'), ['.css']); } catch { return { category: 'selectorDuplicates', violations: [] }; }
  for (const f of cssFiles) {
    const content = readFileSync(f, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      const m = line.match(/\.(bd-[a-z][a-z0-9-]*)\s*\{/);
      if (!m) return;
      if (PSEUDO_STATES.some((p) => line.includes(p))) return;
      const name = m[1];
      if (!byName.has(name)) byName.set(name, []);
      byName.get(name).push({ path: relative(root, f), line: i + 1 });
    });
  }
  const violations = [];
  for (const [name, locs] of byName) {
    const distinctFiles = new Set(locs.map((l) => l.path));
    if (distinctFiles.size > 1) {
      violations.push({
        path: locs[0].path,
        line: locs[0].line,
        severity: 'important',
        message: `Selector ".${name}" defined in ${distinctFiles.size} files: ${[...distinctFiles].join(', ')}`,
        suggestion: 'Pick canonical tier CSS; merge or rename if intentional namespace difference.',
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
 * NOTE on dead-export accuracy: matches export names against a global Set
 * of all import names project-wide. Two modules exporting the same name
 * where only one is imported will NOT be flagged. Audit results from
 * category 6 should be treated as approximate; prefer manual review.
 * Hardening to ts-morph findReferencesAsNodes() is Phase 1+ work.
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
  const importNames = new Set();
  for (const sf of project.getSourceFiles()) {
    for (const imp of sf.getImportDeclarations()) {
      for (const named of imp.getNamedImports()) importNames.add(named.getName());
      const def = imp.getDefaultImport();
      if (def) importNames.add(def.getText());
    }
  }
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
    for (const decl of sf.getExportedDeclarations()) {
      const [name] = decl;
      if (!name || name === 'default') continue;
      if (!importNames.has(name)) {
        violations.push({
          path: filePath,
          line: 1,
          severity: 'minor',
          message: `Dead export "${name}" — not imported anywhere`,
          suggestion: 'Delete unused export; rely on git history if needed later.',
        });
      }
    }
  }
  return { category: 'antiPatterns', violations };
}

export function scanLegacyResiduals(root) {
  const file = resolve(root, 'src/themes/legacy-components.css');
  if (!existsSync(file)) return { category: 'legacyResiduals', violations: [] };
  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const violations = [];
  let depth = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;
    if (depth === 0 && opens > 0) {
      const currentSelectorPart = line.split('{')[0].trim();
      const selectorLines = currentSelectorPart ? [currentSelectorPart] : [];
      let lineIdx = i - 1;
      while (lineIdx >= 0) {
        const prev = lines[lineIdx].trim();
        if (prev === '' || prev.startsWith('//')) { lineIdx--; continue; }
        if (prev.endsWith('}') || prev.endsWith('*/') || prev.endsWith(';')) break;
        selectorLines.unshift(prev);
        lineIdx--;
      }
      const fullSelector = selectorLines.join(' ').replace(/\s*,\s*/g, ', ').trim();
      const startLine = lineIdx + 2;
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
