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

export function applyOp1(content, mapping) {
  const csssVars = {
    ...mapping.css_vars.chrome_and_canvas_operational,
    ...mapping.css_vars.design_runtime,
  };
  return content.replace(/var\((--(?:aqb|ls|accent)-[a-z0-9-]+)(\s*,\s*[^)]+)?\)/g, (match, varName, fallback) => {
    const target = csssVars[varName];
    if (!target) throw new Error(`op1: unmapped CSS var ${varName}`);
    return `var(${target}${fallback || ''})`;
  });
}

export function applyOp1b(content, mapping) {
  const cssVars = {
    ...mapping.css_vars.chrome_and_canvas_operational,
    ...mapping.css_vars.design_runtime,
  };
  // Match --aqb-X / --ls-X / --accent-X NOT immediately followed by ${ (those are Category B manual).
  return content.replace(
    /(--(?:aqb|ls|accent)-[a-z0-9-]+)(?!\$\{)/g,
    (match, varName) => {
      const target = cssVars[varName];
      if (!target) return match; // leave for abort detection in verify step (not implemented here)
      return target;
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
  out = out.replace(/\.?aqb-[a-z0-9]+(?:-[a-z0-9]+)*/g, (match) => {
    const hasDot = match.startsWith('.');
    const name = hasDot ? match.slice(1) : match;
    const target = mapping.classnames[name];
    if (!target) throw new Error(`op5: unmapped class ${name}`);
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

  // 2. Scan for aqb- INSIDE ${...} interpolations (Category B manual abort case)
  const files = walkFiles(DEFAULT_ROOTS, ['.ts', '.tsx']);
  const unhandled = [];
  for (const f of files) {
    const content = readFileSync(f, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (/\$\{[^}]*aqb-/.test(line)) {
        unhandled.push(`${relative('.', f)}:${i + 1} — aqb- INSIDE interpolation`);
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
