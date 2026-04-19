#!/usr/bin/env node
// theme-v3-codemod: aqb-* → buildrick-* rename.
// Deleted in P8. See docs/superpowers/specs/2026-04-19-theme-unification-v3-design.md.
// Pure stdlib — no child_process, no dependencies.

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const MAPPING_PATH = 'scripts/theme-v3-mapping.json';
const DEFAULT_ROOTS = ['packages/editor/src', 'packages/editor/demo'];
const DOCS_ROOTS = [
  'packages/editor/src/docs',
  'packages/editor/src/project-documentation',
  'packages/editor/src/code-to-prd-output',
];

export function loadMapping() {
  return JSON.parse(readFileSync(MAPPING_PATH, 'utf8'));
}

export function walkFiles(roots, exts) {
  const out = [];
  for (const root of roots) {
    const queue = [root];
    while (queue.length) {
      const dir = queue.shift();
      try {
        for (const name of readdirSync(dir)) {
          if (name === 'node_modules' || name === 'dist' || name === '.git') continue;
          const full = join(dir, name);
          const st = statSync(full);
          if (st.isDirectory()) queue.push(full);
          else if (exts.includes(extname(name))) out.push(full);
        }
      } catch { /* root doesn't exist — skip */ }
    }
  }
  return out;
}

// Build combined CSS var lookup: chrome + design + undefined_decisions resolved to targets.
// For undefined_decisions: 'rename-to-existing' uses target field; 'define-new' synthesizes
// --buildrick-{suffix} where suffix strips the --aqb-/--ls-/--accent- prefix.
function buildCssVarLookup(mapping) {
  const lookup = {
    ...mapping.css_vars.chrome_and_canvas_operational,
    ...mapping.css_vars.design_runtime,
  };
  for (const [from, val] of Object.entries(mapping.css_vars.undefined_decisions || {})) {
    if (!val || typeof val !== 'object') continue;
    if (val.action === 'rename-to-existing' && val.target) {
      lookup[from] = val.target;
    } else if (val.action === 'define-new') {
      const suffix = from.replace(/^--(?:aqb|ls|accent)-/, '');
      lookup[from] = `--buildrick-${suffix}`;
    } else if (val.action === 'delete-consumer') {
      // No-op: the consumer reference is usually a comment/placeholder. Leave unchanged.
      // The final grep-verification suite will flag any surviving --aqb-* references.
      lookup[from] = from;
    }
  }
  return lookup;
}

export function applyOp1(content, mapping) {
  const csssVars = buildCssVarLookup(mapping);
  const once = (s) => s.replace(/var\((--(?:aqb|ls|accent)-[a-z0-9-]+)(\s*,\s*[^)]+)?\)/g, (match, varName, fallback) => {
    const target = csssVars[varName];
    if (!target) throw new Error(`op1: unmapped CSS var ${varName}`);
    return `var(${target}${fallback || ''})`;
  });
  // Iterate to handle nested var() calls like var(--aqb-a, var(--aqb-b)).
  // The fallback-group regex greedily consumes the first ), so nested inner vars need a second pass.
  let prev;
  let out = content;
  let passes = 0;
  do {
    prev = out;
    out = once(out);
    passes++;
  } while (out !== prev && passes < 5);
  return out;
}

export function applyOp1b(content, mapping) {
  const cssVars = buildCssVarLookup(mapping);
  // Match --aqb-X / --ls-X / --accent-X NOT immediately followed by ${ (those are Category B manual).
  return content.replace(
    /(--(?:aqb|ls|accent)-[a-z0-9-]+)(?!\$\{)/g,
    (match, varName) => {
      const target = cssVars[varName];
      if (!target) return match; // leave for abort detection in verify step
      return target;
    }
  );
}

// Op 1c: CSS variable DEFINITIONS (--aqb-X: value;) → (--buildrick-Y: value;) per mapping.
// Op 1 handles var() USES; Op 1b handles JS-side refs; this op handles DEFINITIONS.
// Without this, defs like `--aqb-bg: #fff;` in Canvas.css / design-tokens.css would survive P3 and
// break consumers that op 1 renamed to var(--buildrick-bg).
// Runs on CSS files. Safe on default.css too (produces duplicates with P2's new defs; same values → harmless).
export function applyOp1c(content, mapping) {
  const lookup = buildCssVarLookup(mapping);
  return content.replace(
    /^(\s*)(--(?:aqb|ls|accent)-[a-z0-9-]+)(\s*:)/gm,
    (match, indent, name, colon) => {
      const target = lookup[name];
      if (!target) return match;
      return `${indent}${target}${colon}`;
    }
  );
}

export function applyOp2(content, mapping) {
  let out = content;
  for (const [oldName, target] of Object.entries(mapping.keyframes)) {
    if (typeof target === 'string') {
      out = out.replace(new RegExp(`@keyframes\\s+${oldName}\\b`, 'g'), `@keyframes ${target}`);
      out = out.replace(new RegExp(`animation-name:\\s*${oldName}\\b`, 'g'), `animation-name: ${target}`);
      out = out.replace(new RegExp(`(animation:\\s*)${oldName}\\b`, 'g'), `$1${target}`);
    } else if (target && target.action === 'delete') {
      const multi = new RegExp(`animation:\\s*${oldName}[^;]*,|,\\s*${oldName}\\b`);
      if (multi.test(out)) {
        throw new Error(`op2: multi-animation shorthand contains orphan ${oldName} — manual review required`);
      }
      out = out.replace(new RegExp(`^\\s*animation-name:\\s*${oldName}\\s*;\\s*\\n`, 'gm'), '');
      out = out.replace(new RegExp(`^\\s*animation:\\s*${oldName}[^,;]*;\\s*\\n`, 'gm'), '');
    }
  }
  return out;
}

export function applyOp4(content, mapping) {
  return content.replace(/data-aqb-[a-z-]+/g, (match) => {
    const target = mapping.data_attributes[match];
    if (!target) throw new Error(`op4: unmapped data attr ${match}`);
    return target;
  });
}

export function applyOp5(content, mapping) {
  let out = content;
  // Rule-block deletions first (before pattern rename)
  for (const [name, val] of Object.entries(mapping.classnames)) {
    if (val && typeof val === 'object' && val.action === 'delete-rule') {
      const ruleRe = new RegExp(`\\.${name}[^{]*\\{[^}]*\\}\\s*`, 'g');
      out = out.replace(ruleRe, '');
    }
  }
  // Pattern rename — stop at word-boundary (don't eat trailing hyphens before template expressions)
  // Negative lookbehind (?<!-) rejects matches inside --aqb-X / data-aqb-X (those are CSS vars / data-attrs handled by other ops)
  out = out.replace(/(?<!-)\.?aqb-[a-z0-9]+(?:-[a-z0-9]+)*/g, (match) => {
    const hasDot = match.startsWith('.');
    const name = hasDot ? match.slice(1) : match;
    const target = mapping.classnames[name];
    if (!target) {
      // Skip if handled by another op (keyframes / storage keys)
      if (mapping.keyframes && mapping.keyframes[name] !== undefined) return match;
      if (mapping.storage_keys && mapping.storage_keys[name] !== undefined) return match;
      // Skip if handled by dev_flags (colon-prefix match)
      if (mapping.dev_flags) {
        for (const prefix of Object.keys(mapping.dev_flags)) {
          if (name.startsWith(prefix.replace(/:$/, ''))) return match;
        }
      }
      throw new Error(`op5: unmapped class ${name}`);
    }
    if (typeof target === 'object') return match; // already handled by delete-rule
    return (hasDot ? '.' : '') + target;
  });
  return out;
}

export function applyOp6(content, mapping) {
  let out = content;
  for (const [key, val] of Object.entries(mapping.storage_keys)) {
    if (val && typeof val === 'object') {
      if (val.action === 'preserve' || val.action === 'delete') continue;
      if (val._dynamic) {
        const oldPrefix = key.replace(/-\*$/, '-');
        const newPrefix = val.target.replace(/\$\{.*$/, '');
        const re = new RegExp(`(["'\`])${oldPrefix}([^"'\`]*?)\\$\\{`, 'g');
        out = out.replace(re, `$1${newPrefix}$2\${`);
      }
      continue;
    }
    // Plain rename
    const re = new RegExp(`(["'\`])${key}\\1`, 'g');
    out = out.replace(re, `$1${val}$1`);
  }
  return out;
}

export function applyOp7(content, mapping) {
  let out = content;
  for (const [oldPrefix, newPrefix] of Object.entries(mapping.dev_flags)) {
    out = out.split(oldPrefix).join(newPrefix);
  }
  return out;
}

const mode = process.argv[2] || 'dry-run';

if (mode === 'dry-run') runDryRun();
else if (mode === '--verify') runVerify();
else if (mode === '--apply') runApply();
else if (mode === '--docs') runDocsSweep();
else {
  console.error('Usage: node theme-v3-codemod.mjs [dry-run|--verify|--apply|--docs]');
  process.exit(2);
}

export function runVerify() {
  const mapping = loadMapping();
  const errors = [];

  // 1. chrome css_var targets must NOT start with --buildrick-design-
  for (const [from, to] of Object.entries(mapping.css_vars.chrome_and_canvas_operational)) {
    if (typeof to !== 'string') continue;
    if (!to.startsWith('--buildrick-') || to.startsWith('--buildrick-design-')) {
      errors.push(`chrome css_var wrong namespace: ${from} → ${to}`);
    }
  }
  // design_runtime targets MUST start with --buildrick-design-
  for (const [from, to] of Object.entries(mapping.css_vars.design_runtime)) {
    if (typeof to !== 'string') continue;
    if (!to.startsWith('--buildrick-design-')) {
      errors.push(`design css_var wrong namespace: ${from} → ${to}`);
    }
  }

  // 2. Scan for aqb- INSIDE ${...} interpolations where it's JS code (not nested string literal).
  // Per spec: "aqb- inside JS code can't be safely rewritten without understanding surrounding expression".
  // But aqb- inside a string literal nested in the interpolation IS handleable by ops 1b/4/5/6/7.
  // Strip string literals from interpolation body before checking.
  const files = walkFiles(DEFAULT_ROOTS, ['.ts', '.tsx']);
  const unhandled = [];
  for (const f of files) {
    const content = readFileSync(f, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      // Find all ${...} interpolation bodies on this line
      const matches = [...line.matchAll(/\$\{([^}]*)\}/g)];
      for (const m of matches) {
        const innerCode = m[1];
        // Strip nested string literals (double-quote, single-quote, backtick)
        const stripped = innerCode.replace(/"[^"]*"|'[^']*'|`[^`]*`/g, '');
        if (/aqb-/.test(stripped)) {
          unhandled.push(`${relative('.', f)}:${i + 1} — aqb- in JS code inside interpolation (not a string literal)`);
        }
      }
    });
  }
  if (unhandled.length > 0) {
    errors.push(`abort: ${unhandled.length} unhandled template literals:\n  ${unhandled.join('\n  ')}`);
  }

  if (errors.length > 0) {
    console.error('VERIFY FAILED:');
    errors.forEach(e => console.error('  ' + e));
    process.exit(1);
  }
  const counts = {
    chrome: Object.keys(mapping.css_vars.chrome_and_canvas_operational).length,
    design: Object.keys(mapping.css_vars.design_runtime).length,
    keyframes: Object.keys(mapping.keyframes).length,
    dataAttrs: Object.keys(mapping.data_attributes).length,
    classnames: Object.keys(mapping.classnames).length,
    storageKeys: Object.keys(mapping.storage_keys).length,
  };
  console.log(`verify: OK (${JSON.stringify(counts)})`);
}

export function runApply() {
  if (!process.env.THEME_V3_VERIFY_OK) {
    console.error('apply: must set THEME_V3_VERIFY_OK=1 after --verify passes');
    process.exit(2);
  }
  const mapping = loadMapping();
  const files = walkFiles(DEFAULT_ROOTS, ['.css', '.ts', '.tsx', '.html']);
  let modified = 0;

  for (const f of files) {
    let content = readFileSync(f, 'utf8');
    const original = content;
    try {
      if (f.endsWith('.css')) {
        content = applyOp1(content, mapping);
        content = applyOp1c(content, mapping);
        content = applyOp2(content, mapping);
        content = applyOp4(content, mapping);
        content = applyOp5(content, mapping);
      } else {
        content = applyOp1(content, mapping);
        content = applyOp1b(content, mapping);
        content = applyOp2(content, mapping);
        content = applyOp4(content, mapping);
        content = applyOp6(content, mapping);
        content = applyOp7(content, mapping);
        content = applyOp5(content, mapping);
      }
    } catch (e) {
      console.error(`apply: ${f}: ${e.message}`);
      process.exit(1);
    }
    if (content !== original) {
      writeFileSync(f, content, 'utf8');
      modified++;
    }
  }
  console.log(`apply: ${modified} files modified`);
}

export function runDocsSweep() {
  const mapping = loadMapping();
  const files = walkFiles(DOCS_ROOTS, ['.md', '.json']);
  let modified = 0;
  for (const f of files) {
    let content = readFileSync(f, 'utf8');
    const original = content;
    // Liberal mode — catch errors and continue (markdown has partial matches)
    try { content = applyOp1(content, mapping); } catch {}
    try { content = applyOp1b(content, mapping); } catch {}
    try { content = applyOp1c(content, mapping); } catch {}
    try { content = applyOp2(content, mapping); } catch {}
    try { content = applyOp4(content, mapping); } catch {}
    try { content = applyOp5(content, mapping); } catch {}
    try { content = applyOp6(content, mapping); } catch {}
    try { content = applyOp7(content, mapping); } catch {}
    if (content !== original) {
      writeFileSync(f, content, 'utf8');
      modified++;
    }
  }
  console.log(`docs: ${modified} files modified`);
}

export function runDryRun() {
  const mapping = loadMapping();
  const files = walkFiles(DEFAULT_ROOTS, ['.css', '.ts', '.tsx', '.html']);
  const report = [];
  for (const f of files) {
    const original = readFileSync(f, 'utf8');
    let content = original;
    try {
      if (f.endsWith('.css')) {
        content = applyOp1(content, mapping);
        content = applyOp1c(content, mapping);
        content = applyOp2(content, mapping);
        content = applyOp4(content, mapping);
        content = applyOp5(content, mapping);
      } else {
        content = applyOp1(content, mapping);
        content = applyOp1b(content, mapping);
        content = applyOp2(content, mapping);
        content = applyOp4(content, mapping);
        content = applyOp6(content, mapping);
        content = applyOp7(content, mapping);
        content = applyOp5(content, mapping);
      }
    } catch (e) {
      report.push(`ERROR ${relative('.', f)}: ${e.message}`);
      continue;
    }
    if (content !== original) {
      const origLines = original.split('\n').length;
      const newLines = content.split('\n').length;
      report.push(`CHANGE ${relative('.', f)} (${origLines}→${newLines} lines)`);
    }
  }
  console.log(report.join('\n'));
  console.log(`\ndry-run: ${report.filter(r => r.startsWith('CHANGE')).length} files would change, ${report.filter(r => r.startsWith('ERROR')).length} errors`);
}
